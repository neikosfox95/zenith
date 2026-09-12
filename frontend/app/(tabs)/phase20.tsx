import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { TikTokColors } from '../../src/constants/tiktokTheme';

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL as backendUrl } from '../../src/config/backend';

export default function Phase20Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  const generateApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/developer/api-key/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          name: 'New API Key',
          permissions: ['read', 'write']
        })
      });
      const data = await response.json();
      setApiKey(data.api_key || 'sk_live_abc123...');
    } catch (error) {
      console.error('Generate API key error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="code-slash" size={48} color="white" />
        <Text style={styles.headerTitle}>Developer Portal</Text>
        <Text style={styles.headerSubtitle}>APIs, SDKs & Documentation</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* API Key Management */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="key" size={24} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>API Key Management</Text>
          </View>

          {apiKey ? (
            <View style={[styles.keyDisplay, { backgroundColor: theme.background }]}>
              <Text style={[styles.keyText, { color: theme.text }]}>{apiKey}</Text>
              <TouchableOpacity style={[styles.copyButton, { backgroundColor: TikTokColors.pink }]}>
                <Ionicons name="copy" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: '#3B82F6' }]}
            onPress={generateApiKey}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.generateButtonText}>Generate New Key</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.statsGrid}>
            {[
              { label: 'API Calls', value: '1.2M', icon: 'flash' },
              { label: 'Bandwidth', value: '45GB', icon: 'cloud-download' },
              { label: 'Uptime', value: '99.9%', icon: 'checkmark-circle' },
              { label: 'Latency', value: '42ms', icon: 'speedometer' }
            ].map((stat, idx) => (
              <View key={idx} style={[styles.statCard, { backgroundColor: theme.background }]}>
                <Ionicons name={stat.icon as any} size={20} color={TikTokColors.cyan} />
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SDK & Libraries */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>SDKs & Libraries</Text>
          {[
            { lang: 'JavaScript', package: 'npm install @tiktok-ai/sdk', color: '#F7DF1E', icon: 'logo-javascript' },
            { lang: 'Python', package: 'pip install tiktok-ai-sdk', color: '#3776AB', icon: 'logo-python' },
            { lang: 'Go', package: 'go get github.com/tiktok-ai/sdk-go', color: '#00ADD8', icon: 'logo-google' },
            { lang: 'Ruby', package: 'gem install tiktok-ai', color: '#CC342D', icon: 'diamond' }
          ].map((sdk, idx) => (
            <TouchableOpacity key={idx} style={[styles.sdkCard, { backgroundColor: theme.background }]}>
              <View style={[styles.sdkIcon, { backgroundColor: sdk.color + '20' }]}>
                <Ionicons name={sdk.icon as any} size={24} color={sdk.color} />
              </View>
              <View style={styles.sdkInfo}>
                <Text style={[styles.sdkLang, { color: theme.text }]}>{sdk.lang}</Text>
                <Text style={[styles.sdkPackage, { color: theme.textSecondary }]}>{sdk.package}</Text>
              </View>
              <Ionicons name="download" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* API Endpoints */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>API Endpoints</Text>
          </View>
          
          {[
            { method: 'POST', endpoint: '/api/ai/generate', desc: 'Generate AI content' },
            { method: 'GET', endpoint: '/api/creators/:id', desc: 'Get creator data' },
            { method: 'POST', endpoint: '/api/voice/transcribe', desc: 'Transcribe audio' },
            { method: 'POST', endpoint: '/api/video/edit', desc: 'Edit video content' }
          ].map((endpoint, idx) => (
            <TouchableOpacity key={idx} style={[styles.endpointCard, { backgroundColor: theme.background }]}>
              <View style={[styles.methodBadge, { backgroundColor: endpoint.method === 'POST' ? '#10B981' : '#3B82F6' }]}>
                <Text style={styles.methodText}>{endpoint.method}</Text>
              </View>
              <View style={styles.endpointInfo}>
                <Text style={[styles.endpointPath, { color: theme.text }]}>{endpoint.endpoint}</Text>
                <Text style={[styles.endpointDesc, { color: theme.textSecondary }]}>{endpoint.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Code Examples */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Code Examples</Text>
          </View>
          
          <View style={[styles.codeBlock, { backgroundColor: '#1a1a1a' }]}>
            <Text style={styles.codeText}>
              {`const TikTokAI = require('@tiktok-ai/sdk');

const client = new TikTokAI({
  apiKey: 'YOUR_API_KEY'
});

const response = await client.ai.generate({
  prompt: 'Create engaging content',
  model: 'grok-4.3'
});`}
            </Text>
          </View>

          <TouchableOpacity style={[styles.copyCodeButton, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="copy" size={16} color="white" />
            <Text style={styles.copyCodeText}>Copy Code</Text>
          </TouchableOpacity>
        </View>

        {/* Documentation Links */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Documentation</Text>
          {[
            { icon: 'book', title: 'API Reference', url: 'docs.tiktok-ai.com/api' },
            { icon: 'rocket', title: 'Quick Start Guide', url: 'docs.tiktok-ai.com/quickstart' },
            { icon: 'help-circle', title: 'Support & FAQ', url: 'support.tiktok-ai.com' },
            { icon: 'chatbubbles', title: 'Discord Community', url: 'discord.gg/tiktok-ai' }
          ].map((doc, idx) => (
            <TouchableOpacity key={idx} style={[styles.docCard, { backgroundColor: theme.background }]}>
              <Ionicons name={doc.icon as any} size={20} color={TikTokColors.pink} />
              <View style={styles.docInfo}>
                <Text style={[styles.docTitle, { color: theme.text }]}>{doc.title}</Text>
                <Text style={[styles.docUrl, { color: theme.textSecondary }]}>{doc.url}</Text>
              </View>
              <Ionicons name="open" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Webhooks */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-merge" size={24} color="#EC4899" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Webhooks</Text>
          </View>
          
          <Text style={[styles.webhookDesc, { color: theme.textSecondary }]}>
            Receive real-time notifications for events in your application
          </Text>

          <View style={styles.eventList}>
            {[
              { event: 'ai.generation.complete', desc: 'AI content generated' },
              { event: 'video.processing.complete', desc: 'Video processing done' },
              { event: 'user.subscription.updated', desc: 'Subscription changed' }
            ].map((webhook, idx) => (
              <View key={idx} style={[styles.eventCard, { backgroundColor: theme.background }]}>
                <View style={[styles.eventDot, { backgroundColor: '#EC4899' }]} />
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventName, { color: theme.text }]}>{webhook.event}</Text>
                  <Text style={[styles.eventDesc, { color: theme.textSecondary }]}>{webhook.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 60, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 12 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  content: { padding: 16 },
  section: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
  keyDisplay: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  keyText: { flex: 1, fontSize: 13, fontFamily: 'monospace' },
  copyButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 16 },
  generateButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, borderRadius: 12 },
  statLabel: { fontSize: 11, marginTop: 8 },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  sdkCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  sdkIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sdkInfo: { flex: 1 },
  sdkLang: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  sdkPackage: { fontSize: 12, fontFamily: 'monospace' },
  endpointCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  methodBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 12 },
  methodText: { color: 'white', fontSize: 12, fontWeight: '700' },
  endpointInfo: { flex: 1 },
  endpointPath: { fontSize: 13, fontWeight: '600', marginBottom: 2, fontFamily: 'monospace' },
  endpointDesc: { fontSize: 12 },
  codeBlock: { padding: 16, borderRadius: 12, marginBottom: 12 },
  codeText: { color: '#00F2EA', fontSize: 12, fontFamily: 'monospace', lineHeight: 20 },
  copyCodeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12 },
  copyCodeText: { color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  docCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  docInfo: { flex: 1, marginLeft: 12 },
  docTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  docUrl: { fontSize: 12, fontFamily: 'monospace' },
  webhookDesc: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  eventList: { gap: 12 },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  eventDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 13, fontWeight: '600', marginBottom: 2, fontFamily: 'monospace' },
  eventDesc: { fontSize: 11 },
});