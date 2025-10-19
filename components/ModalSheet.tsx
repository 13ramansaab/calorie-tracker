import { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ModalSheetProps {
  visible: boolean;
  title: string;
  children: ReactNode;
  primaryLabel?: string;
  primaryAction?: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  onClose: () => void;
}

export function ModalSheet({
  visible,
  title,
  children,
  primaryLabel,
  primaryAction,
  primaryDisabled,
  secondaryLabel,
  secondaryAction,
  onClose,
}: ModalSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {children}
        </ScrollView>

        {(primaryLabel || secondaryLabel) && (
          <View style={styles.footer}>
            {secondaryLabel && secondaryAction && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={secondaryAction}
              >
                <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
              </TouchableOpacity>
            )}
            {primaryLabel && primaryAction && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  primaryDisabled && styles.primaryButtonDisabled,
                ]}
                onPress={primaryAction}
                disabled={primaryDisabled}
              >
                <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
              </TouchableOpacity>
            )}
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
  title: {
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
