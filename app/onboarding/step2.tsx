import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProgressBar } from '@/components/ProgressBar';
import { ChevronLeft, TrendingDown, TrendingUp, Target, Dumbbell } from 'lucide-react-native';

type GoalType = 'lose_weight' | 'gain_weight' | 'maintain' | 'build_muscle';

interface GoalOption {
  id: GoalType;
  title: string;
  description: string;
  icon: any;
}

const goalOptions: GoalOption[] = [
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    description: 'Reduce body weight with a calorie deficit',
    icon: TrendingDown,
  },
  {
    id: 'gain_weight',
    title: 'Gain Weight',
    description: 'Increase body weight with a calorie surplus',
    icon: TrendingUp,
  },
  {
    id: 'maintain',
    title: 'Maintain Weight',
    description: 'Keep your current weight stable',
    icon: Target,
  },
  {
    id: 'build_muscle',
    title: 'Build Muscle',
    description: 'Gain muscle mass with protein focus',
    icon: Dumbbell,
  },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);

  const handleNext = () => {
    if (!selectedGoal) return;

    router.push({
      pathname: '/onboarding/step3',
      params: {
        ...params,
        goalType: selectedGoal,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ProgressBar current={2} total={5} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>What's your goal?</Text>
            <Text style={styles.subtitle}>
              Choose the primary goal that matters most to you
            </Text>
          </View>

          <View style={styles.goalGrid}>
            {goalOptions.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoal === goal.id;

              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.goalCard, isSelected && styles.goalCardActive]}
                  onPress={() => setSelectedGoal(goal.id)}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && styles.iconContainerActive,
                    ]}
                  >
                    <Icon
                      size={28}
                      color={isSelected ? '#ffffff' : '#10b981'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.goalTitle,
                      isSelected && styles.goalTitleActive,
                    ]}
                  >
                    {goal.title}
                  </Text>
                  <Text
                    style={[
                      styles.goalDescription,
                      isSelected && styles.goalDescriptionActive,
                    ]}
                  >
                    {goal.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedGoal && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedGoal}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  goalGrid: {
    gap: 16,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  goalCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainerActive: {
    backgroundColor: '#10b981',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  goalTitleActive: {
    color: '#047857',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  goalDescriptionActive: {
    color: '#059669',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nextButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
