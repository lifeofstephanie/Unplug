import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface WindingPathProps {
  /** Array of node positions as { x, y } coordinates */
  nodes: Array<{ x: number; y: number }>;
  /** Array of node states: 'complete' | 'active' | 'locked' */
  states: Array<'complete' | 'active' | 'locked'>;
  /** Stroke width of the path */
  strokeWidth?: number;
}

/**
 * SVG-based winding path that draws smooth Bezier curves
 * between roadmap nodes. Colors each segment based on
 * the completion state of the connected nodes.
 */
export default function WindingPath({
  nodes,
  states,
  strokeWidth = 4,
}: WindingPathProps) {
  if (nodes.length < 2) return null;

  const totalHeight = Math.max(
    ...nodes.map((n) => n.y),
    0
  ) + 200;

  return (
    <View style={[styles.container, { height: totalHeight }]} pointerEvents="none">
      <Svg width={SCREEN_W} height={totalHeight}>
        {nodes.slice(0, -1).map((node, i) => {
          const next = nodes[i + 1];
          const state = states[i];
          const nextState = states[i + 1];

          // Determine path color based on both endpoints
          const color =
            state === 'complete'
              ? Colors.nodeComplete
              : nextState === 'active'
              ? Colors.nodeActive
              : Colors.nodeLocked;

          const opacity = state === 'complete' ? 1 : 0.5;

          // Calculate control points for a smooth Bezier curve
          const midY = (node.y + next.y) / 2;
          const d = `M ${node.x} ${node.y} C ${node.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`;

          return (
            <Path
              key={`path_${i}`}
              d={d}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={state === 'locked' ? '8,6' : undefined}
              fill="none"
              opacity={opacity}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
