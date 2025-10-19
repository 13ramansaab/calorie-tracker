import { ReactNode, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Send, Edit, Trash2, AlertCircle, Info, HelpCircle } from 'lucide-react-native';

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

interface FoodSuggestion {
  id: string;
  name: string;
  calories_per_100g: number;
}

interface AnalysisItemRowProps {
  name: string;
  portion: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  confidence?: number;
  suggestions?: FoodSuggestion[];
  explanation?: string;
  error?: string;
  editable?: boolean;
  isEdited?: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onSelectSuggestion?: (suggestion: FoodSuggestion) => void;
}

export function AnalysisItemRow({
  name,
  portion,
  calories,
  protein,
  carbs,
  fat,
  confidence,
  suggestions,
  explanation,
  error,
  editable = true,
  isEdited = false,
  onEdit,
  onRemove,
  onSelectSuggestion,
}: AnalysisItemRowProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const showConfidence = confidence !== undefined && confidence < 80;
  const hasLowConfidence = confidence !== undefined && confidence < 70;

  return (
    <View>
      <View style={[styles.itemRow, error && styles.itemRowError, isEdited && styles.itemRowEdited]}>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{name}</Text>
            {isEdited && (
              <View style={styles.editedBadge}>
                <Text style={styles.editedText}>Edited</Text>
              </View>
            )}
            {showConfidence && (
              <View style={[styles.confidenceBadge, hasLowConfidence && styles.confidenceBadgeLow]}>
                <AlertCircle size={12} color={hasLowConfidence ? '#ef4444' : '#f59e0b'} />
                <Text style={[styles.confidenceText, hasLowConfidence && styles.confidenceTextLow]}>
                  {confidence}%
                </Text>
              </View>
            )}
            {explanation && (
              <TouchableOpacity
                style={styles.explanationButton}
                onPress={() => setShowExplanation(true)}
              >
                <HelpCircle size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.itemStats}>
            <Text style={styles.itemPortion}>{portion}g</Text>
            <Text style={styles.itemDivider}>•</Text>
            <Text style={styles.itemCalories}>{Math.round(calories)} cal</Text>
          </View>
          {(protein !== undefined || carbs !== undefined || fat !== undefined) && (
            <View style={styles.itemMacros}>
              {protein !== undefined && (
                <Text style={styles.macroText}>P: {Math.round(protein)}g</Text>
              )}
              {carbs !== undefined && (
                <Text style={styles.macroText}>C: {Math.round(carbs)}g</Text>
              )}
              {fat !== undefined && (
                <Text style={styles.macroText}>F: {Math.round(fat)}g</Text>
              )}
            </View>
          )}
          {error && <Text style={styles.itemError}>{error}</Text>}
        </View>
        {editable && (
          <View style={styles.itemActions}>
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Edit size={18} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onRemove}>
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {suggestions && suggestions.length > 0 && hasLowConfidence && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsLabel}>Did you mean?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.suggestionsList}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionItem}
                  onPress={() => onSelectSuggestion?.(suggestion)}
                >
                  <Text style={styles.suggestionName}>{suggestion.name}</Text>
                  <Text style={styles.suggestionCals}>
                    {Math.round(suggestion.calories_per_100g * (portion / 100))} cal
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <Modal
        visible={showExplanation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExplanation(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowExplanation(false)}
        >
          <View style={styles.explanationModal}>
            <View style={styles.explanationHeader}>
              <Info size={20} color="#3b82f6" />
              <Text style={styles.explanationTitle}>AI Explanation</Text>
            </View>
            <Text style={styles.explanationText}>{explanation}</Text>
            <TouchableOpacity
              style={styles.explanationClose}
              onPress={() => setShowExplanation(false)}
            >
              <Text style={styles.explanationCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  itemRowEdited: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  editedBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 6,
  },
  editedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  confidenceBadgeLow: {
    backgroundColor: '#fee2e2',
  },
  confidenceTextLow: {
    color: '#ef4444',
  },
  explanationButton: {
    padding: 2,
  },
  itemMacros: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  macroText: {
    fontSize: 12,
    color: '#6b7280',
  },
  suggestionsSection: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionItem: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  suggestionCals: {
    fontSize: 12,
    color: '#10b981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  explanationModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
    width: '100%',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  explanationText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  explanationClose: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  explanationCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
