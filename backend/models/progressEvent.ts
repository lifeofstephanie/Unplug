import mongoose, { Document, Model } from "mongoose";

// ── Types ───────────────────────────────────────────
export interface IProgressEvent extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  lessonId: string;
  eventType: "lesson_started" | "lesson_completed" | "quiz_answered" | "course_completed";
  payload: {
    score: number | null;
    passed: boolean | null;
    timeSpentSeconds: number | null;
    answers: number[];
  };
  xpEarned: number;
  idempotencyKey: string;
  clientTimestamp: Date;
  serverTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const progressEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessonId: { type: String, required: true }, // lesson subdoc _id as string

    eventType: {
      type: String,
      enum: [
        "lesson_started",
        "lesson_completed",
        "quiz_answered",
        "course_completed",
      ],
      required: true,
    },

    payload: {
      score: { type: Number, default: null }, // 0–100
      passed: { type: Boolean, default: null },
      timeSpentSeconds: { type: Number, default: null },
      answers: [Number], // selected option indices
    },

    xpEarned: { type: Number, default: 0 },

    // Client-generated UUID — prevents duplicate processing on retry
    idempotencyKey: { type: String, required: true, unique: true },

    // When the event happened on the device
    clientTimestamp: { type: Date, required: true },

    // When the server received it
    serverTimestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// ── Indexes ─────────────────────────────────────────
progressEventSchema.index({ userId: 1, courseId: 1, clientTimestamp: 1 });
progressEventSchema.index({ userId: 1, lessonId: 1, eventType: 1 });
progressEventSchema.index({ idempotencyKey: 1 }, { unique: true });

const ProgressEvent: Model<IProgressEvent> = mongoose.model<IProgressEvent>(
  "ProgressEvent",
  progressEventSchema,
);
export default ProgressEvent;
