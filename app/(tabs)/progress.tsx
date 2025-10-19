import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Circle, Polyline } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Calendar, TrendingUp, Image as ImageIcon, Award } from 'lucide-react-native';
import { ProgressCharts } from '@/components/ProgressCharts';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48;

type TimeRange = 'week' | 'month';

interface DailyData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function ProgressTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { contentPadding } = useTabBarPadding();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [goal, setGoal] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });

  useEffect(() => {
    fetchProgressData();
  }, [timeRange, user]);

  const fetchProgressData = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const startDate = new Date();

      if (timeRange === 'day') {
        startDate.setDate(today.getDate() - 1);
      } else if (timeRange === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else {
        startDate.setDate(today.getDate() - 30);
      }

      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalData) {
        setGoal({
          calories: Number(goalData.daily_calorie_target) || 2000,
          protein: Number(goalData.protein_target_grams) || 150,
          carbs: Number(goalData.carbs_target_grams) || 200,
          fat: Number(goalData.fat_target_grams) || 65,
        });
      }

      const { data: meals } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', today.toISOString());

      console.log('Fetched meals for progress:', meals);
      console.log('Goal data:', goalData);

      const aggregated: Record<string, DailyData> = {};

      meals?.forEach((meal) => {
        console.log('Processing meal:', {
          id: meal.id,
          logged_at: meal.logged_at,
          total_calories: meal.total_calories,
          total_protein: meal.total_protein,
          total_carbs: meal.total_carbs,
          total_fat: meal.total_fat,
        });
        
        const date = new Date(meal.logged_at).toISOString().split('T')[0];
        if (!aggregated[date]) {
          aggregated[date] = {
            date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          };
        }
        aggregated[date].calories += Number(meal.total_calories) || 0;
        aggregated[date].protein += Number(meal.total_protein) || 0;
        aggregated[date].carbs += Number(meal.total_carbs) || 0;
        aggregated[date].fat += Number(meal.total_fat) || 0;
      });

      const dataArray = Object.values(aggregated).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      setDailyData(dataArray);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCalorieChart = () => {
    if (dailyData.length === 0) return null;

    const maxCalories = Math.max(...dailyData.map((d) => d.calories), goal.calories);
    const chartHeight = 200;
    const padding = 20;

    const points = dailyData.map((data, index) => {
      const x = (index / (dailyData.length - 1)) * (CHART_WIDTH - padding * 2) + padding;
      const y = chartHeight - (data.calories / maxCalories) * (chartHeight - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');

    const goalY = chartHeight - (goal.calories / maxCalories) * (chartHeight - padding * 2) - padding;

    return (
      <Svg width={CHART_WIDTH} height={chartHeight}>
        <Line
          x1={padding}
          y1={goalY}
          x2={CHART_WIDTH - padding}
          y2={goalY}
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <Polyline
          points={points}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
        />
        {dailyData.map((data, index) => {
          const x = (index / (dailyData.length - 1)) * (CHART_WIDTH - padding * 2) + padding;
          const y = chartHeight - (data.calories / maxCalories) * (chartHeight - padding * 2) - padding;
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill="#10b981"
            />
          );
        })}
      </Svg>
    );
  };

  const averages = dailyData.length > 0
    ? {
        calories: Math.round(dailyData.reduce((sum, d) => sum + d.calories, 0) / dailyData.length),
        protein: Math.round(dailyData.reduce((sum, d) => sum + d.protein, 0) / dailyData.length),
        carbs: Math.round(dailyData.reduce((sum, d) => sum + d.carbs, 0) / dailyData.length),
        fat: Math.round(dailyData.reduce((sum, d) => sum + d.fat, 0) / dailyData.length),
      }
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPadding }]}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>Track your nutrition journey</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.timeRangeSelector}>
          {(['week', 'month'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {dailyData.length > 0 ? (
          <ProgressCharts
            data={dailyData.map(d => ({ ...d, goal: goal.calories }))}
            period={timeRange === 'week' ? 7 : 30}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>No data for this period</Text>
          </View>
        )}

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Average Daily Intake</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averages.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={styles.statTarget}>Goal: {goal.calories}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averages.protein}g</Text>
              <Text style={styles.statLabel}>Protein</Text>
              <Text style={styles.statTarget}>Goal: {goal.protein}g</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averages.carbs}g</Text>
              <Text style={styles.statLabel}>Carbs</Text>
              <Text style={styles.statTarget}>Goal: {goal.carbs}g</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averages.fat}g</Text>
              <Text style={styles.statLabel}>Fat</Text>
              <Text style={styles.statTarget}>Goal: {goal.fat}g</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLinkCard}
            onPress={() => router.push('/gallery')}
          >
            <ImageIcon size={24} color="#10b981" />
            <Text style={styles.quickLinkText}>Photo Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLinkCard}>
            <Award size={24} color="#10b981" />
            <Text style={styles.quickLinkText}>Achievements</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -16,
    gap: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#10b981',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  timeRangeTextActive: {
    color: '#ffffff',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    width: '47%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  statTarget: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  quickLinkCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});
