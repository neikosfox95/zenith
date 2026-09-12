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

export default function Phase19Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [modelName, setModelName] = useState('');
  const [trainingJobs, setTrainingJobs] = useState<any[]>([]);

  const startTraining = async () => {
    if (!modelName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/ml-training/job/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          model_name: modelName,
          architecture: 'transformer',
          dataset: 'custom_dataset',
          epochs: 100
        })
      });
      const data = await response.json();
      setTrainingJobs([data, ...trainingJobs]);
      setModelName('');
    } catch (error) {
      console.error('Training job error:', error);
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
        <Ionicons name="school" size={48} color="white" />
        <Text style={styles.headerTitle}>ML Training Lab</Text>
        <Text style={styles.headerSubtitle}>Train custom AI models</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Create Training Job */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>New Training Job</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Model name..."
            placeholderTextColor={theme.textSecondary}
            value={modelName}
            onChangeText={setModelName}
          />
          
          <View style={styles.settingsGrid}>
            {[
              { label: 'Architecture', value: 'Transformer', icon: 'git-network' },
              { label: 'Dataset', value: 'Custom', icon: 'file-tray-full' },
              { label: 'Epochs', value: '100', icon: 'repeat' },
              { label: 'GPU', value: 'A100', icon: 'hardware-chip' }
            ].map((setting, idx) => (
              <View key={idx} style={[styles.settingCard, { backgroundColor: theme.background }]}>
                <Ionicons name={setting.icon as any} size={20} color={TikTokColors.pink} />
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>{setting.label}</Text>
                <Text style={[styles.settingValue, { color: theme.text }]}>{setting.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#8B5CF6' }]}
            onPress={startTraining}
            disabled={loading || !modelName.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="rocket" size={20} color="white" />
                <Text style={styles.createButtonText}>Start Training</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Model Architectures */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Model Architectures</Text>
          {[
            { icon: 'flash', title: 'Transformer', desc: 'GPT, BERT, T5 architectures', color: '#8B5CF6' },
            { icon: 'eye', title: 'Computer Vision', desc: 'ResNet, YOLO, ViT models', color: '#EC4899' },
            { icon: 'chatbubbles', title: 'NLP', desc: 'LSTM, GRU, Attention models', color: '#3B82F6' },
            { icon: 'calculator', title: 'Tabular ML', desc: 'XGBoost, LightGBM, CatBoost', color: '#10B981' }
          ].map((arch, idx) => (
            <TouchableOpacity key={idx} style={[styles.archCard, { backgroundColor: theme.background }]}>
              <View style={[styles.archIcon, { backgroundColor: arch.color + '20' }]}>
                <Ionicons name={arch.icon as any} size={24} color={arch.color} />
              </View>
              <View style={styles.archInfo}>
                <Text style={[styles.archTitle, { color: theme.text }]}>{arch.title}</Text>
                <Text style={[styles.archDesc, { color: theme.textSecondary }]}>{arch.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Training Features */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Advanced Features</Text>
          </View>
          
          {[
            { icon: 'git-branch', title: 'Hyperparameter Tuning', desc: 'Automated optimization' },
            { icon: 'analytics', title: 'Real-time Monitoring', desc: 'TensorBoard integration' },
            { icon: 'cloud-upload', title: 'Distributed Training', desc: 'Multi-GPU support' },
            { icon: 'layers', title: 'Transfer Learning', desc: 'Pre-trained model fine-tuning' }
          ].map((feature, idx) => (
            <TouchableOpacity key={idx} style={[styles.featureCard, { backgroundColor: theme.background }]}>
              <Ionicons name={feature.icon as any} size={20} color="#F59E0B" />
              <View style={styles.featureInfo}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>{feature.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Training Jobs */}
        {trainingJobs.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Training Jobs</Text>
            {trainingJobs.map((job, idx) => (
              <View key={idx} style={[styles.jobCard, { backgroundColor: theme.background }]}>
                <View style={styles.jobInfo}>
                  <Text style={[styles.jobName, { color: theme.text }]}>{job.model_name}</Text>
                  <Text style={[styles.jobMeta, { color: theme.textSecondary }]}>Epoch 42/100 • 67% complete</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#10B981' + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.statusText, { color: '#10B981' }]}>Training</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Model Zoo */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps" size={24} color={TikTokColors.cyan} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Model Zoo</Text>
          </View>
          
          <Text style={[styles.zooDesc, { color: theme.textSecondary }]}>
            Access 1,000+ pre-trained models ready for fine-tuning
          </Text>

          <View style={styles.modelGrid}>
            {[
              { name: 'GPT-5.2', type: 'Text', params: '1.3T' },
              { name: 'DALL-E 3', type: 'Image', params: '600B' },
              { name: 'Whisper v3', type: 'Audio', params: '1.5B' },
              { name: 'Claude 5', type: 'Text', params: '2T' }
            ].map((model, idx) => (
              <TouchableOpacity key={idx} style={[styles.modelCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.modelName, { color: theme.text }]}>{model.name}</Text>
                <Text style={[styles.modelType, { color: theme.textSecondary }]}>{model.type}</Text>
                <Text style={[styles.modelParams, { color: TikTokColors.cyan }]}>{model.params}</Text>
              </TouchableOpacity>
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
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16 },
  settingsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  settingCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, borderRadius: 12 },
  settingLabel: { fontSize: 11, marginTop: 8 },
  settingValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  archCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  archIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  archInfo: { flex: 1 },
  archTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  archDesc: { fontSize: 12 },
  featureCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  featureInfo: { flex: 1, marginLeft: 12 },
  featureTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  featureDesc: { fontSize: 12 },
  jobCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginBottom: 12 },
  jobInfo: { flex: 1 },
  jobName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  jobMeta: { fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  zooDesc: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modelCard: { flex: 1, minWidth: '45%', padding: 12, borderRadius: 12, alignItems: 'center' },
  modelName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  modelType: { fontSize: 11, marginBottom: 4 },
  modelParams: { fontSize: 12, fontWeight: '700' },
});