import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Download, TrendingUp, Award, AlertCircle, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { checkPremiumStatus, showPremiumPrompt } from '@/utils/premium';

export default function InsightsReports() {
  const router = useRouter();
  const { profile } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (profile?.subscription_tier) {
      setIsPremium(checkPremiumStatus(profile.subscription_tier));
    }
  }, [profile]);

  const handleExport = (format: 'pdf' | 'csv') => {
    if (!isPremium) {
      const prompt = showPremiumPrompt(
        'Premium Feature',
        'Export your nutrition data and reports with Premium. Get detailed PDF reports or CSV exports for your records.'
      );
      Alert.alert(prompt.title, prompt.message, prompt.buttons);
      return;
    }

    Alert.alert('Coming Soon', `${format.toUpperCase()} export will be available soon`);
  };

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insights & Reports</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.centerContent}>
          <View style={styles.premiumCard}>
            <LinearGradient
              colors={['#fbbf24', '#f59e0b']}
              style={styles.premiumBadge}
            >
              <Lock size={32} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.premiumTitle}>Premium Feature</Text>
            <Text style={styles.premiumDescription}>
              Get detailed insights into your nutrition habits, track compliance, and
              export your data for personal records or to share with your healthcare
              provider.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Weekly and monthly compliance reports</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Top foods and meal patterns analysis</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Export data as PDF or CSV</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Trend analysis and predictions</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.upgradeButton}>
              <LinearGradient
                colors={['#fbbf24', '#f59e0b']}
                style={styles.upgradeButtonGradient}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.premiumHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLight}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.premiumHeaderTitle}>Insights & Reports</Text>
          <Text style={styles.premiumHeaderSubtitle}>Your nutrition analytics</Text>
        </View>
        <View style={styles.backButtonLight} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport('pdf')}
          >
            <Download size={18} color="#10b981" />
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport('csv')}
          >
            <Download size={18} color="#10b981" />
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <TrendingUp size={24} color="#10b981" />
            <Text style={styles.insightTitle}>Weekly Compliance</Text>
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.complianceValue}>87%</Text>
            <Text style={styles.complianceLabel}>On target this week</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '87%' }]} />
            </View>
            <Text style={styles.insightDescription}>
              You hit your calorie target 6 out of 7 days. Great job!
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Award size={24} color="#3b82f6" />
            <Text style={styles.insightTitle}>Top Foods</Text>
          </View>
          <View style={styles.topFoodsList}>
            {[
              { name: 'Chicken Breast', count: 8 },
              { name: 'Greek Yogurt', count: 6 },
              { name: 'Brown Rice', count: 5 },
              { name: 'Broccoli', count: 5 },
              { name: 'Salmon', count: 4 },
            ].map((food, index) => (
              <View key={index} style={styles.topFoodItem}>
                <Text style={styles.topFoodName}>
                  {index + 1}. {food.name}
                </Text>
                <Text style={styles.topFoodCount}>{food.count}x</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <AlertCircle size={24} color="#f59e0b" />
            <Text style={styles.insightTitle}>Over/Under Days</Text>
          </View>
          <View style={styles.daysGrid}>
            <View style={styles.daysStat}>
              <Text style={styles.daysValue}>2</Text>
              <Text style={styles.daysLabel}>Over days</Text>
              <Text style={styles.daysSubtext}>+150 avg</Text>
            </View>
            <View style={styles.daysStat}>
              <Text style={styles.daysValue}>1</Text>
              <Text style={styles.daysLabel}>Under days</Text>
              <Text style={styles.daysSubtext}>-120 avg</Text>
            </View>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Tip</Text>
          <Text style={styles.tipText}>
            Your protein intake is consistently meeting your target. Keep up the great
            work!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButtonLight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  premiumHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  premiumHeaderSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  scrollContent: {
    padding: 24,
  },
  premiumCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  premiumBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  premiumDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  featureText: {
    fontSize: 15,
    color: '#1f2937',
  },
  upgradeButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  insightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  insightContent: {
    alignItems: 'center',
    gap: 8,
  },
  complianceValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#10b981',
  },
  complianceLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  insightDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  topFoodsList: {
    gap: 12,
  },
  topFoodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  topFoodName: {
    fontSize: 15,
    color: '#1f2937',
  },
  topFoodCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  daysStat: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  daysValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f59e0b',
  },
  daysLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  daysSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
