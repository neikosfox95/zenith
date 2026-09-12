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

export default function Phase28Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [contractText, setContractText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [complianceCheck, setComplianceCheck] = useState<any>(null);

  const analyzeContract = async () => {
    if (!contractText.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/legal/contract/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          contract_text: contractText
        })
      });
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Analyze contract error:', error);
    }
    setLoading(false);
  };

  const searchLegalData = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/legal/research?query=${encodeURIComponent(searchQuery)}&jurisdiction=US`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Legal search error:', error);
    }
    setLoading(false);
  };

  const runComplianceCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/legal/compliance/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          business_type: 'tech_startup',
          regulations: ['GDPR', 'CCPA', 'SOC 2']
        })
      });
      const data = await response.json();
      if (data.success) {
        setComplianceCheck(data.compliance);
      }
    } catch (error) {
      console.error('Compliance check error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="hammer" size={48} color="white" />
        <Text style={styles.headerTitle}>Legal & Compliance AI</Text>
        <Text style={styles.headerSubtitle}>Powered by Grok 4.3 Legal AI</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Contract Analyzer */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#6366F1" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Contract Analyzer</Text>
          </View>
          
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Paste contract text here..."
            placeholderTextColor={theme.textSecondary}
            value={contractText}
            onChangeText={setContractText}
            multiline
            numberOfLines={6}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#6366F1' }]}
            onPress={analyzeContract}
            disabled={loading || !contractText.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="search" size={20} color="white" />
                <Text style={styles.actionButtonText}>Analyze Contract</Text>
              </>
            )}
          </TouchableOpacity>

          {analysis && (
            <View style={[styles.analysisBox, { backgroundColor: theme.background }]}>
              <View style={styles.riskBadge}>
                <Text style={[styles.riskLabel, { color: theme.textSecondary }]}>Risk Level:</Text>
                <View style={[styles.riskIndicator, { backgroundColor: analysis.risk_level === 'high' ? '#EF4444' : analysis.risk_level === 'medium' ? '#F59E0B' : '#10B981' }]}>
                  <Text style={styles.riskText}>{analysis.risk_level}</Text>
                </View>
              </View>

              <Text style={[styles.analysisTitle, { color: theme.text }]}>Key Terms Found:</Text>
              {analysis.key_terms?.map((term: string, idx: number) => (
                <Text key={idx} style={[styles.termText, { color: theme.textSecondary }]}>• {term}</Text>
              ))}

              <Text style={[styles.analysisTitle, { color: theme.text, marginTop: 16 }]}>Issues Detected:</Text>
              {analysis.issues?.map((issue: any, idx: number) => (
                <View key={idx} style={[styles.issueCard, { backgroundColor: theme.card }]}>
                  <View style={[styles.severityBadge, { backgroundColor: issue.severity === 'high' ? '#EF4444' : '#F59E0B' }]}>
                    <Text style={styles.severityText}>{issue.severity}</Text>
                  </View>
                  <Text style={[styles.issueText, { color: theme.textSecondary }]}>{issue.description}</Text>
                </View>
              ))}

              <Text style={[styles.analysisTitle, { color: theme.text, marginTop: 16 }]}>Recommendations:</Text>
              {analysis.recommendations?.map((rec: string, idx: number) => (
                <Text key={idx} style={[styles.recText, { color: '#10B981' }]}>✓ {rec}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Legal Research */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="search" size={24} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Legal Research</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Search case law, regulations..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={searchLegalData}
            disabled={loading || !searchQuery.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="search-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Search</Text>
              </>
            )}
          </TouchableOpacity>

          {searchResults.length > 0 && (
            <View style={{ marginTop: 16 }}>
              {searchResults.map((result, idx) => (
                <TouchableOpacity key={idx} style={[styles.resultCard, { backgroundColor: theme.background }]}>
                  <View style={styles.resultHeader}>
                    <Text style={[styles.resultTitle, { color: theme.text }]}>{result.case_name}</Text>
                    <Text style={[styles.resultYear, { color: theme.textSecondary }]}>{result.year}</Text>
                  </View>
                  <Text style={[styles.resultSummary, { color: theme.textSecondary }]}>{result.summary}</Text>
                  <View style={[styles.relevanceBadge, { backgroundColor: '#8B5CF6' + '20' }]}>
                    <Text style={[styles.relevanceText, { color: '#8B5CF6' }]}>{result.relevance}% relevant</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Compliance Checker */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkbox" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Compliance Checker</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={runComplianceCheck}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="white" />
                <Text style={styles.actionButtonText}>Run Compliance Check</Text>
              </>
            )}
          </TouchableOpacity>

          {complianceCheck && (
            <View style={[styles.complianceBox, { backgroundColor: theme.background }]}>
              <View style={styles.scoreCircle}>
                <Text style={[styles.scoreValue, { color: complianceCheck.overall_score >= 80 ? '#10B981' : '#F59E0B' }]}>{complianceCheck.overall_score}</Text>
                <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Score</Text>
              </View>

              <Text style={[styles.complianceStatus, { color: theme.text }]}>Status: {complianceCheck.status}</Text>

              {complianceCheck.checks?.map((check: any, idx: number) => (
                <View key={idx} style={[styles.checkCard, { backgroundColor: theme.card }]}>
                  <View style={styles.checkHeader}>
                    <Text style={[styles.checkName, { color: theme.text }]}>{check.regulation}</Text>
                    <Ionicons name={check.compliant ? 'checkmark-circle' : 'close-circle'} size={24} color={check.compliant ? '#10B981' : '#EF4444'} />
                  </View>
                  <Text style={[styles.checkScore, { color: theme.textSecondary }]}>Score: {check.score}/100</Text>
                  {check.issues?.map((issue: string, iidx: number) => (
                    <Text key={iidx} style={[styles.checkIssue, { color: '#EF4444' }]}>• {issue}</Text>
                  ))}
                </View>
              ))}

              {complianceCheck.action_items?.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.analysisTitle, { color: theme.text }]}>Action Items:</Text>
                  {complianceCheck.action_items.map((item: string, idx: number) => (
                    <Text key={idx} style={[styles.actionItem, { color: theme.textSecondary }]}>{idx + 1}. {item}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Document Templates */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Document Templates</Text>
          </View>
          
          {[
            { name: 'NDA Agreement', icon: 'lock-closed', color: '#6366F1' },
            { name: 'Service Agreement', icon: 'document-text', color: '#10B981' },
            { name: 'Employment Contract', icon: 'people', color: '#8B5CF6' },
            { name: 'Terms of Service', icon: 'shield', color: '#F59E0B' },
          ].map((template, idx) => (
            <TouchableOpacity key={idx} style={[styles.templateCard, { backgroundColor: theme.background }]}>
              <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
                <Ionicons name={template.icon as any} size={24} color={template.color} />
              </View>
              <Text style={[styles.templateName, { color: theme.text }]}>{template.name}</Text>
              <Ionicons name="download" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  textArea: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16, minHeight: 120, textAlignVertical: 'top' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  analysisBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  riskBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  riskLabel: { fontSize: 14 },
  riskIndicator: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  riskText: { color: 'white', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  analysisTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  termText: { fontSize: 13, marginBottom: 6, paddingLeft: 8 },
  issueCard: { padding: 12, borderRadius: 8, marginBottom: 8 },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  severityText: { color: 'white', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  issueText: { fontSize: 13 },
  recText: { fontSize: 13, marginBottom: 6, paddingLeft: 8 },
  resultCard: { padding: 12, borderRadius: 12, marginBottom: 12 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resultTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  resultYear: { fontSize: 13 },
  resultSummary: { fontSize: 13, marginBottom: 8 },
  relevanceBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  relevanceText: { fontSize: 11, fontWeight: '600' },
  complianceBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  scoreCircle: { alignSelf: 'center', alignItems: 'center', marginBottom: 16 },
  scoreValue: { fontSize: 48, fontWeight: '700' },
  scoreLabel: { fontSize: 13, marginTop: 4 },
  complianceStatus: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  checkCard: { padding: 12, borderRadius: 12, marginBottom: 12 },
  checkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  checkName: { fontSize: 15, fontWeight: '600' },
  checkScore: { fontSize: 12, marginBottom: 8 },
  checkIssue: { fontSize: 12, marginBottom: 4 },
  actionItem: { fontSize: 13, marginBottom: 8 },
  templateCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  templateIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  templateName: { flex: 1, fontSize: 15, fontWeight: '600' },
});