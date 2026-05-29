import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store";
import { Colors, Spacing, Radius, Shadow } from "@/theme";
import { MOCK_COURSES } from "../../constants/mockData";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useStore((s) => s.user);
  const totalXp = useStore((s) => s.totalXp);
  const downloadedCourses = useStore((s) => s.downloadedCourses);
  const getCourseProgress = useStore((s) => s.getCourseProgress);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const downloadedList = Object.keys(downloadedCourses);
  const inProgressCourses = downloadedList
    .map((id) => {
      const prog = getCourseProgress(id);
      const meta = MOCK_COURSES.find((c) => c._id === id);
      return meta ? { ...meta, progress: prog } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .filter((c) => c.progress.percent > 0 && c.progress.percent < 100);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.blue]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>
              {user?.name?.split(" ")[0] || "Learner"} 👋
            </Text>
          </View>
          <View style={styles.xpPill}>
            <Text style={styles.xpEmoji}>⭐</Text>
            <Text style={styles.xpValue}>{totalXp} XP</Text>
          </View>
        </View>

        {/* Streak card */}
        <StreakCard />
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Continue learning */}
          {inProgressCourses.length > 0 && (
            <Section title="Continue Learning">
              {inProgressCourses.map((course, i) => (
                <ContinueCourseCard
                  key={course?._id}
                  course={course}
                  delay={i * 100}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/roadmap",
                      params: { courseId: course?._id },
                    })
                  }
                />
              ))}
            </Section>
          )}

          {/* Daily goal */}
          <DailyGoalCard totalXp={totalXp} />

          {/* Downloaded courses */}
          {downloadedList.length > 0 && (
            <Section title="My Downloaded Courses">
              {downloadedList.map((id) => {
                const meta = MOCK_COURSES.find((c) => c._id === id);
                const prog = getCourseProgress(id);
                if (!meta) return null;
                return (
                  <CourseProgressRow
                    key={id}
                    course={meta}
                    progress={prog}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/roadmap",
                        params: { courseId: id },
                      })
                    }
                  />
                );
              })}
            </Section>
          )}

          {downloadedList.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📥</Text>
              <Text style={styles.emptyTitle}>No courses downloaded yet</Text>
              <Text style={styles.emptyText}>
                Go to the Learn tab and download a course to start learning
                offline.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/(tabs)/courses")}
              >
                <Text style={styles.emptyButtonText}>Browse Courses →</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StreakCard() {
  const streak = useStore((s) => s.streak);
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();

  return (
    <View style={styles.streakCard}>
      <View style={styles.streakLeft}>
        <Text style={styles.streakFire}>🔥</Text>
        <View>
          <Text style={styles.streakCount}>{streak} day streak</Text>
          <Text style={styles.streakSub}>Keep it up!</Text>
        </View>
      </View>
      <View style={styles.streakDays}>
        {days.map((d, i) => (
          <View
            key={i}
            style={[
              styles.streakDay,
              i < today && styles.streakDayDone,
              i === today && styles.streakDayToday,
            ]}
          >
            <Text
              style={[
                styles.streakDayText,
                i <= today && styles.streakDayTextActive,
              ]}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DailyGoalCard({ totalXp }) {
  const goal = 50;
  const progress = Math.min((totalXp % goal) / goal, 1);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>🎯 Daily Goal</Text>
        <Text style={styles.goalXp}>
          {totalXp % goal} / {goal} XP
        </Text>
      </View>
      <View style={styles.goalBar}>
        <Animated.View style={[styles.goalFill, { width: barWidth }]} />
      </View>
      <Text style={styles.goalSub}>
        {progress >= 1
          ? "🎉 Goal reached! Amazing work!"
          : `${goal - (totalXp % goal)} XP to reach your daily goal`}
      </Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ContinueCourseCard({ course, delay, onPress }) {
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <TouchableOpacity
        style={styles.continueCard}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[course.color, Colors.sky]}
          style={styles.continueGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.continueEmoji}>{course.emoji}</Text>
          <View style={styles.continueInfo}>
            <Text style={styles.continueTitle}>{course.title}</Text>
            <View style={styles.continueBar}>
              <View
                style={[
                  styles.continueFill,
                  { width: `${course.progress.percent}%` },
                ]}
              />
            </View>
            <Text style={styles.continuePct}>
              {course.progress.completed}/{course.progress.total} lessons ·{" "}
              {course.progress.percent}%
            </Text>
          </View>
          <Text style={styles.continueArrow}>→</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CourseProgressRow({ course, progress, onPress }) {
  return (
    <TouchableOpacity
      style={styles.progressRow}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.progressEmojiBg,
          { backgroundColor: course.color + "22" },
        ]}
      >
        <Text style={{ fontSize: 24 }}>{course.emoji}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.progressTitle}>{course.title}</Text>
        <View style={styles.progressBarRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress.percent}%`,
                  backgroundColor: course.color,
                },
              ]}
            />
          </View>
          <Text style={styles.progressPct}>{progress.percent}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  greeting: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 2,
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  xpEmoji: { fontSize: 14 },
  xpValue: { fontSize: 14, fontWeight: "800", color: Colors.white },
  streakCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "column",
    gap: 12,
    // justifyContent: "space-between",
    // alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  streakLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakFire: { fontSize: 28 },
  streakCount: { fontSize: 16, fontWeight: "800", color: Colors.white },
  streakSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  streakDays: { flexDirection: "row", gap: 4 },
  streakDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  streakDayDone: { backgroundColor: Colors.sky },
  streakDayToday: { backgroundColor: Colors.white },
  streakDayText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },
  streakDayTextActive: { color: Colors.white },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  goalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  goalTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  goalXp: { fontSize: 14, fontWeight: "700", color: Colors.navy },
  goalBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.pale,
    overflow: "hidden",
    marginBottom: 8,
  },
  goalFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: Colors.sky,
  },
  goalSub: { fontSize: 12, color: Colors.textMuted },
  continueCard: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: 10,
    ...Shadow.md,
  },
  continueGradient: {
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  continueEmoji: { fontSize: 36 },
  continueInfo: { flex: 1 },
  continueTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.white,
    marginBottom: 8,
  },
  continueBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
    marginBottom: 4,
  },
  continueFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  continuePct: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  continueArrow: { fontSize: 22, color: Colors.white, fontWeight: "800" },
  progressRow: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    ...Shadow.sm,
  },
  progressEmojiBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  progressBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.pale,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressPct: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
    minWidth: 32,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: Spacing.lg,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  emptyButtonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
