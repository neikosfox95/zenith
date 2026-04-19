import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function Phase22Screen() {
  const { theme } = useTheme();

  const features = [
    { icon: 'pricetag', title: 'Product Catalog', desc: 'AI-powered product management' },
    { icon: 'cart', title: 'Smart Cart', desc: 'Intelligent recommendations' },
    { icon: 'card', title: 'Payment Processing', desc: 'Multi-currency support' },
    { icon: 'cube', title: 'Inventory Management', desc: 'Real-time stock tracking' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#10B981', '#06B6D4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Ionicons name="cart" size={48} color="white" />
        <Text style={styles.headerTitle}>E-Commerce & Shopping</Text>
        <Text style={styles.headerSubtitle}>Full-stack shopping solution</Text>
      </LinearGradient>
      <View style={styles.content}>
        {features.map((feature, idx) => (
          <TouchableOpacity key={idx} style={[styles.card, { backgroundColor: theme.card }]}>
            <Ionicons name={feature.icon as any} size={40} color="#10B981" />
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