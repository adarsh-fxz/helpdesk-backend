import { Router } from 'express';
import { getChatMessages, createChatMessage } from '../controllers/chatController';
import verifyToken from '../middlewares/middleware';

const chatRouter = Router();

// Get chat messages for a ticket
chatRouter.get('/:ticketId', verifyToken, getChatMessages);

// Create a new chat message
chatRouter.post('/:ticketId', verifyToken, createChatMessage);

export default chatRouter; 