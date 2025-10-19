import { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  secureTextEntry,
  multiline,
  numberOfLines,
}: FormInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput
        style={[
          styles.input,
          error && styles.inputError,
          multiline && styles.inputMultiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleChange = (text: string) => {
    setInputValue(text);
    const numValue = parseFloat(text);
    if (!isNaN(numValue)) {
      if (min !== undefined && numValue < min) return;
      if (max !== undefined && numValue > max) return;
      onChange(numValue);
    }
  };

  const increment = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  const decrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.numberInputContainer}>
        <TouchableOpacity style={styles.numberButton} onPress={decrement}>
          <Text style={styles.numberButtonText}>−</Text>
        </TouchableOpacity>
        <View style={styles.numberValueContainer}>
          <RNTextInput
            style={styles.numberInput}
            value={inputValue}
            onChangeText={handleChange}
            keyboardType="numeric"
          />
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
        <TouchableOpacity style={styles.numberButton} onPress={increment}>
          <Text style={styles.numberButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
  },
  numberValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  numberInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    paddingVertical: 12,
    textAlign: 'center',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
});
