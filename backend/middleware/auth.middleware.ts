import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

// Verify JWT and attach user to request
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as JwtPayload;

    const user = await User.findById(payload.id).select("+offlinePinHash");
    if (!user || !user.isActive) {
      res
        .status(401)
        .json({ error: "User account not found or deactivated." });
      return;
    }
    req.user = user;
    next();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired. Please refresh." });
      return;
    }
    res.status(401).json({ error: "Invalid token." });
  }
};

// Role guard — use after protect
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${roles.join(" or ")}.`,
      });
      return;
    }
    next();
  };
};

// Admin shorthand
export const adminOnly = [protect, requireRole("admin")];
