"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPdfHandler = exports.getVictimHandler = exports.getAccusedHandler = exports.getFirHandler = exports.historyHandler = exports.voiceQueryHandler = exports.translateHandler = exports.chatHandler = void 0;
const context_service_1 = require("../services/context.service");
const translation_service_1 = require("../services/translation.service");
const ai_service_1 = require("../services/ai.service");
const sqlite_1 = require("../db/sqlite");
const pdf_lib_1 = require("pdf-lib");
const chatHandler = async (req, res) => {
    try {
        const { message, sessionId, lang } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty.' });
        }
        const activeSessionId = sessionId || 'default-session';
        const session = context_service_1.contextService.getOrCreateSession(activeSessionId);
        // 1. Language detection and translation to English if Kannada
        let detectedLang = lang;
        if (!detectedLang) {
            detectedLang = await translation_service_1.translationService.detectLanguage(message);
        }
        let processedMessage = message;
        if (detectedLang === 'kn') {
            processedMessage = await translation_service_1.translationService.translate(message, 'en');
        }
        // 2. Process query using the AI Pipeline
        const aiResult = await ai_service_1.aiService.processQuery(processedMessage, session);
        // 3. Save user message and AI response to Context Store
        context_service_1.contextService.addMessage(activeSessionId, 'user', message);
        let finalResponseText = aiResult.text;
        // If original language was Kannada, translate the response back to Kannada
        if (detectedLang === 'kn') {
            finalResponseText = await translation_service_1.translationService.translate(aiResult.text, 'kn');
        }
        context_service_1.contextService.addMessage(activeSessionId, 'model', finalResponseText, aiResult.sql, aiResult.sqlResults, {
            activeFilters: aiResult.activeFilters,
            activeEntities: aiResult.activeEntities,
        });
        // 4. Respond
        return res.json({
            text: finalResponseText,
            sql: aiResult.sql,
            sqlResults: aiResult.sqlResults,
            activeFilters: aiResult.activeFilters || session.activeFilters,
            activeEntities: aiResult.activeEntities || session.activeEntities,
            queryMetadata: aiResult.queryMetadata,
            detectedLang
        });
    }
    catch (error) {
        console.error('Chat handler failed:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.chatHandler = chatHandler;
const translateHandler = async (req, res) => {
    try {
        const { text, targetLang } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required for translation.' });
        }
        const translated = await translation_service_1.translationService.translate(text, targetLang === 'kn' ? 'kn' : 'en');
        return res.json({ translated });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.translateHandler = translateHandler;
const voiceQueryHandler = async (req, res) => {
    // Voice query routes directly to chatHandler, as STT runs in client browser
    return (0, exports.chatHandler)(req, res);
};
exports.voiceQueryHandler = voiceQueryHandler;
const historyHandler = async (req, res) => {
    try {
        const list = context_service_1.contextService.getHistoryList();
        return res.json(list);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.historyHandler = historyHandler;
const getFirHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const fir = await (0, sqlite_1.queryGet)(`
      SELECT f.*, l.district, l.latitude, l.longitude 
      FROM fir f 
      LEFT JOIN location l ON f.location_id = l.location_id 
      WHERE f.fir_id = ?
    `, [id]);
        if (!fir) {
            return res.status(404).json({ error: `FIR with ID ${id} not found.` });
        }
        // Get linked accused & victims
        const accused = await (0, sqlite_1.queryAll)(`
      SELECT a.* FROM accused a 
      JOIN crime_link c ON a.accused_id = c.accused_id 
      WHERE c.fir_id = ?
    `, [id]);
        const victims = await (0, sqlite_1.queryAll)(`
      SELECT v.* FROM victim v 
      JOIN crime_link c ON v.victim_id = c.victim_id 
      WHERE c.fir_id = ?
    `, [id]);
        return res.json({ ...fir, accused, victims });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getFirHandler = getFirHandler;
const getAccusedHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const accused = await (0, sqlite_1.queryGet)('SELECT * FROM accused WHERE accused_id = ?', [id]);
        if (!accused) {
            return res.status(404).json({ error: `Accused with ID ${id} not found.` });
        }
        // Get criminal history
        const history = await (0, sqlite_1.queryAll)(`
      SELECT f.fir_id, f.crime_type, f.date, f.status 
      FROM fir f
      JOIN crime_link c ON f.fir_id = c.fir_id
      WHERE c.accused_id = ?
    `, [id]);
        return res.json({ ...accused, history });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getAccusedHandler = getAccusedHandler;
const getVictimHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const victim = await (0, sqlite_1.queryGet)('SELECT * FROM victim WHERE victim_id = ?', [id]);
        if (!victim) {
            return res.status(404).json({ error: `Victim with ID ${id} not found.` });
        }
        const cases = await (0, sqlite_1.queryAll)(`
      SELECT f.fir_id, f.crime_type, f.date, f.status 
      FROM fir f
      JOIN crime_link c ON f.fir_id = c.fir_id
      WHERE c.victim_id = ?
    `, [id]);
        return res.json({ ...victim, cases });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getVictimHandler = getVictimHandler;
const exportPdfHandler = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = context_service_1.contextService.getOrCreateSession(sessionId || 'default-session');
        // Create a PDF Document
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        let page = pdfDoc.addPage([600, 800]);
        const { width, height } = page.getSize();
        const fontHelvetica = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const fontHelveticaBold = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        let y = height - 50;
        // Header
        page.drawText('KAVERI CRIME INTELLIGENCE PLATFORM', {
            x: 50,
            y,
            size: 18,
            font: fontHelveticaBold,
            color: (0, pdf_lib_1.rgb)(0.05, 0.1, 0.3)
        });
        y -= 25;
        page.drawText('OFFICIAL INVESTIGATION INTEL REPORT', {
            x: 50,
            y,
            size: 12,
            font: fontHelveticaBold,
            color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.4)
        });
        y -= 15;
        page.drawLine({
            start: { x: 50, y },
            end: { x: 550, y },
            thickness: 2,
            color: (0, pdf_lib_1.rgb)(0.1, 0.2, 0.5)
        });
        // Metadata Info Block
        y -= 30;
        page.drawText(`Session ID: ${session.sessionId}`, { x: 50, y, size: 9, font: fontHelvetica, color: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.2) });
        page.drawText(`Date Exported: ${new Date().toLocaleString()}`, { x: 350, y, size: 9, font: fontHelvetica, color: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.2) });
        y -= 15;
        page.drawText(`Classification: CONFIDENTIAL // LAW ENFORCEMENT ONLY`, {
            x: 50,
            y,
            size: 9,
            font: fontHelveticaBold,
            color: (0, pdf_lib_1.rgb)(0.8, 0.1, 0.1)
        });
        y -= 30;
        if (session.messages.length === 0) {
            page.drawText('No record logs in this session.', { x: 50, y, size: 12, font: fontHelvetica });
        }
        else {
            // Loop over messages
            for (const msg of session.messages) {
                // Check if we need a new page
                if (y < 100) {
                    page = pdfDoc.addPage([600, 800]);
                    y = height - 50;
                }
                const roleText = msg.role === 'user' ? 'INVESTIGATOR QUERY:' : 'INTEL SYSTEM RESPONSE:';
                page.drawText(roleText, {
                    x: 50,
                    y,
                    size: 10,
                    font: fontHelveticaBold,
                    color: msg.role === 'user' ? (0, pdf_lib_1.rgb)(0, 0.4, 0) : (0, pdf_lib_1.rgb)(0, 0, 0.5)
                });
                y -= 15;
                // Message text clean-up (remove basic markdown stars)
                const cleanContent = msg.content
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/#/g, '');
                // Wrap text
                const words = cleanContent.split(' ');
                let line = '';
                const lines = [];
                for (const word of words) {
                    const testLine = line + word + ' ';
                    const width = fontHelvetica.widthOfTextAtSize(testLine, 10);
                    if (width > 500) {
                        lines.push(line.trim());
                        line = word + ' ';
                    }
                    else {
                        line = testLine;
                    }
                }
                lines.push(line.trim());
                for (const textLine of lines) {
                    if (y < 60) {
                        page = pdfDoc.addPage([600, 800]);
                        y = height - 50;
                    }
                    page.drawText(textLine, {
                        x: 60,
                        y,
                        size: 9,
                        font: fontHelvetica,
                        color: (0, pdf_lib_1.rgb)(0.1, 0.1, 0.1)
                    });
                    y -= 12;
                }
                // Print SQL if exists
                if (msg.sql) {
                    if (y < 80) {
                        page = pdfDoc.addPage([600, 800]);
                        y = height - 50;
                    }
                    y -= 5;
                    page.drawText(`Executed Database SQL:`, {
                        x: 60,
                        y,
                        size: 8,
                        font: fontHelveticaBold,
                        color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.4)
                    });
                    y -= 10;
                    page.drawText(msg.sql, {
                        x: 65,
                        y,
                        size: 8,
                        font: fontHelvetica,
                        color: (0, pdf_lib_1.rgb)(0.3, 0.2, 0.6)
                    });
                    y -= 15;
                }
                y -= 15; // padding between interactions
            }
        }
        // Save Document
        const pdfBytes = await pdfDoc.save();
        // Set headers and send
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Kaveri_Intel_Report_${session.sessionId}.pdf`);
        return res.send(Buffer.from(pdfBytes));
    }
    catch (error) {
        console.error('PDF Export failed:', error);
        return res.status(500).json({ error: error.message });
    }
};
exports.exportPdfHandler = exportPdfHandler;
