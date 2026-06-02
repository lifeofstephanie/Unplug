import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { Colors } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

export default function Onboarding() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Navigate after 2.5s
    const timer = setTimeout(() => {
      const currentUser = useStore.getState().user;
      if (currentUser) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth/login");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[Colors.navy, Colors.blue, Colors.sky]}
      style={styles.container}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      {/* Floating background circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      <Animated.View
        style={[styles.logoWrap, { transform: [{ scale }], opacity }]}
      >
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>📚</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={{ opacity: taglineOpacity, transform: [{ translateY }] }}
      >
        <Text style={styles.appName}>Unplug</Text>
        <Text style={styles.tagline}>Learn anywhere. No internet needed.</Text>
      </Animated.View>

      {/* Animated dots */}
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <BouncingDot key={i} delay={i * 200} />
        ))}
      </View>
    </LinearGradient>
  );
}

function BouncingDot({ delay }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, {
          toValue: -8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.dot, { transform: [{ translateY: bounce }] }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  circle1: { width: 300, height: 300, top: -80, right: -60 },
  circle2: { width: 200, height: 200, bottom: 80, left: -50 },
  circle3: { width: 150, height: 150, top: height * 0.35, right: -30 },
  logoWrap: { marginBottom: 28 },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  logoEmoji: { fontSize: 52 },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.2,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
