import { Request, Response } from "express";
import Joi from "joi";
import User from "../models/user";
import { generateAccessToken, generateRefreshToken, rotateRefreshToken, revokeAllTokens } from "../utils/tokens";
import RefreshToken from "../models/refreshToken";

// ── Validation schemas ──────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const pinSchema = Joi.object({
  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({ "string.pattern.base": "PIN must be exactly 4 digits" }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

// ── Register ────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const { name, email, password } = value;

  // Check if user already exists
  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const user = await User.create({ name, email, password });
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = await generateRefreshToken(user._id.toString());

  res.status(201).json({
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  });
};

// ── Login ───────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const { email, password } = value;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "Account has been deactivated." });
    return;
  }

  // Update last active
  user.lastActiveAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = await generateRefreshToken(user._id.toString());

  res.json({
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  });
};

// ── Refresh Token ───────────────────────────────────
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token is required." });
    return;
  }

  const tokens = await rotateRefreshToken(refreshToken);
  if (!tokens) {
    res.status(401).json({ error: "Invalid or expired refresh token." });
    return;
  }

  res.json(tokens);
};

// ── Set Offline PIN ─────────────────────────────────
export const setOfflinePin = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = pinSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const user = req.user!;
  await user.setPin(value.pin);
  await user.save();

  res.json({ message: "Offline PIN set successfully.", pinHash: user.offlinePinHash });
};

// ── Get Current User ────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  res.json({ user: req.user!.toSafeObject() });
};

// ── Logout ──────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Revoke the specific refresh token
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { isRevoked: true },
    );
  }

  // Optionally revoke ALL tokens for this user (full logout from all devices)
  if (req.query.all === "true") {
    await revokeAllTokens(req.user!._id.toString());
  }

  res.json({ message: "Logged out successfully." });
};

// ── Change Password ─────────────────────────────────
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const { currentPassword, newPassword } = value;

  // Need to fetch user with password field
  const user = await User.findById(req.user!._id).select("+password");
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  user.password = newPassword;
  await user.save(); // pre-save hook hashes it

  // Revoke all existing refresh tokens (force re-login on other devices)
  await revokeAllTokens(user._id.toString());

  // Issue fresh tokens
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = await generateRefreshToken(user._id.toString());

  res.json({
    message: "Password changed successfully.",
    accessToken,
    refreshToken,
  });
};
