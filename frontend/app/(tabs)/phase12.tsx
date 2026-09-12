import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
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

export default function Phase12Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('shap-e');
  const [models3D, setModels3D] = useState<any[]>([]);
  const [generations, setGenerations] = useState<any[]>([]);
  const [arExperiences, setARExperiences] = useState<any[]>([]);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/3d/models`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      setModels3D(data.models || []);
    } catch (error) {
      console.error('Fetch models error:', error);
    }
  };

  const generate3D = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/3d/generate/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          format: 'glb',
          texture_quality: 'high'
        })
      });
      const data = await response.json();
      setGenerations([data, ...generations]);
      setPrompt('');
    } catch (error) {
      console.error('Generate 3D error:', error);
    }
    setLoading(false);
  };

  const createARExperience = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/ar/experience/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          name: 'AR Demo',
          type: 'face-filter',
          interactions: ['tap', 'swipe']
        })
      });
      const data = await response.json();
      setARExperiences([data, ...arExperiences]);
    } catch (error) {
      console.error('Create AR error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="cube" size={48} color="white" />
        <Text style={styles.headerTitle}>3D & AR Creator</Text>
        <Text style={styles.headerSubtitle}>Generate 3D models & AR experiences</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Text to 3D Generator */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Text to 3D Model</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Describe your 3D model..."
            placeholderTextColor={theme.textSecondary}
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />

          {/* Model Selection */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelScroll}>
            {['shap-e', 'point-e', 'dreamfusion', '3dgen'].map(model => (
              <TouchableOpacity
                key={model}
                style={[
                  styles.modelChip,
                  { backgroundColor: selectedModel === model ? TikTokColors.pink : theme.background }
                ]}
                onPress={() => setSelectedModel(model)}
              >
                <Text style={[styles.modelChipText, { color: selectedModel === model ? 'white' : theme.text }]}>
                  {model}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: TikTokColors.pink }]}
            onPress={generate3D}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="cube-outline" size={20} color="white" />
                <Text style={styles.generateButtonText}>Generate 3D Model</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Generations */}
        {generations.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Generations</Text>
            {generations.slice(0, 3).map((gen, idx) => (
              <View key={idx} style={[styles.genCard, { backgroundColor: theme.background }]}>
                <View style={styles.genInfo}>
                  <Text style={[styles.genPrompt, { color: theme.text }]}>{gen.prompt}</Text>
                  <Text style={[styles.genModel, { color: theme.textSecondary }]}>{gen.model}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: TikTokColors.cyan + '20' }]}>
                  <Text style={[styles.statusText, { color: TikTokColors.cyan }]}>{gen.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* AR Experience Creator */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>AR Experience</Text>
          <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
            Create AR filters for social media platforms
          </Text>

          <View style={styles.arTypes}>
            {[
              { id: 'face', icon: 'happy', label: 'Face Filter' },
              { id: 'world', icon: 'globe', label: 'World AR' },
              { id: 'body', icon: 'body', label: 'Body Tracking' }
            ].map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.arTypeCard, { backgroundColor: theme.background }]}
              >
                <Ionicons name={type.icon as any} size={32} color={TikTokColors.pink} />
                <Text style={[styles.arTypeLabel, { color: theme.text }]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: TikTokColors.cyan }]}
            onPress={createARExperience}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.createButtonText}>Create AR Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Available Models Info */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Available Models ({models3D.length})</Text>
          {models3D.slice(0, 4).map((model, idx) => (
            <View key={idx} style={styles.modelInfoCard}>
              <View>
                <Text style={[styles.modelName, { color: theme.text }]}>{model.id}</Text>
                <Text style={[styles.modelProvider, { color: theme.textSecondary }]}>{model.provider}</Text>
              </View>
              <View style={styles.modelBadges}>
                <View style={[styles.badge, { backgroundColor: '#10B981' + '20' }]}>
                  <Text style={[styles.badgeText, { color: '#10B981' }]}>{model.quality}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: TikTokColors.pink + '20' }]}>
                  <Text style={[styles.badgeText, { color: TikTokColors.pink }]}>{model.speed}</Text>
                </View>
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
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  sectionDesc: { fontSize: 13, marginBottom: 16 },
  input: { borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, marginBottom: 12 },
  modelScroll: { marginBottom: 16 },
  modelChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  modelChipText: { fontSize: 13, fontWeight: '600' },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  generateButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  genCard: { padding: 12, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  genInfo: { flex: 1 },
  genPrompt: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  genModel: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  arTypes: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  arTypeCard: { alignItems: 'center', padding: 16, borderRadius: 12, flex: 1, marginHorizontal: 4 },
  arTypeLabel: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  modelInfoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modelName: { fontSize: 14, fontWeight: '600' },
  modelProvider: { fontSize: 12, marginTop: 2 },
  modelBadges: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});