import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, MessageCircle, FileText, Shield, HelpCircle, Send } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Support() {
  const router = useRouter();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message fields.');
      return;
    }

    setSending(true);

    try {
      const emailBody = `
Subject: ${subject}

Message:
${message}

---
User ID: ${user?.id || 'Not logged in'}
Email: ${user?.email || 'N/A'}
App Version: 1.0.0
Date: ${new Date().toISOString()}
      `.trim();

      const mailtoUrl = `mailto:support@nutritrack.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Alert.alert(
          'Email Opened',
          'Your email app has been opened. Please send the email to complete your support request.',
          [
            {
              text: 'OK',
              onPress: () => {
                setSubject('');
                setMessage('');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'No Email App',
          'Please email us directly at support@nutritrack.app'
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('Error', 'Could not open email app. Please email support@nutritrack.app directly.');
    } finally {
      setSending(false);
    }
  };

  const quickLinks = [
    {
      icon: FileText,
      title: 'Privacy Policy',
      description: 'How we handle your data',
      onPress: () => router.push('/privacy'),
    },
    {
      icon: Shield,
      title: 'Terms of Service',
      description: 'App usage guidelines',
      onPress: () => router.push('/terms'),
    },
    {
      icon: HelpCircle,
      title: 'FAQs',
      description: 'Common questions answered',
      onPress: () => {
        Alert.alert('FAQs', 'FAQ section coming soon!');
      },
    },
  ];

  const faqItems = [
    {
      question: 'How accurate is the AI food recognition?',
      answer:
        'Our AI provides estimates with 70-90% accuracy for common Indian dishes. Always review and adjust the detected items for best results.',
    },
    {
      question: 'How do I cancel my premium subscription?',
      answer:
        'Go to Profile → Subscription, then tap "Cancel Subscription". Your premium access continues until the end of the billing period.',
    },
    {
      question: 'Can I export my nutrition data?',
      answer:
        'Yes! Premium users can export data as CSV or PDF from the Profile screen. CSV includes all meal details, and PDF provides weekly reports.',
    },
    {
      question: 'Is my data secure and private?',
      answer:
        'Absolutely. We use end-to-end encryption, secure cloud storage, and never sell your data. Read our Privacy Policy for details.',
    },
    {
      question: 'How do I delete my account?',
      answer:
        'Go to Profile → Settings → Delete Account. Note that this action is permanent and will delete all your data within 30 days.',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contactCard}>
          <Mail size={32} color="#10b981" />
          <Text style={styles.contactTitle}>Get in Touch</Text>
          <Text style={styles.contactSubtitle}>
            We typically respond within 24 hours
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your issue"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your question or issue in detail..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSendEmail}
            disabled={sending}
          >
            <Send size={18} color="#ffffff" />
            <Text style={styles.sendButtonText}>
              {sending ? 'Opening Email...' : 'Send Message'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.emailDirect}>
            or email us directly at:{' '}
            <Text style={styles.emailLink}>support@nutritrack.app</Text>
          </Text>
        </View>

        <View style={styles.quickLinksSection}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          {quickLinks.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickLinkCard}
              onPress={link.onPress}
            >
              <View style={styles.quickLinkIcon}>
                <link.icon size={20} color="#10b981" />
              </View>
              <View style={styles.quickLinkContent}>
                <Text style={styles.quickLinkTitle}>{link.title}</Text>
                <Text style={styles.quickLinkDescription}>{link.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqItems.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 12,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 24,
  },
  formGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emailDirect: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emailLink: {
    color: '#10b981',
    fontWeight: '600',
  },
  quickLinksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickLinkContent: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  quickLinkDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  faqSection: {
    marginBottom: 24,
  },
  faqItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
});
