import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';

export const LockedNode = ({ title }: { title: string }) => (
  <View style={{ padding: 16, opacity: 0.4 }}>
    <Text style={{ color: Colors.textMuted }}>🔒 {title}</Text>
  </View>
);