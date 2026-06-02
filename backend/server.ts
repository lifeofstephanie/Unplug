import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import { app } from "./app";
import connectDB from "./config/database";
import logger from "./utils/logger";

console.log(
  "ANTHROPIC KEY:",
  process.env.ANTHROPIC_API_KEY?.slice(0, 20) + "...",
);

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info("─────────────────────────────────────────");
    logger.info(`  📚 Unplug API`);
    logger.info(`  🚀 Running on port ${PORT}`);
    logger.info(`  🌍 Environment: ${process.env.NODE_ENV}`);
    logger.info("─────────────────────────────────────────");
  });

  // ── Graceful shutdown ─────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`\n⚡ ${signal} received. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(() => {
      logger.info("  ✅ HTTP server closed");
    });

    try {
      // Close MongoDB connection
      await mongoose.connection.close();
      logger.info("  ✅ MongoDB connection closed");
      logger.info("  👋 Goodbye!\n");
      process.exit(0);
    } catch (err) {
      logger.error("  ❌ Error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: unknown) => {
    logger.error("Unhandled Promise Rejection:", reason);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (err: Error) => {
    logger.error("Uncaught Exception:", err);
    shutdown("uncaughtException");
  });
};

start().catch((err) => {
  logger.error("Fatal startup error:", err);
  process.exit(1);
});
