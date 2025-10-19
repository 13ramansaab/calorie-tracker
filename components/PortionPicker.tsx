import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NumberInput } from './FormInput';

interface PortionPreset {
  label: string;
  grams: number;
  icon?: string;
}

interface PortionPickerProps {
  presets: PortionPreset[];
  grams: number;
  onChange: (grams: number) => void;
  showVisualGuide?: boolean;
  visualGuideUrl?: string;
}

export function PortionPicker({
  presets,
  grams,
  onChange,
  showVisualGuide = false,
  visualGuideUrl,
}: PortionPickerProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (preset: PortionPreset) => {
    setSelectedPreset(preset.label);
    setMode('preset');
    onChange(preset.grams);
  };

  const handleCustomChange = (value: number) => {
    setSelectedPreset(null);
    setMode('custom');
    onChange(value);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Portion Size</Text>

      {showVisualGuide && visualGuideUrl && (
        <View style={styles.visualGuide}>
          <Image source={{ uri: visualGuideUrl }} style={styles.guideImage} />
          <Text style={styles.guideCaption}>Visual portion guide</Text>
        </View>
      )}

      <View style={styles.presetsContainer}>
        <Text style={styles.sectionLabel}>Quick Select:</Text>
        <View style={styles.presetGrid}>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.label}
              style={[
                styles.presetButton,
                selectedPreset === preset.label && styles.presetButtonSelected,
              ]}
              onPress={() => handlePresetSelect(preset)}
            >
              {preset.icon && <Text style={styles.presetIcon}>{preset.icon}</Text>}
              <Text
                style={[
                  styles.presetLabel,
                  selectedPreset === preset.label && styles.presetLabelSelected,
                ]}
              >
                {preset.label}
              </Text>
              <Text
                style={[
                  styles.presetGrams,
                  selectedPreset === preset.label && styles.presetGramsSelected,
                ]}
              >
                {preset.grams}g
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.customContainer}>
        <Text style={styles.sectionLabel}>Or enter custom amount:</Text>
        <NumberInput
          label="Grams"
          value={grams}
          onChange={handleCustomChange}
          unit="g"
          min={1}
          max={2000}
          step={5}
        />
      </View>

      {mode === 'custom' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Custom portion: {grams}g
          </Text>
        </View>
      )}
    </View>
  );
}

export const COMMON_PORTION_PRESETS: Record<string, PortionPreset[]> = {
  roti: [
    { label: 'Small', grams: 25, icon: '🫓' },
    { label: 'Medium', grams: 30, icon: '🫓' },
    { label: 'Large', grams: 40, icon: '🫓' },
  ],
  rice: [
    { label: 'Katori', grams: 100, icon: '🍚' },
    { label: 'Cup', grams: 150, icon: '🍚' },
    { label: 'Bowl', grams: 200, icon: '🍚' },
  ],
  dal: [
    { label: 'Katori', grams: 150, icon: '🥣' },
    { label: 'Cup', grams: 200, icon: '🥣' },
    { label: 'Bowl', grams: 250, icon: '🥣' },
  ],
  curry: [
    { label: 'Katori', grams: 150, icon: '🍛' },
    { label: 'Cup', grams: 200, icon: '🍛' },
    { label: 'Bowl', grams: 250, icon: '🍛' },
  ],
  dosa: [
    { label: 'Small', grams: 80, icon: '🫔' },
    { label: 'Medium', grams: 120, icon: '🫔' },
    { label: 'Large', grams: 150, icon: '🫔' },
  ],
  idli: [
    { label: '1 piece', grams: 40, icon: '⚪' },
    { label: '2 pieces', grams: 80, icon: '⚪' },
    { label: '3 pieces', grams: 120, icon: '⚪' },
  ],
  paratha: [
    { label: 'Small', grams: 40, icon: '🫓' },
    { label: 'Medium', grams: 50, icon: '🫓' },
    { label: 'Large', grams: 70, icon: '🫓' },
  ],
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  visualGuide: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    gap: 8,
  },
  guideImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  guideCaption: {
    fontSize: 12,
    color: '#6b7280',
  },
  presetsContainer: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  presetButtonSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  presetIcon: {
    fontSize: 24,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  presetLabelSelected: {
    color: '#059669',
  },
  presetGrams: {
    fontSize: 12,
    color: '#9ca3af',
  },
  presetGramsSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  customContainer: {
    gap: 8,
  },
  infoBox: {
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
  },
});
