import { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Plus } from 'lucide-react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}

export function PrimaryButton({
  label,
  onPress,
  isLoading,
  disabled,
  icon,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        (disabled || isLoading) && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <>
          {icon}
          <Text style={styles.primaryButtonText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  icon,
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.secondaryButton, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

interface IconButtonProps {
  icon: ReactNode;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'primary' | 'ghost';
}

export function IconButton({
  icon,
  onPress,
  size = 'medium',
  variant = 'default',
}: IconButtonProps) {
  const sizeStyles = {
    small: styles.iconButtonSmall,
    medium: styles.iconButtonMedium,
    large: styles.iconButtonLarge,
  };

  const variantStyles = {
    default: styles.iconButtonDefault,
    primary: styles.iconButtonPrimary,
    ghost: styles.iconButtonGhost,
  };

  return (
    <TouchableOpacity
      style={[styles.iconButton, sizeStyles[size], variantStyles[variant]]}
      onPress={onPress}
    >
      {icon}
    </TouchableOpacity>
  );
}

interface FABProps {
  onPress: () => void;
  icon?: ReactNode;
  label?: string;
}

export function FAB({ onPress, icon, label = 'Log Meal' }: FABProps) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <View style={styles.fabContent}>
        {icon || <Plus size={24} color="#ffffff" />}
        {label && <Text style={styles.fabText}>{label}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  iconButtonSmall: {
    width: 32,
    height: 32,
  },
  iconButtonMedium: {
    width: 40,
    height: 40,
  },
  iconButtonLarge: {
    width: 48,
    height: 48,
  },
  iconButtonDefault: {
    backgroundColor: '#f3f4f6',
  },
  iconButtonPrimary: {
    backgroundColor: '#10b981',
  },
  iconButtonGhost: {
    backgroundColor: 'transparent',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#10b981',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
