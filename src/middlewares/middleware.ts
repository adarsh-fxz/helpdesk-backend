import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

interface CustomRequest extends Request {
    userId: string;
}

export default function verifyToken(req: CustomRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers["authorization"] as string;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(403).json({ message: "Unauthorized" });
        return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        res.status(403).json({ message: "No token provided" });
        return;
    }

    jwt.verify(token, JWT_SECRET as string, (err, decoded: any) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.userId = decoded.userId;
        next();
    });
}