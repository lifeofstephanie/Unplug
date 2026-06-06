import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStore } from "../../store";
import type { User } from "../../store/useUserStore";
import { Colors, Spacing, Radius, Shadow } from "../../constants/theme";
import { authApi } from "../../services/api";

type Mode = "login" | "register";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useStore((s) => s.setAuth);
  const persist = useStore((s) => s.persist);

  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const pressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  // ── Validation ──────────────────────────────────────
  const validate = (): boolean => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return false;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert(
        "Invalid password",
        "Password must be at least 6 characters.",
      );
      return false;
    }
    if (mode === "register" && !name.trim()) {
      Alert.alert("Missing name", "Please enter your name.");
      return false;
    }
    return true;
  };

  // ── Save tokens and user to store ──────────────────
  const saveSession = async (
    user: User,
    accessToken: string,
    refreshToken: string,
  ) => {
    await AsyncStorage.setItem("@access_token", accessToken);
    await AsyncStorage.setItem("@refresh_token", refreshToken);
    setAuth(user, accessToken, refreshToken);
    await persist();
  };

  // ── Register ────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      const { user, accessToken, refreshToken } = res.data;
      await saveSession(user, accessToken, refreshToken);
      router.replace("/(tabs)");
    } catch (err: any) {
      const message =
        err?.response?.data?.error || "Registration failed. Please try again.";
      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      const { user, accessToken, refreshToken } = res.data;
      await saveSession(user, accessToken, refreshToken);
      useStore.setState({
        totalXp: user.xp || 0,
        streak: user.streak || 0,
        lastActivityDate: user.lastActiveAt
          ? new Date(user.lastActiveAt).toISOString().split("T")[0]
          : null,
        eventQueue: [],
      });
      await useStore.getState().persist();
      router.replace("/(tabs)");
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        "Login failed. Please check your credentials.";
      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (mode === "register") {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <LinearGradient
      colors={[Colors.navy, Colors.blue]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration */}
          <View style={styles.illustrationWrap}>
            <View style={styles.illustrationCircle}>
              <Text style={styles.illustrationEmoji}>🎓</Text>
            </View>
            <View style={styles.floatingBadge}>
              <Text style={styles.floatingBadgeText}>✨ Free forever</Text>
            </View>
          </View>

          <Text style={styles.headline}>
            {mode === "register" ? "Start learning\ntoday" : "Welcome\nback"}
          </Text>
          <Text style={styles.subtitle}>
            No internet? No problem. Download lessons once and learn anytime,
            anywhere.
          </Text>

          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                mode === "register" && styles.modeBtnActive,
              ]}
              onPress={() => setMode("register")}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  mode === "register" && styles.modeBtnTextActive,
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
              onPress={() => setMode("login")}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  mode === "login" && styles.modeBtnTextActive,
                ]}
              >
                Log In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            {/* Name — only for register */}
            {mode === "register" && (
              <>
                <Text style={styles.label}>Your name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Amara Okonkwo"
                  placeholderTextColor={Colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!loading}
                />
              </>
            )}

            <Text
              style={[
                styles.label,
                mode === "register" && { marginTop: Spacing.md },
              ]}
            >
              Email
            </Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              editable={!loading}
            />

            <Text style={[styles.label, { marginTop: Spacing.md }]}>
              Password
            </Text>
            <TextInput
              style={styles.input}
              placeholder="at least 6 characters"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              editable={!loading}
            />

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleContinue}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={1}
                disabled={loading}
              >
                <LinearGradient
                  colors={[Colors.sky, Colors.blue]}
                  style={styles.ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.ctaText}>
                      {mode === "register" ? "Create Account →" : "Log In →"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.terms}>
              Your progress is saved on this device and synced when you're
              online.
            </Text>
          </View>

          {/* Feature pills */}
          <View style={styles.features}>
            {[
              "📥 Works offline",
              "🎯 Bite-sized lessons",
              "🏆 Earn XP & badges",
            ].map((f) => (
              <View key={f} style={styles.featurePill}>
                <Text style={styles.featurePillText}>{f}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  illustrationWrap: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    position: "relative",
  },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  illustrationEmoji: { fontSize: 50 },
  floatingBadge: {
    position: "absolute",
    right: 60,
    top: -8,
    backgroundColor: Colors.xp,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  floatingBadgeText: { color: Colors.white, fontSize: 11, fontWeight: "700" },
  headline: {
    fontSize: 38,
    fontWeight: "800",
    color: Colors.white,
    lineHeight: 44,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: Radius.full,
  },
  modeBtnActive: {
    backgroundColor: Colors.white,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },
  modeBtnTextActive: {
    color: Colors.navy,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ctaButton: {
    marginTop: Spacing.lg,
    borderRadius: Radius.full,
    overflow: "hidden",
    ...Shadow.md,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  ctaText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  terms: {
    marginTop: Spacing.md,
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 17,
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: Spacing.xl,
    justifyContent: "center",
  },
  featurePill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  featurePillText: { color: Colors.white, fontSize: 13, fontWeight: "600" },
});
