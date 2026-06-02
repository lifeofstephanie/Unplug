import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  downloadBundle,
} from "../controllers/courseController";
import { protect, requireRole } from "../middleware/auth.middleware";

const router = Router();

// All course routes require authentication
router.use(protect);

// Student + Admin routes
router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.get("/:id/download", downloadBundle);

// Admin-only routes
router.post("/", requireRole("admin"), createCourse);
router.put("/:id", requireRole("admin"), updateCourse);
router.delete("/:id", requireRole("admin"), deleteCourse);
router.put("/:id/publish", requireRole("admin"), publishCourse);
router.put("/:id/unpublish", requireRole("admin"), unpublishCourse);

export default router;
