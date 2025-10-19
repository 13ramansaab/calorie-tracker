import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MessageSquare, ChevronDown, ChevronUp, Edit2, TrendingUp } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ContextBannerProps {
  text: string;
  onEdit?: () => void;
  confidenceImpact?: number;
  variant?: 'default' | 'detail';
  collapsible?: boolean;
}

export function ContextBanner({
  text,
  onEdit,
  confidenceImpact,
  variant = 'default',
  collapsible = true,
}: ContextBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    if (!collapsible) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const hasImpact = confidenceImpact !== undefined && confidenceImpact > 0;
  const isDetailVariant = variant === 'detail';

  return (
    <View
      style={[
        styles.container,
        isDetailVariant && styles.containerDetail,
      ]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={collapsible ? 0.7 : 1}
        disabled={!collapsible}
      >
        <View style={styles.titleRow}>
          <MessageSquare size={18} color={isDetailVariant ? '#059669' : '#10b981'} />
          <Text style={[styles.title, isDetailVariant && styles.titleDetail]}>
            {isDetailVariant ? 'Your Note' : 'Your Context'}
          </Text>
          {hasImpact && (
            <View style={styles.impactBadge}>
              <TrendingUp size={12} color="#059669" />
              <Text style={styles.impactText}>+{confidenceImpact}%</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {onEdit && isExpanded && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 size={16} color="#10b981" />
            </TouchableOpacity>
          )}
          {collapsible && (
            isExpanded ? (
              <ChevronUp size={18} color="#6b7280" />
            ) : (
              <ChevronDown size={18} color="#6b7280" />
            )
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <Text style={[styles.text, isDetailVariant && styles.textDetail]}>
            {text}
          </Text>

          {hasImpact && (
            <View style={styles.impactNote}>
              <Text style={styles.impactNoteText}>
                Used your note to refine estimates.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
    overflow: 'hidden',
  },
  containerDetail: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  titleDetail: {
    fontSize: 14,
    color: '#059669',
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
  },
  impactText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  text: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  textDetail: {
    fontSize: 13,
    color: '#047857',
  },
  impactNote: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
  },
  impactNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
});
