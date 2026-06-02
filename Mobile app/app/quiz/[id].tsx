import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors, Spacing, Radius, Shadow } from '@/theme';
import XPBurstOverlay from '@/components/animations/XPBurst';
import { progressApi } from '@/services/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function QuizScreen() {
  const { courseId, lessonStr } = useLocalSearchParams();
  const lesson = typeof lessonStr === 'string' ? JSON.parse(lessonStr) : lessonStr;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const questions = lesson.quiz || [];

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showXpBurst, setShowXpBurst] = useState(false);

  const markLessonComplete = useStore((s) => s.markLessonComplete);
  const addXp = useStore((s) => s.addXp);
  const enqueueEvent = useStore((s) => s.enqueueEvent);
  const persist = useStore((s) => s.persist);

  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const questionFade = useRef(new Animated.Value(1)).current;
  const questionSlide = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0)).current;
  const cardShake = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  const question = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const progress = (currentQ + (answered ? 1 : 0)) / questions.length;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleSelect = (index) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);

    const isCorrect = index === question.correctIndex;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCorrectCount((c) => c + 1);
      // Pop feedback
      Animated.spring(feedbackScale, {
        toValue: 1,
        tension: 80,
        friction: 7,
        useNativeDriver: true,
      }).start();
      // Bounce heart
      Animated.sequence([
        Animated.spring(heartAnim, { toValue: 1.3, tension: 100, useNativeDriver: true }),
        Animated.spring(heartAnim, { toValue: 1, tension: 100, useNativeDriver: true }),
      ]).start();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Pop feedback
      Animated.spring(feedbackScale, {
        toValue: 1,
        tension: 80,
        friction: 7,
        useNativeDriver: true,
      }).start();
      // Shake card
      Animated.sequence([
        Animated.timing(cardShake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleNext = async () => {
    // Reset feedback
    feedbackScale.setValue(0);
    cardShake.setValue(0);

    if (isLast) {
      const score = Math.round((correctCount / questions.length) * 100);
      markLessonComplete(lesson._id, score);
      addXp(lesson.xpReward);
      const newEvent = {
        courseId: Array.isArray(courseId) ? courseId[0] : courseId,
        lessonId: lesson._id,
        eventType: 'lesson_completed',
        payload: {
          score,
          passed: score >= 60,
          answers: [],
        },
      };

      enqueueEvent(newEvent);
      await persist();

      // Attempt immediate API sync
      try {
        const state = useStore.getState();
        const eventsToSync = state.eventQueue;
        if (eventsToSync.length > 0) {
          await progressApi.sync(eventsToSync);
          state.clearQueue();
          await state.persist();
        }
      } catch (err) {
        console.log("Offline or sync failed, event queued.", err);
      }

      setShowSummary(true);
      setShowXpBurst(true);
      return;
    }

    // Animate to next question
    Animated.parallel([
      Animated.timing(questionFade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(questionSlide, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setAnswered(false);
      questionSlide.setValue(30);
      Animated.parallel([
        Animated.timing(questionFade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(questionSlide, { toValue: 0, tension: 80, useNativeDriver: true }),
      ]).start();
    });
  };

  if (showSummary) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <SummaryScreen
        score={score}
        correct={correctCount}
        total={questions.length}
        xpEarned={lesson.xpReward}
        onDone={() => router.back()}
      />
    );
  }

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.blue]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[styles.progressBarFill, { width: progressBarWidth }]}
            />
          </View>

          <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
            <View style={styles.heartBadge}>
              <Text style={styles.heartText}>❤️</Text>
              <Text style={styles.heartCount}>{questions.length - (questions.length - questions.length)}</Text>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>

      {/* Question counter */}
      <View style={styles.qCounter}>
        <Text style={styles.qCounterText}>
          Question {currentQ + 1} of {questions.length}
        </Text>
        <Text style={styles.qXpText}>⭐ +{lesson.xpReward} XP on completion</Text>
      </View>

      {/* Question card */}
      <Animated.View
        style={[
          styles.qCard,
          {
            opacity: questionFade,
            transform: [{ translateX: questionSlide }, { translateX: cardShake }],
          },
        ]}
      >
        <Text style={styles.qText}>{question.question}</Text>
      </Animated.View>

      {/* Options */}
      <View style={styles.options}>
        {question.options.map((opt, i) => (
          <OptionButton
            key={i}
            label={opt}
            index={i}
            selected={selected === i}
            correct={question.correctIndex === i}
            answered={answered}
            onPress={() => handleSelect(i)}
            delay={i * 80}
          />
        ))}
      </View>

      {/* Explanation + CTA */}
      {answered && (
        <Animated.View
          style={[styles.feedback, { transform: [{ scale: feedbackScale }] }]}
        >
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor:
                  selected === question.correctIndex ? Colors.successBg : Colors.errorBg,
                borderColor:
                  selected === question.correctIndex ? Colors.success : Colors.error,
              },
            ]}
          >
            <Text style={styles.feedbackIcon}>
              {selected === question.correctIndex ? '🎉' : '❌'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.feedbackTitle,
                  {
                    color:
                      selected === question.correctIndex ? Colors.success : Colors.error,
                  },
                ]}
              >
                {selected === question.correctIndex ? 'Correct!' : 'Not quite'}
              </Text>
              <Text style={styles.feedbackExplain}>{question.explanation}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
            <LinearGradient
              colors={[Colors.blue, Colors.sky]}
              style={styles.nextBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextBtnText}>
                {isLast ? 'Finish Quiz 🏆' : 'Continue →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {showXpBurst && <XPBurstOverlay xp={lesson.xpReward} />}
    </View>
  );
}

function OptionButton({ label, index, selected, correct, answered, onPress, delay }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const letters = ['A', 'B', 'C', 'D'];
  const isSelected = selected;
  const isCorrectOpt = answered && correct;
  const isWrongSelected = answered && selected && !correct;

  const bgColor =
    isCorrectOpt ? Colors.successBg :
    isWrongSelected ? Colors.errorBg :
    isSelected && !answered ? Colors.pale :
    Colors.white;

  const borderColor =
    isCorrectOpt ? Colors.success :
    isWrongSelected ? Colors.error :
    isSelected && !answered ? Colors.navy :
    Colors.border;

  const pressIn = () => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }, { scale: pressScale }] }}>
      <TouchableOpacity
        style={[styles.option, { backgroundColor: bgColor, borderColor }]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        disabled={answered}
      >
        <View
          style={[
            styles.optionLetter,
            {
              backgroundColor:
                isCorrectOpt ? Colors.success :
                isWrongSelected ? Colors.error :
                isSelected && !answered ? Colors.navy :
                Colors.background,
            },
          ]}
        >
          <Text
            style={[
              styles.optionLetterText,
              {
                color:
                  isCorrectOpt || isWrongSelected || (isSelected && !answered)
                    ? Colors.white
                    : Colors.textMuted,
              },
            ]}
          >
            {letters[index]}
          </Text>
        </View>
        <Text style={[styles.optionText, isCorrectOpt && { color: Colors.success }]}>
          {label}
        </Text>
        {isCorrectOpt && <Text style={styles.optionIcon}>✓</Text>}
        {isWrongSelected && <Text style={styles.optionIcon}>✗</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

function SummaryScreen({ score, correct, total, xpEarned, onDone }) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const passed = score >= 60;
  const emoji = score === 100 ? '🏆' : score >= 80 ? '🌟' : score >= 60 ? '👍' : '💪';

  return (
    <LinearGradient
      colors={passed ? [Colors.navy, Colors.blue, Colors.sky] : [Colors.navy, Colors.blue]}
      style={[styles.summary, { paddingTop: insets.top + 20 }]}
    >
      <Animated.View style={[styles.summaryInner, { transform: [{ scale }], opacity }]}>
        <Text style={styles.summaryEmoji}>{emoji}</Text>
        <Text style={styles.summaryTitle}>
          {score === 100 ? 'Perfect Score!' : passed ? 'Well Done!' : 'Keep Practicing!'}
        </Text>
        <Text style={styles.summaryScore}>{score}%</Text>

        <View style={styles.summaryStats}>
          <StatItem label="Correct" value={`${correct}/${total}`} color={Colors.success} />
          <StatItem label="XP Earned" value={`+${xpEarned}`} color={Colors.xp} />
          <StatItem label="Score" value={`${score}%`} color={Colors.sky} />
        </View>

        <TouchableOpacity style={styles.summaryBtn} onPress={onDone}>
          <Text style={styles.summaryBtnText}>Back to Course →</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

function StatItem({ label, value, color }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  progressBarBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
  heartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  heartText: { fontSize: 16 },
  heartCount: { fontSize: 14, fontWeight: '800', color: Colors.white },
  qCounter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qCounterText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  qXpText: { fontSize: 13, fontWeight: '700', color: Colors.warning },
  qCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.pale,
  },
  qText: { fontSize: 20, fontWeight: '800', color: Colors.text, lineHeight: 28 },
  options: {
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  option: {
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    ...Shadow.sm,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  optionIcon: { fontSize: 18, fontWeight: '800' },
  feedback: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 36,
    ...Shadow.lg,
  },
  feedbackBanner: {
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  feedbackIcon: { fontSize: 22 },
  feedbackTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  feedbackExplain: { fontSize: 13, color: Colors.text, lineHeight: 19 },
  nextBtn: { borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  nextBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { color: Colors.white, fontSize: 17, fontWeight: '800' },
  summary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInner: { alignItems: 'center', paddingHorizontal: 32 },
  summaryEmoji: { fontSize: 72, marginBottom: 16 },
  summaryTitle: { fontSize: 28, fontWeight: '800', color: Colors.white, marginBottom: 8, textAlign: 'center' },
  summaryScore: { fontSize: 64, fontWeight: '800', color: Colors.white, marginBottom: 24 },
  summaryStats: {
    flexDirection: 'row',
    gap: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', textTransform: 'uppercase' },
  summaryBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.full,
    ...Shadow.md,
  },
  summaryBtnText: { fontSize: 16, fontWeight: '800', color: Colors.navy },
});