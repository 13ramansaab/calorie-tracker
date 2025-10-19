import { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Send, Edit, Trash2, AlertCircle } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatFeedProps {
  messages: Message[];
  typing?: boolean;
}

export function ChatFeed({ messages, typing }: ChatFeedProps) {
  return (
    <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
      {messages.map((message) => (
        <View
          key={message.id}
          style={[
            styles.messageBubble,
            message.isUser ? styles.userMessage : styles.assistantMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              message.isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {message.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              message.isUser ? styles.userMessageTime : styles.assistantMessageTime,
            ]}
          >
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      ))}
      {typing && (
        <View style={[styles.messageBubble, styles.assistantMessage]}>
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

interface SuggestionChipsProps {
  suggestions: { label: string; action: () => void }[];
}

export function SuggestionChips({ suggestions }: SuggestionChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.suggestionsContainer}
    >
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          style={styles.suggestionChip}
          onPress={suggestion.action}
        >
          <Text style={styles.suggestionText}>{suggestion.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

interface AnalysisItemRowProps {
  name: string;
  portion: number;
  calories: number;
  confidence?: number;
  error?: string;
  onEdit: () => void;
  onRemove: () => void;
}

export function AnalysisItemRow({
  name,
  portion,
  calories,
  confidence,
  error,
  onEdit,
  onRemove,
}: AnalysisItemRowProps) {
  const showConfidence = confidence !== undefined && confidence < 80;

  return (
    <View style={[styles.itemRow, error && styles.itemRowError]}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{name}</Text>
          {showConfidence && (
            <View style={styles.confidenceBadge}>
              <AlertCircle size={12} color="#f59e0b" />
              <Text style={styles.confidenceText}>{confidence}%</Text>
            </View>
          )}
        </View>
        <View style={styles.itemStats}>
          <Text style={styles.itemPortion}>{portion}g</Text>
          <Text style={styles.itemDivider}>•</Text>
          <Text style={styles.itemCalories}>{Math.round(calories)} cal</Text>
        </View>
        {error && <Text style={styles.itemError}>{error}</Text>}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Edit size={18} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onRemove}>
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
  },
  assistantMessageText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 11,
  },
  userMessageTime: {
    color: '#ffffff',
    opacity: 0.8,
  },
  assistantMessageTime: {
    color: '#6b7280',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  suggestionChip: {
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemRowError: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  itemContent: {
    flex: 1,
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
  },
  itemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPortion: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemDivider: {
    fontSize: 14,
    color: '#d1d5db',
  },
  itemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  itemError: {
    fontSize: 12,
    color: '#ef4444',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
