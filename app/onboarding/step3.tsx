import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProgressBar } from '@/components/ProgressBar';
import { ChevronLeft } from 'lucide-react-native';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface ActivityOption {
  id: ActivityLevel;
  title: string;
  description: string;
}

const activityOptions: ActivityOption[] = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little or no exercise, desk job',
  },
  {
    id: 'light',
    title: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
  },
  {
    id: 'moderate',
    title: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
  },
  {
    id: 'active',
    title: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
  },
  {
    id: 'very_active',
    title: 'Extremely Active',
    description: 'Very hard exercise, physical job or training twice/day',
  },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel | null>(null);

  const handleNext = () => {
    if (!selectedActivity) return;

    router.push({
      pathname: '/onboarding/step4',
      params: {
        ...params,
        activityLevel: selectedActivity,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ProgressBar current={3} total={5} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>How active are you?</Text>
            <Text style={styles.subtitle}>
              This helps us calculate your daily calorie needs
            </Text>
          </View>

          <View style={styles.activityList}>
            {activityOptions.map((activity) => {
              const isSelected = selectedActivity === activity.id;

              return (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityCard,
                    isSelected && styles.activityCardActive,
                  ]}
                  onPress={() => setSelectedActivity(activity.id)}
                >
                  <View style={styles.activityContent}>
                    <Text
                      style={[
                        styles.activityTitle,
                        isSelected && styles.activityTitleActive,
                      ]}
                    >
                      {activity.title}
                    </Text>
                    <Text
                      style={[
                        styles.activityDescription,
                        isSelected && styles.activityDescriptionActive,
                      ]}
                    >
                      {activity.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterActive,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
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
            !selectedActivity && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedActivity}
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
  activityList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  activityCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  activityContent: {
    flex: 1,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  activityTitleActive: {
    color: '#047857',
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  activityDescriptionActive: {
    color: '#059669',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#10b981',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
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
