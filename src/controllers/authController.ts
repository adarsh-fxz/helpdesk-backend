import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

interface GoogleTokenResponse {
  sub: string;
  email: string;
  name: string;
  email_verified?: boolean;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  const { token: googleToken } = req.body;

  if (!googleToken) {
    res.status(400).json({ message: "Google token is required" });
    return;
  }

  if (!process.env.JWT_SECRET) {
    res.status(500).json({ message: "Server configuration error" });
    return;
  }

  try {
    // Verify Google token
    const response = await axios.get<GoogleTokenResponse>(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${googleToken}`
    );

    const { sub: googleId, email, name, email_verified } = response.data;

    if (!email || !name) {
      res.status(400).json({ message: "Invalid Google token data" });
      return;
    }

    // Create or update user with authProvider
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        name,
        email,
        googleId: googleId || undefined,
        verified: email_verified === true,
        role: "USER",
        password: undefined,
    
      },
      update: {
        name,
        googleId: googleId || undefined,
        verified: email_verified === true,
    
      },
    });

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const authResponse: AuthResponse = {
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    res.status(200).json(authResponse);
  } catch (error) {
    console.error("Authentication error:", error);

    if (axios.isAxiosError(error)) {
      res.status(401).json({
        message: "Google authentication failed",
        details: error.response?.data,
      });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getAuthUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
