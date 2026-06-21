import { Router } from 'express';
import {
  chatHandler,
  translateHandler,
  voiceQueryHandler,
  historyHandler,
  getFirHandler,
  getAccusedHandler,
  getVictimHandler,
  exportPdfHandler
} from '../controllers/chat.controller';

const router = Router();

// Chat & AI pipeline
router.post('/chat', chatHandler);
router.post('/translate', translateHandler);
router.post('/voice-query', voiceQueryHandler);
router.post('/export-pdf', exportPdfHandler);

// History listing
router.get('/history', historyHandler);

// Entity detail retrievals
router.get('/fir/:id', getFirHandler);
router.get('/accused/:id', getAccusedHandler);
router.get('/victim/:id', getVictimHandler);

export default router;
