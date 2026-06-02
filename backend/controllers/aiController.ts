import { Request, Response } from "express";
import Joi from "joi";
import {
  generateQuestions as aiGenerateQuestions,
  generateCourseOutline,
} from "../services/aiService";

// ── Validation ──────────────────────────────────────
const questionGenSchema = Joi.object({
  lessonContent: Joi.string().min(50).max(10000).required(),
  count: Joi.number().min(1).max(20).optional(),
  level: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .default("beginner"),
});

const outlineGenSchema = Joi.object({
  topic: Joi.string().trim().min(3).max(200).required(),
  subject: Joi.string()
    .valid(
      "math",
      "science",
      "literacy",
      "health",
      "agriculture",
      "technology",
      "civics",
    )
    .required(),
  level: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .default("beginner"),
});

// ── Auto-calculate question count from content length ──
const getAutoCount = (content: string): number => {
  const length = content.length;
  if (length < 500) return 5;
  if (length < 1500) return 10;
  return 20;
};

// ── Generate Questions from Lesson Text ─────────────
export const generateQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { error, value } = questionGenSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  // Use manual count if explicitly provided, otherwise auto-calculate
  const count = value.count ?? getAutoCount(value.lessonContent);

  try {
    const questions = await aiGenerateQuestions(
      value.lessonContent,
      count,
      value.level,
    );

    res.json({
      message: `Generated ${questions.length} questions.`,
      questions,
      meta: {
        requested: count,
        contentLength: value.lessonContent.length,
        autoCalculated: !req.body.count,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    console.error("AI question generation error:", message);
    res.status(500).json({ error: `AI generation failed: ${message}` });
  }
};

// ── Generate Course Outline from Topic ──────────────
export const generateOutline = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { error, value } = outlineGenSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  try {
    const outline = await generateCourseOutline(
      value.topic,
      value.subject,
      value.level,
    );

    res.json({
      message: "Course outline generated.",
      outline,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    console.error("AI outline generation error:", message);
    res.status(500).json({ error: `AI generation failed: ${message}` });
  }
};
