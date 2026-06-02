import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth";
import courseRoutes from "./routes/courses";
import lessonRoutes from "./routes/lessons";
import progressRoutes from "./routes/progress";
import aiRoutes from "./routes/ai";
import adminRoutes from "./routes/admin";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// ── Security ────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

app.use(compression());

// ── Rate limiting ───────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts. Please wait 15 minutes." },
});

app.use("/api/", globalLimiter);
app.use("/api/auth/", authLimiter);

app.get("/test-ai", async (req, res) => {
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say hi" }],
    });

    res.json({ success: true, response });
  } catch (err: any) {
    res.json({
      success: false,
      error: err.message,
      keyUsed: process.env.ANTHROPIC_API_KEY?.slice(0, 30) + "...",
      keyLength: process.env.ANTHROPIC_API_KEY?.length,
    });
  }
});

// ── Body parsing ────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Routes ──────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

// ── Health check ────────────────────────────────────
app.get("/health", async (_req: Request, res: Response) => {
  try {
    // Ping MongoDB to verify connection
    const dbState = mongoose.connection.readyState;
    const dbStatus =
      dbState === 1
        ? "connected"
        : dbState === 2
          ? "connecting"
          : "disconnected";

    if (dbState === 1) {
      await mongoose.connection.db?.admin().ping();
    }

    res.json({
      status: dbState === 1 ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      database: dbStatus,
    });
  } catch {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "unreachable",
    });
  }
});

// ── 404 ─────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ────────────────────────────
app.use(errorHandler);

export { app };
