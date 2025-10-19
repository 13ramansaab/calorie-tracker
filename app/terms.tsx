import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.updateDate}>Last Updated: October 19, 2025</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using NutriTrack, you accept and agree to be bound by these Terms of
          Service. If you do not agree to these terms, please do not use the service.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          NutriTrack is a nutrition tracking application that helps users monitor their dietary
          intake through manual logging and AI-powered photo analysis. The service includes:
        </Text>
        <Text style={styles.paragraph}>
          • Meal logging and nutrition tracking{'\n'}
          • AI-powered food recognition from photos{'\n'}
          • Personalized nutritional insights{'\n'}
          • Goal setting and progress tracking{'\n'}
          • Weekly summaries and reports{'\n'}
          • Data export capabilities
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.subsectionTitle}>3.1 Account Creation</Text>
        <Text style={styles.paragraph}>
          You must create an account to use NutriTrack. You agree to provide accurate, current, and
          complete information during registration and to update it as necessary.
        </Text>

        <Text style={styles.subsectionTitle}>3.2 Account Security</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activities that occur under your account. Notify us immediately of any
          unauthorized use.
        </Text>

        <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
        <Text style={styles.paragraph}>
          You agree not to:{'\n'}
          • Use the service for any illegal purpose{'\n'}
          • Attempt to gain unauthorized access to our systems{'\n'}
          • Interfere with the proper functioning of the service{'\n'}
          • Upload malicious code or harmful content{'\n'}
          • Violate any applicable laws or regulations{'\n'}
          • Share your account with others{'\n'}
          • Scrape or collect data without permission
        </Text>

        <Text style={styles.sectionTitle}>5. Medical Disclaimer</Text>
        <Text style={styles.important}>IMPORTANT NOTICE</Text>
        <Text style={styles.paragraph}>
          NutriTrack is a nutrition tracking tool and is NOT a substitute for professional medical
          advice, diagnosis, or treatment. The nutritional information provided is for informational
          purposes only and may not be 100% accurate.
        </Text>
        <Text style={styles.paragraph}>
          • Always consult a qualified healthcare provider before making dietary changes{'\n'}
          • Do not disregard medical advice based on information from this app{'\n'}
          • In case of medical emergencies, contact emergency services immediately{'\n'}
          • Nutritional estimates are approximate and may contain errors
        </Text>

        <Text style={styles.sectionTitle}>6. AI Analysis Accuracy</Text>
        <Text style={styles.paragraph}>
          Our AI-powered food recognition technology provides estimates based on image analysis.
          These estimates may not always be accurate. Users should verify and adjust nutritional
          information as needed. We do not guarantee the accuracy of AI-generated data.
        </Text>

        <Text style={styles.sectionTitle}>7. Subscriptions and Payments</Text>
        <Text style={styles.subsectionTitle}>7.1 Free Trial</Text>
        <Text style={styles.paragraph}>
          New users may be eligible for a 7-day free trial of premium features. No credit card is
          required for the trial. The trial will automatically expire unless you subscribe.
        </Text>

        <Text style={styles.subsectionTitle}>7.2 Subscription Plans</Text>
        <Text style={styles.paragraph}>
          Premium subscriptions are available on a monthly or annual basis. Pricing is displayed in
          the app and may vary by region. Subscriptions automatically renew unless canceled.
        </Text>

        <Text style={styles.subsectionTitle}>7.3 Cancellation</Text>
        <Text style={styles.paragraph}>
          You may cancel your subscription at any time. Cancellation takes effect at the end of the
          current billing period. No refunds are provided for partial periods.
        </Text>

        <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content, features, and functionality of NutriTrack, including but not limited to text,
          graphics, logos, and software, are owned by us and protected by copyright and trademark
          laws.
        </Text>
        <Text style={styles.paragraph}>
          You retain ownership of the content you upload (photos, notes). By uploading content, you
          grant us a license to use it solely for providing the service.
        </Text>

        <Text style={styles.sectionTitle}>9. Data and Privacy</Text>
        <Text style={styles.paragraph}>
          Your use of NutriTrack is also governed by our Privacy Policy. Please review it to
          understand how we collect, use, and protect your data.
        </Text>

        <Text style={styles.sectionTitle}>10. Termination</Text>
        <Text style={styles.paragraph}>
          We reserve the right to suspend or terminate your account if you violate these Terms of
          Service or engage in fraudulent or illegal activities. Upon termination, your right to
          use the service ceases immediately.
        </Text>

        <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the fullest extent permitted by law, NutriTrack and its affiliates shall not be liable
          for any indirect, incidental, special, consequential, or punitive damages resulting from
          your use or inability to use the service.
        </Text>

        <Text style={styles.sectionTitle}>12. Disclaimer of Warranties</Text>
        <Text style={styles.paragraph}>
          The service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either
          express or implied. We do not guarantee that the service will be uninterrupted,
          error-free, or secure.
        </Text>

        <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms of Service at any time. We will notify users of
          significant changes. Continued use of the service after changes constitutes acceptance of
          the new terms.
        </Text>

        <Text style={styles.sectionTitle}>14. Governing Law</Text>
        <Text style={styles.paragraph}>
          These terms shall be governed by and construed in accordance with the laws of India.
          Any disputes shall be resolved in the courts of Bangalore, Karnataka.
        </Text>

        <Text style={styles.sectionTitle}>15. Contact Information</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms of Service, please contact us at:
        </Text>
        <Text style={styles.contactText}>
          Email: legal@nutritrack.app{'\n'}
          Support: support@nutritrack.app
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using NutriTrack, you acknowledge that you have read, understood, and agree to be
            bound by these Terms of Service.
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
  important: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
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
