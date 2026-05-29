import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import XPBurstOverlay from '@/components/animations/XPBurst';

const { width: SCREEN_W } = Dimensions.get('window');

export default function LessonScreen() {
  const { courseId, lessonStr } = useLocalSearchParams();
  const lesson = typeof lessonStr === 'string' ? JSON.parse(lessonStr) : lessonStr;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const markLessonComplete = useStore((s) => s.markLessonComplete);
  const addXp = useStore((s) => s.addXp);
  const enqueueEvent = useStore((s) => s.enqueueEvent);
  const persist = useStore((s) => s.persist);
  const isLessonComplete = useStore((s) => s.isLessonComplete);

  const [completed, setCompleted] = useState(isLessonComplete(lesson._id));
  const [showXpBurst, setShowXpBurst] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const completeBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const progress = (contentOffset.y + layoutMeasurement.height) / contentSize.height;
    setScrollProgress(Math.min(progress, 1));
  };

  const handleComplete = async () => {
    if (completed) {
      router.back();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.spring(completeBtnScale, { toValue: 0.94, useNativeDriver: true }),
      Animated.spring(completeBtnScale, { toValue: 1, tension: 100, useNativeDriver: true }),
    ]).start();

    markLessonComplete(lesson._id, 100);
    addXp(lesson.xpReward);
    enqueueEvent({
      courseId,
      lessonId: lesson._id,
      eventType: 'lesson_completed',
      payload: { score: 100, passed: true },
    });

    await persist();
    setCompleted(true);
    setShowXpBurst(true);

    setTimeout(() => {
      setShowXpBurst(false);
      router.back();
    }, 2000);
  };

  // Simple markdown-to-component renderer
  const renderContent = (markdown) => {
    const lines = markdown.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) {
        return <Text key={i} style={styles.h1}>{line.slice(2)}</Text>;
      }
      if (line.startsWith('## ')) {
        return <Text key={i} style={styles.h2}>{line.slice(3)}</Text>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <Text key={i} style={styles.bold}>{line.slice(2, -2)}</Text>;
      }
      if (line.trim() === '') {
        return <View key={i} style={{ height: 10 }} />;
      }
      // Inline bold
      const parts = line.split(/(\*\*.*?\*\*)/g);
      if (parts.length > 1) {
        return (
          <Text key={i} style={styles.para}>
            {parts.map((p, j) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return <Text key={j} style={styles.inlineBold}>{p.slice(2, -2)}</Text>;
              }
              return p;
            })}
          </Text>
        );
      }
      return <Text key={i} style={styles.para}>{line}</Text>;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Progress bar at very top */}
      <View style={[styles.topProgressBar, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.navy, Colors.blue]}
          style={{ flex: 1, height: 4 + insets.top }}
        >
          <Animated.View
            style={[
              styles.topProgressFill,
              { width: `${scrollProgress * 100}%`, marginTop: insets.top },
            ]}
          />
        </LinearGradient>
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: 6 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerType}>
            {lesson.type === 'text' ? '📖 Reading' : '📖 Lesson'}
          </Text>
          <Text style={styles.xpLabel}>+{lesson.xpReward} XP</Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>⏱ {lesson.durationMinutes}m</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Title card */}
          <LinearGradient
            colors={[Colors.navy, Colors.blue]}
            style={styles.titleCard}
          >
            <Text style={styles.lessonNumber}>Lesson {lesson.order}</Text>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
          </LinearGradient>

          {/* Body */}
          <View style={styles.body}>
            {renderContent(lesson.content)}
          </View>

          {/* Key point callout */}
          <View style={styles.callout}>
            <Text style={styles.calloutIcon}>💡</Text>
            <Text style={styles.calloutText}>
              Take your time to understand each concept before moving on.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Animated.View style={{ transform: [{ scale: completeBtnScale }] }}>
          <TouchableOpacity onPress={handleComplete} activeOpacity={1}>
            <LinearGradient
              colors={completed ? [Colors.success, '#16A34A'] : [Colors.navy, Colors.blue]}
              style={styles.completeBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.completeBtnText}>
                {completed ? '✓ Lesson Complete!' : 'Mark as Complete →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* XP Burst overlay */}
      {showXpBurst && <XPBurstOverlay xp={lesson.xpReward} />}
    </View>
  );
}

const styles = StyleSheet.create({
  topProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topProgressFill: {
    height: 4,
    backgroundColor: Colors.sky,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: Colors.textMuted, fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerType: { fontSize: 14, fontWeight: '700', color: Colors.text },
  xpLabel: { fontSize: 12, color: Colors.warning, fontWeight: '700' },
  timerBadge: {
    backgroundColor: Colors.pale,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  timerText: { fontSize: 12, fontWeight: '700', color: Colors.navy },
  content: { paddingBottom: 40 },
  titleCard: {
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  lessonNumber: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  lessonTitle: { fontSize: 24, fontWeight: '800', color: Colors.white, lineHeight: 30 },
  body: {
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  h1: { fontSize: 22, fontWeight: '800', color: Colors.navy, marginBottom: 8, marginTop: 4 },
  h2: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 6, marginTop: 12 },
  bold: { fontSize: 15, fontWeight: '800', color: Colors.navy, marginVertical: 4 },
  para: { fontSize: 15, color: Colors.text, lineHeight: 24, marginBottom: 4 },
  inlineBold: { fontWeight: '800', color: Colors.navy },
  callout: {
    margin: Spacing.lg,
    backgroundColor: Colors.pale,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.sky,
  },
  calloutIcon: { fontSize: 18, marginTop: 1 },
  calloutText: { flex: 1, fontSize: 13, color: Colors.navyDark, lineHeight: 20, fontWeight: '500' },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completeBtn: {
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  completeBtnText: { color: Colors.white, fontSize: 17, fontWeight: '800' },
});