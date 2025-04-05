import { Router } from "express";
import { PrismaClient, Role, Status } from "@prisma/client";
import verifyToken from "../middlewares/middleware";

const prisma = new PrismaClient();

export const technicianRouter = Router();

// Get technician's assigned tickets
technicianRouter.get('/tickets', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user?.role !== Role.TECHNICIAN) {
            res.status(403).json({
                success: false,
                message: "Only technicians can view their assigned tickets"
            });
            return;
        }

        const tickets = await prisma.ticket.findMany({
            where: { 
                assignedToId: userId,
                status: {
                    in: [Status.ASSIGNED, Status.IN_PROGRESS]
                }
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching assigned tickets"
        });
    }
});

// Get technician's completed tickets
technicianRouter.get('/completed-tickets', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user?.role !== Role.TECHNICIAN) {
            res.status(403).json({
                success: false,
                message: "Only technicians can view their completed tickets"
            });
            return;
        }

        const tickets = await prisma.ticket.findMany({
            where: { 
                assignedToId: userId,
                status: Status.CLOSED
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                resolvedAt: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching completed tickets"
        });
    }
});