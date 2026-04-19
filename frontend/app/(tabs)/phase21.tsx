import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function Phase21Screen() {
  const { theme } = useTheme();

  const features = [
    { icon: 'trophy', title: 'Leaderboard System', desc: 'Competitive rankings & scores' },
    { icon: 'ribbon', title: 'Achievement Engine', desc: 'Badges & trophy system' },
    { icon: 'cart', title: 'Reward Marketplace', desc: 'In-app currency & items' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Ionicons name="game-controller" size={48} color="white" />
        <Text style={styles.headerTitle}>Gaming & Gamification</Text>
        <Text style={styles.headerSubtitle}>Leaderboards, achievements & rewards</Text>
      </LinearGradient>
      <View style={styles.content}>
        {features.map((feature, idx) => (
          <TouchableOpacity key={idx} style={[styles.card, { backgroundColor: theme.card }]}>
            <Ionicons name={feature.icon as any} size={40} color="#7C3AED" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>{feature.title}</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{feature.desc}</Text>
          </TouchableOpacity>
        ))}
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
  card: { borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  cardDesc: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});