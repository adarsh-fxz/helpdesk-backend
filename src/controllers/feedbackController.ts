import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CustomRequest extends Request {
  userId: string;
}

export const createFeedback = async (req: CustomRequest, res: Response) => {
  try {
    const { subject, message, rating } = req.body;
    const userId = req.userId;

    const feedback = await prisma.feedback.create({
      data: {
        subject,
        message,
        rating,
        userId,
      },
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Failed to create feedback' });
  }
};

export const getFeedback = async (req: CustomRequest, res: Response) => {
  try {
    const feedback = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
}; 