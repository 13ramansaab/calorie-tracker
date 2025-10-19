import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SectionCardProps {
  title?: string;
  children: ReactNode;
  style?: any;
}

export function SectionCard({ title, children, style }: SectionCardProps) {
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  content: {
    gap: 12,
  },
});
