export interface UnitPreset {
  id: string;
  name: string;
  gramsEquivalent: number;
  category: 'volume' | 'count' | 'size';
  commonFor: string[];
  visualGuide?: string;
}

export const INDIAN_UNIT_PRESETS: UnitPreset[] = [
  {
    id: 'katori_small',
    name: 'Small Katori',
    gramsEquivalent: 100,
    category: 'volume',
    commonFor: ['dal', 'sabzi', 'curry', 'rice', 'curd'],
    visualGuide: '🥣 Small bowl (½ cup)',
  },
  {
    id: 'katori_medium',
    name: 'Medium Katori',
    gramsEquivalent: 150,
    category: 'volume',
    commonFor: ['dal', 'sabzi', 'curry', 'rice', 'curd'],
    visualGuide: '🥣 Medium bowl (¾ cup)',
  },
  {
    id: 'katori_large',
    name: 'Large Katori',
    gramsEquivalent: 200,
    category: 'volume',
    commonFor: ['dal', 'sabzi', 'curry', 'rice', 'curd'],
    visualGuide: '🥣 Large bowl (1 cup)',
  },
  {
    id: 'cup',
    name: 'Cup',
    gramsEquivalent: 240,
    category: 'volume',
    commonFor: ['milk', 'tea', 'coffee', 'juice', 'water'],
    visualGuide: '☕ Standard cup',
  },
  {
    id: 'glass',
    name: 'Glass',
    gramsEquivalent: 250,
    category: 'volume',
    commonFor: ['milk', 'juice', 'water', 'lassi'],
    visualGuide: '🥛 Standard glass',
  },
  {
    id: 'plate_small',
    name: 'Small Plate',
    gramsEquivalent: 150,
    category: 'volume',
    commonFor: ['rice', 'pulao', 'biryani'],
    visualGuide: '🍽️ Small serving',
  },
  {
    id: 'plate_medium',
    name: 'Medium Plate',
    gramsEquivalent: 250,
    category: 'volume',
    commonFor: ['rice', 'pulao', 'biryani'],
    visualGuide: '🍽️ Medium serving',
  },
  {
    id: 'plate_large',
    name: 'Full Plate',
    gramsEquivalent: 350,
    category: 'volume',
    commonFor: ['rice', 'pulao', 'biryani'],
    visualGuide: '🍽️ Full plate',
  },
  {
    id: 'chapati_small',
    name: 'Small Roti/Chapati',
    gramsEquivalent: 30,
    category: 'count',
    commonFor: ['chapati', 'roti', 'phulka'],
    visualGuide: '🫓 15cm diameter',
  },
  {
    id: 'chapati_medium',
    name: 'Medium Roti/Chapati',
    gramsEquivalent: 40,
    category: 'count',
    commonFor: ['chapati', 'roti', 'phulka'],
    visualGuide: '🫓 18cm diameter',
  },
  {
    id: 'chapati_large',
    name: 'Large Roti/Chapati',
    gramsEquivalent: 50,
    category: 'count',
    commonFor: ['chapati', 'roti', 'phulka'],
    visualGuide: '🫓 20cm diameter',
  },
  {
    id: 'paratha',
    name: 'Paratha',
    gramsEquivalent: 80,
    category: 'count',
    commonFor: ['paratha', 'aloo paratha', 'stuffed paratha'],
    visualGuide: '🫓 Regular paratha',
  },
  {
    id: 'idli',
    name: 'Idli',
    gramsEquivalent: 40,
    category: 'count',
    commonFor: ['idli'],
    visualGuide: '⚪ One idli',
  },
  {
    id: 'dosa',
    name: 'Dosa',
    gramsEquivalent: 120,
    category: 'count',
    commonFor: ['dosa', 'masala dosa'],
    visualGuide: '🥞 Regular dosa',
  },
  {
    id: 'samosa',
    name: 'Samosa',
    gramsEquivalent: 80,
    category: 'count',
    commonFor: ['samosa'],
    visualGuide: '🥟 One samosa',
  },
  {
    id: 'vada',
    name: 'Vada',
    gramsEquivalent: 50,
    category: 'count',
    commonFor: ['vada', 'medu vada'],
    visualGuide: '🍩 One vada',
  },
  {
    id: 'piece_fruit',
    name: 'Piece (Fruit)',
    gramsEquivalent: 100,
    category: 'count',
    commonFor: ['apple', 'banana', 'orange', 'guava'],
    visualGuide: '🍎 Medium fruit',
  },
  {
    id: 'ladoo',
    name: 'Ladoo',
    gramsEquivalent: 40,
    category: 'count',
    commonFor: ['ladoo', 'besan ladoo', 'motichoor ladoo'],
    visualGuide: '🍬 One ladoo',
  },
  {
    id: 'spoon_serving',
    name: 'Serving Spoon',
    gramsEquivalent: 60,
    category: 'volume',
    commonFor: ['dal', 'sabzi', 'curry', 'rice'],
    visualGuide: '🥄 Large spoon',
  },
  {
    id: 'spoon_table',
    name: 'Tablespoon',
    gramsEquivalent: 15,
    category: 'volume',
    commonFor: ['ghee', 'oil', 'chutney', 'pickle'],
    visualGuide: '🥄 1 tbsp',
  },
  {
    id: 'spoon_tea',
    name: 'Teaspoon',
    gramsEquivalent: 5,
    category: 'volume',
    commonFor: ['sugar', 'salt', 'spices'],
    visualGuide: '🥄 1 tsp',
  },
  {
    id: 'handful',
    name: 'Handful',
    gramsEquivalent: 30,
    category: 'volume',
    commonFor: ['nuts', 'peanuts', 'popcorn', 'murukku'],
    visualGuide: '✋ One handful',
  },
];

export function getUnitPresetsByFood(foodName: string): UnitPreset[] {
  const lowerFood = foodName.toLowerCase();
  return INDIAN_UNIT_PRESETS.filter((preset) =>
    preset.commonFor.some((food) => lowerFood.includes(food) || food.includes(lowerFood))
  );
}

export function getUnitPresetByName(name: string): UnitPreset | undefined {
  return INDIAN_UNIT_PRESETS.find((preset) => preset.name.toLowerCase() === name.toLowerCase());
}

export function convertToGrams(amount: number, unitName: string): number {
  const preset = getUnitPresetByName(unitName);
  if (preset) {
    return amount * preset.gramsEquivalent;
  }
  return amount;
}

export function suggestUnit(foodName: string, gramsAmount: number): string {
  const presets = getUnitPresetsByFood(foodName);

  if (presets.length === 0) {
    return `${gramsAmount}g`;
  }

  let closest = presets[0];
  let closestDiff = Math.abs(gramsAmount - closest.gramsEquivalent);

  presets.forEach((preset) => {
    const diff = Math.abs(gramsAmount - preset.gramsEquivalent);
    if (diff < closestDiff) {
      closest = preset;
      closestDiff = diff;
    }
  });

  const count = Math.round(gramsAmount / closest.gramsEquivalent);
  return count > 1
    ? `${count} × ${closest.name}`
    : closest.name;
}

export const HINDI_FOOD_TERMS: Record<string, string> = {
  roti: 'chapati',
  phulka: 'chapati',
  anda: 'egg',
  ande: 'eggs',
  dahi: 'curd',
  doodh: 'milk',
  chawal: 'rice',
  sabzi: 'vegetable curry',
  subzi: 'vegetable curry',
  aloo: 'potato',
  pyaz: 'onion',
  tamatar: 'tomato',
  palak: 'spinach',
  methi: 'fenugreek',
  gobhi: 'cauliflower',
  bhindi: 'okra',
  baingan: 'eggplant',
  gajar: 'carrot',
  matar: 'peas',
  rajma: 'kidney beans',
  chole: 'chickpeas',
  chana: 'chickpeas',
  moong: 'mung beans',
  masoor: 'lentils',
  toor: 'pigeon peas',
  urad: 'black lentils',
  paneer: 'cottage cheese',
  murgh: 'chicken',
  murg: 'chicken',
  machli: 'fish',
  gosht: 'meat',
  mutton: 'mutton',
  katori: 'bowl',
  gilas: 'glass',
  chammach: 'spoon',
  thali: 'plate',
};

export function translateHindiTerm(hindiTerm: string): string {
  const lower = hindiTerm.toLowerCase().trim();
  return HINDI_FOOD_TERMS[lower] || hindiTerm;
}

export function parseIndianFoodNote(note: string): {
  originalNote: string;
  translatedNote: string;
  detectedUnits: string[];
} {
  const words = note.split(/\s+/);
  const translatedWords: string[] = [];
  const detectedUnits: string[] = [];

  words.forEach((word) => {
    const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
    const translation = translateHindiTerm(cleaned);

    if (translation !== cleaned) {
      translatedWords.push(translation);
      detectedUnits.push(word);
    } else {
      translatedWords.push(word);
    }
  });

  return {
    originalNote: note,
    translatedNote: translatedWords.join(' '),
    detectedUnits,
  };
}
