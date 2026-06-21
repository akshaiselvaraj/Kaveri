import './db/sqlite'; // Boots SQLite and seeds database
import { aiService } from './services/ai.service';
import { contextService } from './services/context.service';

import { translationService } from './services/translation.service';

const TEST_CASES = [
  'Show FIR 1001',
  'Show theft cases in Mysuru',
  'Show cyber fraud cases in Bengaluru',
  'Show criminal history of Ravi Kumar',
  'Show pending investigations',
  'Show repeat offenders',
  'Show victims in FIR 1023',
  'Show crimes in Bengaluru East',
  'What is the most common crime type?',
  'ಬೆಂಗಳೂರುದಲ್ಲಿ ಸೈಬರ್ ಅಪರಾಧಗಳು'
];

async function runTests() {
  console.log('===========================================================');
  console.log('KAVERI PIPELINE TEST SUITE: RUNNING OPERATIONAL QUERY CHECKS');
  console.log('===========================================================');

  // Wait 2 seconds for SQLite database initialization and seeding to finish
  await new Promise(resolve => setTimeout(resolve, 2000));

  const sessionId = 'test-session-' + Date.now();
  const session = contextService.getOrCreateSession(sessionId);

  for (const query of TEST_CASES) {
    console.log(`\n\n🔎 INVESTIGATOR QUERY: "${query}"`);
    console.log('-----------------------------------------------------------');

    try {
      // 1. Language detection and translation to English if Kannada
      const detectedLang = await translationService.detectLanguage(query);
      let processedMessage = query;
      if (detectedLang === 'kn') {
        processedMessage = await translationService.translate(query, 'en');
        console.log(`[Translation] Detected Kannada. Translated: "${processedMessage}"`);
      }

      // 2. Process query
      const result = await aiService.processQuery(processedMessage, session);
      
      // 3. Translate response back if needed
      let finalResponseText = result.text;
      if (detectedLang === 'kn') {
        finalResponseText = await translationService.translate(result.text, 'kn');
      }

      console.log(`Detected Language:  ${detectedLang}`);
      console.log(`Classified Intent:  ${result.queryMetadata?.intent}`);
      console.log(`Extracted Filters:  ${JSON.stringify(result.activeFilters)}`);
      console.log(`Extracted Entities: ${JSON.stringify(result.activeEntities)}`);
      console.log(`Executed SQL Query:\n${result.sql}`);
      console.log('--- Friendly Markdown Output ---');
      console.log(finalResponseText);
      console.log('-----------------------------------------------------------');

      // Update session with this model response to save context memory
      contextService.addMessage(
        sessionId,
        'user',
        query
      );
      contextService.addMessage(
        sessionId,
        'model',
        finalResponseText,
        result.sql,
        result.sqlResults,
        {
          activeFilters: result.activeFilters,
          activeEntities: result.activeEntities
        }
      );
    } catch (err: any) {
      console.error(`❌ Query processing failed:`, err.message);
    }
  }

  // Test Follow-up Context Memory
  console.log('\n\n🧠 TESTING FOLLOW-UP CONTEXT MEMORY');
  console.log('===========================================================');
  
  const ctxSessionId = 'context-memory-test-' + Date.now();
  const ctxSession = contextService.getOrCreateSession(ctxSessionId);

  // 1. Ask about Cyber Fraud in Bengaluru
  const q1 = 'Show cyber fraud cases in Bengaluru';
  console.log(`\nInvestigator Query 1: "${q1}"`);
  const r1 = await aiService.processQuery(q1, ctxSession);
  console.log(`Active Location Filter: ${r1.activeFilters?.location}`);
  console.log(`Active Crime Filter:    ${r1.activeFilters?.crime_type}`);
  
  contextService.addMessage(ctxSessionId, 'user', q1);
  contextService.addMessage(ctxSessionId, 'model', r1.text, r1.sql, r1.sqlResults, {
    activeFilters: r1.activeFilters,
    activeEntities: r1.activeEntities
  });

  // 2. Ask follow-up about repeat offenders (should inherit Bengaluru and Cyber Fraud)
  const q2 = 'Which accused appears most?';
  console.log(`\nInvestigator Query 2 (Follow-up): "${q2}"`);
  const r2 = await aiService.processQuery(q2, ctxSession);
  console.log(`Resolved Intent:        ${r2.queryMetadata?.intent}`);
  console.log(`Inherited Location:     ${r2.activeFilters?.location}`);
  console.log(`Inherited Crime Type:   ${r2.activeFilters?.crime_type}`);
  console.log(`Executed SQL Query:\n${r2.sql}`);
  console.log('-----------------------------------------------------------');

  console.log('\nTests completed.');
  process.exit(0);
}

runTests();
