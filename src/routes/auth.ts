import { Router, Router as ExpressRouter } from "express";
import { CreateUserSchema, SignInSchema } from "../types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authRouter: ExpressRouter = Router();

authRouter.post('/signup', async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid data",
        })
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        await prisma.user.create({
            data: {
                name: parsedData.data.name,
                email: parsedData.data.email,
                password: hashedPassword,
                role: "USER",
            }
        })
        res.status(201).json({
            message: "User created",
        });
    } catch (e) {
        if ((e as any).code === "P2002") {
            res.status(400).json({
                message: "Email already exists",
            });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
        });
    }
})

authRouter.post('/signin', async (req, res) => {
    const parsedData = SignInSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid data",
        })
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: parsedData.data.email,
            }
        })

        if (!user) {
            res.status(400).json({
                message: "User not found",
            });
            return;
        }

        const passwordMatch = await bcrypt.compare(parsedData.data.password, user.password);
        if (!passwordMatch) {
            res.status(400).json({
                message: "Invalid password",
            });
            return;
        }

        const token = jwt.sign({
            userId: user.id,
            name: user.name,
        }, process.env.JWT_SECRET || "secret");

        res.json({
            token,
        });
        
    } catch (e) {
        res.status(500).json({
            message: "Internal server error",
        });
    }
})