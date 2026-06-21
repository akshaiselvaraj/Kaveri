import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { SessionContext } from './context.service';
import { queryService } from './query.service';
import { formatterService } from './formatter.service';

interface AIQueryResult {
  text: string;
  sql?: string;
  sqlResults?: any[];
  activeFilters?: Record<string, string>;
  activeEntities?: Record<string, any>;
  queryMetadata?: {
    intent: string;
    explanation: string;
    executionTimeMs: number;
  };
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
  }

  private getModel() {
    if (!this.genAI) throw new Error('Gemini API key is not configured.');
    return this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Rule-based fallback parser to extract intent & entities when API key is missing
   */
  private runFallbackParser(userQuery: string, session: SessionContext): { intent: string; entities: Record<string, any>; explanation: string } {
    const query = userQuery.trim().toLowerCase();

    // 1. Show FIR 1001 / Show victims in FIR 1023
    if (/show\s+(?:victims\s+in\s+)?fir\s+(\d+|fir-\d+)/i.test(query)) {
      const match = query.match(/show\s+(?:victims\s+in\s+)?fir\s+(\d+|fir-\d+)/i);
      let id = match ? match[1].toUpperCase() : '';
      if (!id.startsWith('FIR-')) {
        id = `FIR-${id}`;
      }
      return {
        intent: 'get_fir',
        entities: { fir_id: id },
        explanation: 'Rule-based: FIR query match'
      };
    }

    // 2. Show criminal history of Ravi Kumar / Show accused Suresh Gowda
    if (/show\s+(?:criminal\s+history\s+of|accused|suspect)\s+([\w\s]+)/i.test(query)) {
      const match = query.match(/show\s+(?:criminal\s+history\s+of|accused|suspect)\s+([\w\s]+)/i);
      return {
        intent: 'criminal_history',
        entities: { person_name: match ? match[1].trim() : '' },
        explanation: 'Rule-based: suspect history match'
      };
    }

    // 3. Show victims in FIR 1023 / get victim
    if (/show\s+victims?\s+([\w\s]+)/i.test(query)) {
      const match = query.match(/show\s+victims?\s+([\w\s]+)/i);
      return {
        intent: 'get_victim',
        entities: { person_name: match ? match[1].trim() : '' },
        explanation: 'Rule-based: victim profile match'
      };
    }

    // 4. Show theft/cyber fraud cases in Mysuru/Bengaluru
    if (/show\s+([\w\s]+)\s+cases\s+in\s+([\w\s]+)/i.test(query)) {
      const match = query.match(/show\s+([\w\s]+)\s+cases\s+in\s+([\w\s]+)/i);
      const typeStr = match ? match[1].trim().toLowerCase() : '';
      const locStr = match ? match[2].trim() : '';
      
      let crime_type = '';
      if (typeStr.includes('theft')) crime_type = 'Theft';
      else if (typeStr.includes('cyber')) crime_type = 'Cyber Fraud';
      else if (typeStr.includes('burglary')) crime_type = 'Burglary';
      else if (typeStr.includes('assault')) crime_type = 'Assault';
      else if (typeStr.includes('robbery')) crime_type = 'Robbery';

      // District mapping
      let location = locStr;
      if (locStr.toLowerCase() === 'bengaluru') location = 'Bengaluru East'; // Default region mapper

      return {
        intent: 'crime_by_location',
        entities: { location, crime_type },
        explanation: 'Rule-based: location-crime type match'
      };
    }

    // 5. Show crimes in Bengaluru East
    if (/show\s+crimes\s+in\s+([\w\s]+)/i.test(query)) {
      const match = query.match(/show\s+crimes\s+in\s+([\w\s]+)/i);
      return {
        intent: 'crime_by_location',
        entities: { location: match ? match[1].trim() : '' },
        explanation: 'Rule-based: location match'
      };
    }

    // 6. Show pending investigations
    if (/show\s+pending\s+investigations/i.test(query)) {
      return {
        intent: 'investigation_status',
        entities: { investigation_status: 'Pending' },
        explanation: 'Rule-based: status filter Pending'
      };
    }

    // 7. Show repeat offenders / Which accused appears most
    if (/repeat\s+offenders|accused\s+appears\s+most/i.test(query)) {
      // Inherit context if available
      const location = session.activeFilters?.location;
      const crimeType = session.activeFilters?.crime_type;
      return {
        intent: 'repeat_offenders',
        entities: { location, crime_type: crimeType },
        explanation: 'Rule-based: repeat offenders context lookup'
      };
    }

    // 8. What is the most common crime type
    if (/common\s+crime\s+type|statistics|stats/i.test(query)) {
      const location = session.activeFilters?.location;
      return {
        intent: 'crime_statistics',
        entities: { location },
        explanation: 'Rule-based: statistics lookup'
      };
    }

    return {
      intent: 'GENERAL',
      entities: {},
      explanation: 'Rule-based: general help dialog'
    };
  }

  public async processQuery(userQuery: string, session: SessionContext): Promise<AIQueryResult> {
    const startTime = Date.now();
    let extracted: {
      intent: string;
      entities: Record<string, any>;
      explanation: string;
    };

    if (!this.genAI) {
      console.log('Gemini API key is not configured. Falling back to Rule-Based parsing.');
      extracted = this.runFallbackParser(userQuery, session);
    } else {
      try {
        const model = this.getModel();
        const contextSummary = this.buildContextSummary(session);

        const extractionPrompt = `
You are the Crime Intelligence Natural Language Processor for the Kaveri Crime Intelligence Platform.
Analyze the user query and output a JSON response identifying the intent and entities.

SUPPORTED INTENTS:
1. "get_fir": Retrieve details of a specific Case File / FIR.
   Example: "Show FIR 1001" or "Retrieve FIR-1002" or "Show victims in FIR 1023".
2. "get_accused": Retrieve profile and criminal dossier of a specific suspect by name or ID.
   Example: "Show accused Suresh Gowda" or "Show suspect details of Ravi Kumar".
3. "get_victim": Retrieve profile of a victim by name or ID.
   Example: "Show details for victim Shreya Rao".
4. "crime_by_location": Search for crime incidents in a specific location or district.
   Example: "Show theft cases in Mysuru" or "Show crimes in Bengaluru East" or "Show cyber fraud in Mangaluru".
5. "investigation_status": Filter cases by investigation progress status.
   Status options: "Pending", "Under Investigation", "Completed", "Closed".
   Example: "Show pending investigations" or "List completed cases in Mysuru".
6. "repeat_offenders": Identify suspects with multiple crime entries.
   Example: "List repeat offenders" or "Which accused appears most?".
7. "criminal_history": Dossier lookup for a suspect name (equivalent to get_accused).
   Example: "Show criminal history of Ravi Kumar".
8. "crime_statistics": Aggregate metrics, graphs, counts, or rates of crime.
   Example: "What is the most common crime type?" or "Show statistics for Bengaluru".
9. "GENERAL": Generic greeting, query help, or non-database conversation.

ENTITY KEY DEFINITIONS:
- "fir_id": Text id like "FIR-1001", "1001", "FIR-1023".
- "person_name": Suspect, accused, or victim name like "Ravi Kumar", "Suresh Gowda".
- "crime_type": One of: "Cyber Fraud", "Theft", "Robbery", "Assault", "Financial Crime", "Vehicle Theft", "Burglary", "Narcotics".
- "location": Karnataka district like "Bengaluru", "Bengaluru East", "Bengaluru West", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Shivamogga", "Davanagere", "Kalaburagi".
- "date_range": Any date filters like "May 2026", "between 2024 and 2025".
- "investigation_status": Status string like "Pending", "Under Investigation", "Completed", "Closed".

CONVERSATION CONTEXT MEMORY:
${contextSummary}

CONTEXT INHERITANCE INSTRUCTIONS:
- If the current query lacks details but is a follow-up (e.g. "Which accused appears most?" or "Show details" or "what is their risk score"), you must resolve the missing entities (like location or crime_type) by pulling them from the CONVERSATION CONTEXT.
  For example, if the context shows the last query was about "cyber fraud in Bengaluru", and the user asks "Which accused appears most?", you should extract intent "repeat_offenders" and populate:
  "location": "Bengaluru", "crime_type": "Cyber Fraud" (inherited from context).
  If the user asks "Show details of Ravi Kumar" and then asks "What cases are linked to him?", you should extract intent "criminal_history" and populate:
  "person_name": "Ravi Kumar" (inherited from context).

OUTPUT FORMAT:
Respond with ONLY raw JSON matching this structure. Do NOT include markdown code blocks, backticks, or text before/after.
{
  "intent": "get_fir" | "get_accused" | "get_victim" | "crime_by_location" | "investigation_status" | "repeat_offenders" | "criminal_history" | "crime_statistics" | "GENERAL",
  "entities": {
    "fir_id": "string or null",
    "person_name": "string or null",
    "crime_type": "string or null",
    "location": "string or null",
    "date_range": "string or null",
    "investigation_status": "string or null"
  },
  "explanation": "brief reasoning"
}

USER QUERY:
"${userQuery}"
        `.trim();

        const extractionResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: extractionPrompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        });

        const responseText = extractionResult.response.text().trim();
        try {
          extracted = JSON.parse(responseText);
        } catch (e) {
          const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          extracted = JSON.parse(cleaned);
        }
      } catch (err: any) {
        console.error('Gemini extraction failed, falling back to rule-based parsing:', err);
        extracted = this.runFallbackParser(userQuery, session);
      }
    }

    try {
      // Execute Query Layer based on intent
      let finalMarkdown = '';
      let sqlExecuted = '';
      let sqlResults: any[] = [];
      let activeFilters: Record<string, string> = {};
      let activeEntities: Record<string, any> = {};

      const intent = extracted.intent;
      const entities = extracted.entities || {};

      switch (intent) {
        case 'get_fir': {
          const firId = entities.fir_id || session.activeEntities?.fir_id;
          if (!firId) {
            finalMarkdown = '⚠️ **Error: Could not identify a valid FIR ID. Please specify an ID, e.g. "FIR-1001".**';
            break;
          }
          const result = await queryService.getFir(firId);
          finalMarkdown = formatterService.formatFir(result.data);
          sqlExecuted = result.sql;
          sqlResults = result.data ? [result.data.fir] : [];
          activeEntities = { fir_id: firId };
          if (result.data?.fir) {
            activeFilters = {
              crime_type: result.data.fir.crime_type,
              location: result.data.fir.district,
              investigation_status: result.data.fir.status
            };
          }
          break;
        }

        case 'get_accused':
        case 'criminal_history': {
          const personName = entities.person_name || session.activeEntities?.person_name;
          if (!personName) {
            finalMarkdown = '⚠️ **Error: Suspect name not specified. Please mention a name, e.g., "Ravi Kumar".**';
            break;
          }
          const result = await queryService.getAccused(personName);
          finalMarkdown = formatterService.formatAccused(result.data);
          sqlExecuted = result.sql;
          sqlResults = result.data?.accused ? [result.data.accused] : [];
          activeEntities = { person_name: personName };
          if (result.data?.accused) {
            activeEntities.accused_id = result.data.accused.accused_id;
          }
          break;
        }

        case 'get_victim': {
          const personName = entities.person_name || session.activeEntities?.person_name;
          if (!personName) {
            finalMarkdown = '⚠️ **Error: Victim name not specified. Please mention a name, e.g., "Shreya Rao".**';
            break;
          }
          const result = await queryService.getVictim(personName);
          finalMarkdown = formatterService.formatVictim(result.data);
          sqlExecuted = result.sql;
          sqlResults = result.data?.victim ? [result.data.victim] : [];
          activeEntities = { person_name: personName };
          break;
        }

        case 'crime_by_location': {
          const location = entities.location || session.activeFilters?.location;
          if (!location) {
            finalMarkdown = '⚠️ **Error: Location district not specified. Please mention a district (e.g. "Mysuru").**';
            break;
          }
          const crimeType = entities.crime_type || session.activeFilters?.crime_type;
          const result = await queryService.crimeByLocation(location, crimeType);
          finalMarkdown = formatterService.formatCrimeByLocation(result.data, location, crimeType);
          sqlExecuted = result.sql;
          sqlResults = result.data;
          activeFilters = { location };
          if (crimeType) activeFilters.crime_type = crimeType;
          break;
        }

        case 'investigation_status': {
          const rawStatus = entities.investigation_status || session.activeFilters?.investigation_status || 'Pending';
          let status = 'Pending';
          if (rawStatus.toLowerCase().includes('investig')) status = 'Under Investigation';
          else if (rawStatus.toLowerCase().includes('compl')) status = 'Completed';
          else if (rawStatus.toLowerCase().includes('clos')) status = 'Closed';

          const location = entities.location || session.activeFilters?.location;
          const crimeType = entities.crime_type || session.activeFilters?.crime_type;

          const result = await queryService.investigationStatus(status, location, crimeType);
          finalMarkdown = formatterService.formatInvestigationStatus(result.data, status, location, crimeType);
          sqlExecuted = result.sql;
          sqlResults = result.data;
          
          activeFilters = { investigation_status: status };
          if (location) activeFilters.location = location;
          if (crimeType) activeFilters.crime_type = crimeType;
          break;
        }

        case 'repeat_offenders': {
          const location = entities.location || session.activeFilters?.location;
          const crimeType = entities.crime_type || session.activeFilters?.crime_type;
          const result = await queryService.repeatOffenders(location, crimeType);
          finalMarkdown = formatterService.formatRepeatOffenders(result.data, location, crimeType);
          sqlExecuted = result.sql;
          sqlResults = result.data;

          if (location) activeFilters.location = location;
          if (crimeType) activeFilters.crime_type = crimeType;
          break;
        }

        case 'crime_statistics': {
          const location = entities.location || session.activeFilters?.location;
          const crimeType = entities.crime_type || session.activeFilters?.crime_type;
          const result = await queryService.crimeStatistics(location, crimeType);
          finalMarkdown = formatterService.formatStatistics(result.data, location);
          sqlExecuted = result.sql;
          sqlResults = [result.data];

          if (location) activeFilters.location = location;
          if (crimeType) activeFilters.crime_type = crimeType;
          break;
        }

        case 'GENERAL':
        default: {
          if (!this.genAI) {
            finalMarkdown = `
### 🛡️ Kaveri Crime Intelligence Platform
Active and ready. Available operational queries:
- **Dossier Case File Lookup**: *"Show FIR 1001"*
- **Suspect Details**: *"Show criminal history of Ravi Kumar"*
- **Location Audits**: *"Show theft cases in Mysuru"*
- **Aggregated Analytics**: *"What is the most common crime type?"* or *"Show repeat offenders"*
- **Status Registries**: *"Show pending investigations"*
            `.trim();
            sqlExecuted = '-- No database query required for general assistance.';
          } else {
            const model = this.getModel();
            const chatPrompt = `
You are the Kaveri Crime Intelligence Platform virtual assistant.
Respond to the investigator's message.
Keep your response concise, professional, and helpful. Mention that you can search for Case Files (FIRs), Suspect Dossiers, Victim Profiles, Repeat Offenders, and Location Registries in Karnataka.

USER MESSAGE: "${userQuery}"
            `.trim();

            const chatResult = await model.generateContent({
              contents: [{ role: 'user', parts: [{ text: chatPrompt }] }],
              generationConfig: { temperature: 0.4 }
            });

            finalMarkdown = chatResult.response.text().trim();
            sqlExecuted = '-- No database query required for general assistance.';
          }
          break;
        }
      }

      const executionTimeMs = Date.now() - startTime;

      return {
        text: finalMarkdown,
        sql: sqlExecuted,
        sqlResults: sqlResults.length > 0 ? sqlResults : undefined,
        activeFilters,
        activeEntities,
        queryMetadata: {
          intent,
          explanation: extracted.explanation || 'Intent resolved',
          executionTimeMs
        }
      };

    } catch (err: any) {
      console.error('AI Query Pipeline Error:', err);
      return {
        text: `Error processing query: ${err.message || 'An unknown error occurred.'}`,
        queryMetadata: {
          intent: 'ERROR',
          explanation: err.message || 'Pipeline failed',
          executionTimeMs: Date.now() - startTime
        }
      };
    }
  }

  private buildContextSummary(session: SessionContext): string {
    let summary = '';
    if (session.activeFilters && Object.keys(session.activeFilters).length > 0) {
      summary += `- Last Active Filters: ${JSON.stringify(session.activeFilters)}\n`;
    }
    if (session.activeEntities && Object.keys(session.activeEntities).length > 0) {
      summary += `- Last Active Entities: ${JSON.stringify(session.activeEntities)}\n`;
    }
    
    const lastUserMsg = session.messages.filter(m => m.role === 'user').pop();
    if (lastUserMsg) {
      summary += `- Last Investigator Query: "${lastUserMsg.content}"\n`;
    }

    return summary || 'No previous conversation context details are stored.';
  }
}

export const aiService = new AIService();
