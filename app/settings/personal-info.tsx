import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, User, Calendar, Ruler, Weight, Activity } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type Gender = 'male' | 'female' | 'other';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState('');
  const [currentWeightKg, setCurrentWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDateOfBirth(profile.date_of_birth || '');
      setGender((profile.gender as Gender) || 'male');
      setHeightCm(profile.height_cm?.toString() || '');
      setCurrentWeightKg(profile.current_weight_kg?.toString() || '');
      setActivityLevel((profile.activity_level as ActivityLevel) || 'moderate');
    }
  }, [profile]);

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return false;
    }

    if (heightCm && (parseFloat(heightCm) < 100 || parseFloat(heightCm) > 250)) {
      Alert.alert('Validation Error', 'Height must be between 100-250 cm');
      return false;
    }

    if (currentWeightKg && (parseFloat(currentWeightKg) < 30 || parseFloat(currentWeightKg) > 300)) {
      Alert.alert('Validation Error', 'Weight must be between 30-300 kg');
      return false;
    }

    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        Alert.alert('Validation Error', 'Please enter a valid date of birth');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth || null,
          gender: gender,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          current_weight_kg: currentWeightKg ? parseFloat(currentWeightKg) : null,
          activity_level: activityLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      Alert.alert('Success', 'Personal information updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update personal information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <User size={20} color="#10b981" />
              <Text style={styles.label}>Full Name</Text>
            </View>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Calendar size={20} color="#10b981" />
              <Text style={styles.label}>Date of Birth</Text>
            </View>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 1990-01-15)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.optionGrid}>
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    gender === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setGender(option.value as Gender)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      gender === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Ruler size={20} color="#10b981" />
              <Text style={styles.label}>Height (cm)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="Enter height in cm"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Weight size={20} color="#10b981" />
              <Text style={styles.label}>Current Weight (kg)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={currentWeightKg}
              onChangeText={setCurrentWeightKg}
              placeholder="Enter weight in kg"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Activity size={20} color="#10b981" />
              <Text style={styles.label}>Activity Level</Text>
            </View>
            <View style={styles.activityOptions}>
              {[
                { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                { value: 'light', label: 'Light', desc: 'Exercise 1-3 days/week' },
                { value: 'moderate', label: 'Moderate', desc: 'Exercise 3-5 days/week' },
                { value: 'active', label: 'Active', desc: 'Exercise 6-7 days/week' },
                { value: 'very_active', label: 'Very Active', desc: 'Intense exercise daily' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.activityCard,
                    activityLevel === option.value && styles.activityCardActive,
                  ]}
                  onPress={() => setActivityLevel(option.value as ActivityLevel)}
                >
                  <Text
                    style={[
                      styles.activityLabel,
                      activityLevel === option.value && styles.activityLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.activityDesc,
                      activityLevel === option.value && styles.activityDescActive,
                    ]}
                  >
                    {option.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  optionButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  optionTextActive: {
    color: '#10b981',
  },
  activityOptions: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  activityCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  activityLabelActive: {
    color: '#10b981',
  },
  activityDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  activityDescActive: {
    color: '#059669',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
