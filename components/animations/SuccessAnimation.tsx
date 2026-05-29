import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '@/constants/theme';

const { width: W, height: H } = Dimensions.get('window');

interface SuccessAnimationProps {
  message?: string;
  emoji?: string;
  onComplete?: () => void;
}

/**
 * Full-screen celebratory overlay with a scaling emoji,
 * message text, and confetti-style star particles.
 */
export default function SuccessAnimation({
  message = 'Well Done!',
  emoji = '🎉',
  onComplete,
}: SuccessAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(textSlide, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      {/* Star particles */}
      {STARS.map((star, i) => (
        <StarParticle key={i} {...star} />
      ))}

      <Animated.Text
        style={[styles.emoji, { transform: [{ scale: scaleAnim }] }]}
      >
        {emoji}
      </Animated.Text>

      <Animated.Text
        style={[
          styles.message,
          { transform: [{ translateY: textSlide }], opacity: opacityAnim },
        ]}
      >
        {message}
      </Animated.Text>
    </Animated.View>
  );
}

function StarParticle({
  x,
  y,
  delay,
  size,
}: {
  x: number;
  y: number;
  delay: number;
  size: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: y,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: size,
        left: W / 2 + x,
        top: H / 2,
        transform: [{ translateY }, { rotate: spin }],
        opacity,
      }}
    >
      ⭐
    </Animated.Text>
  );
}

const STARS = [
  { x: -60, y: -120, delay: 0, size: 16 },
  { x: 50, y: -140, delay: 50, size: 12 },
  { x: -100, y: -80, delay: 100, size: 14 },
  { x: 80, y: -100, delay: 150, size: 10 },
  { x: -30, y: -170, delay: 200, size: 16 },
  { x: 40, y: -160, delay: 250, size: 12 },
  { x: -80, y: -50, delay: 300, size: 14 },
  { x: 100, y: -70, delay: 350, size: 10 },
];

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  message: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
