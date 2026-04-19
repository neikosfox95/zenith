import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { TikTokColors, TikTokSpacing, TikTokBorderRadius, TikTokFontSize, ModelBrandColors } from '../../src/constants/tiktokTheme';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface VoiceModel {
  id: string;
  name: string;
  provider: string;
  parameters: string;
  languages: string;
  zeroShot: boolean;
  streaming: boolean;
  quality: string;
  features: string[];
  bestFor: string;
}

interface VoiceProfile {
  voice_id: string;
  name: string;
  description?: string;
  language: string;
  gender?: string;
  status: string;
  created_at: string;
  reference_count: number;
}

export default function VoiceScreen() {
  const { user } = useAuth();
  const [models, setModels] = useState<VoiceModel[]>([]);
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('kokoro-82m');
  const [selectedTab, setSelectedTab] = useState<'clone' | 'convert' | 'profiles'>('clone');
  
  // Clone voice state
  const [cloneText, setCloneText] = useState('');
  const [referenceAudioUrl, setReferenceAudioUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [emotion, setEmotion] = useState('neutral');
  
  // Convert voice state
  const [sourceAudioUrl, setSourceAudioUrl] = useState('');
  const [targetVoiceUrl, setTargetVoiceUrl] = useState('');
  const [pitchShift, setPitchShift] = useState(0);
  
  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profileRefs, setProfileRefs] = useState<string[]>(['']);
  
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [result, setResult] = useState<any>(null);

  const languages = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko'];
  const emotions = ['neutral', 'happy', 'sad', 'angry', 'excited'];

  useEffect(() => {
    fetchModels();
    fetchProfiles();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/voice/models`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/voice/profiles`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const handleCloneVoice = async () => {
    if (!cloneText.trim() || !referenceAudioUrl.trim()) {
      Alert.alert('Error', 'Please enter text and reference audio URL');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/voice/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cloneText,
          reference_audio_url: referenceAudioUrl,
          model: selectedModel,
          language,
          emotion
        })
      });

      const data = await response.json();
      
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        setResult(data);
        Alert.alert('Success', 'Voice cloning job queued!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to clone voice');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertVoice = async () => {
    if (!sourceAudioUrl.trim() || !targetVoiceUrl.trim()) {
      Alert.alert('Error', 'Please enter source and target audio URLs');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/voice/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_audio_url: sourceAudioUrl,
          target_voice_reference: targetVoiceUrl,
          model: selectedModel,
          pitch_shift: pitchShift
        })
      });

      const data = await response.json();
      
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        setResult(data);
        Alert.alert('Success', 'Voice conversion job queued!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to convert voice');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim() || profileRefs.filter(r => r.trim()).length === 0) {
      Alert.alert('Error', 'Please enter profile name and at least one reference audio URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/voice/profile/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileName,
          reference_audio_urls: profileRefs.filter(r => r.trim()),
          description: profileDescription,
          language,
          gender: 'neutral'
        })
      });

      const data = await response.json();
      
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        Alert.alert('Success', 'Voice profile created!');
        setProfileName('');
        setProfileDescription('');
        setProfileRefs(['']);
        fetchProfiles();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (voiceId: string) => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete this voice profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/api/voice/profile/${voiceId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${user?.token}`
                }
              });
              Alert.alert('Success', 'Profile deleted');
              fetchProfiles();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile');
            }
          }
        }
      ]
    );
  };

  const getProviderColor = (provider: string): string => {
    if (provider.includes('Fish')) return ModelBrandColors.openai;
    if (provider.includes('HexGrad') || provider.includes('Ashish')) return ModelBrandColors.anthropic;
    if (provider.includes('Kitten')) return ModelBrandColors.google;
    if (provider.includes('Neuphonic')) return ModelBrandColors.meta;
    if (provider.includes('OpenMOSS')) return ModelBrandColors.mistral;
    if (provider.includes('Alibaba')) return ModelBrandColors.qwen;
    if (provider.includes('Soul')) return ModelBrandColors.deepseek;
    if (provider.includes('Microsoft')) return ModelBrandColors.microsoft;
    return TikTokColors.accentCyan;
  };

  if (loadingModels) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TikTokColors.pink} />
          <Text style={styles.loadingText}>Loading Voice Models...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Ionicons name="mic" size={32} color={TikTokColors.pink} />
            <Text style={styles.headerTitle}>Voice AI Studio</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {models.length} Voice Models • Clone, Convert & Create
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'clone' && styles.tabActive]}
            onPress={() => setSelectedTab('clone')}
          >
            <Ionicons 
              name="copy" 
              size={20} 
              color={selectedTab === 'clone' ? TikTokColors.white : TikTokColors.textSecondary} 
            />
            <Text style={[styles.tabText, selectedTab === 'clone' && styles.tabTextActive]}>
              Clone
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'convert' && styles.tabActive]}
            onPress={() => setSelectedTab('convert')}
          >
            <Ionicons 
              name="swap-horizontal" 
              size={20} 
              color={selectedTab === 'convert' ? TikTokColors.white : TikTokColors.textSecondary} 
            />
            <Text style={[styles.tabText, selectedTab === 'convert' && styles.tabTextActive]}>
              Convert
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'profiles' && styles.tabActive]}
            onPress={() => setSelectedTab('profiles')}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={selectedTab === 'profiles' ? TikTokColors.white : TikTokColors.textSecondary} 
            />
            <Text style={[styles.tabText, selectedTab === 'profiles' && styles.tabTextActive]}>
              Profiles
            </Text>
          </TouchableOpacity>
        </View>

        {/* Model Selection (for Clone & Convert) */}
        {(selectedTab === 'clone' || selectedTab === 'convert') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Model</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.modelGrid}>
                {models.map((model) => (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelCard,
                      selectedModel === model.id && styles.modelCardActive
                    ]}
                    onPress={() => setSelectedModel(model.id)}
                  >
                    <View style={[
                      styles.modelBadge,
                      { backgroundColor: getProviderColor(model.provider) }
                    ]} />
                    <Text style={styles.modelName}>{model.name}</Text>
                    <Text style={styles.modelProvider}>{model.provider}</Text>
                    <Text style={styles.modelDetails}>{model.parameters}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Clone Voice Tab */}
        {selectedTab === 'clone' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Text to Speak</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter the text you want to speak with the cloned voice..."
                placeholderTextColor={TikTokColors.textTertiary}
                value={cloneText}
                onChangeText={setCloneText}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reference Audio URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/voice-sample.mp3"
                placeholderTextColor={TikTokColors.textTertiary}
                value={referenceAudioUrl}
                onChangeText={setReferenceAudioUrl}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipContainer}>
                  {languages.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.chip,
                        language === lang && styles.chipActive
                      ]}
                      onPress={() => setLanguage(lang)}
                    >
                      <Text style={[
                        styles.chipText,
                        language === lang && styles.chipTextActive
                      ]}>
                        {lang.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Emotion</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipContainer}>
                  {emotions.map((emo) => (
                    <TouchableOpacity
                      key={emo}
                      style={[
                        styles.chip,
                        emotion === emo && styles.chipActive
                      ]}
                      onPress={() => setEmotion(emo)}
                    >
                      <Text style={[
                        styles.chipText,
                        emotion === emo && styles.chipTextActive
                      ]}>
                        {emo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.actionButtonDisabled]}
              onPress={handleCloneVoice}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={TikTokColors.white} />
              ) : (
                <>
                  <Ionicons name="mic" size={20} color={TikTokColors.white} />
                  <Text style={styles.actionButtonText}>Clone Voice</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Convert Voice Tab */}
        {selectedTab === 'convert' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Source Audio URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/source-audio.mp3"
                placeholderTextColor={TikTokColors.textTertiary}
                value={sourceAudioUrl}
                onChangeText={setSourceAudioUrl}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Target Voice URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/target-voice.mp3"
                placeholderTextColor={TikTokColors.textTertiary}
                value={targetVoiceUrl}
                onChangeText={setTargetVoiceUrl}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pitch Shift: {pitchShift}</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity onPress={() => setPitchShift(Math.max(-12, pitchShift - 1))}>
                  <Ionicons name="remove-circle" size={32} color={TikTokColors.pink} />
                </TouchableOpacity>
                <Text style={styles.sliderValue}>{pitchShift} semitones</Text>
                <TouchableOpacity onPress={() => setPitchShift(Math.min(12, pitchShift + 1))}>
                  <Ionicons name="add-circle" size={32} color={TikTokColors.pink} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.actionButtonDisabled]}
              onPress={handleConvertVoice}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={TikTokColors.white} />
              ) : (
                <>
                  <Ionicons name="swap-horizontal" size={20} color={TikTokColors.white} />
                  <Text style={styles.actionButtonText}>Convert Voice</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Profiles Tab */}
        {selectedTab === 'profiles' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create New Profile</Text>
              <TextInput
                style={styles.input}
                placeholder="Profile Name"
                placeholderTextColor={TikTokColors.textTertiary}
                value={profileName}
                onChangeText={setProfileName}
              />
              <TextInput
                style={[styles.input, { marginTop: TikTokSpacing.sm }]}
                placeholder="Description (optional)"
                placeholderTextColor={TikTokColors.textTertiary}
                value={profileDescription}
                onChangeText={setProfileDescription}
              />
              {profileRefs.map((ref, index) => (
                <TextInput
                  key={index}
                  style={[styles.input, { marginTop: TikTokSpacing.sm }]}
                  placeholder={`Reference Audio URL ${index + 1}`}
                  placeholderTextColor={TikTokColors.textTertiary}
                  value={ref}
                  onChangeText={(text) => {
                    const newRefs = [...profileRefs];
                    newRefs[index] = text;
                    setProfileRefs(newRefs);
                  }}
                  autoCapitalize="none"
                />
              ))}
              <TouchableOpacity
                style={styles.addRefButton}
                onPress={() => setProfileRefs([...profileRefs, ''])}
              >
                <Ionicons name="add-circle-outline" size={20} color={TikTokColors.cyan} />
                <Text style={styles.addRefText}>Add Reference Audio</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.actionButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={TikTokColors.white} />
              ) : (
                <>
                  <Ionicons name="save" size={20} color={TikTokColors.white} />
                  <Text style={styles.actionButtonText}>Save Profile</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Saved Profiles List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved Profiles ({profiles.length})</Text>
              {profiles.map((profile) => (
                <View key={profile.voice_id} style={styles.profileCard}>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileDetails}>
                      {profile.language} • {profile.reference_count} references
                    </Text>
                    {profile.description && (
                      <Text style={styles.profileDescription}>{profile.description}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteProfile(profile.voice_id)}>
                    <Ionicons name="trash" size={24} color={TikTokColors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Result Display */}
        {result && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Result</Text>
            <View style={styles.resultCard}>
              <Text style={styles.resultText}>Job ID: {result.job_id}</Text>
              <Text style={styles.resultText}>Status: {result.status}</Text>
              <Text style={styles.resultText}>Model: {result.model}</Text>
              {result.estimated_time && (
                <Text style={styles.resultText}>Est. Time: {result.estimated_time}</Text>
              )}
              {result.message && (
                <Text style={styles.resultMessage}>{result.message}</Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TikTokColors.background
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: TikTokColors.textPrimary,
    fontSize: TikTokFontSize.md,
    marginTop: TikTokSpacing.md
  },
  header: {
    padding: TikTokSpacing.lg,
    paddingTop: TikTokSpacing.xxl
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: TikTokSpacing.sm
  },
  headerTitle: {
    fontSize: TikTokFontSize.display,
    fontWeight: '700',
    color: TikTokColors.textPrimary,
    marginLeft: TikTokSpacing.md
  },
  headerSubtitle: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.textSecondary
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: TikTokSpacing.lg,
    marginBottom: TikTokSpacing.lg,
    gap: TikTokSpacing.sm
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: TikTokSpacing.md,
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    borderWidth: 1,
    borderColor: TikTokColors.border,
    gap: TikTokSpacing.sm
  },
  tabActive: {
    backgroundColor: TikTokColors.pink,
    borderColor: TikTokColors.pink
  },
  tabText: {
    fontSize: TikTokFontSize.md,
    color: TikTokColors.textSecondary,
    fontWeight: '600'
  },
  tabTextActive: {
    color: TikTokColors.white
  },
  section: {
    paddingHorizontal: TikTokSpacing.lg,
    marginBottom: TikTokSpacing.lg
  },
  sectionTitle: {
    fontSize: TikTokFontSize.lg,
    fontWeight: '600',
    color: TikTokColors.textPrimary,
    marginBottom: TikTokSpacing.md
  },
  modelGrid: {
    flexDirection: 'row',
    gap: TikTokSpacing.md
  },
  modelCard: {
    width: 140,
    padding: TikTokSpacing.md,
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    borderWidth: 2,
    borderColor: TikTokColors.border
  },
  modelCardActive: {
    borderColor: TikTokColors.pink,
    backgroundColor: TikTokColors.surfaceLight
  },
  modelBadge: {
    width: 32,
    height: 32,
    borderRadius: TikTokBorderRadius.sm,
    marginBottom: TikTokSpacing.sm
  },
  modelName: {
    fontSize: TikTokFontSize.sm,
    fontWeight: '600',
    color: TikTokColors.textPrimary,
    marginBottom: 2
  },
  modelProvider: {
    fontSize: TikTokFontSize.xs,
    color: TikTokColors.textSecondary,
    marginBottom: 2
  },
  modelDetails: {
    fontSize: TikTokFontSize.xs,
    color: TikTokColors.textTertiary
  },
  textInput: {
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    padding: TikTokSpacing.md,
    color: TikTokColors.textPrimary,
    fontSize: TikTokFontSize.md,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: TikTokColors.border
  },
  input: {
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    padding: TikTokSpacing.md,
    color: TikTokColors.textPrimary,
    fontSize: TikTokFontSize.md,
    borderWidth: 1,
    borderColor: TikTokColors.border
  },
  chipContainer: {
    flexDirection: 'row',
    gap: TikTokSpacing.sm
  },
  chip: {
    paddingVertical: TikTokSpacing.sm,
    paddingHorizontal: TikTokSpacing.md,
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.full,
    borderWidth: 1,
    borderColor: TikTokColors.border
  },
  chipActive: {
    backgroundColor: TikTokColors.cyan,
    borderColor: TikTokColors.cyan
  },
  chipText: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.textSecondary,
    fontWeight: '600'
  },
  chipTextActive: {
    color: TikTokColors.black
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: TikTokSpacing.md
  },
  sliderValue: {
    fontSize: TikTokFontSize.lg,
    color: TikTokColors.textPrimary,
    fontWeight: '600'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TikTokColors.pink,
    marginHorizontal: TikTokSpacing.lg,
    padding: TikTokSpacing.md,
    borderRadius: TikTokBorderRadius.lg,
    gap: TikTokSpacing.sm,
    marginBottom: TikTokSpacing.lg
  },
  actionButtonDisabled: {
    opacity: 0.6
  },
  actionButtonText: {
    fontSize: TikTokFontSize.lg,
    fontWeight: '700',
    color: TikTokColors.white
  },
  addRefButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: TikTokSpacing.md,
    gap: TikTokSpacing.sm
  },
  addRefText: {
    fontSize: TikTokFontSize.md,
    color: TikTokColors.cyan,
    fontWeight: '600'
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    padding: TikTokSpacing.md,
    marginBottom: TikTokSpacing.sm,
    borderWidth: 1,
    borderColor: TikTokColors.border
  },
  profileInfo: {
    flex: 1
  },
  profileName: {
    fontSize: TikTokFontSize.md,
    fontWeight: '600',
    color: TikTokColors.textPrimary,
    marginBottom: 4
  },
  profileDetails: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.textSecondary,
    marginBottom: 2
  },
  profileDescription: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.textTertiary,
    marginTop: 4
  },
  resultCard: {
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    padding: TikTokSpacing.md,
    borderWidth: 1,
    borderColor: TikTokColors.border
  },
  resultText: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.textPrimary,
    marginBottom: 4
  },
  resultMessage: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.textSecondary,
    marginTop: TikTokSpacing.sm,
    fontStyle: 'italic'
  }
});
