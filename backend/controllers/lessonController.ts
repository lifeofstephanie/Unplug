import { Request, Response } from "express";
import Joi from "joi";
import { parse } from "csv-parse/sync";
import Course from "../models/course";

// ── Validation ──────────────────────────────────────
const lessonSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  type: Joi.string().valid("text", "quiz").default("text"),
  content: Joi.string().default(""),
  durationMinutes: Joi.number().min(1).max(120).default(5),
  xpReward: Joi.number().min(0).max(500).default(20),
});

const questionSchema = Joi.object({
  question: Joi.string().required(),
  options: Joi.array().items(Joi.string()).length(4).required(),
  correctIndex: Joi.number().min(0).max(3).required(),
  explanation: Joi.string().default(""),
});

// ── Add Lesson ──────────────────────────────────────
export const addLesson = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = lessonSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  // Auto-set order to next available
  const maxOrder = course.lessons.reduce((max, l) => Math.max(max, l.order), 0);

  course.lessons.push({
    ...value,
    order: maxOrder + 1,
    quiz: [],
  });

  await course.save();

  const newLesson = course.lessons[course.lessons.length - 1];
  res.status(201).json({ lesson: newLesson, course });
};

// ── Update Lesson ───────────────────────────────────
export const updateLesson = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = lessonSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }

  lesson.set(value);
  await course.save();

  res.json({ lesson, course });
};

// ── Delete Lesson ───────────────────────────────────
export const deleteLesson = async (req: Request, res: Response): Promise<void> => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }

  lesson.deleteOne();
  await course.save();

  res.json({ message: "Lesson deleted.", course });
};

// ── Reorder Lessons ─────────────────────────────────
export const reorderLessons = async (req: Request, res: Response): Promise<void> => {
  const { lessonOrder } = req.body; // Array of { lessonId, order }

  if (!Array.isArray(lessonOrder)) {
    res.status(400).json({ error: "lessonOrder must be an array of { lessonId, order }." });
    return;
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  for (const item of lessonOrder) {
    const lesson = course.lessons.id(item.lessonId);
    if (lesson) {
      lesson.order = item.order;
    }
  }

  await course.save();
  res.json({ message: "Lessons reordered.", course });
};

// ── Add Questions Manually ──────────────────────────
export const addQuestions = async (req: Request, res: Response): Promise<void> => {
  const { questions } = req.body;

  if (!Array.isArray(questions)) {
    res.status(400).json({ error: "questions must be an array." });
    return;
  }

  // Validate each question
  for (const q of questions) {
    const { error } = questionSchema.validate(q);
    if (error) {
      res.status(400).json({ error: `Question validation failed: ${error.details[0].message}` });
      return;
    }
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }

  for (const q of questions) {
    lesson.quiz.push({ ...q, aiGenerated: false });
  }

  await course.save();
  res.json({ message: `${questions.length} questions added.`, lesson });
};

// ── Upload Questions via CSV ────────────────────────
export const uploadQuestions = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No CSV file uploaded." });
    return;
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }

  try {
    const csvContent = req.file.buffer.toString("utf-8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<{
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct: string;
      explanation?: string;
    }>;

    const errors: string[] = [];
    const validQuestions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
      aiGenerated: boolean;
    }> = [];

    records.forEach((row, index) => {
      if (!row.question || !row.option_a || !row.option_b || !row.option_c || !row.option_d || !row.correct) {
        errors.push(`Row ${index + 1}: Missing required fields.`);
        return;
      }

      const options = [row.option_a, row.option_b, row.option_c, row.option_d];
      const correctLetter = row.correct.toUpperCase().trim();
      const correctMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      const correctIndex = correctMap[correctLetter];

      if (correctIndex === undefined) {
        errors.push(`Row ${index + 1}: 'correct' must be A, B, C, or D. Got "${row.correct}".`);
        return;
      }

      validQuestions.push({
        question: row.question,
        options,
        correctIndex,
        explanation: row.explanation || "",
        aiGenerated: false,
      });
    });

    if (validQuestions.length === 0) {
      res.status(400).json({
        error: "No valid questions found in CSV.",
        details: errors,
      });
      return;
    }

    for (const q of validQuestions) {
      lesson.quiz.push(q);
    }

    await course.save();

    res.json({
      message: `${validQuestions.length} questions imported.`,
      errors: errors.length > 0 ? errors : undefined,
      lesson,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse CSV";
    res.status(400).json({ error: `CSV parsing failed: ${message}` });
  }
};
