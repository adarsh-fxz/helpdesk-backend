import { Router } from "express";
import { PrismaClient, Status } from "@prisma/client";
import verifyToken from "../middlewares/middleware";

const prisma = new PrismaClient();

export const ticketRouter = Router();

// Create a ticket
ticketRouter.post('/create', verifyToken, async (req, res) => {
    try {
        const { title, description, imageUrls = [] } = req.body;
        const userId = (req as any).userId;

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                imageUrls,
                status: Status.OPEN,
                createdBy: {
                    connect: { id: userId }
                }
            },
            include: {
                createdBy: true,
                assignedTo: true
            }
        });

        res.status(201).json({
            success: true,
            data: ticket,
            message: "Ticket created successfully"
        });
        return;
    } catch (error: any) {
        console.error("Error creating ticket:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create ticket",
            error: error.message
        });
    }
});

// Get all tickets
ticketRouter.get('/', verifyToken, async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: tickets,
            message: "Tickets retrieved successfully"
        });
    } catch (error: any) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve tickets",
            error: error.message
        });
    }
});

// Get a single ticket by ID
ticketRouter.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!ticket) {
            res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: ticket,
            message: "Ticket retrieved successfully"
        });
        return;
    } catch (error: any) {
        console.error("Error fetching ticket:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve ticket",
            error: error.message
        });
        return;
    }
});

// Update a ticket
ticketRouter.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, imageUrls, assignedToId } = req.body;

        // Check if the ticket exists
        const ticketExists = await prisma.ticket.findUnique({
            where: { id }
        });

        if (!ticketExists) {
            res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
            return
        }

        // Prepare update data
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (imageUrls !== undefined) updateData.imageUrls = imageUrls;
        if (status !== undefined) updateData.status = status;

        // If status is being changed to CLOSED, set resolvedAt
        if (status === Status.CLOSED && ticketExists.status !== Status.CLOSED) {
            updateData.resolvedAt = new Date();
        }

        // Handle assignedTo relationship
        if (assignedToId) {
            updateData.assignedTo = {
                connect: { id: assignedToId }
            };

            // If we're assigning the ticket and it's OPEN, change status to ASSIGNED
            if (ticketExists.status === Status.OPEN && !ticketExists.assignedToId) {
                updateData.status = Status.ASSIGNED;
            }
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data: updateData,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: ticket,
            message: "Ticket updated successfully"
        });
    } catch (error: any) {
        console.error("Error updating ticket:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update ticket",
            error: error.message
        });
    }
});

// Delete a ticket
ticketRouter.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the ticket exists
        const ticketExists = await prisma.ticket.findUnique({
            where: { id }
        });

        if (!ticketExists) {
            res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
            return
        }

        await prisma.ticket.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: "Ticket deleted successfully"
        });
    } catch (error: any) {
        console.error("Error deleting ticket:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete ticket",
            error: error.message
        });
    }
});