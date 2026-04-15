import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  getTeachers 
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/teachers', protect, getTeachers);

export default router;
