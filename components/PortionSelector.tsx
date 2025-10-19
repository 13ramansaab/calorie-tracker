import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Info } from 'lucide-react-native';
import { getUnitPresetsByFood, type UnitPreset } from '@/lib/ai/unitPresetsIndia';

interface PortionSelectorProps {
  foodName: string;
  currentGrams: number;
  onSelectPortion: (grams: number, unitName: string) => void;
}

export function PortionSelector({ foodName, currentGrams, onSelectPortion }: PortionSelectorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const presets = getUnitPresetsByFood(foodName);

  if (presets.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Portions</Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowTooltip(!showTooltip)}
        >
          <Info size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {showTooltip && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            Tap a portion size to quickly set the amount. These are standard Indian measurements
            converted to grams.
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {presets.map((preset) => {
          const isSelected = Math.abs(currentGrams - preset.gramsEquivalent) < 5;

          return (
            <TouchableOpacity
              key={preset.id}
              style={[styles.presetCard, isSelected && styles.presetCardSelected]}
              onPress={() => onSelectPortion(preset.gramsEquivalent, preset.name)}
            >
              <View style={styles.presetContent}>
                {preset.visualGuide && (
                  <Text style={styles.presetIcon}>{preset.visualGuide.split(' ')[0]}</Text>
                )}
                <Text
                  style={[styles.presetName, isSelected && styles.presetNameSelected]}
                  numberOfLines={2}
                >
                  {preset.name}
                </Text>
                <Text style={[styles.presetGrams, isSelected && styles.presetGramsSelected]}>
                  {preset.gramsEquivalent}g
                </Text>
                {preset.visualGuide && (
                  <Text style={styles.presetGuide} numberOfLines={1}>
                    {preset.visualGuide.split(' ').slice(1).join(' ')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  infoButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  tooltipText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  presetCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 100,
    alignItems: 'center',
  },
  presetCardSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  presetContent: {
    alignItems: 'center',
    gap: 4,
  },
  presetIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  presetNameSelected: {
    color: '#10b981',
  },
  presetGrams: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6b7280',
  },
  presetGramsSelected: {
    color: '#10b981',
  },
  presetGuide: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
