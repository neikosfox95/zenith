import React, { useState, useEffect } from 'react';
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
import Constants from 'expo-constants';

export default function Phase15Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [orgName, setOrgName] = useState('');

  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

  const createOrganization = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/org/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          name: orgName,
          description: 'Enterprise organization',
          industry: 'technology',
          size: 'enterprise'
        })
      });
      const data = await response.json();
      setOrganizations([data, ...organizations]);
      setOrgName('');
    } catch (error) {
      console.error('Create org error:', error);
    }
    setLoading(false);
  };

  const fetchUsage = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/org/demo_org_id/usage?period=30d`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Fetch usage error:', error);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#1E40AF', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="business" size={48} color="white" />
        <Text style={styles.headerTitle}>Enterprise Admin</Text>
        <Text style={styles.headerSubtitle}>Organization & team management</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Create Organization */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Create Organization</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Organization name..."
            placeholderTextColor={theme.textSecondary}
            value={orgName}
            onChangeText={setOrgName}
          />
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#1E40AF' }]}
            onPress={createOrganization}
            disabled={loading || !orgName.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Organization</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Usage Statistics */}
        {usage && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={24} color={TikTokColors.pink} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Usage Analytics (30 Days)</Text>
            </View>
            
            <View style={styles.usageGrid}>
              <View style={styles.usageCard}>
                <Text style={[styles.usageValue, { color: theme.text }]}>
                  {(usage.api_calls?.total / 1000).toFixed(0)}K
                </Text>
                <Text style={[styles.usageLabel, { color: theme.textSecondary }]}>API Calls</Text>
              </View>
              <View style={styles.usageCard}>
                <Text style={[styles.usageValue, { color: theme.text }]}>
                  {usage.storage?.total_gb.toFixed(0)} GB
                </Text>
                <Text style={[styles.usageLabel, { color: theme.textSecondary }]}>Storage</Text>
              </View>
              <View style={styles.usageCard}>
                <Text style={[styles.usageValue, { color: theme.text }]}>
                  {usage.users?.total_active}
                </Text>
                <Text style={[styles.usageLabel, { color: theme.textSecondary }]}>Active Users</Text>
              </View>
              <View style={styles.usageCard}>
                <Text style={[styles.usageValue, { color: '#10B981' }]}>
                  ${usage.costs?.total.toFixed(2)}
                </Text>
                <Text style={[styles.usageLabel, { color: theme.textSecondary }]}>Total Cost</Text>
              </View>
            </View>

            {/* Cost Breakdown */}
            <View style={styles.breakdown}>
              <Text style={[styles.breakdownTitle, { color: theme.text }]}>Cost by Service:</Text>
              {Object.entries(usage.costs?.by_service || {}).map(([service, cost]: [string, any]) => (
                <View key={service} style={styles.breakdownRow}>
                  <Text style={[styles.serviceName, { color: theme.text }]}>{service.replace(/-/g, ' ')}</Text>
                  <Text style={[styles.serviceCost, { color: theme.textSecondary }]}>${cost.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Team Management */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color={TikTokColors.cyan} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Team Management</Text>
          </View>
          
          {[
            { role: 'Owner', permissions: 'Full access', count: 1, color: '#EF4444' },
            { role: 'Admin', permissions: 'Manage members & projects', count: 3, color: '#F59E0B' },
            { role: 'Member', permissions: 'Create content', count: 12, color: '#10B981' },
            { role: 'Viewer', permissions: 'View only', count: 8, color: '#6B7280' }
          ].map((role, idx) => (
            <View key={idx} style={[styles.roleCard, { backgroundColor: theme.background }]}>
              <View style={[styles.roleIcon, { backgroundColor: role.color + '20' }]}>
                <Text style={[styles.roleCount, { color: role.color }]}>{role.count}</Text>
              </View>
              <View style={styles.roleInfo}>
                <Text style={[styles.roleName, { color: theme.text }]}>{role.role}</Text>
                <Text style={[styles.rolePermissions, { color: theme.textSecondary }]}>{role.permissions}</Text>
              </View>
              <TouchableOpacity style={[styles.manageButton, { backgroundColor: role.color }]}>
                <Ionicons name="settings" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Billing */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Billing & Subscription</Text>
          </View>
          
          <View style={[styles.planCard, { backgroundColor: theme.background }]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.text }]}>Enterprise Plan</Text>
              <View style={[styles.planBadge, { backgroundColor: '#10B981' + '20' }]}>
                <Text style={[styles.planBadgeText, { color: '#10B981' }]}>Active</Text>
              </View>
            </View>
            <Text style={[styles.planPrice, { color: theme.text }]}>$2,499.00/month</Text>
            <Text style={[styles.planSeats, { color: theme.textSecondary }]}>100 seats included</Text>
            <Text style={[styles.planNext, { color: theme.textSecondary }]}>Next billing: June 30, 2025</Text>
          </View>

          <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: TikTokColors.pink }]}>
            <Ionicons name="arrow-up-circle" size={20} color="white" />
            <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Security Features */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Security & Compliance</Text>
          </View>
          
          {[
            { feature: 'SSO Enabled', status: true },
            { feature: 'MFA Required', status: true },
            { feature: 'IP Whitelist', status: false },
            { feature: 'Audit Logging', status: true }
          ].map((item, idx) => (
            <View key={idx} style={styles.securityRow}>
              <Text style={[styles.securityFeature, { color: theme.text }]}>{item.feature}</Text>
              <View style={[styles.statusDot, { backgroundColor: item.status ? '#10B981' : '#6B7280' }]} />
            </View>
          ))}
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
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  usageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  usageCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12 },
  usageValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  usageLabel: { fontSize: 12 },
  breakdown: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  breakdownTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  serviceName: { fontSize: 13, textTransform: 'capitalize' },
  serviceCost: { fontSize: 13, fontWeight: '600' },
  roleCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  roleIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  roleCount: { fontSize: 18, fontWeight: 'bold' },
  roleInfo: { flex: 1 },
  roleName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rolePermissions: { fontSize: 12 },
  manageButton: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  planCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName: { fontSize: 16, fontWeight: '700' },
  planBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  planBadgeText: { fontSize: 11, fontWeight: '600' },
  planPrice: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  planSeats: { fontSize: 13, marginBottom: 4 },
  planNext: { fontSize: 12 },
  upgradeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  upgradeButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  securityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  securityFeature: { fontSize: 14 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
});