import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { BACKEND_URL as backendBaseUrl } from '../../src/config/backend';

const { width } = Dimensions.get('window');

/** GET /api/health (and the enterprise status endpoint) service map. */
interface SystemHealth {
  status?: string;
  database?: string | boolean;
  services?: Record<string, boolean | string | number | null | undefined>;
  [key: string]: unknown;
}

interface SystemMetrics {
  response_time?: number;
  requests_per_min?: number;
  active_users?: number;
  uptime?: number | string;
  [key: string]: unknown;
}

interface ApiKeyEntry {
  id?: string;
  name?: string;
  key?: string;
  created_at?: string | number | Date;
}

export default function EnterpriseScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // FIX: untyped useState(null)/useState([]) — the setters became
  // `(prev: null) => null` / `never[]`, so nothing could be stored and every
  // property read below reported "does not exist on type never".
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // FIX: app.json defines no `extra` block, so this was always '' and every
  // call below was a bare relative path that only works on web.
  const backendUrl = backendBaseUrl;

  const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/system/health`);
      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error('Error fetching health:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/system/metrics`);
      const data = await response.json();
      setSystemMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/api-keys`);
      const data = await response.json();
      setApiKeys(data.api_keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const generateApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/api-keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mobile App',
          permissions: ['read', 'write'],
        }),
      });
      const data = await response.json();
      alert(`API Key Generated:\n${data.api_key.key}`);
      fetchApiKeys();
    } catch (error) {
      alert('Error generating API key');
    }
    setLoading(false);
  };

  const clearCache = async () => {
    setLoading(true);
    try {
      await fetch(`${backendUrl}/api/cache/clear`, { method: 'POST' });
      alert('Cache cleared successfully!');
    } catch (error) {
      alert('Error clearing cache');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSystemHealth(), fetchSystemMetrics(), fetchApiKeys()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSystemHealth();
    fetchSystemMetrics();
    fetchApiKeys();
  }, []);

  const getHealthColor = (status?: string) => {
    if (status === 'healthy') return '#00C851';
    if (status === 'degraded') return '#ffbb33';
    return '#ff4444';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🏢 Enterprise Hub</Text>
        <Text style={styles.headerSubtitle}>System Monitoring & Management</Text>
      </LinearGradient>

      {/* System Health */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>System Health</Text>
        {systemHealth ? (
          <View style={styles.healthGrid}>
            <View style={[styles.healthCard, { backgroundColor: theme.card }]}>
              <View
                style={[
                  styles.healthDot,
                  { backgroundColor: getHealthColor(systemHealth.status) },
                ]}
              />
              <Text style={[styles.healthStatus, { color: theme.text }]}>
                {systemHealth.status || 'Unknown'}
              </Text>
              <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>
                Overall Status
              </Text>
            </View>
            <View style={[styles.healthCard, { backgroundColor: theme.card }]}>
              <Ionicons name="server" size={32} color={theme.primary} />
              <Text style={[styles.healthValue, { color: theme.text }]}>
                {systemHealth.services?.backend ? '✅' : '❌'}
              </Text>
              <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>
                Backend
              </Text>
            </View>
            <View style={[styles.healthCard, { backgroundColor: theme.card }]}>
              {/* FIX: "database" is not an Ionicons glyph name, so this
                  rendered an empty box. "server-outline" is the equivalent. */}
              <Ionicons name="server-outline" size={32} color={theme.primary} />
              <Text style={[styles.healthValue, { color: theme.text }]}>
                {systemHealth.services?.database ? '✅' : '❌'}
              </Text>
              <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>
                Database
              </Text>
            </View>
          </View>
        ) : (
          <ActivityIndicator size="large" color={theme.primary} />
        )}
      </View>

      {/* System Metrics */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance Metrics</Text>
        {systemMetrics ? (
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: '#FF0050' }]}>
              <Ionicons name="speedometer" size={28} color="#fff" />
              <Text style={styles.metricValue}>{systemMetrics.response_time || 'N/A'}</Text>
              <Text style={styles.metricLabel}>Response Time</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#00f2ea' }]}>
              <Ionicons name="analytics" size={28} color="#fff" />
              <Text style={styles.metricValue}>{systemMetrics.requests_per_min || 0}</Text>
              <Text style={styles.metricLabel}>Requests/min</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#10a37f' }]}>
              <Ionicons name="people" size={28} color="#fff" />
              <Text style={styles.metricValue}>{systemMetrics.active_users || 0}</Text>
              <Text style={styles.metricLabel}>Active Users</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#667eea' }]}>
              <Ionicons name="time" size={28} color="#fff" />
              <Text style={styles.metricValue}>{systemMetrics.uptime || 'N/A'}</Text>
              <Text style={styles.metricLabel}>Uptime</Text>
            </View>
          </View>
        ) : (
          <ActivityIndicator size="large" color={theme.primary} />
        )}
      </View>

      {/* Multi-Language Support */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>🌍 Language Support</Text>
        <View style={styles.languageGrid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                { backgroundColor: theme.card },
                selectedLanguage === lang.code && styles.languageCardSelected,
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text style={[styles.languageName, { color: theme.text }]}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* API Keys */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>🔑 API Keys</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#667eea' }]}
          onPress={generateApiKey}
          disabled={loading}
        >
          <Ionicons name="key" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Generate New API Key</Text>
          {loading && <ActivityIndicator color="#fff" />}
        </TouchableOpacity>
        <View style={styles.apiKeysList}>
          {apiKeys.length > 0 ? (
            apiKeys.map((key, index) => (
              <View key={index} style={[styles.apiKeyCard, { backgroundColor: theme.card }]}>
                <View style={styles.apiKeyHeader}>
                  <Ionicons name="key-outline" size={20} color={theme.primary} />
                  <Text style={[styles.apiKeyName, { color: theme.text }]}>
                    {key.name || 'API Key'}
                  </Text>
                </View>
                <Text style={[styles.apiKeyValue, { color: theme.textSecondary }]}>
                  {key.key?.substring(0, 20)}...
                </Text>
                <Text style={[styles.apiKeyMeta, { color: theme.textSecondary }]}>
                  Created: {key.created_at ? new Date(key.created_at).toLocaleDateString() : '—'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No API keys yet. Generate one above!
            </Text>
          )}
        </View>
      </View>

      {/* Cache Management */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>⚡ Cache Management</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ff4444' }]}
          onPress={clearCache}
          disabled={loading}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Clear Cache</Text>
          {loading && <ActivityIndicator color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* White Label */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>🎨 White Label</Text>
        <View style={styles.brandingCard}>
          <View style={styles.brandingRow}>
            <View style={[styles.colorBox, { backgroundColor: '#FF0050' }]} />
            <Text style={[styles.brandingText, { color: theme.text }]}>Primary Color</Text>
          </View>
          <View style={styles.brandingRow}>
            <View style={[styles.colorBox, { backgroundColor: '#00f2ea' }]} />
            <Text style={[styles.brandingText, { color: theme.text }]}>Secondary Color</Text>
          </View>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#667eea' }]}>
            <Ionicons name="color-palette" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Customize Branding</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 32,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  healthGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  healthCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  healthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  healthValue: {
    fontSize: 24,
    marginVertical: 8,
  },
  healthLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageCard: {
    width: (width - 64) / 3,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardSelected: {
    borderColor: '#FFD700',
  },
  languageFlag: {
    fontSize: 28,
    marginBottom: 4,
  },
  languageName: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginVertical: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  apiKeysList: {
    marginTop: 8,
  },
  apiKeyCard: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  apiKeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  apiKeyName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  apiKeyValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  apiKeyMeta: {
    fontSize: 11,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
  brandingCard: {
    gap: 12,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  brandingText: {
    fontSize: 14,
  },
});
