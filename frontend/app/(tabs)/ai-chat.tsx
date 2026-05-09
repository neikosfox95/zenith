import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function AIChatScreen() {
  const [message, setMessage] = useState('');
  const [messages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI assistant powered by GPT-5.2 Pro. How can I help you optimize your TikTok Live streaming today?",
      timestamp: new Date(Date.now() - 3600000),
      model: 'GPT-5.2 Pro'
    },
    {
      id: 2,
      type: 'user',
      content: "What's the best time for me to stream?",
      timestamp: new Date(Date.now() - 3500000)
    },
    {
      id: 3,
      type: 'ai',
      content: "Based on your analytics, Friday and Saturday evenings (7-10 PM) show 45% higher viewer engagement. Your audience is most active during these windows, with peak gift-giving around 8:30 PM.",
      timestamp: new Date(Date.now() - 3400000),
      model: 'Gemini 3.0 Flash'
    },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Send logic here
      setMessage('');
    }
  };

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('en-US', options);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.chatIcon}>
            <Ionicons name="chatbubbles" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            AI Chat
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Ask anything about your streams
          </Animated.Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => (
            <Animated.View 
              key={msg.id} 
              entering={FadeInDown.delay(300 + index * 100)}
              style={[styles.messageRow, msg.type === 'user' && styles.messageRowUser]}
            >
              {msg.type === 'ai' && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={20} color={TikTokTheme.colors.brand.cyan} />
                </View>
              )}
              
              <View style={[styles.messageBubble, msg.type === 'user' && styles.messageBubbleUser]}>
                <BlurView intensity={msg.type === 'ai' ? 40 : 30} style={styles.messageBlur}>
                  <LinearGradient
                    colors={msg.type === 'ai' 
                      ? ['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']
                      : ['rgba(254, 44, 85, 0.15)', 'rgba(254, 44, 85, 0.05)']
                    }
                    style={styles.messageContent}
                  >
                    <Text style={styles.messageText}>{msg.content}</Text>
                    <View style={styles.messageFooter}>
                      <Text style={styles.messageTime}>{formatTime(msg.timestamp)}</Text>
                      {msg.type === 'ai' && msg.model && (
                        <Text style={styles.messageModel}>{msg.model}</Text>
                      )}
                    </View>
                  </LinearGradient>
                </BlurView>
              </View>

              {msg.type === 'user' && (
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={20} color={TikTokTheme.colors.brand.pink} />
                </View>
              )}
            </Animated.View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.inputContainer}>
          <BlurView intensity={60} style={styles.inputBlur}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ask your AI assistant..."
                placeholderTextColor={TikTokTheme.colors.text.muted}
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={!message.trim()}
              >
                <LinearGradient
                  colors={message.trim() ? [TikTokTheme.colors.brand.cyan, TikTokTheme.colors.brand.pink] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendGradient}
                >
                  <Ionicons name="send" size={20} color={message.trim() ? '#FFFFFF' : TikTokTheme.colors.text.muted} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  heroContainer: { height: 120, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  heroSubtitle: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  chatContainer: { flex: 1 },
  messagesContent: { padding: TikTokTheme.spacing.base, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'flex-end' },
  messageRowUser: { flexDirection: 'row-reverse' },
  aiAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: TikTokTheme.colors.brand.cyan },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(254, 44, 85, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: TikTokTheme.colors.brand.pink },
  messageBubble: { maxWidth: '75%', borderRadius: 16, overflow: 'hidden', elevation: 2 },
  messageBubbleUser: { elevation: 2 },
  messageBlur: { flex: 1 },
  messageContent: { padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  messageText: { fontSize: 14, color: TikTokTheme.colors.text.primary, lineHeight: 20, marginBottom: 6 },
  messageFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  messageTime: { fontSize: 10, color: TikTokTheme.colors.text.muted },
  messageModel: { fontSize: 9, color: TikTokTheme.colors.brand.cyan, fontStyle: 'italic' },
  inputContainer: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' },
  inputBlur: { flex: 1 },
  inputWrapper: { flexDirection: 'row', padding: TikTokTheme.spacing.base, gap: 12, alignItems: 'flex-end' },
  input: { flex: 1, maxHeight: 100, fontSize: 15, color: TikTokTheme.colors.text.primary, paddingVertical: 10 },
  sendButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});