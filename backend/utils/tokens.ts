import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/refreshToken";

/**
 * Generate a short-lived access token (15 minutes).
 */
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: "15m",
  });
};

/**
 * Generate a long-lived refresh token (30 days).
 * Stores it in MongoDB for rotation and revocation.
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(40).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await RefreshToken.create({
    token,
    userId,
    expiresAt,
  });

  return token;
};

/**
 * Rotate a refresh token — revoke the old one, issue a new one.
 * Returns the new token or null if the old one is invalid.
 */
export const rotateRefreshToken = async (
  oldToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> => {
  const existing = await RefreshToken.findOne({
    token: oldToken,
    isRevoked: false,
  });

  if (!existing || existing.expiresAt < new Date()) {
    // If token was already used (revoked), revoke ALL tokens for this user
    // This is a security measure — potential token theft
    if (existing?.isRevoked) {
      await RefreshToken.updateMany(
        { userId: existing.userId },
        { isRevoked: true },
      );
    }
    return null;
  }

  // Revoke the old token
  existing.isRevoked = true;
  await existing.save();

  // Issue new pair
  const accessToken = generateAccessToken(existing.userId.toString());
  const refreshToken = await generateRefreshToken(existing.userId.toString());

  return { accessToken, refreshToken };
};

/**
 * Revoke all refresh tokens for a user (e.g. on password change).
 */
export const revokeAllTokens = async (userId: string): Promise<void> => {
  await RefreshToken.updateMany({ userId }, { isRevoked: true });
};
