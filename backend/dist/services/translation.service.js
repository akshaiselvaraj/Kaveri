"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("../config");
class TranslationService {
    genAI = null;
    constructor() {
        if (config_1.config.GEMINI_API_KEY) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(config_1.config.GEMINI_API_KEY);
        }
    }
    getModel() {
        if (!this.genAI)
            throw new Error('Gemini API key is not configured.');
        return this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    async detectLanguage(text) {
        if (!this.genAI) {
            // Offline fallback: Check for Kannada characters (Unicode range \u0c80-\u0cff) or transliteration keywords
            const hasKannadaUnicode = /[\u0c80-\u0cff]/.test(text);
            const hasTranslitKeywords = /\b(madi|toral|toli|haku|ide|illa|kannada)\b/i.test(text);
            if (hasKannadaUnicode || hasTranslitKeywords) {
                return 'kn';
            }
            return 'en';
        }
        try {
            const model = this.getModel();
            const prompt = `Analyze the language of the following text. Respond with ONLY 'kn' if it is Kannada (either Kannada script like ಕನ್ನಡ or Kannada written in English script like 'kannada', e.g., 'theft cases show madi'), otherwise respond with 'en'. No punctuation or explanations.
Text: "${text.replace(/"/g, '\\"')}"`;
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 5 }
            });
            const responseText = result.response.text().trim().toLowerCase();
            return responseText.includes('kn') ? 'kn' : 'en';
        }
        catch (error) {
            console.error('Language detection failed, using fallback:', error);
            // Fallback check
            return /[\u0c80-\u0cff]/.test(text) ? 'kn' : 'en';
        }
    }
    async translate(text, targetLang) {
        if (!text.trim())
            return text;
        if (!this.genAI) {
            // Rule-based dictionary fallback for offline operational testing
            if (targetLang === 'en') {
                let clean = text.trim();
                // Exact query mappings
                if (clean.includes('ಬೆಂಗಳೂರುದಲ್ಲಿ ಸೈಬರ್ ಅಪರಾಧಗಳು') || clean.includes('ಬೆಂಗಳೂರು ಸೈಬರ್')) {
                    return 'Show cyber fraud cases in Bengaluru';
                }
                if (clean.includes('ಮೈಸೂರುನಲ್ಲಿ ಕಳ್ಳತನ') || clean.includes('ಮೈಸೂರು ಕಳ್ಳತನ')) {
                    return 'Show theft cases in Mysuru';
                }
                if (clean.includes('ರವಿ ಕುಮಾರ್ ಅಪರಾಧ ಇತಿಹಾಸ') || clean.includes('ರವಿ ಕುಮಾರ್')) {
                    return 'Show criminal history of Ravi Kumar';
                }
                // Generic word mappings
                clean = clean
                    .replace(/ಬೆಂಗಳೂರು(?:ದಲ್ಲಿ|ನ|ನಲ್ಲಿ)?/g, 'Bengaluru')
                    .replace(/ಮೈಸೂರು(?:ನಲ್ಲಿ|ನ)?/g, 'Mysuru')
                    .replace(/ಮಂಗಳೂರು(?:ನಲ್ಲಿ|ನ)?/g, 'Mangaluru')
                    .replace(/ಹುಬ್ಬಳ್ಳಿ(?:ನಲ್ಲಿ|ನ)?/g, 'Hubballi')
                    .replace(/ಬೆಳಗಾವಿ(?:ನಲ್ಲಿ|ನ)?/g, 'Belagavi')
                    .replace(/ಸೈಬರ್\s+ಅಪರಾಧ(?:ಗಳು)?/g, 'cyber fraud')
                    .replace(/ಕಳ್ಳತನ(?:ಗಳು)?/g, 'theft')
                    .replace(/ತೋರಿಸಿ|ತೋರು|ತೋರ್ಸಿ/g, 'show')
                    .replace(/ಪ್ರಕರಣಗಳು|ಪ್ರಕರಣ/g, 'cases');
                return clean;
            }
            else {
                // Translate English response to Kannada
                let clean = text;
                // Offline headers dictionary
                const dictionary = {
                    'Investigation File': 'ತನಿಖಾ ಕಡತ',
                    'Crime Type': 'ಅಪರಾಧದ ವಿಧ',
                    'Status': 'ಪ್ರಕರಣದ ಸ್ಥಿತಿ',
                    'Date': 'ದಿನಾಂಕ',
                    'Location': 'ಸ್ಥಳ',
                    'Description': 'ವಿವರಣೆ',
                    'Linked Suspects/Accused': 'ಲಿಂಕ್ ಮಾಡಲಾದ ಆರೋಪಿಗಳು',
                    'Suspect Name': 'ಆರೋಪಿಯ ಹೆಸರು',
                    'Age': 'ವಯಸ್ಸು',
                    'Gender': 'ಲಿಂಗ',
                    'Occupation': 'ಉದ್ಯೋಗ',
                    'Risk Score': 'ಅಪಾಯದ ಅಂಕ',
                    'Dossier': 'ದಸ್ತಾವೇಜು',
                    'Linked Victims': 'ಸಂತ್ರಸ್ತರು',
                    'Victim Name': 'ಸಂತ್ರಸ್ತನ ಹೆಸರು',
                    'Associated Account Transactions': 'ಖಾತೆ ವಹಿವಾಟುಗಳು',
                    'Repeat Offenders': 'ಪುನರಾವರ್ತಿತ ಅಪರಾಧಿಗಳು',
                    'Incident Registry': 'ಅಪರಾಧಗಳ ದಾಖಲಾತಿ',
                    'Crime Intelligence Summary Report': 'ಅಪರಾಧ ಗುಪ್ತಚರ ಸಾರಾಂಶ ವರದಿ',
                    'Total Registered Cases': 'ಒಟ್ಟು ದಾಖಲಾದ ಪ್ರಕರಣಗಳು'
                };
                Object.entries(dictionary).forEach(([eng, kan]) => {
                    const regex = new RegExp(eng, 'gi');
                    clean = clean.replace(regex, kan);
                });
                return `**ಕನ್ನಡ ಅನುವಾದ (ಕಾವೇರಿ ಸಹಾಯಕಿ):**\n\n${clean}`;
            }
        }
        try {
            const model = this.getModel();
            let prompt = '';
            if (targetLang === 'en') {
                prompt = `You are a translator. Translate the following text from Kannada (which could be in Kannada script or transliterated Kannada using Latin letters) to English.
Ensure police terminology is translated accurately (e.g., 'theft', 'burglary', 'cyber fraud', 'accused', 'victim', 'FIR').
Respond ONLY with the translated English text, nothing else.
Text: "${text.replace(/"/g, '\\"')}"`;
            }
            else {
                prompt = `You are a translator. Translate the following English text to Kannada (using Kannada script, e.g. ಕನ್ನಡ).
Keep specific database terms, identifiers (like 'FIR-1001', 'TXN-101'), numbers, and English names in English if they are clearer to investigators, but write the rest in proper professional Kannada.
Respond ONLY with the translated Kannada text, nothing else.
Text: "${text.replace(/"/g, '\\"')}"`;
            }
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2 }
            });
            return result.response.text().trim();
        }
        catch (error) {
            console.error(`Translation to ${targetLang} failed, returning fallback:`, error);
            return text;
        }
    }
}
exports.translationService = new TranslationService();
