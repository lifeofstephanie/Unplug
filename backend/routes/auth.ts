import { Router } from "express";
import {
  register,
  login,
  refresh,
  setOfflinePin,
  getMe,
  logout,
  changePassword,
} from "../controllers/authController";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

// Protected routes
router.post("/set-pin", protect, setOfflinePin);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/change-password", protect, changePassword);

export default router;
