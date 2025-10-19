import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';

interface ChipsProps {
  options: { label: string; value: string }[];
  selected: string[];
  onSelect: (value: string) => void;
  multi?: boolean;
}

export function Chips({ options, selected, onSelect, multi = false }: ChipsProps) {
  const handleSelect = (value: string) => {
    if (multi) {
      onSelect(value);
    } else {
      onSelect(value);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => handleSelect(option.value)}
          >
            {isSelected && multi && (
              <Check size={16} color="#ffffff" style={styles.checkIcon} />
            )}
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

interface FilterChipsProps {
  activeFilters: string[];
  onRemove: (filter: string) => void;
}

export function FilterChips({ activeFilters, onRemove }: FilterChipsProps) {
  if (activeFilters.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {activeFilters.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={styles.filterChip}
          onPress={() => onRemove(filter)}
        >
          <Text style={styles.filterChipText}>{filter}</Text>
          <Text style={styles.filterChipClose}>×</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  checkIcon: {
    marginRight: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  filterChipClose: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3b82f6',
    lineHeight: 20,
  },
});
