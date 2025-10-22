import { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, Flame, Drumstick, Wheat, Droplet, Image as ImageIcon, Sparkles, ArrowRight, ChevronRight } from 'lucide-react-native';
import { ProgressCharts } from '@/components/ProgressCharts';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const SCREEN_WIDTH = Dimensions.get('window').width;

type TimeRange = 'week' | 'month';

interface DailyData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeeklySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  daysLogged: number;
  goalCalories: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
  percentToGoal: number;
  caloriesTrend: number;
  proteinTrend: number;
  carbsTrend: number;
  fatTrend: number;
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

  const weeklySummary = useMemo<WeeklySummary>(() => {
    if (dailyData.length === 0) {
      return {
        totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
        avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0,
        daysLogged: 0, goalCalories: goal.calories, goalProtein: goal.protein,
        goalCarbs: goal.carbs, goalFat: goal.fat, percentToGoal: 0,
        caloriesTrend: 0, proteinTrend: 0, carbsTrend: 0, fatTrend: 0,
      };
    }

    const totalCalories = dailyData.reduce((sum, d) => sum + d.calories, 0);
    const totalProtein = dailyData.reduce((sum, d) => sum + d.protein, 0);
    const totalCarbs = dailyData.reduce((sum, d) => sum + d.carbs, 0);
    const totalFat = dailyData.reduce((sum, d) => sum + d.fat, 0);

    const avgCalories = totalCalories / dailyData.length;
    const avgProtein = totalProtein / dailyData.length;
    const avgCarbs = totalCarbs / dailyData.length;
    const avgFat = totalFat / dailyData.length;

    const daysInPeriod = timeRange === 'week' ? 7 : 30;
    const targetTotalCalories = goal.calories * daysInPeriod;
    const percentToGoal = (totalCalories / targetTotalCalories) * 100;

    const mid = Math.floor(dailyData.length / 2);
    const firstHalf = dailyData.slice(0, mid);
    const secondHalf = dailyData.slice(mid);

    const calcTrend = (metric: keyof DailyData) => {
      if (firstHalf.length === 0 || secondHalf.length === 0) return 0;
      const firstAvg = firstHalf.reduce((sum, d) => sum + Number(d[metric]), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + Number(d[metric]), 0) / secondHalf.length;
      return ((secondAvg - firstAvg) / firstAvg) * 100;
    };

    return {
      totalCalories, totalProtein, totalCarbs, totalFat,
      avgCalories: Math.round(avgCalories),
      avgProtein: Math.round(avgProtein),
      avgCarbs: Math.round(avgCarbs),
      avgFat: Math.round(avgFat),
      daysLogged: dailyData.length,
      goalCalories: goal.calories,
      goalProtein: goal.protein,
      goalCarbs: goal.carbs,
      goalFat: goal.fat,
      percentToGoal: Math.round(percentToGoal),
      caloriesTrend: calcTrend('calories'),
      proteinTrend: calcTrend('protein'),
      carbsTrend: calcTrend('carbs'),
      fatTrend: calcTrend('fat'),
    };
  }, [dailyData, goal, timeRange]);

  const aiInsights = useMemo(() => {
    const insights = [];

    if (weeklySummary.avgCalories > 0) {
      const caloriePercent = (weeklySummary.avgCalories / weeklySummary.goalCalories) * 100;
      if (caloriePercent < 80) {
        insights.push({
          icon: 'flame',
          text: `You're consuming ${Math.round(caloriePercent)}% of your calorie goal. Try adding nutrient-dense snacks.`,
          color: '#f59e0b',
        });
      } else if (caloriePercent >= 95 && caloriePercent <= 105) {
        insights.push({
          icon: 'flame',
          text: "Perfect! You're hitting your calorie target consistently.",
          color: '#10b981',
        });
      }
    }

    if (weeklySummary.proteinTrend > 10) {
      insights.push({
        icon: 'protein',
        text: `Your protein intake improved by ${Math.round(weeklySummary.proteinTrend)}% this ${timeRange}. Great progress!`,
        color: '#3b82f6',
      });
    }

    if (weeklySummary.daysLogged >= (timeRange === 'week' ? 5 : 20)) {
      insights.push({
        icon: 'sparkles',
        text: "You're consistent! Keep tracking to build sustainable habits.",
        color: '#10b981',
      });
    }

    const proteinRatio = (weeklySummary.avgProtein * 4) / weeklySummary.avgCalories;
    if (proteinRatio < 0.25 && weeklySummary.avgCalories > 0) {
      insights.push({
        icon: 'protein',
        text: 'Try increasing protein intake to 25-30% of calories for better satiety.',
        color: '#3b82f6',
      });
    }

    return insights;
  }, [weeklySummary, timeRange]);


  const motivationalSubtitle = useMemo(() => {
    if (weeklySummary.percentToGoal >= 95 && weeklySummary.percentToGoal <= 105) {
      return "🎯 Perfect! You're right on target.";
    } else if (weeklySummary.percentToGoal >= 50) {
      return `Great work! You're ${weeklySummary.percentToGoal}% to your ${timeRange}ly goal.`;
    } else if (weeklySummary.daysLogged === 0) {
      return "Start logging to track your progress";
    } else {
      return "Keep going! Every meal logged matters.";
    }
  }, [weeklySummary, timeRange]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPadding }]}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>{motivationalSubtitle}</Text>
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
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range === 'week' ? '7 Days' : '30 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {dailyData.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>This {timeRange === 'week' ? 'Week' : 'Month'} Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconContainer}>
                  <Flame size={20} color="#ef4444" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>{Math.round(weeklySummary.totalCalories).toLocaleString()}</Text>
                  <Text style={styles.summaryLabel}>Total Calories</Text>
                  <View style={styles.trendBadge}>
                    {weeklySummary.caloriesTrend > 0 ? (
                      <TrendingUp size={12} color="#10b981" />
                    ) : weeklySummary.caloriesTrend < 0 ? (
                      <TrendingDown size={12} color="#ef4444" />
                    ) : null}
                    {weeklySummary.caloriesTrend !== 0 && (
                      <Text style={[styles.trendText, { color: weeklySummary.caloriesTrend > 0 ? '#10b981' : '#ef4444' }]}>
                        {Math.abs(Math.round(weeklySummary.caloriesTrend))}%
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Drumstick size={20} color="#3b82f6" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>{Math.round(weeklySummary.totalProtein)}g</Text>
                  <Text style={styles.summaryLabel}>Total Protein</Text>
                  <View style={styles.trendBadge}>
                    {weeklySummary.proteinTrend > 0 ? (
                      <TrendingUp size={12} color="#10b981" />
                    ) : weeklySummary.proteinTrend < 0 ? (
                      <TrendingDown size={12} color="#ef4444" />
                    ) : null}
                    {weeklySummary.proteinTrend !== 0 && (
                      <Text style={[styles.trendText, { color: weeklySummary.proteinTrend > 0 ? '#10b981' : '#ef4444' }]}>
                        {Math.abs(Math.round(weeklySummary.proteinTrend))}%
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, { backgroundColor: '#fef3c7' }]}>
                  <Wheat size={20} color="#f59e0b" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>{Math.round(weeklySummary.totalCarbs)}g</Text>
                  <Text style={styles.summaryLabel}>Total Carbs</Text>
                  <View style={styles.trendBadge}>
                    {weeklySummary.carbsTrend > 0 ? (
                      <TrendingUp size={12} color="#10b981" />
                    ) : weeklySummary.carbsTrend < 0 ? (
                      <TrendingDown size={12} color="#ef4444" />
                    ) : null}
                    {weeklySummary.carbsTrend !== 0 && (
                      <Text style={[styles.trendText, { color: weeklySummary.carbsTrend > 0 ? '#10b981' : '#ef4444' }]}>
                        {Math.abs(Math.round(weeklySummary.carbsTrend))}%
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, { backgroundColor: '#fee2e2' }]}>
                  <Droplet size={20} color="#ef4444" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>{Math.round(weeklySummary.totalFat)}g</Text>
                  <Text style={styles.summaryLabel}>Total Fat</Text>
                  <View style={styles.trendBadge}>
                    {weeklySummary.fatTrend > 0 ? (
                      <TrendingUp size={12} color="#10b981" />
                    ) : weeklySummary.fatTrend < 0 ? (
                      <TrendingDown size={12} color="#ef4444" />
                    ) : null}
                    {weeklySummary.fatTrend !== 0 && (
                      <Text style={[styles.trendText, { color: weeklySummary.fatTrend > 0 ? '#10b981' : '#ef4444' }]}>
                        {Math.abs(Math.round(weeklySummary.fatTrend))}%
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarHeader}>
                <Text style={styles.progressBarLabel}>Overall Progress</Text>
                <Text style={styles.progressBarValue}>{weeklySummary.percentToGoal}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${Math.min(weeklySummary.percentToGoal, 100)}%` }]}
                />
              </View>
              <Text style={styles.progressBarSubtext}>
                {weeklySummary.daysLogged} of {timeRange === 'week' ? 7 : 30} days logged
              </Text>
            </View>
          </View>
        )}

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Daily Trends</Text>
            <Text style={styles.chartSubtitle}>Tap categories to switch metrics</Text>
          </View>
          {dailyData.length > 0 ? (
            <ProgressCharts
              data={dailyData.map(d => ({ ...d, goal: goal.calories }))}
              period={timeRange === 'week' ? 7 : 30}
            />
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Flame size={48} color="#d1d5db" />
              </View>
              <Text style={styles.emptyTitle}>No data yet</Text>
              <Text style={styles.emptyMessage}>Start logging meals to see your progress</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/log')}
              >
                <Text style={styles.emptyButtonText}>Log Your First Meal</Text>
                <ArrowRight size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {aiInsights.length > 0 && dailyData.length > 0 && (
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <Sparkles size={20} color="#10b981" />
              <Text style={styles.insightsTitle}>Smart Insights</Text>
            </View>
            {aiInsights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <View style={[styles.insightIconContainer, { backgroundColor: `${insight.color}15` }]}>
                  {insight.icon === 'flame' && <Flame size={16} color={insight.color} />}
                  {insight.icon === 'protein' && <Drumstick size={16} color={insight.color} />}
                  {insight.icon === 'sparkles' && <Sparkles size={16} color={insight.color} />}
                </View>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            ))}
          </View>
        )}

        {dailyData.length > 0 && (
          <View style={styles.macroCardsContainer}>
            <Text style={styles.sectionTitle}>Average Daily Intake</Text>

            <View style={styles.macroCard}>
              <View style={styles.macroCardHeader}>
                <View style={styles.macroIconContainer}>
                  <Flame size={24} color="#ef4444" />
                </View>
                <View style={styles.macroInfo}>
                  <Text style={styles.macroLabel}>Calories</Text>
                  <View style={styles.macroValues}>
                    <Text style={styles.macroValue}>{weeklySummary.avgCalories}</Text>
                    <Text style={styles.macroTarget}>/ {goal.calories} kcal</Text>
                  </View>
                </View>
              </View>
              <View style={styles.macroProgressContainer}>
                <View style={styles.macroProgressTrack}>
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.macroProgressFill, { width: `${Math.min((weeklySummary.avgCalories / goal.calories) * 100, 100)}%` }]}
                  />
                </View>
                <Text style={styles.macroPercentage}>
                  {Math.round((weeklySummary.avgCalories / goal.calories) * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.macroCard}>
              <View style={styles.macroCardHeader}>
                <View style={[styles.macroIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Drumstick size={24} color="#3b82f6" />
                </View>
                <View style={styles.macroInfo}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <View style={styles.macroValues}>
                    <Text style={styles.macroValue}>{weeklySummary.avgProtein}g</Text>
                    <Text style={styles.macroTarget}>/ {goal.protein}g</Text>
                  </View>
                </View>
              </View>
              <View style={styles.macroProgressContainer}>
                <View style={styles.macroProgressTrack}>
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.macroProgressFill, { width: `${Math.min((weeklySummary.avgProtein / goal.protein) * 100, 100)}%` }]}
                  />
                </View>
                <Text style={styles.macroPercentage}>
                  {Math.round((weeklySummary.avgProtein / goal.protein) * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.macroCard}>
              <View style={styles.macroCardHeader}>
                <View style={[styles.macroIconContainer, { backgroundColor: '#fef3c7' }]}>
                  <Wheat size={24} color="#f59e0b" />
                </View>
                <View style={styles.macroInfo}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <View style={styles.macroValues}>
                    <Text style={styles.macroValue}>{weeklySummary.avgCarbs}g</Text>
                    <Text style={styles.macroTarget}>/ {goal.carbs}g</Text>
                  </View>
                </View>
              </View>
              <View style={styles.macroProgressContainer}>
                <View style={styles.macroProgressTrack}>
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.macroProgressFill, { width: `${Math.min((weeklySummary.avgCarbs / goal.carbs) * 100, 100)}%` }]}
                  />
                </View>
                <Text style={styles.macroPercentage}>
                  {Math.round((weeklySummary.avgCarbs / goal.carbs) * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.macroCard}>
              <View style={styles.macroCardHeader}>
                <View style={[styles.macroIconContainer, { backgroundColor: '#fee2e2' }]}>
                  <Droplet size={24} color="#ef4444" />
                </View>
                <View style={styles.macroInfo}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <View style={styles.macroValues}>
                    <Text style={styles.macroValue}>{weeklySummary.avgFat}g</Text>
                    <Text style={styles.macroTarget}>/ {goal.fat}g</Text>
                  </View>
                </View>
              </View>
              <View style={styles.macroProgressContainer}>
                <View style={styles.macroProgressTrack}>
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.macroProgressFill, { width: `${Math.min((weeklySummary.avgFat / goal.fat) * 100, 100)}%` }]}
                  />
                </View>
                <Text style={styles.macroPercentage}>
                  {Math.round((weeklySummary.avgFat / goal.fat) * 100)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.galleryCard}
          onPress={() => router.push('/gallery')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.galleryGradient}
          >
            <View style={styles.galleryContent}>
              <View style={styles.galleryIconCircle}>
                <ImageIcon size={28} color="#ffffff" />
              </View>
              <View style={styles.galleryTextContainer}>
                <Text style={styles.galleryTitle}>Your Meal Gallery</Text>
                <Text style={styles.gallerySubtitle}>
                  {dailyData.length > 0 ? `${dailyData.length} meals logged this ${timeRange}` : 'View all your meal photos'}
                </Text>
              </View>
            </View>
            <ChevronRight size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
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
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 12,
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  summaryItem: {
    width: '48%',
    flexDirection: 'row',
    gap: 12,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressBarValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 0,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  chartHeader: {
    padding: 20,
    paddingBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  insightsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 8,
  },
  insightIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 16,
  },
  macroCardsContainer: {
    marginTop: 16,
  },
  macroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  macroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroInfo: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  macroValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  macroTarget: {
    fontSize: 14,
    color: '#9ca3af',
  },
  macroProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    minWidth: 42,
    textAlign: 'right',
  },
  galleryCard: {
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  galleryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  galleryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  galleryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryTextContainer: {
    flex: 1,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  gallerySubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
  },
});
