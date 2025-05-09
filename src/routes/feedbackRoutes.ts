import express from 'express';
import { createFeedback, getFeedback } from '../controllers/feedbackController';
import verifyToken from '../middlewares/middleware';

const router = express.Router();

router.post('/', verifyToken, createFeedback);
router.get('/', verifyToken, getFeedback);

export default router; 