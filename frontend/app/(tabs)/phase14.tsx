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

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL as backendUrl } from '../../src/config/backend';

export default function Phase14Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [agentName, setAgentName] = useState('');
  const [selectedType, setSelectedType] = useState('assistant');

  useEffect(() => {
    fetchAgents();
    fetchWorkflows();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/agents`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Fetch agents error:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/workflows`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Fetch workflows error:', error);
    }
  };

  const createAgent = async () => {
    if (!agentName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/agents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          name: agentName,
          description: `${selectedType} AI agent powered by Grok 4.3`,
          type: selectedType,
          capabilities: ['text', 'vision', 'audio'],
          model: 'grok-4.3'
        })
      });
      const data = await response.json();
      setAgents([data, ...agents]);
      setAgentName('');
    } catch (error) {
      console.error('Create agent error:', error);
    }
    setLoading(false);
  };

  const agentTypes = [
    { id: 'assistant', icon: 'chatbubbles', label: 'Assistant', color: TikTokColors.pink },
    { id: 'analyst', icon: 'analytics', label: 'Analyst', color: '#3B82F6' },
    { id: 'creator', icon: 'brush', label: 'Creator', color: '#8B5CF6' },
    { id: 'moderator', icon: 'shield', label: 'Moderator', color: '#10B981' }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="hardware-chip" size={48} color="white" />
        <Text style={styles.headerTitle}>AI Agent Manager</Text>
        <Text style={styles.headerSubtitle}>Autonomous agents powered by Grok 4.3</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Create Agent */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Create New AI Agent</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Agent name..."
            placeholderTextColor={theme.textSecondary}
            value={agentName}
            onChangeText={setAgentName}
          />

          <Text style={[styles.label, { color: theme.text }]}>Agent Type:</Text>
          <View style={styles.typeGrid}>
            {agentTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  { backgroundColor: selectedType === type.id ? type.color + '20' : theme.background }
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={28} 
                  color={selectedType === type.id ? type.color : theme.textSecondary} 
                />
                <Text style={[
                  styles.typeLabel, 
                  { color: selectedType === type.id ? theme.text : theme.textSecondary }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#8B5CF6' }]}
            onPress={createAgent}
            disabled={loading || !agentName.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Agent</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.grokBadge, { backgroundColor: '#000' }]}>
            <Text style={styles.grokText}>⚡ Powered by Grok 4.3 Multimodal</Text>
          </View>
        </View>

        {/* My Agents */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My AI Agents</Text>
            <Text style={[styles.count, { color: theme.textSecondary }]}>({agents.length})</Text>
          </View>
          {agents.length > 0 ? (
            agents.map((agent, idx) => {
              const agentType = agentTypes.find(t => t.id === agent.type);
              return (
                <View key={idx} style={[styles.agentCard, { backgroundColor: theme.background }]}>
                  <View style={[styles.agentIcon, { backgroundColor: agentType?.color + '20' || '#ccc' }]}>
                    <Ionicons name={agentType?.icon as any || 'cube'} size={24} color={agentType?.color || '#666'} />
                  </View>
                  <View style={styles.agentInfo}>
                    <Text style={[styles.agentName, { color: theme.text }]}>{agent.name}</Text>
                    <Text style={[styles.agentType, { color: theme.textSecondary }]}>{agent.type} • {agent.model}</Text>
                    <View style={styles.agentStats}>
                      <View style={[styles.statusBadge, { backgroundColor: '#10B981' + '20' }]}>
                        <View style={styles.statusDot} />
                        <Text style={[styles.statusText, { color: '#10B981' }]}>{agent.status}</Text>
                      </View>
                      <Text style={[styles.statsText, { color: theme.textSecondary }]}>
                        {agent.stats?.tasks_completed || 0} tasks
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: agentType?.color }]}>
                    <Ionicons name="play" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No agents created yet</Text>
          )}
        </View>

        {/* Workflows */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Automation Workflows</Text>
            <Text style={[styles.count, { color: theme.textSecondary }]}>({workflows.length})</Text>
          </View>
          {workflows.length > 0 ? (
            workflows.map((workflow, idx) => (
              <View key={idx} style={[styles.workflowCard, { backgroundColor: theme.background }]}>
                <View style={styles.workflowInfo}>
                  <Text style={[styles.workflowName, { color: theme.text }]}>{workflow.name}</Text>
                  <Text style={[styles.workflowDesc, { color: theme.textSecondary }]}>
                    Trigger: {workflow.trigger?.type || 'manual'}
                  </Text>
                  <View style={styles.workflowStats}>
                    <Text style={[styles.workflowStat, { color: theme.textSecondary }]}>
                      {workflow.stats?.executions || 0} runs
                    </Text>
                    <Text style={[styles.workflowStat, { color: '#10B981' }]}>
                      {workflow.stats?.successes || 0} success
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: TikTokColors.cyan + '20' }]}>
                  <Text style={[styles.statusText, { color: TikTokColors.cyan }]}>{workflow.status}</Text>
                </View>
              </View>
            ))
          ) : (
            <TouchableOpacity style={[styles.createWorkflowButton, { backgroundColor: theme.background }]}>
              <Ionicons name="add-circle-outline" size={32} color={TikTokColors.pink} />
              <Text style={[styles.createWorkflowText, { color: theme.text }]}>Create Workflow</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Capabilities */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Agent Capabilities</Text>
          {[
            { icon: 'chatbubbles', title: 'Conversational AI', desc: 'Natural language processing' },
            { icon: 'eye', title: 'Computer Vision', desc: 'Image & video analysis' },
            { icon: 'mic', title: 'Voice Processing', desc: 'Speech-to-text & TTS' },
            { icon: 'flash', title: 'Autonomous Actions', desc: 'Execute tasks independently' }
          ].map((cap, idx) => (
            <View key={idx} style={styles.capabilityCard}>
              <Ionicons name={cap.icon as any} size={20} color={TikTokColors.pink} />
              <View style={styles.capabilityInfo}>
                <Text style={[styles.capabilityTitle, { color: theme.text }]}>{cap.title}</Text>
                <Text style={[styles.capabilityDesc, { color: theme.textSecondary }]}>{cap.desc}</Text>
              </View>
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
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  count: { fontSize: 14, marginLeft: 8 },
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  typeCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 16, borderRadius: 12 },
  typeLabel: { fontSize: 12, marginTop: 8, fontWeight: '600' },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  grokBadge: { padding: 8, borderRadius: 8, alignItems: 'center' },
  grokText: { color: 'white', fontSize: 11, fontWeight: '600' },
  agentCard: { padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  agentIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  agentType: { fontSize: 12, marginBottom: 8, textTransform: 'capitalize' },
  agentStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  statsText: { fontSize: 12 },
  actionButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', fontSize: 14, padding: 24 },
  workflowCard: { padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workflowInfo: { flex: 1 },
  workflowName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  workflowDesc: { fontSize: 12, marginBottom: 6 },
  workflowStats: { flexDirection: 'row', gap: 12 },
  workflowStat: { fontSize: 12 },
  createWorkflowButton: { padding: 24, borderRadius: 12, alignItems: 'center' },
  createWorkflowText: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  capabilityCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  capabilityInfo: { marginLeft: 12, flex: 1 },
  capabilityTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  capabilityDesc: { fontSize: 12 },
});