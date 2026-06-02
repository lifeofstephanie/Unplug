import { Router } from "express";
import { syncEvents, getMyProgress, leaderboard } from "../controllers/progressController";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// All progress routes require authentication
router.use(protect);

// Core sync endpoint — batch event ingestion
router.post("/sync", syncEvents);

// My progress — optionally filter by courseId query param
router.get("/me", getMyProgress);

// Leaderboard — optionally set ?limit=N
router.get("/leaderboard", leaderboard);

export default router;
