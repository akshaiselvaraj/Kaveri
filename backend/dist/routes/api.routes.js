"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const router = (0, express_1.Router)();
// Chat & AI pipeline
router.post('/chat', chat_controller_1.chatHandler);
router.post('/translate', chat_controller_1.translateHandler);
router.post('/voice-query', chat_controller_1.voiceQueryHandler);
router.post('/export-pdf', chat_controller_1.exportPdfHandler);
// History listing
router.get('/history', chat_controller_1.historyHandler);
// Entity detail retrievals
router.get('/fir/:id', chat_controller_1.getFirHandler);
router.get('/accused/:id', chat_controller_1.getAccusedHandler);
router.get('/victim/:id', chat_controller_1.getVictimHandler);
exports.default = router;
