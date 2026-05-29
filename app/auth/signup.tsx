import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useStore } from '@/store';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(true);
  const setAuth = useStore((s) => s.setAuth);
  const persist = useStore((s) => s.persist);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Your name', 'Please enter your name to continue.');
      return;
    }
    // Offline-first: create local profile, no server needed
    const user = {
      _id: `local_${Date.now()}`,
      name: name.trim(),
      email: email.trim() || null,
      xp: 0,
      streak: 0,
      role: 'student',
    };
    setAuth(user, null, null);
    await persist();
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={[Colors.navy, Colors.blue]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Top illustration */}
          <View style={styles.illustrationWrap}>
            <View style={styles.illustrationCircle}>
              <Text style={styles.illustrationEmoji}>🎓</Text>
            </View>
            <View style={styles.floatingBadge}>
              <Text style={styles.floatingBadgeText}>✨ Free forever</Text>
            </View>
          </View>

          <Text style={styles.headline}>Start learning{'\n'}today</Text>
          <Text style={styles.subtitle}>
            No internet? No problem. Download lessons once and learn anytime, anywhere.
          </Text>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Amara Okonkwo"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={[styles.label, { marginTop: Spacing.md }]}>
              Email <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="for syncing your progress"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleContinue}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={[Colors.sky, Colors.blue]}
                  style={styles.ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.ctaText}>Get Started →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.terms}>
              Your progress is saved on this device. Connect to the internet to sync across devices.
            </Text>
          </View>

          {/* Feature pills */}
          <View style={styles.features}>
            {['📥 Works offline', '🎯 Bite-sized lessons', '🏆 Earn XP & badges'].map((f) => (
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
    alignItems: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  illustrationEmoji: { fontSize: 50 },
  floatingBadge: {
    position: 'absolute',
    right: 60,
    top: -8,
    backgroundColor: Colors.xp,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  floatingBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 44,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  optional: { fontWeight: '400', textTransform: 'none' },
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
    overflow: 'hidden',
    ...Shadow.md,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  terms: {
    marginTop: Spacing.md,
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 17,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.xl,
    justifyContent: 'center',
  },
  featurePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  featurePillText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});