import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.updateDate}>Last Updated: October 19, 2025</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to NutriTrack. We respect your privacy and are committed to protecting your
          personal data. This privacy policy explains how we collect, use, and safeguard your
          information when you use our nutrition tracking application.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.subsectionTitle}>2.1 Account Information</Text>
        <Text style={styles.paragraph}>
          When you create an account, we collect your email address, name, and authentication
          credentials. This information is necessary to provide you with personalized nutrition
          tracking services.
        </Text>

        <Text style={styles.subsectionTitle}>2.2 Nutrition Data</Text>
        <Text style={styles.paragraph}>
          We collect and store information about your meals, including food items, portions,
          photos, nutritional content, and timestamps. This data is essential for tracking your
          dietary intake and providing personalized insights.
        </Text>

        <Text style={styles.subsectionTitle}>2.3 Photos</Text>
        <Text style={styles.paragraph}>
          When you upload meal photos, we process them using AI to identify food items and
          estimate nutritional content. Photos are stored securely and are only accessible to you.
        </Text>

        <Text style={styles.subsectionTitle}>2.4 Usage Data</Text>
        <Text style={styles.paragraph}>
          We collect analytics data about how you use the app, including features accessed, time
          spent, and interactions. This helps us improve the app experience.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          • Provide nutrition tracking and analysis services{'\n'}
          • Generate personalized meal suggestions and insights{'\n'}
          • Process AI-powered food recognition{'\n'}
          • Calculate nutritional goals and progress{'\n'}
          • Send notifications and weekly summaries{'\n'}
          • Improve app functionality and user experience{'\n'}
          • Provide customer support
        </Text>

        <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
        <Text style={styles.paragraph}>
          Your data is stored securely using Supabase infrastructure with encryption at rest and in
          transit. We implement industry-standard security measures including:
        </Text>
        <Text style={styles.paragraph}>
          • End-to-end encryption for data transmission{'\n'}
          • Secure authentication with password hashing{'\n'}
          • Row-level security policies{'\n'}
          • Regular security audits{'\n'}
          • Restricted access controls
        </Text>

        <Text style={styles.sectionTitle}>5. Data Sharing</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal data. We may share your data only in the following limited
          circumstances:
        </Text>
        <Text style={styles.paragraph}>
          • With your explicit consent{'\n'}
          • With service providers (AI analysis, cloud storage) under strict confidentiality
          agreements{'\n'}
          • When required by law or to protect our legal rights{'\n'}
          • In anonymized, aggregated form for research or analytics
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to:{'\n'}
          • Access your personal data{'\n'}
          • Correct inaccurate data{'\n'}
          • Request deletion of your data{'\n'}
          • Export your data{'\n'}
          • Opt-out of marketing communications{'\n'}
          • Withdraw consent at any time
        </Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your data for as long as your account is active or as needed to provide
          services. If you delete your account, we will delete your personal data within 30 days,
          except where retention is required by law.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our service is not intended for children under 13 years of age. We do not knowingly
          collect personal information from children under 13.
        </Text>

        <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
        <Text style={styles.paragraph}>
          Your data may be transferred to and processed in countries other than your own. We ensure
          appropriate safeguards are in place to protect your data in accordance with this privacy
          policy.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this privacy policy from time to time. We will notify you of significant
          changes by email or through the app. Your continued use of the service after changes
          constitutes acceptance of the updated policy.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this privacy policy or wish to exercise your rights, please
          contact us at:
        </Text>
        <Text style={styles.contactText}>
          Email: privacy@nutritrack.app{'\n'}
          Support: support@nutritrack.app
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using NutriTrack, you acknowledge that you have read and understood this Privacy
            Policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  updateDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#10b981',
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'center',
  },
});
