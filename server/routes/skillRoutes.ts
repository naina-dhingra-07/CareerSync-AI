import express from 'express';
import { 
  analyzeSkillGap, 
  getMySkills, 
  getUserSkills, 
  markSkillComplete 
} from '../controllers/skillController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);
router.get('/me', getMySkills);
router.post('/analyze', authorize('student'), analyzeSkillGap);
router.put('/:skillId/complete', authorize('student'), markSkillComplete);
router.get('/:userId', getUserSkills);

export default router;
