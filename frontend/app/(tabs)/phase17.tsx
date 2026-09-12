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

export default function Phase17Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [experienceName, setExperienceName] = useState('');
  const [vrPrompt, setVRPrompt] = useState('');

  const createAR = async () => {
    setLoading(true);
    try {
      await fetch(`${backendUrl}/api/ar/experience/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          name: experienceName || 'AR Experience',
          type: 'face-filter',
          interactions: ['tap', 'swipe']
        })
      });
      setExperienceName('');
    } catch (error) {
      console.error('Create AR error:', error);
    }
    setLoading(false);
  };

  const generateVR = async () => {
    setLoading(true);
    try {
      await fetch(`${backendUrl}/api/vr/environment/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          prompt: vrPrompt,
          style: 'realistic',
          size: 'large',
          interactive_elements: ['objects', 'lighting']
        })
      });
      setVRPrompt('');
    } catch (error) {
      console.error('Generate VR error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#EC4899', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="glasses" size={48} color="white" />
        <Text style={styles.headerTitle}>AR/VR Studio</Text>
        <Text style={styles.headerSubtitle}>Immersive content creation</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* AR Experience Creator */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="camera" size={24} color={TikTokColors.pink} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Create AR Experience</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Experience name..."
            placeholderTextColor={theme.textSecondary}
            value={experienceName}
            onChangeText={setExperienceName}
          />

          <View style={styles.arTypes}>
            {[
              { id: 'face', icon: 'happy', label: 'Face Filter', desc: 'Snapchat/Instagram style' },
              { id: 'world', icon: 'globe', label: 'World AR', desc: 'Place objects in real world' },
              { id: 'body', icon: 'body', label: 'Body Track', desc: 'Full body tracking' },
              { id: 'image', icon: 'image', label: 'Image Track', desc: 'Marker-based AR' }
            ].map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.arTypeCard, { backgroundColor: theme.background }]}
              >
                <Ionicons name={type.icon as any} size={28} color={TikTokColors.pink} />
                <Text style={[styles.arTypeLabel, { color: theme.text }]}>{type.label}</Text>
                <Text style={[styles.arTypeDesc, { color: theme.textSecondary }]}>{type.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: TikTokColors.pink }]}
            onPress={createAR}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.createButtonText}>Create AR Experience</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* VR Environment Generator */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="game-controller" size={24} color={TikTokColors.cyan} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Generate VR Environment</Text>
          </View>
          
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Describe your VR world (e.g., 'futuristic city at night with neon lights')..."
            placeholderTextColor={theme.textSecondary}
            value={vrPrompt}
            onChangeText={setVRPrompt}
            multiline
          />

          <View style={styles.vrOptions}>
            {[
              { label: 'Realistic', icon: 'eye' },
              { label: 'Stylized', icon: 'color-palette' },
              { label: 'Abstract', icon: 'shapes' },
              { label: 'Futuristic', icon: 'rocket' }
            ].map((style, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.styleChip, { backgroundColor: theme.background }]}
              >
                <Ionicons name={style.icon as any} size={16} color={TikTokColors.cyan} />
                <Text style={[styles.styleChipText, { color: theme.text }]}>{style.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: TikTokColors.cyan }]}
            onPress={generateVR}
            disabled={loading || !vrPrompt.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="cube" size={20} color="white" />
                <Text style={styles.createButtonText}>Generate VR World</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.estimatedTime, { color: theme.textSecondary }]}>Estimated time: 3-5 minutes</Text>
        </View>

        {/* 360° Video */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="planet" size={24} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>360° Video Processing</Text>
          </View>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="videocam" size={20} color="#8B5CF6" />
              <Text style={[styles.featureText, { color: theme.text }]}>4K/8K resolution support</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="volume-high" size={20} color="#8B5CF6" />
              <Text style={[styles.featureText, { color: theme.text }]}>Spatial audio processing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="layers" size={20} color="#8B5CF6" />
              <Text style={[styles.featureText, { color: theme.text }]}>Stereoscopic 3D (VR)</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.processButton, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="cloud-upload" size={20} color="white" />
            <Text style={styles.processButtonText}>Upload 360° Video</Text>
          </TouchableOpacity>
        </View>

        {/* VR Platforms */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Compatible VR Platforms</Text>
          {[
            { name: 'Meta Quest', icon: 'logo-oculus', color: '#0081FB' },
            { name: 'PSVR2', icon: 'game-controller', color: '#003087' },
            { name: 'SteamVR', icon: 'logo-steam', color: '#1B2838' },
            { name: 'WebXR', icon: 'globe', color: '#10B981' }
          ].map((platform, idx) => (
            <View key={idx} style={[styles.platformCard, { backgroundColor: theme.background }]}>
              <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                <Ionicons name={platform.icon as any} size={24} color={platform.color} />
              </View>
              <View style={styles.platformInfo}>
                <Text style={[styles.platformName, { color: theme.text }]}>{platform.name}</Text>
                <View style={[styles.compatibleBadge, { backgroundColor: '#10B981' + '20' }]}>
                  <Ionicons name="checkmark" size={12} color="#10B981" />
                  <Text style={[styles.compatibleText, { color: '#10B981' }]}>Compatible</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* XR Features */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>XR Capabilities</Text>
          {[
            { icon: 'eye', title: 'Eye Tracking', desc: 'Advanced gaze interaction' },
            { icon: 'hand-left', title: 'Hand Tracking', desc: 'Controller-free input' },
            { icon: 'mic', title: 'Voice Commands', desc: 'Natural language control' },
            { icon: 'speedometer', title: 'Room Scale', desc: 'Full movement tracking' }
          ].map((feature, idx) => (
            <View key={idx} style={styles.capabilityCard}>
              <Ionicons name={feature.icon as any} size={20} color={TikTokColors.pink} />
              <View style={styles.capabilityInfo}>
                <Text style={[styles.capabilityTitle, { color: theme.text }]}>{feature.title}</Text>
                <Text style={[styles.capabilityDesc, { color: theme.textSecondary }]}>{feature.desc}</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  textArea: { minHeight: 80 },
  arTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  arTypeCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, borderRadius: 12 },
  arTypeLabel: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  arTypeDesc: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 4 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  vrOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  styleChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  styleChipText: { fontSize: 13, marginLeft: 6, fontWeight: '600' },
  estimatedTime: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  featureList: { marginBottom: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { fontSize: 14, marginLeft: 12 },
  processButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  processButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  platformCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  platformIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  compatibleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  compatibleText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  capabilityCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  capabilityInfo: { marginLeft: 12, flex: 1 },
  capabilityTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  capabilityDesc: { fontSize: 12 },
});