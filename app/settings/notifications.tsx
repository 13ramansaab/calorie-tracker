import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [goalAchievements, setGoalAchievements] = useState(true);
  const [mealSuggestions, setMealSuggestions] = useState(false);

  useEffect(() => {
    if (profile?.preferences?.notifications) {
      const notifs = profile.preferences.notifications;
      setDailyReminders(notifs.daily_reminders ?? true);
      setWeeklyReports(notifs.weekly_reports ?? true);
      setGoalAchievements(notifs.goal_achievements ?? true);
      setMealSuggestions(notifs.meal_suggestions ?? false);
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
            notifications: {
              daily_reminders: dailyReminders,
              weekly_reports: weeklyReports,
              goal_achievements: goalAchievements,
              meal_suggestions: mealSuggestions,
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      Alert.alert('Success', 'Notification settings saved', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving notifications:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const NotificationToggle = ({
    title,
    description,
    value,
    onValueChange,
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.toggleItem}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: '#86efac' }}
        thumbColor={value ? '#10b981' : '#f3f4f6'}
        ios_backgroundColor="#d1d5db"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Notification Preferences</Text>
            </View>
            <View style={styles.toggleList}>
              <NotificationToggle
                title="Daily Meal Reminders"
                description="Get reminded to log your meals"
                value={dailyReminders}
                onValueChange={setDailyReminders}
              />
              <NotificationToggle
                title="Weekly Progress Reports"
                description="Receive weekly nutrition summaries"
                value={weeklyReports}
                onValueChange={setWeeklyReports}
              />
              <NotificationToggle
                title="Goal Achievements"
                description="Celebrate when you hit your targets"
                value={goalAchievements}
                onValueChange={setGoalAchievements}
              />
              <NotificationToggle
                title="Meal Suggestions"
                description="Get AI-powered meal recommendations"
                value={mealSuggestions}
                onValueChange={setMealSuggestions}
              />
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
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  toggleList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
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
