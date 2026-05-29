import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@komuniti_store';

interface User {
  _id: string;
  name: string;
  email: string | null;
  xp: number;
  streak: number;
  role: string;
}

interface LessonProgressEntry {
  completed: boolean;
  score: number;
  completedAt: string;
}

interface QueueEvent {
  courseId: string;
  lessonId: string;
  eventType: string;
  payload: any;
  idempotencyKey: string;
  clientTimestamp: string;
}

interface StoreState {
  // Auth
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string | null, refreshToken: string | null) => void;
  clearAuth: () => void;

  // Courses
  courses: any[];
  downloadedCourses: Record<string, any>;
  setCourses: (courses: any[]) => void;
  setDownloadedCourse: (courseId: string, bundle: any) => void;

  // Progress
  lessonProgress: Record<string, LessonProgressEntry>;
  markLessonComplete: (lessonId: string, score?: number) => void;
  isLessonComplete: (lessonId: string) => boolean;
  getCourseProgress: (courseId: string) => { completed: number; total: number; percent: number };

  // XP
  totalXp: number;
  streak: number;
  addXp: (amount: number) => void;

  // Offline event queue
  eventQueue: QueueEvent[];
  enqueueEvent: (event: Omit<QueueEvent, 'idempotencyKey' | 'clientTimestamp'>) => void;
  clearQueue: () => void;

  // Connectivity
  isOnline: boolean;
  setOnline: (val: boolean) => void;

  // Persist
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────
  user: null,
  accessToken: null,
  refreshToken: null,

  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken }),

  clearAuth: () =>
    set({ user: null, accessToken: null, refreshToken: null }),

  // ── Courses ───────────────────────────────────────────
  courses: [],
  downloadedCourses: {}, // courseId -> full bundle

  setCourses: (courses) => set({ courses }),

  setDownloadedCourse: (courseId, bundle) =>
    set((s) => ({
      downloadedCourses: { ...s.downloadedCourses, [courseId]: bundle },
    })),

  // ── Progress ──────────────────────────────────────────
  // Map: lessonId -> { completed, score, completedAt }
  lessonProgress: {},

  markLessonComplete: (lessonId, score = 100) =>
    set((s) => ({
      lessonProgress: {
        ...s.lessonProgress,
        [lessonId]: { completed: true, score, completedAt: new Date().toISOString() },
      },
    })),

  isLessonComplete: (lessonId) => {
    return !!get().lessonProgress[lessonId]?.completed;
  },

  getCourseProgress: (courseId) => {
    const store = get();
    const bundle = store.downloadedCourses[courseId];
    if (!bundle) return { completed: 0, total: 0, percent: 0 };
    const lessons = bundle.course.lessons;
    const completed = lessons.filter((l: any) => store.lessonProgress[l._id]?.completed).length;
    return {
      completed,
      total: lessons.length,
      percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    };
  },

  // ── XP ────────────────────────────────────────────────
  totalXp: 0,
  streak: 0,

  addXp: (amount) =>
    set((s) => ({ totalXp: s.totalXp + amount })),

  // ── Offline event queue ───────────────────────────────
  eventQueue: [],

  enqueueEvent: (event) =>
    set((s) => ({
      eventQueue: [
        ...s.eventQueue,
        {
          ...event,
          idempotencyKey: `${event.lessonId}_${event.eventType}_${Date.now()}`,
          clientTimestamp: new Date().toISOString(),
        },
      ],
    })),

  clearQueue: () => set({ eventQueue: [] }),

  // ── Connectivity ──────────────────────────────────────
  isOnline: false,
  setOnline: (val) => set({ isOnline: val }),

  // ── Persist to AsyncStorage ───────────────────────────
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({
          user: saved.user || null,
          accessToken: saved.accessToken || null,
          refreshToken: saved.refreshToken || null,
          lessonProgress: saved.lessonProgress || {},
          totalXp: saved.totalXp || 0,
          streak: saved.streak || 0,
          eventQueue: saved.eventQueue || [],
          downloadedCourses: saved.downloadedCourses || {},
        });
      }
    } catch (_) {}
  },

  persist: async () => {
    const s = get();
    const toSave = {
      user: s.user,
      accessToken: s.accessToken,
      refreshToken: s.refreshToken,
      lessonProgress: s.lessonProgress,
      totalXp: s.totalXp,
      streak: s.streak,
      eventQueue: s.eventQueue,
      downloadedCourses: s.downloadedCourses,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  },
}));