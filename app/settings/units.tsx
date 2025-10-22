import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Ruler, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type UnitSystem = 'metric' | 'imperial';

export default function UnitsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  useEffect(() => {
    if (profile?.preferences?.unit_system) {
      setUnitSystem(profile.preferences.unit_system);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const currentPrefs = profile?.preferences || {};
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...currentPrefs,
            unit_system: unitSystem,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      Alert.alert('Success', 'Unit preferences saved successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving units:', error);
      Alert.alert('Error', 'Failed to save unit preferences');
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
          <Text style={styles.headerTitle}>Units & Measurements</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ruler size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Measurement System</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.unitCard,
                unitSystem === 'metric' && styles.unitCardActive,
              ]}
              onPress={() => setUnitSystem('metric')}
            >
              <View style={styles.unitContent}>
                <View>
                  <Text style={styles.unitTitle}>Metric</Text>
                  <Text style={styles.unitDescription}>
                    Kilograms (kg), Centimeters (cm), Grams (g)
                  </Text>
                </View>
                {unitSystem === 'metric' && (
                  <View style={styles.checkmark}>
                    <Check size={20} color="#10b981" />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.unitCard,
                unitSystem === 'imperial' && styles.unitCardActive,
              ]}
              onPress={() => setUnitSystem('imperial')}
            >
              <View style={styles.unitContent}>
                <View>
                  <Text style={styles.unitTitle}>Imperial</Text>
                  <Text style={styles.unitDescription}>
                    Pounds (lb), Feet/Inches (ft/in), Ounces (oz)
                  </Text>
                </View>
                {unitSystem === 'imperial' && (
                  <View style={styles.checkmark}>
                    <Check size={20} color="#10b981" />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                This setting affects how weight, height, and portion sizes are displayed throughout the app.
              </Text>
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
            <Text style={styles.saveButtonText}>Save Settings</Text>
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
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  unitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  unitCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  unitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  unitDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  checkmark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
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
