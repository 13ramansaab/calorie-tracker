import { DetectedFood } from '@/types/ai';

export interface ContradictionResult {
  isContradictory: boolean;
  reason?: string;
  modelItem: string;
  noteItem: string;
  confidence: 'high' | 'medium' | 'low';
}

export function detectContradictoryNote(
  detectedFoods: DetectedFood[],
  userNote: string
): ContradictionResult | null {
  const noteLower = userNote.toLowerCase().trim();

  const contradictionPairs: Record<string, string[]> = {
    naan: ['chapati', 'roti', 'paratha'],
    chapati: ['naan', 'kulcha'],
    roti: ['naan', 'kulcha'],
    paratha: ['chapati', 'roti', 'naan'],
    dosa: ['idli', 'uttapam'],
    idli: ['dosa', 'vada'],
    rice: ['roti', 'naan', 'chapati'],
    paneer: ['chicken', 'mutton', 'fish', 'egg'],
    chicken: ['paneer', 'tofu'],
  };

  for (const food of detectedFoods) {
    const foodLower = food.name.toLowerCase();

    for (const [modelTerm, noteMismatchTerms] of Object.entries(contradictionPairs)) {
      if (foodLower.includes(modelTerm)) {
        for (const noteTerm of noteMismatchTerms) {
          if (noteLower.includes(noteTerm)) {
            const confidence = food.confidence >= 0.8 ? 'high' : food.confidence >= 0.6 ? 'medium' : 'low';

            return {
              isContradictory: true,
              reason: `Photo shows ${modelTerm} but note mentions ${noteTerm}`,
              modelItem: modelTerm,
              noteItem: noteTerm,
              confidence,
            };
          }
        }
      }
    }
  }

  return null;
}

export function validateNoteLength(note: string, maxLength: number = 140): {
  isValid: boolean;
  trimmedNote?: string;
  warning?: string;
} {
  const trimmed = note.trim();

  if (trimmed.length === 0) {
    return { isValid: true };
  }

  if (trimmed.length <= maxLength) {
    return { isValid: true, trimmedNote: trimmed };
  }

  const truncated = trimmed.substring(0, maxLength);

  return {
    isValid: false,
    trimmedNote: truncated,
    warning: 'Keep it short—counts and units work best.',
  };
}

export function shouldMarkNoteConflict(
  detectedFoods: DetectedFood[],
  userNote: string,
  userResolution?: 'model' | 'note'
): boolean {
  const contradiction = detectContradictoryNote(detectedFoods, userNote);

  if (!contradiction || !contradiction.isContradictory) {
    return false;
  }

  if (userResolution === 'note') {
    return false;
  }

  if (userResolution === 'model') {
    return true;
  }

  if (contradiction.confidence === 'high') {
    return true;
  }

  return false;
}

export function handleNonIndianEntry(
  detectedFoods: DetectedFood[],
  userNote: string
): { allowEntry: boolean; shouldMapAnyway: boolean } {
  const nonIndianTerms = [
    'pizza', 'burger', 'pasta', 'sandwich', 'salad', 'steak',
    'sushi', 'ramen', 'taco', 'burrito', 'croissant', 'bagel',
  ];

  const noteLower = userNote.toLowerCase();
  const hasNonIndianTerm = nonIndianTerms.some((term) => noteLower.includes(term));

  return {
    allowEntry: true,
    shouldMapAnyway: true,
  };
}

export interface PrivacySettings {
  includeNotesInExport: boolean;
  showNotesInSharedScreenshots: boolean;
}

export function applyPrivacyPolicy(
  note: string,
  settings: PrivacySettings,
  context: 'export' | 'share'
): string | null {
  if (context === 'export' && settings.includeNotesInExport) {
    return note;
  }

  if (context === 'share' && settings.showNotesInSharedScreenshots) {
    return note;
  }

  return null;
}

export function sanitizeNoteForStorage(note: string): string {
  let sanitized = note.trim();

  sanitized = sanitized.replace(/[^\w\s\u0900-\u097F+\-(),.]/g, '');

  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

export function extractStructuredData(note: string): {
  quantities: Array<{ count: number; item: string }>;
  units: Array<{ unit: string; item: string }>;
  sizes: Array<{ size: string; item: string }>;
} {
  const quantities: Array<{ count: number; item: string }> = [];
  const units: Array<{ unit: string; item: string }> = [];
  const sizes: Array<{ size: string; item: string }> = [];

  const quantityPattern = /(\d+)\s+([a-z]+)/gi;
  let match;
  while ((match = quantityPattern.exec(note)) !== null) {
    quantities.push({
      count: parseInt(match[1], 10),
      item: match[2],
    });
  }

  const unitPattern = /(bowl|cup|katori|plate|glass|spoon)\s+([a-z\s]+)/gi;
  while ((match = unitPattern.exec(note)) !== null) {
    units.push({
      unit: match[1],
      item: match[2].trim(),
    });
  }

  const sizePattern = /(small|medium|large|big|chota|bada)\s+([a-z\s]+)/gi;
  while ((match = sizePattern.exec(note)) !== null) {
    sizes.push({
      size: match[1],
      item: match[2].trim(),
    });
  }

  return { quantities, units, sizes };
}
