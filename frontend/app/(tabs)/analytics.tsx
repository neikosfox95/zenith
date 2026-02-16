import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function Analytics() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Analytics</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.comingSoon}>
          <Ionicons name="bar-chart-outline" size={80} color={theme.textSecondary} />
          <Text style={[styles.comingSoonText, { color: theme.text }]}>Analytics Dashboard</Text>
          <Text style={[styles.comingSoonSubtext, { color: theme.textSecondary }]}>
            Gift analytics, viewer trends, revenue estimation, and performance metrics coming soon!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  comingSoon: {
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
  },
  comingSoonSubtext: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
});
