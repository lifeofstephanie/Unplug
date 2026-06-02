import { Request, Response } from "express";
import Joi from "joi";
import Course from "../models/course";
import Download from "../models/download";
import User from "../models/user";

// ── Validation ──────────────────────────────────────
const createCourseSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  subject: Joi.string()
    .valid("math", "science", "literacy", "health", "agriculture", "technology", "civics")
    .required(),
  level: Joi.string().valid("beginner", "intermediate", "advanced").default("beginner"),
  language: Joi.string().default("en"),
  emoji: Joi.string().default("📚"),
  color: Joi.string().default("#2C5EAD"),
  tags: Joi.array().items(Joi.string()).default([]),
});

// ── Create Course (admin only) ──────────────────────
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createCourseSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const course = await Course.create({
    ...value,
    createdBy: req.user!._id,
  });

  res.status(201).json({ course });
};

// ── Get All Courses ─────────────────────────────────
export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  const { subject, level, search } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  // Admin sees all; students see published only
  if (req.user?.role !== "admin") {
    filter.isPublished = true;
  }

  if (subject) filter.subject = subject;
  if (level) filter.level = level;
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select("-lessons") // Don't send full lessons in list view
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Course.countDocuments(filter),
  ]);

  res.json({
    courses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

// ── Get Course by ID ────────────────────────────────
export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  // Students can only see published courses
  if (!course.isPublished && req.user?.role !== "admin") {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  res.json({ course });
};

// ── Update Course (admin only) ──────────────────────
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createCourseSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { ...value, version: { $inc: 1 } },
    { new: true, runValidators: true },
  );

  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  res.json({ course });
};

// ── Delete Course (admin only) ──────────────────────
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  const course = await Course.findByIdAndDelete(req.params.id);

  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  res.json({ message: "Course deleted successfully." });
};

// ── Publish / Unpublish ─────────────────────────────
export const publishCourse = async (req: Request, res: Response): Promise<void> => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  if (course.lessons.length === 0) {
    res.status(400).json({ error: "Cannot publish a course with no lessons." });
    return;
  }

  course.isPublished = true;
  course.publishedAt = new Date();
  await course.save();

  res.json({ message: "Course published.", course });
};

export const unpublishCourse = async (req: Request, res: Response): Promise<void> => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { isPublished: false },
    { new: true },
  );

  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  res.json({ message: "Course unpublished.", course });
};

// ── Download Bundle ─────────────────────────────────
export const downloadBundle = async (req: Request, res: Response): Promise<void> => {
  const course = await Course.findById(req.params.id);

  if (!course || !course.isPublished) {
    res.status(404).json({ error: "Course not found or not published." });
    return;
  }

  // Record the download
  await Download.findOneAndUpdate(
    { userId: req.user!._id, courseId: course._id },
    { courseVersion: course.version, downloadedAt: new Date() },
    { upsert: true },
  );

  // Increment download count
  course.downloadCount += 1;
  await course.save();

  // Add to user's downloaded courses
  await User.findByIdAndUpdate(req.user!._id, {
    $addToSet: { downloadedCourses: course._id },
  });

  // Return the full course as a JSON bundle
  res.json({
    bundle: {
      courseId: course._id,
      version: course.version,
      title: course.title,
      description: course.description,
      subject: course.subject,
      level: course.level,
      language: course.language,
      emoji: course.emoji,
      color: course.color,
      totalXp: course.totalXp,
      estimatedHours: course.estimatedHours,
      totalLessons: course.totalLessons,
      lessons: course.lessons,
      downloadedAt: new Date().toISOString(),
    },
  });
};
