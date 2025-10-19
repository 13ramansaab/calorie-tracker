import { DetectedFood } from '@/types/ai';

export interface ConfidenceAssessment {
  level: 'high' | 'medium' | 'low' | 'very_low';
  color: string;
  action: 'accept' | 'review' | 'confirm' | 'reject';
  message: string;
  requiresUserAction: boolean;
  showSuggestions: boolean;
  showTypeahead: boolean;
}

export function assessItemConfidence(food: DetectedFood): ConfidenceAssessment {
  const score = food.confidence;

  if (score >= 80) {
    return {
      level: 'high',
      color: '#10b981',
      action: 'accept',
      message: 'High confidence - minor edits allowed',
      requiresUserAction: false,
      showSuggestions: false,
      showTypeahead: false,
    };
  }

  if (score >= 60 && score < 80) {
    return {
      level: 'medium',
      color: '#f59e0b',
      action: 'review',
      message: 'Medium confidence - please review',
      requiresUserAction: true,
      showSuggestions: true,
      showTypeahead: false,
    };
  }

  if (score >= 40 && score < 60) {
    return {
      level: 'low',
      color: '#ef4444',
      action: 'confirm',
      message: 'Low confidence - confirmation required',
      requiresUserAction: true,
      showSuggestions: true,
      showTypeahead: true,
    };
  }

  return {
    level: 'very_low',
    color: '#991b1b',
    action: 'reject',
    message: 'Very low confidence - manual entry recommended',
    requiresUserAction: true,
    showSuggestions: false,
    showTypeahead: true,
  };
}

export interface MappingConfidenceFactors {
  stringSimilarity: number;
  synonymMatch: boolean;
  regionMatch: boolean;
  dietMatch: boolean;
}

export function calculateMappingConfidence(
  factors: MappingConfidenceFactors
): number {
  let confidence = factors.stringSimilarity;

  if (factors.synonymMatch) {
    confidence += 15;
  }

  if (factors.regionMatch) {
    confidence += 10;
  }

  if (factors.dietMatch) {
    confidence += 5;
  }

  return Math.min(100, confidence);
}

export interface PortionConfidenceFactors {
  hasVisualReference: boolean;
  hasUserPrior: boolean;
  hasStandardPrior: boolean;
  portionDeviation: number;
}

export function calculatePortionConfidence(
  factors: PortionConfidenceFactors
): number {
  let confidence = 50;

  if (factors.hasVisualReference) {
    confidence += 20;
  }

  if (factors.hasUserPrior) {
    confidence += 15;
  }

  if (factors.hasStandardPrior) {
    confidence += 10;
  }

  if (factors.portionDeviation < 0.2) {
    confidence += 10;
  } else if (factors.portionDeviation > 0.5) {
    confidence -= 15;
  }

  return Math.max(0, Math.min(100, confidence));
}

export function shouldBlockSave(items: DetectedFood[]): {
  block: boolean;
  reason?: string;
} {
  if (items.length === 0) {
    return {
      block: true,
      reason: 'No items detected. Please add at least one food item.',
    };
  }

  const allLowConfidence = items.every((item) => item.confidence < 60);

  if (allLowConfidence && items.length > 0) {
    return {
      block: true,
      reason:
        'All items have low confidence. Please review and correct before saving.',
    };
  }

  return { block: false };
}

export function generateSaveWarning(items: DetectedFood[]): string | null {
  const lowConfidenceCount = items.filter((item) => item.confidence < 80).length;

  if (lowConfidenceCount === 0) {
    return null;
  }

  if (lowConfidenceCount === 1) {
    return '1 item has low confidence. You can still save, but please verify it looks correct.';
  }

  return `${lowConfidenceCount} items have low confidence. You can still save, but corrections are encouraged for better future predictions.`;
}

export interface FallbackStrategy {
  strategy: 'suggestions' | 'typeahead' | 'manual_entry' | 'conservative_estimate';
  message: string;
  defaultAction: string;
}

export function determineFallbackStrategy(
  confidence: number,
  hasSuggestions: boolean
): FallbackStrategy {
  if (confidence >= 60 && hasSuggestions) {
    return {
      strategy: 'suggestions',
      message: 'We found some similar items. Select the correct one:',
      defaultAction: 'show_suggestions',
    };
  }

  if (confidence >= 40 && confidence < 60) {
    return {
      strategy: 'typeahead',
      message: 'Please confirm or search for the correct food item:',
      defaultAction: 'show_typeahead',
    };
  }

  if (confidence < 40 && !hasSuggestions) {
    return {
      strategy: 'manual_entry',
      message: 'Unable to identify this item. Please search and add manually:',
      defaultAction: 'show_search',
    };
  }

  return {
    strategy: 'conservative_estimate',
    message:
      'Low confidence. Using conservative estimate. Please adjust portion if needed:',
    defaultAction: 'show_portion_picker',
  };
}

export function getConfidenceExplanation(
  food: DetectedFood,
  factors: {
    modelConfidence: number;
    mappingConfidence: number;
    portionConfidence: number;
  }
): string {
  const explanations: string[] = [];

  if (factors.modelConfidence < 70) {
    explanations.push(
      'AI model had difficulty identifying this dish from the image'
    );
  }

  if (factors.mappingConfidence < 70) {
    explanations.push(
      'Could not find exact match in food database - using closest approximation'
    );
  }

  if (factors.portionConfidence < 60) {
    explanations.push(
      'Portion size estimated - please verify it matches what you ate'
    );
  }

  if (explanations.length === 0) {
    return 'High confidence identification based on clear image, database match, and typical portion size.';
  }

  return explanations.join('. ') + '.';
}

export function shouldShowAlternatives(
  confidence: number,
  alternativesCount: number
): boolean {
  return confidence < 80 && alternativesCount > 0;
}

export function sortAlternativesByRelevance(
  alternatives: Array<{ name: string; confidence: number }>,
  userPrefs?: {
    region?: string;
    dietaryPrefs?: string[];
    recentFoods?: string[];
  }
): Array<{ name: string; confidence: number; score: number }> {
  return alternatives
    .map((alt) => {
      let score = alt.confidence;

      if (userPrefs?.recentFoods?.includes(alt.name)) {
        score += 15;
      }

      return {
        ...alt,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
