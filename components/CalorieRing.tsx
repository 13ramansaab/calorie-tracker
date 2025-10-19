import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CalorieRingProps {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export function CalorieRing({
  current,
  target,
  size = 200,
  strokeWidth = 16,
  animate = true,
}: CalorieRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const percentage = Math.min((current / target) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    if (animate) {
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [percentage, animate]);

  const remaining = Math.max(target - current, 0);
  const over = Math.max(current - target, 0);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={over > 0 ? '#ef4444' : '#10b981'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.content}>
        <Text style={styles.current}>{Math.round(current)}</Text>
        <Text style={styles.label}>
          {over > 0 ? `+${over} over` : `${remaining} left`}
        </Text>
        <Text style={styles.target}>of {target} cal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
  },
  current: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1f2937',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  target: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});
