import React, { useState, useEffect } from 'react';
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
import Constants from 'expo-constants';

export default function Phase16Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<any[]>([]);
  const [metadata, setMetadata] = useState({ name: '', description: '' });
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');

  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

  const fetchNFTs = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/nft/collection`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      setNfts(data.nfts || []);
    } catch (error) {
      console.error('Fetch NFTs error:', error);
    }
  };

  const mintNFT = async () => {
    if (!metadata.name.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/nft/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          content_url: 'https://example.com/content.png',
          metadata,
          blockchain: selectedBlockchain,
          collection: 'My Collection'
        })
      });
      const data = await response.json();
      setNfts([data, ...nfts]);
      setMetadata({ name: '', description: '' });
    } catch (error) {
      console.error('Mint NFT error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNFTs();
  }, []);

  const blockchains = [
    { id: 'ethereum', name: 'Ethereum', icon: 'logo-ethereum', color: '#627EEA' },
    { id: 'polygon', name: 'Polygon', icon: 'triangle', color: '#8247E5' },
    { id: 'solana', name: 'Solana', icon: 'flash', color: '#14F195' },
    { id: 'base', name: 'Base', icon: 'layers', color: '#0052FF' }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#6366F1', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="diamond" size={48} color="white" />
        <Text style={styles.headerTitle}>Web3 & NFT Hub</Text>
        <Text style={styles.headerSubtitle}>Blockchain, NFTs, crypto payments</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Mint NFT */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hammer" size={24} color={TikTokColors.pink} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mint New NFT</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="NFT Name..."
            placeholderTextColor={theme.textSecondary}
            value={metadata.name}
            onChangeText={(text) => setMetadata({ ...metadata, name: text })}
          />
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Description..."
            placeholderTextColor={theme.textSecondary}
            value={metadata.description}
            onChangeText={(text) => setMetadata({ ...metadata, description: text })}
            multiline
          />

          <Text style={[styles.label, { color: theme.text }]}>Select Blockchain:</Text>
          <View style={styles.blockchainGrid}>
            {blockchains.map(chain => (
              <TouchableOpacity
                key={chain.id}
                style={[
                  styles.blockchainCard,
                  { backgroundColor: selectedBlockchain === chain.id ? chain.color + '20' : theme.background }
                ]}
                onPress={() => setSelectedBlockchain(chain.id)}
              >
                <Ionicons 
                  name={chain.icon as any} 
                  size={28} 
                  color={selectedBlockchain === chain.id ? chain.color : theme.textSecondary} 
                />
                <Text style={[
                  styles.blockchainName,
                  { color: selectedBlockchain === chain.id ? theme.text : theme.textSecondary }
                ]}>
                  {chain.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.mintButton, { backgroundColor: TikTokColors.pink }]}
            onPress={mintNFT}
            disabled={loading || !metadata.name.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="hammer" size={20} color="white" />
                <Text style={styles.mintButtonText}>Mint NFT</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.estimatedTime, { color: theme.textSecondary }]}>Estimated time: 30-60 seconds</Text>
        </View>

        {/* My NFT Collection */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images" size={24} color={TikTokColors.cyan} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My NFT Collection</Text>
            <Text style={[styles.count, { color: theme.textSecondary }]}>({nfts.length})</Text>
          </View>
          
          {nfts.length > 0 ? (
            nfts.map((nft, idx) => (
              <View key={idx} style={[styles.nftCard, { backgroundColor: theme.background }]}>
                <View style={styles.nftInfo}>
                  <Text style={[styles.nftName, { color: theme.text }]}>{nft.metadata?.name || 'Unnamed NFT'}</Text>
                  <Text style={[styles.nftBlockchain, { color: theme.textSecondary }]}>
                    {nft.blockchain} • {nft.status}
                  </Text>
                  {nft.transaction_hash && (
                    <Text style={[styles.nftTx, { color: theme.textSecondary }]} numberOfLines={1}>
                      TX: {nft.transaction_hash.substring(0, 20)}...
                    </Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: nft.status === 'minted' ? '#10B981' + '20' : '#F59E0B' + '20' }]}>
                  <Text style={[styles.statusText, { color: nft.status === 'minted' ? '#10B981' : '#F59E0B' }]}>
                    {nft.status}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No NFTs minted yet</Text>
          )}
        </View>

        {/* Crypto Payments */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Crypto Payments</Text>
          </View>
          
          {[
            { currency: 'ETH', name: 'Ethereum', balance: '2.45', usd: '$4,850', color: '#627EEA' },
            { currency: 'USDC', name: 'USD Coin', balance: '1,250', usd: '$1,250', color: '#2775CA' },
            { currency: 'SOL', name: 'Solana', balance: '15.8', usd: '$1,580', color: '#14F195' },
            { currency: 'MATIC', name: 'Polygon', balance: '500', usd: '$450', color: '#8247E5' }
          ].map((crypto, idx) => (
            <View key={idx} style={[styles.cryptoCard, { backgroundColor: theme.background }]}>
              <View style={[styles.cryptoIcon, { backgroundColor: crypto.color + '20' }]}>
                <Text style={[styles.cryptoCurrency, { color: crypto.color }]}>{crypto.currency}</Text>
              </View>
              <View style={styles.cryptoInfo}>
                <Text style={[styles.cryptoName, { color: theme.text }]}>{crypto.name}</Text>
                <Text style={[styles.cryptoBalance, { color: theme.textSecondary }]}>{crypto.balance} {crypto.currency}</Text>
              </View>
              <Text style={[styles.cryptoUsd, { color: theme.text }]}>{crypto.usd}</Text>
            </View>
          ))}

          <TouchableOpacity style={[styles.paymentButton, { backgroundColor: '#10B981' }]}>
            <Ionicons name="card" size={20} color="white" />
            <Text style={styles.paymentButtonText}>Create Payment Request</Text>
          </TouchableOpacity>
        </View>

        {/* Web3 Features */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Web3 Features</Text>
          {[
            { icon: 'cube', title: 'IPFS Storage', desc: 'Decentralized file storage', color: '#3B82F6' },
            { icon: 'document', title: 'Smart Contracts', desc: 'Deploy & manage contracts', color: '#8B5CF6' },
            { icon: 'lock-closed', title: 'Token Gating', desc: 'Access control via tokens', color: '#EC4899' },
            { icon: 'wallet', title: 'Wallet Connect', desc: 'Connect Web3 wallets', color: '#10B981' }
          ].map((feature, idx) => (
            <View key={idx} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>{feature.desc}</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8, flex: 1 },
  count: { fontSize: 14 },
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  textArea: { minHeight: 80 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  blockchainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  blockchainCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 16, borderRadius: 12 },
  blockchainName: { fontSize: 12, marginTop: 8, fontWeight: '600' },
  mintButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  mintButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  estimatedTime: { fontSize: 12, textAlign: 'center' },
  nftCard: { padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nftInfo: { flex: 1 },
  nftName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  nftBlockchain: { fontSize: 12, marginBottom: 4, textTransform: 'capitalize' },
  nftTx: { fontSize: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyText: { textAlign: 'center', fontSize: 14, padding: 24 },
  cryptoCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  cryptoIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cryptoCurrency: { fontSize: 12, fontWeight: 'bold' },
  cryptoInfo: { flex: 1 },
  cryptoName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cryptoBalance: { fontSize: 12 },
  cryptoUsd: { fontSize: 16, fontWeight: 'bold' },
  paymentButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 8 },
  paymentButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  featureCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featureIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  featureDesc: { fontSize: 13 },
});