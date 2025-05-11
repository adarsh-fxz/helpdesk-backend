import { WebSocketServer, WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const wss = new WebSocketServer({ port: 8080 });

interface User {
    socket: WebSocket;
    room: string;
    userId: string;
}

let allSockets: User[] = [];

wss.on("connection", (socket) => {
    socket.on("message", async (message) => {
        try {
            //@ts-ignore
            const parsedMessage = JSON.parse(message);
            
            if (parsedMessage.type === "join") {
                allSockets.push({
                    socket,
                    room: parsedMessage.payload.roomId,
                    userId: parsedMessage.payload.userId
                });
            }

            if (parsedMessage.type === "chat") {
                const currentUser = allSockets.find((x) => x.socket === socket);
                if (!currentUser) return;

                // Store message in database
                const chatMessage = await prisma.chatMessage.create({
                    data: {
                        ticketId: currentUser.room,
                        senderId: currentUser.userId,
                        message: parsedMessage.payload.message
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

                // Broadcast message to all users in the room
                const messageToSend = JSON.stringify({
                    type: "chat",
                    data: chatMessage
                });

                for (const user of allSockets) {
                    if (user.room === currentUser.room) {
                        user.socket.send(messageToSend);
                    }
                }
            }
        } catch (error) {
            console.error("WebSocket error:", error);
        }
    });

    socket.on("close", () => {
        const index = allSockets.findIndex((x) => x.socket === socket);
        if (index !== -1) {
            allSockets.splice(index, 1);
        }
    });
});