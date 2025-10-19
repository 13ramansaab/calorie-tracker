import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';

interface ConfidencePillProps {
  score: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export function ConfidencePill({ score, label, size = 'medium' }: ConfidencePillProps) {
  const level = getConfidenceLevel(score);
  const displayLabel = label || level.label;

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
      iconSize: 12,
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
      iconSize: 14,
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
      iconSize: 16,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container, level.containerStyle]}>
      {level.icon(currentSize.iconSize, level.color)}
      <Text style={[styles.text, currentSize.text, { color: level.color }]}>
        {displayLabel}
      </Text>
      {size !== 'small' && (
        <Text style={[styles.percentage, currentSize.text, { color: level.color }]}>
          {Math.round(score)}%
        </Text>
      )}
    </View>
  );
}

function getConfidenceLevel(score: number) {
  if (score >= 85) {
    return {
      label: 'High',
      color: '#10b981',
      containerStyle: styles.containerHigh,
      icon: (size: number, color: string) => <CheckCircle size={size} color={color} />,
    };
  }

  if (score >= 70) {
    return {
      label: 'Medium',
      color: '#f59e0b',
      containerStyle: styles.containerMedium,
      icon: (size: number, color: string) => <AlertCircle size={size} color={color} />,
    };
  }

  if (score >= 50) {
    return {
      label: 'Low',
      color: '#ef4444',
      containerStyle: styles.containerLow,
      icon: (size: number, color: string) => <AlertCircle size={size} color={color} />,
    };
  }

  return {
    label: 'Very Low',
    color: '#991b1b',
    containerStyle: styles.containerVeryLow,
    icon: (size: number, color: string) => <XCircle size={size} color={color} />,
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  containerMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  containerLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  containerHigh: {
    backgroundColor: '#d1fae5',
  },
  containerMedium: {
    backgroundColor: '#fef3c7',
  },
  containerLow: {
    backgroundColor: '#fee2e2',
  },
  containerVeryLow: {
    backgroundColor: '#fecaca',
  },
  text: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
  percentage: {
    fontWeight: '700',
  },
});
