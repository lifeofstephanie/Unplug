import { Router } from "express";
import { generateQuestions, generateOutline } from "../controllers/aiController";
import { protect, requireRole } from "../middleware/auth.middleware";

const router = Router();

// All AI routes require admin authentication
router.use(protect, requireRole("admin"));

// Generate quiz questions from lesson text
router.post("/generate-questions", generateQuestions);

// Generate a full course outline from a topic
router.post("/generate-outline", generateOutline);

export default router;
