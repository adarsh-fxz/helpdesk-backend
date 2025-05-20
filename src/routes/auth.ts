import { Router, Request, Response } from "express";
import { CreateUserSchema, SignInSchema, ChangePasswordSchema } from "../types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import verifyToken from "../middlewares/middleware";

const prisma = new PrismaClient();
export const authRouter = Router();

// POST /signup
authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Invalid data" });
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
    });

    res.status(201).json({ message: "User created" });
  } catch (e: any) {
  console.log("Signup error:", e);
  if (e.code === "P2002") {
    res.status(400).json({ message: "Email already exists" });
    return;
  }
  res.status(500).json({ message: "Internal server error" });
}
});

// POST /signin
authRouter.post('/signin', async (req: Request, res: Response): Promise<void> => {
  const parsedData = SignInSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Invalid data" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsedData.data.email }
    });

    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    if (!user.password) {
      res.status(400).json({ message: "Password not set for this user" });
      return;
    }

    const passwordMatch = await bcrypt.compare(parsedData.data.password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ message: "Incorrect password" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, name: user.name },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      id: user.id,
      role: user.role
    });

  } catch (e) {
    console.error("Signin error:", e);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /change-password
authRouter.post('/change-password', verifyToken, async (req: Request, res: Response): Promise<void> => {
  const parsedData = ChangePasswordSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Invalid data" });
    return;
  }

  if (parsedData.data.newPassword !== parsedData.data.confirmPassword) {
    res.status(400).json({ message: "New passwords do not match" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsedData.data.userId }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

   // In /change-password route
    if (!user.password) {
    res.status(400).json({ message: "Password not set for this user" });
    return;
    }

    const passwordMatch = await bcrypt.compare(parsedData.data.currentPassword, user.password);


    const hashedPassword = await bcrypt.hash(parsedData.data.newPassword, 10);
    await prisma.user.update({
      where: { id: parsedData.data.userId },
      data: { password: hashedPassword }
    });

    res.status(200).json({ message: "Password updated successfully" });

  } catch (e) {
    console.error("Password change error:", e);
    res.status(500).json({ message: "Internal server error" });
  }
});
