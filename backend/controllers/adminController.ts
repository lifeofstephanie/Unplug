import { Request, Response } from "express";
import User from "../models/user";
import Course from "../models/course";
import Download from "../models/download";
import ProgressEvent from "../models/progressEvent";

// ── Get Dashboard Analytics ─────────────────────────
export const getAnalytics = async (_req: Request, res: Response): Promise<void> => {
  const [
    totalUsers,
    totalCourses,
    publishedCourses,
    totalDownloads,
    totalEvents,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true }),
    Download.countDocuments(),
    ProgressEvent.countDocuments(),
  ]);

  // Top downloaded courses
  const topCourses = await Download.aggregate([
    { $group: { _id: "$courseId", downloads: { $sum: 1 } } },
    { $sort: { downloads: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
    {
      $project: {
        _id: 0,
        courseId: "$_id",
        title: "$course.title",
        subject: "$course.subject",
        downloads: 1,
      },
    },
  ]);

  // Completion rates per course
  const completionRates = await ProgressEvent.aggregate([
    { $match: { eventType: "course_completed" } },
    { $group: { _id: "$courseId", completions: { $sum: 1 } } },
    { $sort: { completions: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
    {
      $project: {
        _id: 0,
        courseId: "$_id",
        title: "$course.title",
        completions: 1,
      },
    },
  ]);

  // Average quiz scores
  const avgScores = await ProgressEvent.aggregate([
    {
      $match: {
        eventType: "quiz_answered",
        "payload.score": { $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: "$payload.score" },
        totalQuizzes: { $sum: 1 },
      },
    },
  ]);

  res.json({
    overview: {
      totalUsers,
      totalCourses,
      publishedCourses,
      totalDownloads,
      totalProgressEvents: totalEvents,
    },
    topCourses,
    completionRates,
    quizStats: avgScores.length > 0
      ? {
          averageScore: Math.round(avgScores[0].averageScore),
          totalQuizzesTaken: avgScores[0].totalQuizzes,
        }
      : { averageScore: 0, totalQuizzesTaken: 0 },
  });
};

// ── Get All Users (paginated) ───────────────────────
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const search = req.query.search as string | undefined;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name email role xp badges isActive lastActiveAt createdAt"),
    User.countDocuments(filter),
  ]);

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

// ── Toggle User Active Status ───────────────────────
export const toggleUserActive = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user!._id.toString()) {
    res.status(400).json({ error: "Cannot deactivate your own account." });
    return;
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    message: `User ${user.isActive ? "activated" : "deactivated"}.`,
    user: { _id: user._id, name: user.name, isActive: user.isActive },
  });
};

// ── Admin Reset User Password ───────────────────────
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }

  const user = await User.findById(req.params.id).select("+password");
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  user.password = newPassword;
  await user.save(); // pre-save hook hashes it

  // Revoke all refresh tokens — forces user to log in again
  const { revokeAllTokens } = await import("../utils/tokens");
  await revokeAllTokens(user._id.toString());

  res.json({ message: `Password reset for ${user.name} (${user.email}).` });
};
