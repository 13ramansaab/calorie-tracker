import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { DetectedFood } from '@/types/ai';

interface FoodItem {
  id: string;
  name: string;
  name_local?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  category?: string;
}

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: DetectedFood) => void;
  initialQuery?: string;
}

export function FoodSearchModal({
  visible,
  onClose,
  onSelect,
  initialQuery = '',
}: FoodSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionGrams, setPortionGrams] = useState('100');

  useEffect(() => {
    if (visible && initialQuery) {
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [visible, initialQuery]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .or(`name.ilike.%${query}%,name_local.ilike.%${query}%`)
        .eq('is_active', true)
        .order('name')
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (item: FoodItem) => {
    setSelectedFood(item);
  };

  const handleConfirm = () => {
    if (!selectedFood) return;

    const portion = parseFloat(portionGrams) || 100;
    const ratio = portion / 100;

    const detectedFood: DetectedFood = {
      name: selectedFood.name_local || selectedFood.name,
      portion: portion,
      calories: Math.round(selectedFood.calories_per_100g * ratio),
      protein: Math.round(selectedFood.protein_per_100g * ratio * 10) / 10,
      carbs: Math.round(selectedFood.carbs_per_100g * ratio * 10) / 10,
      fat: Math.round(selectedFood.fat_per_100g * ratio * 10) / 10,
      confidence: 1.0,
    };

    onSelect(detectedFood);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery(initialQuery);
    setResults([]);
    setSelectedFood(null);
    setPortionGrams('100');
    onClose();
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={[
        styles.foodItem,
        selectedFood?.id === item.id && styles.foodItemSelected,
      ]}
      onPress={() => handleSelectFood(item)}
      activeOpacity={0.7}
    >
      <View style={styles.foodItemHeader}>
        <Text style={styles.foodName}>{item.name_local || item.name}</Text>
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
      </View>
      <Text style={styles.foodMacros}>
        {item.calories_per_100g} cal • P: {item.protein_per_100g}g • C:{' '}
        {item.carbs_per_100g}g • F: {item.fat_per_100g}g (per 100g)
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Food</Text>
          <View style={styles.closeButton} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Search size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a food..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(searchQuery)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setResults([]);
                }}
              >
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderFoodItem}
            contentContainerStyle={styles.resultsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : searchQuery.trim() ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Search size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Search for foods</Text>
            <Text style={styles.emptySubtext}>
              Type to search from thousands of food items
            </Text>
          </View>
        )}

        {selectedFood && (
          <View style={styles.selectionCard}>
            <Text style={styles.selectionTitle}>Selected: {selectedFood.name}</Text>
            <View style={styles.portionRow}>
              <Text style={styles.portionLabel}>Portion (grams):</Text>
              <TextInput
                style={styles.portionInput}
                value={portionGrams}
                onChangeText={setPortionGrams}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleConfirm}>
              <Text style={styles.addButtonText}>Add to Meal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  resultsList: {
    paddingVertical: 8,
  },
  foodItem: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  foodItemSelected: {
    backgroundColor: '#d1fae5',
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  foodMacros: {
    fontSize: 13,
    color: '#6b7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  selectionCard: {
    padding: 24,
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 16,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  portionInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
