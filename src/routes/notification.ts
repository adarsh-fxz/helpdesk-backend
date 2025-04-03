import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import verifyToken from "../middlewares/middleware";

const prisma = new PrismaClient();

export const notificationRouter = Router();

// Get user notifications
notificationRouter.get('/', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching notifications"
        });
    }
});

// Mark notification as read
notificationRouter.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.status(200).json({
            success: true,
            data: notification,
            message: "Notification marked as read"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating notification"
        });
    }
});

// Mark all notifications as read
notificationRouter.put('/read-all', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating notifications"
        });
    }
}); 