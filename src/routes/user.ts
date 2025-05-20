import { Router } from "express";
import { PrismaClient, Role } from "@prisma/client";
import verifyToken from "../middlewares/middleware";
import path from "path";
import { profile } from "console";



const prisma = new PrismaClient();

export const userRouter = Router();

// Get all users (Admin only)
userRouter.get('/users', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const currentUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (currentUser?.role !== Role.ADMIN) {
            res.status(403).json({
                success: false,
                message: "Only admin can view all users"
            });
            return;
        }

        const users = await prisma.user.findMany({
            where: { role: Role.USER },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                profilePicture: true
            }
        });

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching users"
        });
    }
});

// Get all technicians (Admin only)
userRouter.get('/technicians', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const currentUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (currentUser?.role !== Role.ADMIN) {
            res.status(403).json({
                success: false,
                message: "Only admin can view technicians"
            });
            return;
        }

        const technicians = await prisma.user.findMany({
            where: { role: Role.TECHNICIAN },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                profilePicture: true
            }
        });

        res.status(200).json({
            success: true,
            data: technicians
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching technicians"
        });
    }
});

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
                phone: true,
                bio: true,
                department: true,
                location: true,
                createdAt: true,
                updatedAt: true,
                profilePicture: true
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

        // Validate role
        if (!Object.values(Role).includes(role)) {
            res.status(400).json({
                success: false,
                message: "Invalid role"
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
                role: true,
                profilePicture: true
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

// Delete user (Admin only)
userRouter.delete('/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = (req as any).userId;

        // Check if current user is admin
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId }
        });

        if (currentUser?.role !== Role.ADMIN) {
            res.status(403).json({
                success: false,
                message: "Only admin can delete users"
            });
            return;
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Delete user
        await prisma.user.delete({
            where: { id: userId }
        });

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting user"
        });
    }
});

// Update user profile
userRouter.put('/profile', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { name, phone, bio, department, location ,profilePicture} = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name,
                phone: phone,
                bio: bio,
                department: department,
                location: location,
                profilePicture: profilePicture,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                bio: true,
                department: true,
                location: true,
                profilePicture: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: "Profile updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating profile"
        });
    }
}); 

