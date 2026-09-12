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

export default function Phase18Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState<any[]>([]);

  const createProject = async () => {
    if (!projectName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/video-editor/project/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          name: projectName,
          resolution: '4k',
          fps: 60,
          aspect_ratio: '16:9'
        })
      });
      const data = await response.json();
      setProjects([data, ...projects]);
      setProjectName('');
    } catch (error) {
      console.error('Create project error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#EF4444', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="film" size={48} color="white" />
        <Text style={styles.headerTitle}>Video Editor</Text>
        <Text style={styles.headerSubtitle}>Professional post-production</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Create Project */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>New Video Project</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Project name..."
            placeholderTextColor={theme.textSecondary}
            value={projectName}
            onChangeText={setProjectName}
          />
          
          <View style={styles.settingsGrid}>
            {[
              { label: 'Resolution', value: '4K', icon: 'expand' },
              { label: 'Frame Rate', value: '60 FPS', icon: 'speedometer' },
              { label: 'Aspect Ratio', value: '16:9', icon: 'crop' },
              { label: 'Color Space', value: 'Rec709', icon: 'color-palette' }
            ].map((setting, idx) => (
              <View key={idx} style={[styles.settingCard, { backgroundColor: theme.background }]}>
                <Ionicons name={setting.icon as any} size={20} color={TikTokColors.pink} />
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>{setting.label}</Text>
                <Text style={[styles.settingValue, { color: theme.text }]}>{setting.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#EF4444' }]}
            onPress={createProject}
            disabled={loading || !projectName.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Project</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Editing Tools */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Editing Tools</Text>
          {[
            { icon: 'color-palette', title: 'Color Grading', desc: 'Cinematic, Vibrant, Moody presets', color: '#8B5CF6' },
            { icon: 'sparkles', title: 'Visual Effects', desc: 'Green screen, Motion tracking', color: '#EC4899' },
            { icon: 'cut', title: 'Multi-Track Editing', desc: '4 tracks: Video, Audio, Effects, Text', color: '#3B82F6' },
            { icon: 'volume-high', title: 'Audio Mixing', desc: 'Professional audio post-production', color: '#10B981' }
          ].map((tool, idx) => (
            <TouchableOpacity key={idx} style={[styles.toolCard, { backgroundColor: theme.background }]}>
              <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
                <Ionicons name={tool.icon as any} size={24} color={tool.color} />
              </View>
              <View style={styles.toolInfo}>
                <Text style={[styles.toolTitle, { color: theme.text }]}>{tool.title}</Text>
                <Text style={[styles.toolDesc, { color: theme.textSecondary }]}>{tool.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Auto-Edit */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hardware-chip" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Auto-Edit (Grok 4.3)</Text>
          </View>
          
          <Text style={[styles.aiDesc, { color: theme.textSecondary }]}>
            Let AI automatically edit your videos with intelligent cuts, music sync, and pacing.
          </Text>

          <View style={styles.styleOptions}>
            {[
              { label: 'Fast-Paced', icon: 'flash' },
              { label: 'Cinematic', icon: 'film' },
              { label: 'Documentary', icon: 'book' },
              { label: 'Vlog', icon: 'person' }
            ].map((style, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.styleChip, { backgroundColor: theme.background }]}
              >
                <Ionicons name={style.icon as any} size={16} color="#F59E0B" />
                <Text style={[styles.styleLabel, { color: theme.text }]}>{style.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.aiButton, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="sparkles" size={20} color="white" />
            <Text style={styles.aiButtonText}>Generate AI Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Export Options */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-download" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Export Settings</Text>
          </View>
          
          {[
            { format: 'MP4', codec: 'H.264', size: '~500MB', quality: 'High' },
            { format: 'MOV', codec: 'ProRes', size: '~2GB', quality: 'Ultra' },
            { format: 'WebM', codec: 'VP9', size: '~300MB', quality: 'Good' }
          ].map((preset, idx) => (
            <TouchableOpacity key={idx} style={[styles.exportCard, { backgroundColor: theme.background }]}>
              <View style={styles.exportInfo}>
                <Text style={[styles.exportFormat, { color: theme.text }]}>{preset.format}</Text>
                <Text style={[styles.exportDetails, { color: theme.textSecondary }]}>
                  {preset.codec} • {preset.size} • {preset.quality}
                </Text>
              </View>
              <View style={[styles.qualityBadge, { backgroundColor: '#10B981' + '20' }]}>
                <Text style={[styles.qualityText, { color: '#10B981' }]}>{preset.quality}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Projects */}
        {projects.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Projects</Text>
            {projects.map((project, idx) => (
              <View key={idx} style={[styles.projectCard, { backgroundColor: theme.background }]}>
                <View style={styles.projectInfo}>
                  <Text style={[styles.projectName, { color: theme.text }]}>{project.name}</Text>
                  <Text style={[styles.projectMeta, { color: theme.textSecondary }]}>
                    {project.settings?.resolution} • {project.settings?.fps}fps
                  </Text>
                </View>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: TikTokColors.pink }]}>
                  <Ionicons name="create" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16 },
  settingsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  settingCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, borderRadius: 12 },
  settingLabel: { fontSize: 11, marginTop: 8 },
  settingValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  toolCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  toolIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  toolInfo: { flex: 1 },
  toolTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  toolDesc: { fontSize: 12 },
  aiDesc: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  styleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  styleChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  styleLabel: { fontSize: 13, marginLeft: 6, fontWeight: '600' },
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  aiButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  exportCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginBottom: 12 },
  exportInfo: { flex: 1 },
  exportFormat: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  exportDetails: { fontSize: 12 },
  qualityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  qualityText: { fontSize: 11, fontWeight: '600' },
  projectCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginBottom: 12 },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  projectMeta: { fontSize: 12 },
  editButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});