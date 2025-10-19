import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Filter } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_COUNT = 3;
const GAP = 2;
const IMAGE_SIZE = (SCREEN_WIDTH - GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

interface PhotoItem {
  id: string;
  photo_url: string;
  created_at: string;
  meal_type: string | null;
  total_calories: number | null;
}

interface MonthSection {
  month: string;
  photos: PhotoItem[];
}

type MealTypeFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function GalleryScreen() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [sections, setSections] = useState<MonthSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<MealTypeFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const ITEMS_PER_PAGE = 50;
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (user) {
      loadPhotos(true);
    }
  }, [user, filter]);

  const loadPhotos = async (reset: boolean = false) => {
    if (!user) return;

    try {
      if (reset) {
        setIsLoading(true);
        setOffset(0);
        setPhotos([]);
      } else {
        setIsLoadingMore(true);
      }

      let query = supabase
        .from('meal_logs')
        .select('id, photo_url, created_at, meal_type, total_calories')
        .eq('user_id', user.id)
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: false })
        .range(reset ? 0 : offset, reset ? ITEMS_PER_PAGE - 1 : offset + ITEMS_PER_PAGE - 1);

      if (filter !== 'all') {
        query = query.eq('meal_type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading photos:', error);
        return;
      }

      if (data) {
        const newPhotos = reset ? data : [...photos, ...data];
        setPhotos(newPhotos);
        setOffset(reset ? ITEMS_PER_PAGE : offset + ITEMS_PER_PAGE);
        setHasMore(data.length === ITEMS_PER_PAGE);

        groupPhotosByMonth(newPhotos);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const groupPhotosByMonth = (photosList: PhotoItem[]) => {
    const grouped = photosList.reduce(
      (acc, photo) => {
        const date = new Date(photo.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthLabel,
            photos: [],
          };
        }

        acc[monthKey].photos.push(photo);
        return acc;
      },
      {} as Record<string, MonthSection>
    );

    setSections(Object.values(grouped));
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadPhotos(false);
    }
  };

  const handlePhotoPress = (photoId: string) => {
    router.push(`/photo/${photoId}`);
  };

  const renderPhoto = useCallback(
    ({ item }: { item: PhotoItem }) => (
      <TouchableOpacity
        onPress={() => handlePhotoPress(item.id)}
        style={styles.photoContainer}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.photo_url }} style={styles.photo} resizeMode="cover" />
        {item.total_calories !== null && (
          <View style={styles.caloriesBadge}>
            <Text style={styles.caloriesText}>{Math.round(item.total_calories)}</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    []
  );

  const renderSection = ({ item }: { item: MonthSection }) => (
    <View style={styles.section}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthText}>{item.month}</Text>
        <Text style={styles.countText}>{item.photos.length} photos</Text>
      </View>
      <View style={styles.grid}>
        {item.photos.map((photo) => (
          <View key={photo.id}>{renderPhoto({ item: photo })}</View>
        ))}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  };

  const FilterButton = ({
    label,
    value,
  }: {
    label: string;
    value: MealTypeFilter;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => {
        setFilter(value);
        setShowFilters(false);
      }}
    >
      <Text
        style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Gallery</Text>
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterContainer}>
          <FilterButton label="All" value="all" />
          <FilterButton label="Breakfast" value="breakfast" />
          <FilterButton label="Lunch" value="lunch" />
          <FilterButton label="Dinner" value="dinner" />
          <FilterButton label="Snack" value="snack" />
        </View>
      )}

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySubtext}>
            Start logging meals with photos to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(item) => item.month}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  filterIconButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  countText: {
    fontSize: 14,
    color: '#6b7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: GAP,
  },
  photoContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  caloriesBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  caloriesText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
