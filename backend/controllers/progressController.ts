import { Request, Response } from "express";
import Joi from "joi";
import {
  processSyncBatch,
  getUserProgress,
  getLeaderboard,
  SyncEvent,
} from "../services/progressService";

// ── Validation ──────────────────────────────────────
const syncSchema = Joi.object({
  events: Joi.array()
    .items(
      Joi.object({
        courseId: Joi.string().required(),
        lessonId: Joi.string().required(),
        eventType: Joi.string()
          .valid("lesson_started", "lesson_completed", "quiz_answered", "course_completed")
          .required(),
        payload: Joi.object({
          score: Joi.number().min(0).max(100).allow(null),
          passed: Joi.boolean().allow(null),
          timeSpentSeconds: Joi.number().min(0).allow(null),
          answers: Joi.array().items(Joi.number()),
        }).default({}),
        idempotencyKey: Joi.string().uuid().required(),
        clientTimestamp: Joi.string().isoDate().required(),
      }),
    )
    .max(100)
    .required(),
});

// ── Sync Events (the core sync endpoint) ────────────
export const syncEvents = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = syncSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const result = await processSyncBatch(
    req.user!._id.toString(),
    value.events as SyncEvent[],
  );

  res.json({
    message: `Processed ${result.accepted.length} events.`,
    ...result,
  });
};

// ── Get My Progress ─────────────────────────────────
export const getMyProgress = async (req: Request, res: Response): Promise<void> => {
  const courseId = req.query.courseId as string | undefined;

  const progress = await getUserProgress(req.user!._id.toString(), courseId);

  res.json(progress);
};

// ── Get Leaderboard ─────────────────────────────────
export const leaderboard = async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const board = await getLeaderboard(limit);

  res.json({ leaderboard: board });
};
