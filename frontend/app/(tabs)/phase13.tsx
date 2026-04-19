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

export default function Phase13Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [workspaceName, setWorkspaceName] = useState('');

  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/workspaces`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      console.error('Fetch workspaces error:', error);
    }
    setLoading(false);
  };

  const createWorkspace = async () => {
    if (!workspaceName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/workspace/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          name: workspaceName,
          description: 'Team collaboration workspace',
          type: 'team',
          members: []
        })
      });
      const data = await response.json();
      setWorkspaces([data, ...workspaces]);
      setWorkspaceName('');
    } catch (error) {
      console.error('Create workspace error:', error);
    }
    setLoading(false);
  };

  const startSession = async (workspaceId: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/collab/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: 'demo_project',
          type: 'brainstorm'
        })
      });
      const data = await response.json();
      setActiveSessions([data, ...activeSessions]);
    } catch (error) {
      console.error('Start session error:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#10B981', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="people" size={48} color="white" />
        <Text style={styles.headerTitle}>Team Collaboration</Text>
        <Text style={styles.headerSubtitle}>Real-time workspace & live sessions</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Create Workspace */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Create New Workspace</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Workspace name..."
            placeholderTextColor={theme.textSecondary}
            value={workspaceName}
            onChangeText={setWorkspaceName}
          />
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#10B981' }]}
            onPress={createWorkspace}
            disabled={loading || !workspaceName.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Workspace</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* My Workspaces */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My Workspaces</Text>
            <Text style={[styles.count, { color: theme.textSecondary }]}>({workspaces.length})</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={TikTokColors.pink} style={{ marginVertical: 24 }} />
          ) : workspaces.length > 0 ? (
            workspaces.map((workspace, idx) => (
              <View key={idx} style={[styles.workspaceCard, { backgroundColor: theme.background }]}>
                <View style={styles.workspaceInfo}>
                  <Text style={[styles.workspaceName, { color: theme.text }]}>{workspace.name}</Text>
                  <Text style={[styles.workspaceType, { color: theme.textSecondary }]}>{workspace.type} workspace</Text>
                  <View style={styles.workspaceStats}>
                    <View style={styles.stat}>
                      <Ionicons name="people" size={14} color={theme.textSecondary} />
                      <Text style={[styles.statText, { color: theme.textSecondary }]}>  
                        {workspace.members?.length || 1} members
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Ionicons name="folder" size={14} color={theme.textSecondary} />
                      <Text style={[styles.statText, { color: theme.textSecondary }]}>
                        {workspace.stats?.total_projects || 0} projects
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: TikTokColors.cyan }]}
                  onPress={() => startSession(workspace.workspace_id)}
                >
                  <Ionicons name="play" size={16} color="white" />
                  <Text style={styles.joinButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No workspaces yet</Text>
          )}
        </View>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Sessions</Text>
            {activeSessions.map((session, idx) => (
              <View key={idx} style={[styles.sessionCard, { backgroundColor: theme.background }]}>
                <View style={styles.sessionInfo}>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                  <Text style={[styles.sessionType, { color: theme.text }]}>{session.type} Session</Text>
                  <Text style={[styles.sessionTime, { color: theme.textSecondary }]}>
                    Started {new Date(session.started_at).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.participantCount}>
                  <Ionicons name="people" size={16} color={TikTokColors.pink} />
                  <Text style={[styles.participantText, { color: theme.text }]}>
                    {session.participants?.length || 1}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Features */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Collaboration Features</Text>
          {[
            { icon: 'chatbubbles', title: 'Team Chat', desc: 'Real-time messaging' },
            { icon: 'videocam', title: 'Live Sessions', desc: 'Video conferencing' },
            { icon: 'eye', title: 'Presence', desc: 'See who\'s online' },
            { icon: 'git-branch', title: 'Version Control', desc: 'Track changes' }
          ].map((feature, idx) => (
            <View key={idx} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: TikTokColors.pink + '20' }]}>
                <Ionicons name={feature.icon as any} size={24} color={TikTokColors.pink} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>{feature.desc}</Text>
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
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  workspaceCard: { padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workspaceInfo: { flex: 1 },
  workspaceName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  workspaceType: { fontSize: 12, marginBottom: 8, textTransform: 'capitalize' },
  workspaceStats: { flexDirection: 'row', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 12, marginLeft: 4 },
  joinButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  joinButtonText: { color: 'white', fontSize: 13, fontWeight: '600', marginLeft: 4 },
  emptyText: { textAlign: 'center', fontSize: 14, padding: 24 },
  sessionCard: { padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionInfo: { flex: 1 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 },
  liveText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  sessionType: { fontSize: 15, fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  sessionTime: { fontSize: 12 },
  participantCount: { flexDirection: 'row', alignItems: 'center', backgroundColor: TikTokColors.pink + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  participantText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  featureCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featureIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  featureDesc: { fontSize: 13 },
});