import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { ticketRouter } from "./routes/ticket";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/ticket", ticketRouter);

const PORT = process.env.PORT || 5000;

app.get("/test", (req, res) => {
    res.send("Test route");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
