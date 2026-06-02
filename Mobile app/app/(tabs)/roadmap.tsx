import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store";
import { Colors, Spacing, Radius, Shadow } from "@/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const NODE_SIZE = 72;
const PATH_COLS = [SCREEN_W * 0.25, SCREEN_W * 0.5, SCREEN_W * 0.75];
// Alternating zig-zag columns for the winding path
const NODE_POSITIONS = [
  PATH_COLS[1],
  PATH_COLS[2],
  PATH_COLS[1],
  PATH_COLS[0],
  PATH_COLS[1],
  PATH_COLS[2],
  PATH_COLS[1],
  PATH_COLS[0],
];
const ROW_HEIGHT = 130;

export default function CourseRoadmapScreen() {
  const { courseId: rawCourseId } = useLocalSearchParams();
  const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const downloadedCourses = useStore((s) => s.downloadedCourses);
  const isLessonComplete = useStore((s) => s.isLessonComplete);
  const lessonProgress = useStore((s) => s.lessonProgress);

  const [remoteCourse, setRemoteCourse] = useState<any>(null);

  useEffect(() => {
    async function loadCourse() {
      try {
        const { coursesApi } = await import("@/services/api");
        const res = await coursesApi.get(courseId);
        console.log("--- Roadmap API Data ---");
        console.log(JSON.stringify(res.data, null, 2));
        const remoteData = res.data?.course || res.data;
        setRemoteCourse(remoteData);

        // If the user has this course downloaded, silently update the offline bundle
        // to ensure lesson IDs and content stay perfectly in sync with the remote version
        const store = useStore.getState();
        if (store.downloadedCourses[courseId]) {
          store.setDownloadedCourse(courseId, remoteData);
          store.persist();
        }
      } catch (err) {
        console.error("Failed to fetch course for roadmap", err);
      }
    }
    loadCourse();
  }, [courseId]);

  const bundle = downloadedCourses[courseId];
  const courseObj = remoteCourse || bundle?.course || bundle;
  const lessons = courseObj?.lessons || [];

  const completedCount = lessons.filter(
    (l: any) => lessonProgress[l._id]?.completed,
  ).length;
  const progressPercent = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [popupAnim] = useState(new Animated.Value(0));
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getLessonState = (lesson, index) => {
    if (isLessonComplete(lesson._id)) return "complete";
    const prevDone = index === 0 || isLessonComplete(lessons[index - 1]?._id);
    if (prevDone) return "active";
    return "locked";
  };

  const openPopup = (lesson) => {
    setSelectedLesson(lesson);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(popupAnim, {
      toValue: 1,
      tension: 70,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const closePopup = () => {
    Animated.timing(popupAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedLesson(null));
  };

  const startLesson = (lesson) => {
    closePopup();
    setTimeout(() => {
      const safeCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
      router.push({
        pathname: "/lesson/[id]",
        params: {
          id: lesson._id,
          courseId: safeCourseId,
          lessonStr: JSON.stringify(lesson),
        },
      });
    }, 250);
  };

  const totalHeight = lessons.length * ROW_HEIGHT + 200;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.blue, Colors.sky]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Animated.View style={{ opacity: headerFade }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {courseObj?.title || "Course"}
              </Text>
              <Text style={styles.headerSub}>
                {completedCount}/{lessons.length} lessons complete
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* XP Progress bar */}
          <View style={styles.xpBarWrap}>
            <Text style={styles.xpBarLabel}>
              ⭐ {progressPercent}% complete
            </Text>
            <View style={styles.xpBarBg}>
              <Animated.View
                style={[styles.xpBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Roadmap scroll */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.roadmap,
          { minHeight: Math.max(totalHeight, 400) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {lessons.length === 0 && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: Colors.text, fontSize: 16 }}>
              Loading lessons or no lessons found...
            </Text>
          </View>
        )}
        {/* SVG-style path connector drawn with Views */}
        {lessons.map((lesson, index) => {
          if (index === lessons.length - 1) return null;
          const fromX = NODE_POSITIONS[index % NODE_POSITIONS.length];
          const toX = NODE_POSITIONS[(index + 1) % NODE_POSITIONS.length];
          const fromY = index * ROW_HEIGHT + NODE_SIZE / 2 + 60;
          const toY = (index + 1) * ROW_HEIGHT + NODE_SIZE / 2 + 60;
          const state = getLessonState(lesson, index);
          const nextState = getLessonState(lessons[index + 1], index + 1);
          const lineColor =
            state === "complete"
              ? Colors.nodeComplete
              : nextState === "active"
                ? Colors.blue
                : Colors.nodeLocked;

          return (
            <PathConnector
              key={`path_${index}`}
              fromX={fromX}
              fromY={fromY}
              toX={toX}
              toY={toY}
              color={lineColor}
              animated={state === "complete"}
            />
          );
        })}

        {/* Lesson nodes */}
        {lessons.map((lesson, index) => {
          const x = NODE_POSITIONS[index % NODE_POSITIONS.length];
          const y = index * ROW_HEIGHT + 60;
          const state = getLessonState(lesson, index);
          const isFirst = index === 0;
          const isLast = index === lessons.length - 1;

          return (
            <LessonNode
              key={lesson._id}
              lesson={lesson}
              index={index}
              x={x}
              y={y}
              state={state}
              isFirst={isFirst}
              isLast={isLast}
              onPress={() => state !== "locked" && openPopup(lesson)}
            />
          );
        })}

        {/* Finish line */}
        {lessons.length > 0 && (
          <View
            style={[
              styles.finishLine,
              {
                top: lessons.length * ROW_HEIGHT + 40,
                left:
                  NODE_POSITIONS[lessons.length % NODE_POSITIONS.length] - 50,
              },
            ]}
          >
            <Text style={styles.finishEmoji}>🏁</Text>
            <Text style={styles.finishText}>Finish!</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Lesson popup modal */}
      {selectedLesson && (
        <LessonPopup
          lesson={selectedLesson}
          state={getLessonState(
            selectedLesson,
            lessons.indexOf(selectedLesson),
          )}
          anim={popupAnim}
          onClose={closePopup}
          onStart={() => startLesson(selectedLesson)}
          courseId={courseId}
        />
      )}
    </View>
  );
}

/* ── Path connector between nodes ─────────────────────────────── */
function PathConnector({ fromX, fromY, toX, toY, color, animated }) {
  const dashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.timing(dashAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ).start();
    }
  }, [animated]);

  // Draw a multi-segment dashed line
  const segments = 8;
  const segPoints = Array.from({ length: segments }, (_, i) => {
    const t = i / (segments - 1);
    const x = fromX + (toX - fromX) * t;
    const y = fromY + (toY - fromY) * t;
    return { x, y };
  });

  return (
    <>
      {segPoints.slice(0, -1).map((pt, i) => {
        const next = segPoints[i + 1];
        const isEven = i % 2 === 0;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: Math.min(pt.x, next.x) - 3,
              top: Math.min(pt.y, next.y) - 3,
              width: Math.abs(next.x - pt.x) + 6,
              height: Math.abs(next.y - pt.y) + 6,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isEven && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: color,
                  opacity: 0.7,
                }}
              />
            )}
          </View>
        );
      })}
    </>
  );
}

/* ── Individual lesson node ────────────────────────────────────── */
function LessonNode({ lesson, index, x, y, state, isFirst, isLast, onPress }) {
  const scale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 120),
      Animated.spring(scale, {
        toValue: 1,
        tension: 80,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (state === "active") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [state]);

  const nodeColor =
    state === "complete"
      ? Colors.nodeComplete
      : state === "active"
        ? Colors.nodeActive
        : Colors.nodeLocked;

  const nodeBg =
    state === "complete"
      ? Colors.nodeComplete
      : state === "active"
        ? Colors.nodeActive
        : Colors.nodeLockedBg;

  const typeEmoji =
    lesson.type === "quiz" ? "❓" : isLast ? "🏆" : isFirst ? "🚀" : "📖";

  return (
    <Animated.View
      style={[
        styles.nodeWrap,
        {
          left: x - NODE_SIZE / 2,
          top: y,
          transform: [{ scale }, { scale: state === "active" ? pulseAnim : 1 }],
        },
      ]}
    >
      {/* Active glow ring */}
      {state === "active" && <GlowRing />}

      <TouchableOpacity
        style={[
          styles.node,
          { backgroundColor: nodeBg, borderColor: nodeColor },
          state === "complete" && styles.nodeComplete,
          state === "locked" && styles.nodeLocked,
        ]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={state === "locked"}
      >
        {state === "complete" ? (
          <Text style={styles.nodeCheckmark}>✓</Text>
        ) : state === "locked" ? (
          <Text style={styles.nodeLockIcon}>🔒</Text>
        ) : (
          <Text style={styles.nodeEmoji}>{typeEmoji}</Text>
        )}
      </TouchableOpacity>

      {/* Lesson number badge */}
      <View style={[styles.nodeBadge, { backgroundColor: nodeColor }]}>
        <Text style={styles.nodeBadgeText}>{index + 1}</Text>
      </View>

      {/* Label below node */}
      <Text
        style={[styles.nodeLabel, state === "locked" && styles.nodeLabelLocked]}
        numberOfLines={2}
      >
        {lesson.title}
      </Text>
    </Animated.View>
  );
}

/* ── Pulsing glow ring for active node ─────────────────────────── */
function GlowRing() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ring1, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(ring1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(ring2, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(ring2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const ringStyle = (anim: any): any => ({
    position: "absolute",
    width: NODE_SIZE + 20,
    height: NODE_SIZE + 20,
    borderRadius: (NODE_SIZE + 20) / 2,
    borderWidth: 2,
    borderColor: Colors.sky,
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    }),
    alignSelf: "center",
    top: -10,
  });

  return (
    <>
      <Animated.View style={ringStyle(ring1)} />
      <Animated.View style={ringStyle(ring2)} />
    </>
  );
}

/* ── Lesson detail popup ─────────────────────────────────────────── */
function LessonPopup({ lesson, state, anim, onClose, onStart, courseId }) {
  const isComplete = state === "complete";
  const isLessonComplete = useStore((s) => s.isLessonComplete);
  const completed = isLessonComplete(lesson._id);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });
  const overlayOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Lesson type badge */}
        <View style={styles.popupBadgeRow}>
          <View
            style={[styles.popupTypeBadge, { backgroundColor: Colors.pale }]}
          >
            <Text style={styles.popupTypeBadgeText}>
              {lesson.type === "quiz" ? "❓ Quiz" : "📖 Lesson"}
            </Text>
          </View>
          <View style={[styles.popupXpBadge]}>
            <Text style={styles.popupXpText}>⭐ +{lesson.xpReward} XP</Text>
          </View>
        </View>

        <Text style={styles.popupTitle}>{lesson.title}</Text>
        <Text style={styles.popupMeta}>
          ⏱ {lesson.durationMinutes} min
          {lesson.quiz?.length > 0
            ? `  ·  ${lesson.quiz.length} questions`
            : ""}
        </Text>

        {completed && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerText}>
              🎉 Completed! You earned {lesson.xpReward} XP
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: Colors.navy }]}
          onPress={onStart}
        >
          <LinearGradient
            colors={[Colors.blue, Colors.sky]}
            style={styles.startBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.startBtnText}>
              {completed ? "🔄 Practice Again" : "▶  Start Lesson"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Not now</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 20, color: Colors.white, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.white },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  xpBarWrap: { gap: 6 },
  xpBarLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  xpBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  roadmap: {
    position: "relative",
    width: SCREEN_W,
  },
  nodeWrap: {
    position: "absolute",
    width: NODE_SIZE,
    alignItems: "center",
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    ...Shadow.md,
  },
  nodeComplete: {
    backgroundColor: Colors.nodeComplete,
    borderColor: "#16A34A",
  },
  nodeLocked: {
    backgroundColor: Colors.nodeLockedBg,
    borderColor: Colors.nodeLocked,
    ...Shadow.sm,
  },
  nodeCheckmark: { fontSize: 28, color: Colors.white, fontWeight: "800" },
  nodeLockIcon: { fontSize: 26 },
  nodeEmoji: { fontSize: 28 },
  nodeBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  nodeBadgeText: { fontSize: 10, fontWeight: "800", color: Colors.white },
  nodeLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    maxWidth: 90,
    lineHeight: 15,
  },
  nodeLabelLocked: { color: Colors.textLight },
  finishLine: {
    position: "absolute",
    alignItems: "center",
  },
  finishEmoji: { fontSize: 40 },
  finishText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.navy,
    marginTop: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    paddingBottom: 40,
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  popupBadgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  popupTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  popupTypeBadgeText: { fontSize: 12, fontWeight: "700", color: Colors.navy },
  popupXpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.xpBg,
  },
  popupXpText: { fontSize: 12, fontWeight: "700", color: Colors.warning },
  popupTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 6,
  },
  popupMeta: { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
  completedBanner: {
    backgroundColor: Colors.successBg,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
  },
  completedBannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.success,
  },
  startBtn: {
    borderRadius: Radius.full,
    overflow: "hidden",
    marginBottom: 10,
    ...Shadow.md,
  },
  startBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  startBtnText: { color: Colors.white, fontSize: 17, fontWeight: "800" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 15, color: Colors.textMuted, fontWeight: "600" },
});
