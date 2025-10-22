import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useTabBarPadding() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const tabBarHeight = 80 + bottomInset;
  const fabOverflow = 32;
  const contentPadding = tabBarHeight + fabOverflow + 16;

  return {
    tabBarHeight,
    contentPadding,
    bottomInset,
    fabOverflow,
  };
}
