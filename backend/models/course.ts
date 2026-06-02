import mongoose, { Document, Model } from "mongoose";

// ── Types ───────────────────────────────────────────
export interface IQuestion {
  _id?: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  aiGenerated: boolean;
}

export interface ILesson {
  _id: mongoose.Types.ObjectId;
  title: string;
  order: number;
  type: "text" | "quiz";
  content: string;
  durationMinutes: number;
  xpReward: number;
  quiz: IQuestion[];
}

export interface ICourse extends Document {
  title: string;
  description: string;
  subject: string;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  emoji: string;
  color: string;
  lessons: mongoose.Types.DocumentArray<ILesson>;
  totalXp: number;
  estimatedHours: number;
  downloadSizeKb: number;
  totalLessons: number;
  isPublished: boolean;
  publishedAt: Date | null;
  createdBy: mongoose.Types.ObjectId;
  tags: string[];
  downloadCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Question subdocument ────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length === 4,
        message: "Questions must have exactly 4 options",
      },
    },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: "" },
    aiGenerated: { type: Boolean, default: false },
  },
  { _id: true },
);

// ── Lesson subdocument ──────────────────────────────
const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    type: { type: String, enum: ["text", "quiz"], default: "text" },
    content: { type: String, default: "" },
    durationMinutes: { type: Number, default: 5 },
    xpReward: { type: Number, default: 20 },
    quiz: [questionSchema],
  },
  { _id: true },
);

// ── Course ──────────────────────────────────────────
const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    subject: {
      type: String,
      enum: [
        "math",
        "science",
        "literacy",
        "health",
        "agriculture",
        "technology",
        "civics",
      ],
      required: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    language: { type: String, default: "en" },
    emoji: { type: String, default: "📚" },
    color: { type: String, default: "#2C5EAD" },

    lessons: [lessonSchema],

    // Computed fields — updated on save
    totalXp: { type: Number, default: 0 },
    estimatedHours: { type: Number, default: 0 },
    downloadSizeKb: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },

    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tags: [String],
    downloadCount: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// ── Pre-save: recompute totals ──────────────────────
courseSchema.pre("save", function (next) {
  this.totalXp = this.lessons.reduce((sum: number, l) => sum + ((l as ILesson).xpReward || 0), 0);
  this.totalLessons = this.lessons.length;

  const totalMinutes = this.lessons.reduce(
    (sum: number, l) => sum + ((l as ILesson).durationMinutes || 0),
    0,
  );
  this.estimatedHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Rough size estimate based on content length
  const totalChars = this.lessons.reduce(
    (sum: number, l) => {
      const lesson = l as ILesson;
      return sum + (lesson.content?.length || 0) + JSON.stringify(lesson.quiz || []).length;
    },
    0,
  );
  this.downloadSizeKb = Math.max(10, Math.round((totalChars / 1024) * 1.3));

  next();
});

// ── Indexes ─────────────────────────────────────────
courseSchema.index({ subject: 1, isPublished: 1 });
courseSchema.index({ createdAt: -1 });

const Course: Model<ICourse> = mongoose.model<ICourse>("Course", courseSchema);
export default Course;
