import express from 'express';
import { 
  getJobs, 
  getJobById, 
  generateApplicationEmail, 
  sendApplicationEmail,
  seedTeachers
} from '../controllers/jobController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.use(protect);
router.get('/', getJobs);
router.post('/seed-teachers', seedTeachers);
router.get('/:id', getJobById);
router.post('/:id/generate-email', generateApplicationEmail);
router.post('/:id/send-email', upload.single('resumeFile'), sendApplicationEmail);

export default router;
