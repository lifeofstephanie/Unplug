import mongoose from "mongoose";
import ProgressEvent, { IProgressEvent } from "../models/progressEvent";
import User from "../models/user";
import Course from "../models/course";

// ── Types ───────────────────────────────────────────
export interface SyncEvent {
  courseId: string;
  lessonId: string;
  eventType: "lesson_started" | "lesson_completed" | "quiz_answered" | "course_completed";
  payload?: {
    score?: number | null;
    passed?: boolean | null;
    timeSpentSeconds?: number | null;
    answers?: number[];
  };
  idempotencyKey: string;
  clientTimestamp: string;
}

export interface SyncResult {
  accepted: string[];   // idempotency keys that were saved
  duplicates: string[]; // idempotency keys that already existed
  errors: string[];     // idempotency keys that had errors
}

interface BadgeDefinition {
  id: string;
  name: string;
  emoji: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  totalLessonsCompleted: number;
  totalCoursesCompleted: number;
  totalQuizzesTaken: number;
  totalXp: number;
}

// ── Badge definitions ───────────────────────────────
const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_lesson",
    name: "First Step",
    emoji: "🎯",
    check: (s) => s.totalLessonsCompleted >= 1,
  },
  {
    id: "five_lessons",
    name: "Getting Started",
    emoji: "📖",
    check: (s) => s.totalLessonsCompleted >= 5,
  },
  {
    id: "ten_lessons",
    name: "Dedicated Learner",
    emoji: "🌟",
    check: (s) => s.totalLessonsCompleted >= 10,
  },
  {
    id: "fifty_lessons",
    name: "Knowledge Seeker",
    emoji: "🧠",
    check: (s) => s.totalLessonsCompleted >= 50,
  },
  {
    id: "first_course",
    name: "Course Complete",
    emoji: "🎓",
    check: (s) => s.totalCoursesCompleted >= 1,
  },
  {
    id: "five_courses",
    name: "Scholar",
    emoji: "📚",
    check: (s) => s.totalCoursesCompleted >= 5,
  },
  {
    id: "quiz_master",
    name: "Quiz Master",
    emoji: "🏆",
    check: (s) => s.totalQuizzesTaken >= 20,
  },
  {
    id: "xp_100",
    name: "Century Club",
    emoji: "💯",
    check: (s) => s.totalXp >= 100,
  },
  {
    id: "xp_500",
    name: "Rising Star",
    emoji: "⭐",
    check: (s) => s.totalXp >= 500,
  },
  {
    id: "xp_1000",
    name: "Champion",
    emoji: "👑",
    check: (s) => s.totalXp >= 1000,
  },
];

// ── Process a batch of sync events ──────────────────
export const processSyncBatch = async (
  userId: string,
  events: SyncEvent[],
): Promise<SyncResult> => {
  const result: SyncResult = { accepted: [], duplicates: [], errors: [] };

  for (const event of events) {
    try {
      // Look up the course to find XP for the lesson
      let xpEarned = 0;
      if (
        event.eventType === "lesson_completed" ||
        event.eventType === "quiz_answered"
      ) {
        const course = await Course.findById(event.courseId);
        if (course) {
          const lesson = course.lessons.find(
            (l) => l._id.toString() === event.lessonId,
          );
          if (lesson && event.eventType === "lesson_completed") {
            xpEarned = lesson.xpReward || 0;
          }
          if (lesson && event.eventType === "quiz_answered") {
            // Award partial XP for quizzes based on score
            const score = event.payload?.score || 0;
            xpEarned = Math.round(((lesson.xpReward || 0) * score) / 100);
          }
        }
      }

      await ProgressEvent.create({
        userId: new mongoose.Types.ObjectId(userId),
        courseId: new mongoose.Types.ObjectId(event.courseId),
        lessonId: event.lessonId,
        eventType: event.eventType,
        payload: event.payload || {},
        xpEarned,
        idempotencyKey: event.idempotencyKey,
        clientTimestamp: new Date(event.clientTimestamp),
      });

      result.accepted.push(event.idempotencyKey);
    } catch (err: unknown) {
      // Duplicate idempotency key → already processed
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        result.duplicates.push(event.idempotencyKey);
      } else {
        result.errors.push(event.idempotencyKey);
        console.error(
          `Sync event error (${event.idempotencyKey}):`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  // After processing, recalculate XP and badges
  if (result.accepted.length > 0) {
    await computeXpAndBadges(userId);
  }

  return result;
};

// ── Recompute XP and award badges ───────────────────
export const computeXpAndBadges = async (userId: string): Promise<void> => {
  // Sum all xpEarned from unique lesson completions
  const xpAgg = await ProgressEvent.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalXp: { $sum: "$xpEarned" },
      },
    },
  ]);

  const totalXp = xpAgg.length > 0 ? xpAgg[0].totalXp : 0;

  // Count stats for badge checks
  const stats = await getStatsForUser(userId);
  stats.totalXp = totalXp;

  // Check which badges should be awarded
  const user = await User.findById(userId);
  if (!user) return;

  const existingBadgeIds = new Set(user.badges.map((b) => b.id));
  const newBadges: { id: string; name: string; emoji: string; earnedAt: Date }[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (!existingBadgeIds.has(badge.id) && badge.check(stats)) {
      newBadges.push({
        id: badge.id,
        name: badge.name,
        emoji: badge.emoji,
        earnedAt: new Date(),
      });
    }
  }

  // Update user
  await User.findByIdAndUpdate(userId, {
    xp: totalXp,
    lastSyncedAt: new Date(),
    ...(newBadges.length > 0 && {
      $push: { badges: { $each: newBadges } },
    }),
  });
};

// ── Get user progress for a course or all courses ───
export const getUserProgress = async (
  userId: string,
  courseId?: string,
): Promise<{
  courses: Array<{
    courseId: string;
    lessonsStarted: number;
    lessonsCompleted: number;
    totalLessons: number;
    quizzesTaken: number;
    averageScore: number;
    xpEarned: number;
    completedAt: Date | null;
  }>;
}> => {
  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };
  if (courseId) {
    match.courseId = new mongoose.Types.ObjectId(courseId);
  }

  const progress = await ProgressEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$courseId",
        lessonsStarted: {
          $sum: {
            $cond: [{ $eq: ["$eventType", "lesson_started"] }, 1, 0],
          },
        },
        lessonsCompleted: {
          $sum: {
            $cond: [{ $eq: ["$eventType", "lesson_completed"] }, 1, 0],
          },
        },
        quizzesTaken: {
          $sum: {
            $cond: [{ $eq: ["$eventType", "quiz_answered"] }, 1, 0],
          },
        },
        totalScore: {
          $sum: {
            $cond: [
              { $eq: ["$eventType", "quiz_answered"] },
              { $ifNull: ["$payload.score", 0] },
              0,
            ],
          },
        },
        xpEarned: { $sum: "$xpEarned" },
        completedAt: {
          $max: {
            $cond: [
              { $eq: ["$eventType", "course_completed"] },
              "$clientTimestamp",
              null,
            ],
          },
        },
      },
    },
  ]);

  // Enrich with total lessons from the course
  const courses = await Promise.all(
    progress.map(async (p) => {
      const course = await Course.findById(p._id);
      return {
        courseId: p._id.toString(),
        lessonsStarted: p.lessonsStarted,
        lessonsCompleted: p.lessonsCompleted,
        totalLessons: course?.totalLessons || 0,
        quizzesTaken: p.quizzesTaken,
        averageScore:
          p.quizzesTaken > 0
            ? Math.round(p.totalScore / p.quizzesTaken)
            : 0,
        xpEarned: p.xpEarned,
        completedAt: p.completedAt,
      };
    }),
  );

  return { courses };
};

// ── Leaderboard ─────────────────────────────────────
export const getLeaderboard = async (
  limit: number = 20,
): Promise<Array<{ userId: string; name: string; xp: number; badges: number }>> => {
  const users = await User.find({ isActive: true })
    .sort({ xp: -1 })
    .limit(limit)
    .select("name xp badges");

  return users.map((u) => ({
    userId: u._id.toString(),
    name: u.name,
    xp: u.xp,
    badges: u.badges.length,
  }));
};

// ── Internal helper ─────────────────────────────────
const getStatsForUser = async (userId: string): Promise<UserStats> => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [lessonsCompleted, coursesCompleted, quizzesTaken] = await Promise.all([
    ProgressEvent.countDocuments({
      userId: uid,
      eventType: "lesson_completed",
    }),
    ProgressEvent.countDocuments({
      userId: uid,
      eventType: "course_completed",
    }),
    ProgressEvent.countDocuments({
      userId: uid,
      eventType: "quiz_answered",
    }),
  ]);

  return {
    totalLessonsCompleted: lessonsCompleted,
    totalCoursesCompleted: coursesCompleted,
    totalQuizzesTaken: quizzesTaken,
    totalXp: 0, // filled by caller
  };
};
