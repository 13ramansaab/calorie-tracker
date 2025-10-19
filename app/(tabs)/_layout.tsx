import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, Camera, Search, TrendingUp, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const routes = [
    { key: 'index', name: 'Home', icon: Home, path: '/(tabs)' },
    { key: 'search', name: 'Search', icon: Search, path: '/(tabs)/search' },
    { key: 'log', name: 'Log', icon: Camera, path: '/(tabs)/log', isFAB: true },
    { key: 'progress', name: 'Progress', icon: TrendingUp, path: '/(tabs)/progress' },
    { key: 'profile', name: 'Profile', icon: User, path: '/(tabs)/profile' },
  ];

  const handleTabPress = (path: string, isFAB?: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(path);
  };

  const isActive = (path: string) => {
    if (path === '/(tabs)') {
      return pathname === '/(tabs)' || pathname === '/';
    }
    return pathname === path;
  };

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
          height: 80 + bottomPadding,
        },
      ]}
    >
      <View style={styles.tabBar}>
        {routes.map((route, index) => {
          const Icon = route.icon;
          const active = isActive(route.path);

          if (route.isFAB) {
            return (
              <TouchableOpacity
                key={route.key}
                style={styles.fabContainer}
                onPress={() => handleTabPress(route.path, true)}
                accessibilityRole="button"
                accessibilityLabel={route.name}
                accessibilityState={{ selected: active }}
              >
                <View style={styles.fab}>
                  <Icon size={28} color="#ffffff" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={() => handleTabPress(route.path)}
              accessibilityRole="button"
              accessibilityLabel={route.name}
              accessibilityState={{ selected: active }}
            >
              <Icon
                size={24}
                color={active ? '#10b981' : '#9ca3af'}
                strokeWidth={active ? 2.5 : 2}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="gallery" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 48,
    minWidth: 48,
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginTop: -32,
    minHeight: 48,
    minWidth: 48,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
