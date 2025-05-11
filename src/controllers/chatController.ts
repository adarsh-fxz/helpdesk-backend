import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CustomRequest extends Request {
  userId: string;
}

export const getChatMessages = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const userId = req.userId;

    // Verify user has access to this ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true,
        assignedTo: true
      }
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
      return;
    }

    // Check if user is either the creator or assigned technician
    if (ticket.createdById !== userId && ticket.assignedToId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this chat'
      });
      return;
    }

    const messages = await prisma.chatMessage.findMany({
      where: { ticketId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat messages'
    });
  }
};

export const createChatMessage = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    // Verify user has access to this ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true,
        assignedTo: true
      }
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
      return;
    }

    // Check if user is either the creator or assigned technician
    if (ticket.createdById !== userId && ticket.assignedToId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this chat'
      });
      return;
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        ticketId,
        senderId: userId,
        message
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: chatMessage
    });
  } catch (error) {
    console.error('Error creating chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat message'
    });
  }
}; 