import { Router } from "express";
import { PrismaClient, Role } from "@prisma/client";
import verifyToken from "../middlewares/middleware";

const prisma = new PrismaClient();

export const userRouter = Router();

// Get user profile
userRouter.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching user profile"
        });
    }
});

// Update user role (Admin only)
userRouter.put('/:userId/role', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const currentUserId = (req as any).userId;

        // Check if current user is admin
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId }
        });

        if (currentUser?.role !== Role.ADMIN) {
            res.status(403).json({
                success: false,
                message: "Only admin can update user roles"
            });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: role as Role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: "User role updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating user role"
        });
    }
}); 