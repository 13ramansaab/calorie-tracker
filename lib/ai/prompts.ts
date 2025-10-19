export const SYSTEM_PROMPT = `You are a nutrition analysis AI specialized in Indian and global cuisines. Your task is to analyze food items from images or text descriptions and provide accurate nutritional estimates.

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "foods": [
    {
      "name": "string (food item name)",
      "portion": number (grams),
      "unit": "string (g, ml, piece, cup, etc)",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams),
      "confidence": number (0-100)
    }
  ],
  "notes": "string (optional context or uncertainties)"
}

GUIDELINES:
1. For Indian dishes, use common regional names (e.g., "Chole Bhature" not "chickpea curry with fried bread")
2. Default portions to typical serving sizes unless specified
3. Break down complex meals into individual components
4. Include cooking methods in names when it affects calories (e.g., "fried" vs "grilled")
5. Confidence should reflect:
   - 90-100: Clear view, standard dish
   - 70-89: Partial view or unusual preparation
   - 50-69: Unclear image or uncommon dish
   - Below 50: Very uncertain, needs human verification
6. For drinks, estimate volume in ml
7. Consider visible ingredients like oil, ghee, nuts that add calories
8. If multiple items on one plate, list each separately

INDIAN CUISINE CONTEXT:
- Account for common cooking methods: tadka, fried, gravy-based, dry
- Recognize regional variations (South Indian, North Indian, etc)
- Know common accompaniments (raita, chutney, papad)
- Understand portion norms (1 roti ~30g, 1 cup dal ~200ml)`;

export const VISION_PROMPT_TEMPLATE = (mealType?: string, region?: string) => `
Analyze this food image and identify all visible food items.

${mealType ? `Meal Type: ${mealType}` : ''}
${region ? `Regional Context: ${region}` : ''}

Provide detailed nutritional breakdown for each item.
`;

export const TEXT_PROMPT_TEMPLATE = (text: string, mealType?: string) => `
Parse this food description and estimate nutritional content:

"${text}"

${mealType ? `Meal Type: ${mealType}` : ''}

Handle:
- Quantities with units (2 rotis, 1 cup rice, 200g chicken)
- Menu items without portions (estimate typical serving)
- Cooking methods that affect nutrition
- Multiple items in one description
`;

export const INDIAN_PORTION_PRIORS: Record<string, number> = {
  roti: 30,
  chapati: 30,
  paratha: 50,
  naan: 70,
  'plain rice': 150,
  'steamed rice': 150,
  dal: 200,
  'dal fry': 200,
  sambar: 200,
  'chicken curry': 200,
  'paneer tikka': 100,
  dosa: 120,
  idli: 40,
  vada: 50,
  biryani: 250,
  'chole bhature': 250,
  'aloo paratha': 100,
};

export const INDIAN_SYNONYM_MAP: Record<string, string> = {
  'chapati': 'roti',
  'phulka': 'roti',
  'dal tadka': 'dal fry',
  'toor dal': 'dal',
  'masoor dal': 'dal',
  'chicken masala': 'chicken curry',
  'murgh curry': 'chicken curry',
  'paneer butter masala': 'paneer curry',
  'plain dosa': 'dosa',
  'masala dosa': 'dosa',
  'rava dosa': 'dosa',
};

export function buildPromptConfig(
  region?: string,
  dietaryPrefs?: string[],
  recentFoods?: string[]
): string {
  let contextAddons = '';

  if (region) {
    contextAddons += `\nRegional Focus: ${region} cuisine`;
  }

  if (dietaryPrefs && dietaryPrefs.length > 0) {
    contextAddons += `\nDietary Preferences: ${dietaryPrefs.join(', ')}`;
  }

  if (recentFoods && recentFoods.length > 0) {
    contextAddons += `\nRecent User Foods: ${recentFoods.slice(0, 5).join(', ')}`;
  }

  return contextAddons;
}
