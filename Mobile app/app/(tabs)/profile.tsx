import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";
import { MOCK_COURSES } from "@/constants/mockData";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useStore((s) => s.user);
  const totalXp = useStore((s) => s.totalXp);
  const streak = useStore((s) => s.streak);
  const downloadedCourses = useStore((s) => s.downloadedCourses);
  const lessonProgress = useStore((s) => s.lessonProgress);
  const eventQueue = useStore((s) => s.eventQueue);
  const isOnline = useStore((s) => s.isOnline);
  const clearAuth = useStore((s) => s.clearAuth);
  const persist = useStore((s) => s.persist);

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

  const downloadedCount = Object.keys(downloadedCourses).length;
  const completedLessons = Object.values(lessonProgress).filter(
    (p: any) => p.completed,
  ).length;
  const pendingSync = eventQueue.length;

  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Your progress is saved on this device. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            clearAuth();
            await persist();
            router.replace("/auth/login");
          },
        },
      ],
    );
  };

  // Level system based on XP
  const level = Math.floor(totalXp / 100) + 1;
  const xpInLevel = totalXp % 100;
  const levelProgress = xpInLevel / 100;
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.blue, Colors.sky]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={[Colors.sky, Colors.blue]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() || "?"}
            </Text>
          </LinearGradient>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv {level}</Text>
          </View>
        </View>

        <Text style={styles.userName}>{user?.name || "Learner"}</Text>
        {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}

        {/* XP Progress to next level */}
        <View style={styles.xpSection}>
          <Text style={styles.xpLabel}>
            Level {level} · {xpInLevel}/100 XP to next level
          </Text>
          <View style={styles.xpBarBg}>
            <Animated.View
              style={[
                styles.xpBarFill,
                { width: `${Math.min(levelProgress * 100, 100)}%` },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatCard
              emoji="⭐"
              value={`${totalXp}`}
              label="Total XP"
              color={Colors.xp}
              delay={0}
            />
            <StatCard
              emoji="🔥"
              value={`${streak}`}
              label="Day Streak"
              color={Colors.error}
              delay={80}
            />
            <StatCard
              emoji="📖"
              value={`${completedLessons}`}
              label="Lessons Done"
              color={Colors.success}
              delay={160}
            />
            <StatCard
              emoji="📥"
              value={`${downloadedCount}`}
              label="Courses"
              color={Colors.blue}
              delay={240}
            />
          </View>

          {/* Offline sync status */}
          <View style={styles.syncCard}>
            <View style={styles.syncHeader}>
              <View style={styles.syncDot}>
                <View
                  style={[
                    styles.syncIndicator,
                    {
                      backgroundColor: isOnline
                        ? Colors.success
                        : Colors.textLight,
                    },
                  ]}
                />
              </View>
              <Text style={styles.syncTitle}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
            <Text style={styles.syncBody}>
              {pendingSync > 0
                ? `${pendingSync} event${pendingSync > 1 ? "s" : ""} waiting to sync`
                : "All progress synced ✓"}
            </Text>
            {!isOnline && pendingSync > 0 && (
              <Text style={styles.syncHint}>
                Events will sync automatically when you reconnect.
              </Text>
            )}
          </View>

          {/* Achievements */}
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsRow}>
            <AchievementBadge
              emoji="🚀"
              title="First Steps"
              unlocked={completedLessons >= 1}
            />
            <AchievementBadge
              emoji="📚"
              title="5 Lessons"
              unlocked={completedLessons >= 5}
            />
            <AchievementBadge
              emoji="🔥"
              title="3-Day Streak"
              unlocked={streak >= 3}
            />
            <AchievementBadge
              emoji="💯"
              title="100 XP"
              unlocked={totalXp >= 100}
            />
            <AchievementBadge emoji="🏆" title="Course Done" unlocked={false} />
          </View>

          {/* Actions */}
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.actionsCard}>
            <ActionRow
              emoji="📊"
              title="Learning Stats"
              subtitle={`${completedLessons} lessons · ${downloadedCount} courses`}
            />
            <View style={styles.divider} />
            <ActionRow
              emoji="🔔"
              title="Reminders"
              subtitle="Daily learning reminders"
            />
            <View style={styles.divider} />
            <ActionRow emoji="📱" title="App Version" subtitle="1.0.0" />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ── Stat Card ────────────────────────────────────────── */
function StatCard({
  emoji,
  value,
  label,
  color,
  delay,
}: {
  emoji: string;
  value: string;
  label: string;
  color: string;
  delay: number;
}) {
  const scale = useRef(new Animated.Value(0.9)).current;
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
    <Animated.View
      style={[styles.statCard, { transform: [{ scale }], opacity }]}
    >
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

/* ── Achievement Badge ────────────────────────────────── */
function AchievementBadge({
  emoji,
  title,
  unlocked,
}: {
  emoji: string;
  title: string;
  unlocked: boolean;
}) {
  return (
    <View style={[styles.badge, !unlocked && styles.badgeLocked]}>
      <Text style={[styles.badgeEmoji, !unlocked && { opacity: 0.3 }]}>
        {emoji}
      </Text>
      <Text
        style={[styles.badgeTitle, !unlocked && { color: Colors.textLight }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {unlocked && (
        <View style={styles.badgeCheck}>
          <Text style={styles.badgeCheckText}>✓</Text>
        </View>
      )}
    </View>
  );
}

/* ── Action Row ───────────────────────────────────────── */
function ActionRow({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.actionRow}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.actionChevron}>›</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  avatarWrap: {
    marginBottom: 12,
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: Colors.xp,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.white,
  },
  userEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  xpSection: {
    width: "100%",
    marginTop: Spacing.md,
    gap: 6,
  },
  xpLabel: {
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
    backgroundColor: Colors.xp,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: "center",
    ...Shadow.sm,
  },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  syncCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  syncHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  syncDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  syncIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  syncBody: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  syncHint: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  achievementsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  badge: {
    width: 64,
    alignItems: "center",
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    ...Shadow.sm,
    position: "relative",
  },
  badgeLocked: {
    backgroundColor: Colors.nodeLockedBg,
  },
  badgeEmoji: { fontSize: 24, marginBottom: 4 },
  badgeTitle: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  badgeCheck: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCheckText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: "800",
  },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  actionEmoji: { fontSize: 20 },
  actionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  actionChevron: {
    fontSize: 20,
    color: Colors.textLight,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 14,
  },
  logoutBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.error,
    marginBottom: Spacing.lg,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.error,
  },
});
