import { Router, Request, Response } from "express";
import { PrismaClient, Status, Role } from "@prisma/client";
import verifyToken from "../middlewares/middleware";

const prisma = new PrismaClient();

export const ticketRouter = Router();

// Create a ticket
ticketRouter.post('/create', verifyToken, async (req, res) => {
    try {
        const { title, description, imageUrls = [], location, latitude, longitude, notify = true } = req.body;
        const userId = (req as any).userId;

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                imageUrls,
                location,
                latitude,
                longitude,
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

        // Create notifications for admins and technicians if notify is true
        if (notify) {
            const adminsAndTechnicians = await prisma.user.findMany({
                where: {
                    role: {
                        in: [Role.ADMIN, Role.TECHNICIAN]
                    }
                }
            });

            // Create notifications for each admin/technician
            await Promise.all(adminsAndTechnicians.map(user => 
                prisma.notification.create({
                    data: {
                        userId: user.id,
                        message: `New support ticket "${ticket.title}" has been created and requires attention`,
                        isRead: false
                    }
                })
            ));
        }

        res.status(201).json({
            success: true,
            data: ticket,
            message: "Ticket created successfully"
        });
    } catch (error: any) {
        console.error("Error creating ticket:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create ticket",
            error: error.message
        });
    }
});

// Get user's own tickets
ticketRouter.get('/my-tickets', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const tickets = await prisma.ticket.findMany({
            where: { createdById: userId },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                createdAt: true,
                resolvedAt: true,
                location: true,
                latitude: true,
                longitude: true,
                imageUrls: true,
                
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePicture: true
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching user tickets"
        });
    }
});

// Get open tickets (for technicians)
ticketRouter.get('/open', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user?.role !== Role.TECHNICIAN && user?.role !== Role.ADMIN) {
            res.status(403).json({
                success: false,
                message: "Only technicians and admins can view open tickets"
            });
            return;
        }

        const tickets = await prisma.ticket.findMany({
            where: { 
                status: {
                    in: [Status.OPEN, Status.ASSIGNED, Status.IN_PROGRESS]
                }
            },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                createdAt: true,
                resolvedAt: true,
                location: true,
                latitude: true,
                longitude: true,
                imageUrls: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profilePicture: true
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching open tickets"
        });
    }
});

// Get tickets assigned to the current technician
ticketRouter.get('/assigned', verifyToken, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const currentUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!currentUser) {
            res.status(403).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // If user is not admin or technician, deny access
        if (currentUser.role !== Role.TECHNICIAN && currentUser.role !== Role.ADMIN) {
            res.status(403).json({
                success: false,
                message: "Only technicians and admins can view assigned tickets"
            });
            return;
        }

        // Build the where clause based on user role
        const whereClause = currentUser.role === Role.ADMIN 
            ? { assignedToId: { not: null } }  // Show all assigned tickets for admins
            : { assignedToId: userId };        // Show only tickets assigned to the technician

        const assignedTickets = await prisma.ticket.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                createdAt: true,
                resolvedAt: true,
                location: true,
                latitude: true,
                longitude: true,
                imageUrls: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profilePicture: true,
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profilePicture: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: assignedTickets
        });
    } catch (error) {
        console.error('Error fetching assigned tickets:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching assigned tickets"
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
    } catch (error: any) {
        console.error("Error fetching ticket:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve ticket",
            error: error.message
        });
    }
});

// Update a ticket
ticketRouter.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, imageUrls, assignedToId } = req.body;

        const ticketExists = await prisma.ticket.findUnique({
            where: { id }
        });

        if (!ticketExists) {
            res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
            return;
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (imageUrls !== undefined) updateData.imageUrls = imageUrls;
        if (status !== undefined) updateData.status = status;

        if (status === Status.CLOSED && ticketExists.status !== Status.CLOSED) {
            updateData.resolvedAt = new Date();
        }

        if (assignedToId) {
            updateData.assignedTo = {
                connect: { id: assignedToId }
            };

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

// Assign ticket to technician
ticketRouter.put('/:id/assign', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { technicianId } = req.body;
        const userId = (req as any).userId;

        // Check if current user is admin or technician
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // If user is not admin or technician, deny access
        if (user?.role !== Role.ADMIN && user?.role !== Role.TECHNICIAN) {
            res.status(403).json({
                success: false,
                message: "Only admin and technicians can assign tickets"
            });
            return;
        }

        // If user is technician, they can only assign to themselves
        if (user?.role === Role.TECHNICIAN && technicianId !== userId) {
            res.status(403).json({
                success: false,
                message: "Technicians can only assign tickets to themselves"
            });
            return;
        }

        // Check if technician exists and is actually a technician
        const technician = await prisma.user.findUnique({
            where: { id: technicianId }
        });

        if (!technician) {
            res.status(404).json({
                success: false,
                message: "Technician not found"
            });
            return;
        }

        if (technician.role !== Role.TECHNICIAN) {
            res.status(400).json({
                success: false,
                message: "User is not a technician"
            });
            return;
        }

        // Check if ticket exists
        const existingTicket = await prisma.ticket.findUnique({
            where: { id }
        });

        if (!existingTicket) {
            res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
            return;
        }

        // Update the ticket
        const ticket = await prisma.ticket.update({
            where: { id },
            data: {
                assignedToId: technicianId,
                status: Status.ASSIGNED
            },
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
                        email: true,
                        role: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: ticket,
            message: "Ticket assigned successfully"
        });
    } catch (error) {
        console.error("Error assigning ticket:", error);
        res.status(500).json({
            success: false,
            message: "Error assigning ticket"
        });
    }
});

// Update ticket status
ticketRouter.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (req as any).userId;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: { assignedTo: true }
        });

        if (!ticket) {
            res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
            return;
        }

        if (user?.role !== Role.ADMIN && 
            (user?.role !== Role.TECHNICIAN || ticket.assignedTo?.id !== userId)) {
            res.status(403).json({
                success: false,
                message: "You don't have permission to update this ticket's status"
            });
            return;
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: { 
                status: status as Status,
                resolvedAt: status === Status.CLOSED ? new Date() : undefined
            },
            include: {
                createdBy: true,
                assignedTo: true
            }
        });

        res.status(200).json({
            success: true,
            data: updatedTicket,
            message: "Ticket status updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating ticket status"
        });
    }
});

// Unassign ticket
ticketRouter.put('/:id/unassign', verifyToken, async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id;
        const userId = (req as any).userId;

        // Get the ticket
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { assignedTo: true }
        });

        if (!ticket) {
            res.status(404).json({ success: false, message: 'Ticket not found' });
            return;
        }

        // Check if the current user is the assigned technician
        if (ticket.assignedTo?.id !== userId) {
            res.status(403).json({ 
                success: false, 
                message: 'Only the assigned technician can unassign this ticket' 
            });
            return;
        }

        // Update the ticket to remove assignment and set status to OPEN
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                assignedToId: null,
                status: Status.OPEN
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Ticket unassigned successfully',
            data: updatedTicket
        });
    } catch (error) {
        console.error('Error unassigning ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to unassign ticket' });
    }
});

// Delete a ticket
ticketRouter.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const ticketExists = await prisma.ticket.findUnique({
            where: { id }
        });

        if (!ticketExists) {
            res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
            return;
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