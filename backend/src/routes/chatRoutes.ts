import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { sendMessage, getChatHistory } from '../controllers/chatController';

const router = Router();

router.post('/', authenticate, sendMessage);
router.get('/history', authenticate, getChatHistory);

export default router;
