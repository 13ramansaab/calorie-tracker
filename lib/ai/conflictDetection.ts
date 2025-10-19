import { DetectedFood, ConflictDetection } from '@/types/ai';
import { INDIAN_PORTION_PRIORS } from './prompts';

interface NoteParseResult {
  items: {
    name: string;
    quantity?: number;
    portion?: string;
  }[];
}

export function parseUserNote(note: string): NoteParseResult {
  const items: NoteParseResult['items'] = [];

  const itemPatterns = [
    /(\d+)\s*([a-z\s]+?)(?:\s*\+|,|$)/gi,
    /([a-z\s]+?)\s*\((\d+)\)/gi,
    /(\d+)\s*(?:piece|pieces|pc)\s+([a-z\s]+)/gi,
  ];

  let text = note.toLowerCase().trim();

  const quantityPattern = /(\d+)\s+(chapati|chapatis|roti|rotis|idli|idlis|dosa|dosas|paratha|parathas|vada|vadas)/gi;
  let match;

  while ((match = quantityPattern.exec(text)) !== null) {
    const quantity = parseInt(match[1], 10);
    const name = match[2].replace(/s$/, '');

    items.push({
      name: name === 'chapati' ? 'roti' : name,
      quantity,
    });
  }

  const portionPattern = /(small|medium|large|1|one)?\s*(bowl|katori|cup|plate)\s+(?:of\s+)?([a-z\s]+)/gi;
  while ((match = portionPattern.exec(text)) !== null) {
    const size = match[1] || 'medium';
    const container = match[2];
    const name = match[3].trim();

    items.push({
      name,
      portion: `${size} ${container}`,
    });
  }

  return { items };
}

export function detectConflicts(
  detectedFoods: DetectedFood[],
  userNote?: string
): ConflictDetection[] {
  if (!userNote || !userNote.trim()) {
    return [];
  }

  const conflicts: ConflictDetection[] = [];
  const parsedNote = parseUserNote(userNote);

  for (const noteItem of parsedNote.items) {
    const matchingFood = detectedFoods.find(
      (food) =>
        food.name.toLowerCase().includes(noteItem.name.toLowerCase()) ||
        noteItem.name.toLowerCase().includes(food.name.toLowerCase())
    );

    if (matchingFood && noteItem.quantity) {
      const unitWeight = INDIAN_PORTION_PRIORS[matchingFood.name.toLowerCase()] || 50;
      const noteExpectedGrams = noteItem.quantity * unitWeight;

      const deviation = Math.abs(matchingFood.portion - noteExpectedGrams) / noteExpectedGrams;

      if (deviation > 0.25) {
        conflicts.push({
          itemName: matchingFood.name,
          modelValue: Math.round(matchingFood.portion / unitWeight),
          noteValue: noteItem.quantity,
          conflictType: 'quantity',
        });
      }
    }
  }

  return conflicts;
}

export function applyNoteInfluence(
  detectedFoods: DetectedFood[],
  userNote?: string
): DetectedFood[] {
  if (!userNote || !userNote.trim()) {
    return detectedFoods.map((food) => ({
      ...food,
      noteInfluence: 'none',
    }));
  }

  const parsedNote = parseUserNote(userNote);
  const updatedFoods = detectedFoods.map((food) => {
    const noteItem = parsedNote.items.find(
      (item) =>
        food.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(food.name.toLowerCase())
    );

    if (!noteItem) {
      return { ...food, noteInfluence: 'none' as const };
    }

    let influence: 'none' | 'name' | 'portion' | 'both' = 'none';
    let updatedFood = { ...food };

    if (noteItem.quantity) {
      const unitWeight = INDIAN_PORTION_PRIORS[food.name.toLowerCase()] || 50;
      const noteExpectedGrams = noteItem.quantity * unitWeight;

      const ratio = noteExpectedGrams / food.portion;

      updatedFood.portion = noteExpectedGrams;
      updatedFood.calories = Math.round(food.calories * ratio);
      updatedFood.protein = Math.round(food.protein * ratio * 10) / 10;
      updatedFood.carbs = Math.round(food.carbs * ratio * 10) / 10;
      updatedFood.fat = Math.round(food.fat * ratio * 10) / 10;

      updatedFood.confidence = Math.min(food.confidence + 0.05, 1.0);

      influence = 'portion';
    }

    if (noteItem.portion) {
      influence = influence === 'portion' ? 'both' : 'name';
    }

    return {
      ...updatedFood,
      noteInfluence: influence,
    };
  });

  return updatedFoods;
}

export function shouldShowConflictUI(conflicts: ConflictDetection[]): boolean {
  return conflicts.length > 0;
}

export function resolveConflict(
  food: DetectedFood,
  selectedValue: string | number,
  source: 'model' | 'note'
): DetectedFood {
  if (typeof selectedValue !== 'number') {
    return food;
  }

  const unitWeight = INDIAN_PORTION_PRIORS[food.name.toLowerCase()] || 50;
  const newPortionGrams = selectedValue * unitWeight;
  const ratio = newPortionGrams / food.portion;

  return {
    ...food,
    portion: newPortionGrams,
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    noteInfluence: source === 'note' ? 'portion' : 'none',
  };
}
