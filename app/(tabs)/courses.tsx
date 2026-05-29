import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store";
import { Colors, Spacing, Radius, Shadow } from "@/theme";
import { MOCK_COURSES, MOCK_COURSE_BUNDLE } from "@/services/mockData";

const SUBJECTS = [
  "all",
  "math",
  "science",
  "literacy",
  "health",
  "agriculture",
  "technology",
];

export default function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("all");
  const downloadedCourses = useStore((s) => s.downloadedCourses);
  const setDownloadedCourse = useStore((s) => s.setDownloadedCourse);
  const getCourseProgress = useStore((s) => s.getCourseProgress);
  const persist = useStore((s) => s.persist);
  const [downloading, setDownloading] = useState(null);

  const filtered =
    filter === "all"
      ? MOCK_COURSES
      : MOCK_COURSES.filter((c) => c.subject === filter);

  const handleDownload = async (course) => {
    setDownloading(course._id);
    // Simulate download delay
    await new Promise((r) => setTimeout(r, 1200));
    const bundle = MOCK_COURSE_BUNDLE(course._id);
    setDownloadedCourse(course._id, bundle);
    await persist();
    setDownloading(null);
  };

  const handleOpen = (course) => {
    router.push({
      pathname: "/(tabs)/roadmap",
      params: { courseId: course._id }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.blue]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>Explore Courses</Text>
        <Text style={styles.headerSub}>Download once, learn anytime</Text>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {SUBJECTS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, filter === s && styles.chipActive]}
              onPress={() => setFilter(s)}
            >
              <Text
                style={[styles.chipText, filter === s && styles.chipTextActive]}
              >
                {s === "all"
                  ? "✨ All"
                  : s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((course, i) => {
          const isDownloaded = !!downloadedCourses[course._id];
          const isDownloading = downloading === course._id;
          const progress = isDownloaded ? getCourseProgress(course._id) : null;

          return (
            <CourseCard
              key={course._id}
              course={course}
              isDownloaded={isDownloaded}
              isDownloading={isDownloading}
              progress={progress}
              delay={i * 80}
              onPress={() =>
                isDownloaded ? handleOpen(course) : handleDownload(course)
              }
            />
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function CourseCard({
  course,
  isDownloaded,
  isDownloading,
  progress,
  delay,
  onPress,
}) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 10,
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

  const pressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const pressOut = () =>
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View
      style={{ transform: [{ scale }, { scale: pressScale }], opacity }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        disabled={isDownloading}
      >
        {/* Top color strip */}
        <LinearGradient
          colors={[course.color, course.color + "BB"]}
          style={styles.cardTop}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.cardEmoji}>{course.emoji}</Text>
          {isDownloaded && (
            <View style={styles.downloadedBadge}>
              <Text style={styles.downloadedBadgeText}>✓ Ready</Text>
            </View>
          )}
        </LinearGradient>

        {/* Card body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{course.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {course.description}
          </Text>

          {/* Tags */}
          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>⭐ {course.totalXp} XP</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>⏱ {course.estimatedHours}h</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>📥 {course.downloadSizeKb}KB</Text>
            </View>
          </View>

          {/* Progress bar if downloaded */}
          {isDownloaded && progress && (
            <View style={styles.progressBarWrap}>
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
              <Text style={styles.progressText}>{progress.percent}%</Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[
              styles.cta,
              { backgroundColor: isDownloaded ? course.color : Colors.pale },
            ]}
            onPress={onPress}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <View style={styles.ctaLoading}>
                <ActivityIndicator size="small" color={Colors.navy} />
                <Text style={[styles.ctaText, { color: Colors.navy }]}>
                  Downloading…
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.ctaText,
                  { color: isDownloaded ? Colors.white : Colors.navy },
                ]}
              >
                {isDownloaded
                  ? progress?.percent === 100
                    ? "🏆 Review Course"
                    : "▶ Continue"
                  : "📥 Download Free"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: Colors.white },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    marginBottom: 16,
  },
  filterScroll: { marginHorizontal: -Spacing.lg },
  filterContent: { paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  chipActive: { backgroundColor: Colors.white },
  chipText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.8)" },
  chipTextActive: { color: Colors.navy },
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: "hidden",
    ...Shadow.md,
  },
  cardTop: {
    height: 90,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardEmoji: { fontSize: 44 },
  downloadedBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  downloadedBadgeText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  cardBody: { padding: Spacing.md },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: 10,
  },
  tags: { flexDirection: "row", gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  tagText: { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  progressBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.pale,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: "700", color: Colors.textMuted },
  cta: {
    borderRadius: Radius.full,
    paddingVertical: 11,
    alignItems: "center",
  },
  ctaLoading: { flexDirection: "row", alignItems: "center", gap: 8 },
  ctaText: { fontSize: 14, fontWeight: "800" },
});
