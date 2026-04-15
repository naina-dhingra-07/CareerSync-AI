import express from 'express';
import { 
  uploadResume, 
  saveResume, 
  getResumes, 
  deleteResume,
  getLatestResume,
  updateResumeAnalysis
} from '../controllers/resumeController.js';
import { protect, authorize } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.use(protect);
router.post('/upload', authorize('student'), upload.single('resume'), uploadResume);
router.put('/:id/analysis', authorize('student'), updateResumeAnalysis);
router.get('/', getResumes);
router.get('/latest', getLatestResume);
router.put('/:id', authorize('student'), saveResume);
router.delete('/:id', authorize('student'), deleteResume);

export default router;
