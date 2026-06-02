import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Colors } from '@/constants/theme';

const { width: W, height: H } = Dimensions.get('window');

// Confetti-style XP burst overlay
export default function XPBurstOverlay({ xp }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -60, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Confetti particles */}
      {PARTICLES.map((p, i) => (
        <ConfettiParticle key={i} {...p} delay={i * 30} />
      ))}

      {/* Central XP badge */}
      <Animated.View
        style={[
          styles.badge,
          {
            transform: [{ scale }, { translateY }],
            opacity,
          },
        ]}
      >
        <Text style={styles.star}>⭐</Text>
        <Text style={styles.xpText}>+{xp} XP</Text>
        <Text style={styles.congrats}>Awesome!</Text>
      </Animated.View>
    </View>
  );
}

function ConfettiParticle({ x, y, color, size, delay }) {
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: y, duration: 800, useNativeDriver: true }),
        Animated.timing(translateXAnim, { toValue: x, duration: 800, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 4,
          transform: [
            { translateX: translateXAnim },
            { translateY: translateYAnim },
            { rotate },
          ],
          opacity: opacityAnim,
          top: H / 2,
          left: W / 2,
        },
      ]}
    />
  );
}

const PARTICLES = [
  { x: -80, y: -120, color: Colors.sky, size: 10 },
  { x: 80, y: -100, color: Colors.xp, size: 8 },
  { x: -40, y: -150, color: Colors.success, size: 12 },
  { x: 40, y: -140, color: Colors.pale, size: 6 },
  { x: -100, y: -60, color: Colors.blue, size: 10 },
  { x: 100, y: -80, color: Colors.xp, size: 8 },
  { x: -60, y: -180, color: Colors.sky, size: 6 },
  { x: 60, y: -160, color: Colors.success, size: 10 },
  { x: -120, y: -40, color: Colors.pale, size: 8 },
  { x: 120, y: -50, color: Colors.blue, size: 12 },
  { x: -20, y: -200, color: Colors.xp, size: 8 },
  { x: 20, y: -190, color: Colors.sky, size: 6 },
];

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  badge: {
    backgroundColor: Colors.navy,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 3,
    borderColor: Colors.sky,
  },
  star: { fontSize: 36, marginBottom: 4 },
  xpText: { fontSize: 36, fontWeight: '800', color: Colors.xp, letterSpacing: -1 },
  congrats: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  particle: {
    position: 'absolute',
  },
});