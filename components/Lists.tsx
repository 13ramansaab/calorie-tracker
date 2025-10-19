import { ReactNode } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';

interface RepeatingListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyComponent?: ReactNode;
  ListHeaderComponent?: ReactNode;
  ListFooterComponent?: ReactNode;
}

export function RepeatingList<T>({
  items,
  renderItem,
  keyExtractor,
  loading,
  refreshing,
  onRefresh,
  emptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
}: RepeatingListProps<T>) {
  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={
        keyExtractor || ((item, index) => `item-${index}`)
      }
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={emptyComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        ) : undefined
      }
    />
  );
}

interface PaginatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  onLoadMore: () => void;
  hasMore: boolean;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyComponent?: ReactNode;
}

export function PaginatedList<T>({
  items,
  renderItem,
  keyExtractor,
  onLoadMore,
  hasMore,
  loading,
  refreshing,
  onRefresh,
  emptyComponent,
}: PaginatedListProps<T>) {
  const handleEndReached = () => {
    if (hasMore && !loading) {
      onLoadMore();
    }
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#10b981" />
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={
        keyExtractor || ((item, index) => `item-${index}`)
      }
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={emptyComponent}
      ListFooterComponent={renderFooter}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  listContent: {
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
