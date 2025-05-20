import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { ticketRouter } from "./routes/ticket";
import { userRouter } from "./routes/user";
import { notificationRouter } from "./routes/notification";
import { technicianRouter } from "./routes/technician";
import feedbackRouter from "./routes/feedbackRoutes";
import chatRouter from "./routes/chat";
import "./webSocket";
import googleAuthRouter from './routes/googleAuth';
import path from "path";

dotenv.config();

const app = express();
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/ticket", ticketRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/technician", technicianRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/chat", chatRouter);
app.use("/api/googleAuth", googleAuthRouter);


const PORT = process.env.PORT || 3000;

app.get("/test", (req, res) => {
    res.send("Test route");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
