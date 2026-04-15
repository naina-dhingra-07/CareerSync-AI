import express from 'express';
import {
  getConversationList,
  getConversation,
  sendMessage,
  getUnreadCount,
  uploadAudio,
  uploadFile,
} from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.use(protect);
router.get('/', getConversationList);
router.get('/unread', getUnreadCount);
router.post('/upload-audio', upload.single('audio'), uploadAudio);
router.post('/upload-file', upload.single('file'), uploadFile);
router.get('/:userId', getConversation);
router.post('/:userId', upload.single('attachment'), sendMessage);

export default router;
