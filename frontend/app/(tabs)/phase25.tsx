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

export default function Phase25Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [cryptoPortfolio, setCryptoPortfolio] = useState<any>(null);

  const addInvestment = async () => {
    if (!symbol || !shares || !price) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/finance/portfolio/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          shares: parseInt(shares),
          purchase_price: parseFloat(price)
        })
      });
      const data = await response.json();
      if (data.success) {
        setPortfolio([data.investment, ...portfolio]);
        setSymbol('');
        setShares('');
        setPrice('');
      }
    } catch (error) {
      console.error('Add investment error:', error);
    }
    setLoading(false);
  };

  const getAIAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/finance/ai-advisor/consult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          portfolio: {},
          risk_tolerance: 'moderate'
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiAdvice(data.advice);
      }
    } catch (error) {
      console.error('AI advice error:', error);
    }
    setLoading(false);
  };

  const logExpense = async () => {
    if (!expenseAmount || !expenseCategory) return;
    setLoading(true);
    try {
      await fetch(`${backendUrl}/api/finance/expense/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          amount: parseFloat(expenseAmount),
          category: expenseCategory,
          description: 'Expense'
        })
      });
      setExpenseAmount('');
      setExpenseCategory('');
    } catch (error) {
      console.error('Log expense error:', error);
    }
    setLoading(false);
  };

  const loadCrypto = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/finance/crypto/portfolio`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setCryptoPortfolio(data.portfolio);
      }
    } catch (error) {
      console.error('Load crypto error:', error);
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
        <Ionicons name="cash" size={48} color="white" />
        <Text style={styles.headerTitle}>Finance & Investment</Text>
        <Text style={styles.headerSubtitle}>AI-powered wealth management</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Portfolio Summary */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.portfolioHeader}>
            <View>
              <Text style={[styles.portfolioLabel, { color: theme.textSecondary }]}>Total Portfolio Value</Text>
              <Text style={[styles.portfolioValue, { color: '#10B981' }]}>$87,450</Text>
            </View>
            <View style={[styles.gainBadge, { backgroundColor: '#10B981' + '20' }]}>
              <Ionicons name="trending-up" size={16} color="#10B981" />
              <Text style={[styles.gainText, { color: '#10B981' }]}>+12.5%</Text>
            </View>
          </View>
        </View>

        {/* Add Investment */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={24} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Add Investment</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Stock symbol (e.g., AAPL)"
            placeholderTextColor={theme.textSecondary}
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Shares"
              placeholderTextColor={theme.textSecondary}
              value={shares}
              onChangeText={setShares}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, styles.halfInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Price ($)"
              placeholderTextColor={theme.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={addInvestment}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Add to Portfolio</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Financial Advisor */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={24} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Advisor (Grok 4.3)</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={getAIAdvice}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text style={styles.actionButtonText}>Get AI Advice</Text>
              </>
            )}
          </TouchableOpacity>

          {aiAdvice && (
            <View style={[styles.adviceBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.adviceText, { color: theme.textSecondary }]}>{aiAdvice.recommendation}</Text>
              <View style={styles.allocationBox}>
                <Text style={[styles.allocationTitle, { color: theme.text }]}>Suggested Allocation</Text>
                {Object.entries(aiAdvice.suggested_allocation || {}).map(([key, value]: [string, any], idx) => (
                  <View key={idx} style={styles.allocationRow}>
                    <Text style={[styles.allocationLabel, { color: theme.textSecondary }]}>{key}</Text>
                    <Text style={[styles.allocationValue, { color: theme.text }]}>{value}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Expense Tracker */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Expense Tracker</Text>
          </View>
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Amount ($)"
              placeholderTextColor={theme.textSecondary}
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.halfInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Category"
              placeholderTextColor={theme.textSecondary}
              value={expenseCategory}
              onChangeText={setExpenseCategory}
            />
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            onPress={logExpense}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.actionButtonText}>Log Expense</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Crypto Portfolio */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="logo-bitcoin" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Crypto Portfolio</Text>
            <TouchableOpacity onPress={loadCrypto} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#F59E0B" />
            </TouchableOpacity>
          </View>
          
          {cryptoPortfolio ? (
            <View>
              {cryptoPortfolio.holdings?.map((holding: any, idx: number) => (
                <View key={idx} style={[styles.cryptoCard, { backgroundColor: theme.background }]}>
                  <View style={[styles.cryptoIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                    <Ionicons name="logo-bitcoin" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.cryptoInfo}>
                    <Text style={[styles.cryptoSymbol, { color: theme.text }]}>{holding.symbol}</Text>
                    <Text style={[styles.cryptoAmount, { color: theme.textSecondary }]}>{holding.amount} coins</Text>
                  </View>
                  <View style={styles.cryptoValue}>
                    <Text style={[styles.cryptoPrice, { color: '#10B981' }]}>${holding.value.toLocaleString()}</Text>
                    <Text style={[styles.cryptoChange, { color: holding.change_24h > 0 ? '#10B981' : '#EF4444' }]}>                      {holding.change_24h > 0 ? '+' : ''}{holding.change_24h}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Tap refresh to load portfolio</Text>
          )}
        </View>

        {/* My Investments */}
        {portfolio.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My Investments</Text>
            {portfolio.map((inv, idx) => (
              <View key={idx} style={[styles.investmentCard, { backgroundColor: theme.background }]}>
                <View style={styles.investmentInfo}>
                  <Text style={[styles.investmentSymbol, { color: theme.text }]}>{inv.symbol}</Text>
                  <Text style={[styles.investmentShares, { color: theme.textSecondary }]}>{inv.shares} shares</Text>
                </View>
                <View style={styles.investmentValue}>
                  <Text style={[styles.investmentPrice, { color: '#10B981' }]}>${inv.current_price.toFixed(2)}</Text>
                  <Text style={[styles.investmentGain, { color: '#10B981' }]}>+{inv.gain_loss_percent}%</Text>
                </View>
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  refreshButton: { padding: 4 },
  portfolioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  portfolioLabel: { fontSize: 13, marginBottom: 8 },
  portfolioValue: { fontSize: 32, fontWeight: '700' },
  gainBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  gainText: { fontSize: 14, fontWeight: '700' },
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  adviceBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  adviceText: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  allocationBox: { marginTop: 8 },
  allocationTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  allocationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  allocationLabel: { fontSize: 14, textTransform: 'capitalize' },
  allocationValue: { fontSize: 14, fontWeight: '700' },
  cryptoCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  cryptoIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cryptoInfo: { flex: 1 },
  cryptoSymbol: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cryptoAmount: { fontSize: 12 },
  cryptoValue: { alignItems: 'flex-end' },
  cryptoPrice: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cryptoChange: { fontSize: 12, fontWeight: '600' },
  placeholderText: { fontSize: 14, textAlign: 'center', padding: 20 },
  investmentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  investmentInfo: { flex: 1 },
  investmentSymbol: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  investmentShares: { fontSize: 12 },
  investmentValue: { alignItems: 'flex-end' },
  investmentPrice: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  investmentGain: { fontSize: 12, fontWeight: '600' },
});