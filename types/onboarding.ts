export interface OnboardingData {
  fullName: string;
  dateOfBirth: Date | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  goalType: 'lose_weight' | 'gain_weight' | 'maintain' | 'build_muscle' | null;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  targetWeightKg: number | null;
  timelineWeeks: number | null;
  dietaryPattern: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'pescatarian' | null;
  allergies: string[];
}

export const initialOnboardingData: OnboardingData = {
  fullName: '',
  dateOfBirth: null,
  gender: null,
  heightCm: null,
  currentWeightKg: null,
  goalType: null,
  activityLevel: null,
  targetWeightKg: null,
  timelineWeeks: null,
  dietaryPattern: null,
  allergies: [],
};
