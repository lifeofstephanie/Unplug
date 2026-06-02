import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, Radius, Shadow } from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();

  const pressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 13 },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 17 },
  };

  const gradientColors: Record<string, [string, string]> = {
    primary: [Colors.blue, Colors.sky],
    secondary: [Colors.navy, Colors.blue],
    danger: [Colors.error, "#DC2626"],
  };

  const currentSize = sizeStyles[size];

  if (variant === "outline") {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          style={[
            styles.outline,
            {
              paddingVertical: currentSize.paddingVertical,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
            disabled && styles.disabled,
          ]}
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={1}
          disabled={disabled}
        >
          <Text
            style={[
              styles.outlineText,
              { fontSize: currentSize.fontSize },
              textStyle,
            ]}
          >
            {icon ? `${icon} ${title}` : title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        disabled={disabled}
        style={[styles.wrapper, disabled && styles.disabled]}
      >
        <LinearGradient
          colors={gradientColors[variant] || gradientColors.primary}
          style={[
            styles.gradient,
            {
              paddingVertical: currentSize.paddingVertical,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text
            style={[styles.text, { fontSize: currentSize.fontSize }, textStyle]}
          >
            {icon ? `${icon} ${title}` : title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.full,
    overflow: "hidden",
    ...Shadow.md,
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: Colors.white,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  outline: {
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: {
    color: Colors.navy,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
});
