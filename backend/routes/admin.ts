import { Router } from "express";
import { getAnalytics, getAllUsers, toggleUserActive, resetUserPassword } from "../controllers/adminController";
import { protect, requireRole } from "../middleware/auth.middleware";

const router = Router();

// All admin routes require admin authentication
router.use(protect, requireRole("admin"));

// Dashboard analytics
router.get("/analytics", getAnalytics);

// User management
router.get("/users", getAllUsers);
router.patch("/users/:id/toggle", toggleUserActive);
router.post("/users/:id/reset-password", resetUserPassword);


export default router;
