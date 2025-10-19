interface CalorieCalculationInput {
  gender: string;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: string;
  goalType: string;
}

interface CalorieResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export function calculateCalorieTargets(input: CalorieCalculationInput): CalorieResult {
  const { gender, weightKg, heightCm, age, activityLevel, goalType } = input;

  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const tdee = bmr * multiplier;

  let targetCalories = tdee;
  if (goalType === 'lose_weight') {
    targetCalories = tdee - 500;
  } else if (goalType === 'gain_weight' || goalType === 'build_muscle') {
    targetCalories = tdee + 300;
  }

  targetCalories = Math.max(targetCalories, bmr * 1.2);

  let proteinPercentage = 30;
  let carbsPercentage = 40;
  let fatPercentage = 30;

  if (goalType === 'build_muscle') {
    proteinPercentage = 35;
    carbsPercentage = 40;
    fatPercentage = 25;
  } else if (goalType === 'lose_weight') {
    proteinPercentage = 35;
    carbsPercentage = 35;
    fatPercentage = 30;
  }

  const proteinGrams = Math.round((targetCalories * (proteinPercentage / 100)) / 4);
  const carbsGrams = Math.round((targetCalories * (carbsPercentage / 100)) / 4);
  const fatGrams = Math.round((targetCalories * (fatPercentage / 100)) / 9);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    proteinGrams,
    carbsGrams,
    fatGrams,
  };
}
