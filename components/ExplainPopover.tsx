import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { HelpCircle, Info, X, Sparkles } from 'lucide-react-native';

interface ExplainPopoverProps {
  explanation: string;
  modelVersion?: string;
  trigger?: 'icon' | 'text';
  triggerText?: string;
  position?: 'top' | 'bottom' | 'center';
}

export function ExplainPopover({
  explanation,
  modelVersion,
  trigger = 'icon',
  triggerText = 'Why?',
  position = 'center',
}: ExplainPopoverProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={trigger === 'icon' ? styles.iconTrigger : styles.textTrigger}
        onPress={() => setVisible(true)}
      >
        {trigger === 'icon' ? (
          <HelpCircle size={18} color="#6b7280" />
        ) : (
          <>
            <Sparkles size={14} color="#3b82f6" />
            <Text style={styles.triggerText}>{triggerText}</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={[
              styles.popover,
              position === 'top' && styles.popoverTop,
              position === 'bottom' && styles.popoverBottom,
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Info size={20} color="#3b82f6" />
                <Text style={styles.title}>AI Explanation</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.explanation}>{explanation}</Text>

              {modelVersion && (
                <View style={styles.modelInfo}>
                  <Text style={styles.modelLabel}>Analysis Model:</Text>
                  <Text style={styles.modelVersion}>{modelVersion}</Text>
                </View>
              )}

              <View style={styles.disclaimer}>
                <Text style={styles.disclaimerText}>
                  AI suggestions are estimates. Please verify and adjust as needed.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.buttonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

interface ExplainInlineProps {
  explanation: string;
  modelVersion?: string;
}

export function ExplainInline({ explanation, modelVersion }: ExplainInlineProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.inlineContainer}>
      <TouchableOpacity
        style={styles.inlineHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Sparkles size={14} color="#3b82f6" />
        <Text style={styles.inlineTitle}>AI Explanation</Text>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.inlineContent}>
          <Text style={styles.inlineExplanation}>{explanation}</Text>
          {modelVersion && (
            <Text style={styles.inlineModel}>Model: {modelVersion}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconTrigger: {
    padding: 4,
  },
  textTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popover: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  popoverTop: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  popoverBottom: {
    marginTop: 20,
    marginBottom: 'auto',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 300,
  },
  explanation: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  modelLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  modelVersion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  disclaimer: {
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  inlineContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  inlineTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  expandIcon: {
    fontSize: 10,
    color: '#6b7280',
  },
  inlineContent: {
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  inlineExplanation: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  inlineModel: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
