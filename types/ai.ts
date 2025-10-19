export interface DetectedFood {
  name: string;
  portion: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  noteInfluence?: 'none' | 'name' | 'portion' | 'both';
  foodId?: string;
}

export interface AnalysisResponse {
  foods: DetectedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  overallConfidence: number;
  modelVersion: string;
  timestamp: string;
  notes?: string;
}

export interface AnalysisInput {
  type: 'photo' | 'text' | 'mixed';
  photoUri?: string;
  text?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  userContext?: {
    region?: string;
    dietaryPrefs?: string[];
    recentFoods?: string[];
    auxText?: string;
  };
}

export interface CorrectionData {
  analysisId: string;
  userId: string;
  originalFood: DetectedFood;
  correctedFood: DetectedFood;
  correctionType: 'name' | 'portion' | 'macros';
  timestamp: string;
}

export interface UsageLimit {
  photoAnalysesPerDay: number;
  textAnalysesPerDay: number;
  currentPhotoCount: number;
  currentTextCount: number;
  resetAt: string;
}

export interface PromptConfig {
  systemPrompt: string;
  regionBias?: string;
  dietaryContext?: string;
  portionPriors?: Record<string, number>;
  synonymMap?: Record<string, string>;
}

export interface ConflictDetection {
  itemName: string;
  modelValue: string | number;
  noteValue: string | number;
  conflictType: 'quantity' | 'portion' | 'name';
}

export interface AnalysisEvent {
  eventType: 'note_entered' | 'note_used_in_analysis' | 'note_conflict_shown' | 'conflict_choice_selected';
  eventData: Record<string, any>;
  timestamp: string;
}
