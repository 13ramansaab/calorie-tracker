import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Award,
  Flame,
  Target,
  TrendingUp,
  Star,
  Zap,
  CheckCircle,
  Lock,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  target?: number;
}

export default function Achievements() {
  const router = useRouter();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  const fetchAchievements = async () => {
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        name: 'First Step',
        description: 'Log your first meal',
        icon: 'star',
        earned: true,
        earnedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Streak Master',
        description: 'Log meals for 7 days in a row',
        icon: 'flame',
        earned: true,
        earnedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        name: 'Perfect Week',
        description: 'Hit your calorie target 7 days in a row',
        icon: 'target',
        earned: false,
        progress: 4,
        target: 7,
      },
      {
        id: '4',
        name: 'Consistent Logger',
        description: 'Log 30 meals',
        icon: 'trending-up',
        earned: false,
        progress: 18,
        target: 30,
      },
      {
        id: '5',
        name: 'Photo Pro',
        description: 'Log 20 meals with photos',
        icon: 'camera',
        earned: false,
        progress: 8,
        target: 20,
      },
      {
        id: '6',
        name: 'Protein Champion',
        description: 'Hit your protein target 10 days in a row',
        icon: 'zap',
        earned: false,
        progress: 0,
        target: 10,
      },
    ];

    setAchievements(mockAchievements);
    setCurrentStreak(7);
  };

  const getIconComponent = (iconName: string, earned: boolean) => {
    const color = earned ? '#10b981' : '#9ca3af';
    const size = 32;

    switch (iconName) {
      case 'star':
        return <Star size={size} color={color} fill={earned ? color : 'none'} />;
      case 'flame':
        return <Flame size={size} color={color} fill={earned ? color : 'none'} />;
      case 'target':
        return <Target size={size} color={color} />;
      case 'trending-up':
        return <TrendingUp size={size} color={color} />;
      case 'zap':
        return <Zap size={size} color={color} fill={earned ? color : 'none'} />;
      default:
        return <Award size={size} color={color} />;
    }
  };

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSubtitle}>
            {earnedCount} of {achievements.length} unlocked
          </Text>
        </View>
        <View style={styles.backButton} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.streakCard}>
          <View style={styles.streakIcon}>
            <Flame size={40} color="#f59e0b" fill="#f59e0b" />
          </View>
          <View style={styles.streakContent}>
            <Text style={styles.streakValue}>{currentStreak} Days</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earned</Text>
          <View style={styles.achievementsGrid}>
            {achievements
              .filter((a) => a.earned)
              .map((achievement) => (
                <TouchableOpacity key={achievement.id} style={styles.achievementCard}>
                  <View style={styles.achievementIcon}>
                    {getIconComponent(achievement.icon, true)}
                  </View>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  {achievement.earnedAt && (
                    <View style={styles.earnedBadge}>
                      <CheckCircle size={14} color="#10b981" />
                      <Text style={styles.earnedText}>
                        {new Date(achievement.earnedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In Progress</Text>
          <View style={styles.achievementsGrid}>
            {achievements
              .filter((a) => !a.earned)
              .map((achievement) => (
                <TouchableOpacity key={achievement.id} style={styles.achievementCardLocked}>
                  <View style={styles.achievementIconLocked}>
                    {getIconComponent(achievement.icon, false)}
                  </View>
                  <Text style={styles.achievementNameLocked}>{achievement.name}</Text>
                  <Text style={styles.achievementDescriptionLocked}>
                    {achievement.description}
                  </Text>
                  {achievement.progress !== undefined && achievement.target && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${(achievement.progress / achievement.target) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {achievement.progress}/{achievement.target}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={celebrationVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCelebrationVisible(false)}
      >
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationIcon}>
              <Award size={64} color="#10b981" fill="#10b981" />
            </View>
            <Text style={styles.celebrationTitle}>Achievement Unlocked!</Text>
            {newAchievement && (
              <>
                <Text style={styles.celebrationName}>{newAchievement.name}</Text>
                <Text style={styles.celebrationDescription}>
                  {newAchievement.description}
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.celebrationButton}
              onPress={() => setCelebrationVisible(false)}
            >
              <Text style={styles.celebrationButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  streakContent: {
    flex: 1,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  streakLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  achievementsGrid: {
    gap: 16,
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCardLocked: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementIconLocked: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  achievementNameLocked: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  achievementDescriptionLocked: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  earnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  progressContainer: {
    marginTop: 16,
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  celebrationIcon: {
    marginBottom: 24,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  celebrationName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
  },
  celebrationDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  celebrationButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  celebrationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
