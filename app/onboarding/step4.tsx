import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProgressBar } from '@/components/ProgressBar';
import { ChevronLeft, Info } from 'lucide-react-native';

export default function OnboardingStep4() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [targetWeight, setTargetWeight] = useState('');
  const [timeline, setTimeline] = useState('12');
  const [paceMessage, setPaceMessage] = useState('');

  const currentWeight = parseFloat(params.currentWeightKg as string);
  const goalType = params.goalType as string;

  useEffect(() => {
    if (targetWeight && timeline) {
      const target = parseFloat(targetWeight);
      const weeks = parseInt(timeline);

      if (!isNaN(target) && !isNaN(weeks) && weeks > 0) {
        const weightDiff = Math.abs(currentWeight - target);
        const kgPerWeek = weightDiff / weeks;

        if (kgPerWeek > 1) {
          setPaceMessage('This pace is aggressive. Consider a slower, more sustainable approach.');
        } else if (kgPerWeek > 0.5) {
          setPaceMessage('This is a healthy, sustainable pace. Great choice!');
        } else if (kgPerWeek > 0) {
          setPaceMessage('This is a gentle pace. You may reach your goal faster.');
        } else {
          setPaceMessage('');
        }
      }
    }
  }, [targetWeight, timeline, currentWeight]);

  const isValid = targetWeight && timeline && parseFloat(targetWeight) > 0;

  const handleNext = () => {
    if (!isValid) return;

    router.push({
      pathname: '/onboarding/step5',
      params: {
        ...params,
        targetWeightKg: targetWeight,
        timelineWeeks: timeline,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ProgressBar current={4} total={5} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Set your target</Text>
            <Text style={styles.subtitle}>
              {goalType === 'maintain'
                ? 'Define your maintenance range'
                : 'What weight do you want to reach and by when?'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.infoCard}>
              <Info size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Current weight: {currentWeight} kg
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter target weight"
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Timeline (weeks)</Text>
              <View style={styles.timelineContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="12"
                  value={timeline}
                  onChangeText={setTimeline}
                  keyboardType="number-pad"
                />
                <Text style={styles.timelineHint}>
                  About {Math.round(parseInt(timeline || '0') / 4.33)} months
                </Text>
              </View>
            </View>

            {paceMessage ? (
              <View
                style={[
                  styles.paceCard,
                  paceMessage.includes('aggressive')
                    ? styles.paceCardWarning
                    : styles.paceCardSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.paceText,
                    paceMessage.includes('aggressive')
                      ? styles.paceTextWarning
                      : styles.paceTextSuccess,
                  ]}
                >
                  {paceMessage}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  form: {
    gap: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  timelineContainer: {
    gap: 8,
  },
  timelineHint: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  paceCard: {
    padding: 16,
    borderRadius: 12,
  },
  paceCardSuccess: {
    backgroundColor: '#d1fae5',
  },
  paceCardWarning: {
    backgroundColor: '#fef3c7',
  },
  paceText: {
    fontSize: 14,
    lineHeight: 20,
  },
  paceTextSuccess: {
    color: '#047857',
  },
  paceTextWarning: {
    color: '#92400e',
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
