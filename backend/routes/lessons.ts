import { Router } from "express";
import multer from "multer";
import {
  addLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  addQuestions,
  uploadQuestions,
} from "../controllers/lessonController";
import { protect, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Multer setup for CSV upload (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed."));
    }
  },
});

// All lesson routes require auth + admin role
router.use(protect, requireRole("admin"));

// Lesson CRUD
router.post("/:courseId", addLesson);
router.put("/:courseId/:lessonId", updateLesson);
router.delete("/:courseId/:lessonId", deleteLesson);
router.put("/:courseId/reorder", reorderLessons);

// Question management
router.post("/:courseId/:lessonId/questions", addQuestions);
router.post("/:courseId/:lessonId/upload-questions", upload.single("file"), uploadQuestions);

export default router;
