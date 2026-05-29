import { View, Text, Pressable } from 'react-native';
import { Colors } from '@/constants/theme';

export function RoadNode({ title, status, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor:
            status === 'completed'
              ? Colors.success
              : status === 'available'
              ? Colors.blue
              : Colors.navyDark,
          opacity: status === 'locked' ? 0.4 : 1,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}