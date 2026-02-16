import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { creatorsAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

interface Creator {
  _id: string;
  tiktok_username: string;
  is_live: boolean;
  current_viewers: number;
}

export default function Creators() {
  const { theme } = useTheme();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const data = await creatorsAPI.getCreators();
      setCreators(data);
    } catch (error) {
      console.error('Error loading creators:', error);
    }
  };

  const handleAddCreator = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Please enter a TikTok username');
      return;
    }

    setLoading(true);
    try {
      await creatorsAPI.addCreator(newUsername.trim());
      Alert.alert('Success', `Started monitoring @${newUsername}`);
      setNewUsername('');
      setModalVisible(false);
      await loadCreators();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add creator');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCreator = (creator: Creator) => {
    Alert.alert(
      'Remove Creator',
      `Stop monitoring @${creator.tiktok_username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await creatorsAPI.deleteCreator(creator._id);
              await loadCreators();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove creator');
            }
          },
        },
      ]
    );
  };

  const renderCreatorItem = ({ item }: { item: Creator }) => (
    <View style={[styles.creatorItem, { backgroundColor: theme.card }]}>
      <View style={styles.creatorContent}>
        <Ionicons name="logo-tiktok" size={40} color={theme.primary} />
        <View style={styles.creatorInfo}>
          <Text style={[styles.creatorUsername, { color: theme.text }]}>
            @{item.tiktok_username}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.is_live ? theme.success : theme.textSecondary },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {item.is_live ? `LIVE - ${item.current_viewers} viewers` : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteCreator(item)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={24} color={theme.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Creators</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={32} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={creators}
        renderItem={renderCreatorItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No creators added yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Tap the + button to add a TikTok creator
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Creator</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Enter the TikTok username to start monitoring their live streams
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="at"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="TikTok username (e.g., darkskully)"
                placeholderTextColor={theme.textSecondary}
                value={newUsername}
                onChangeText={setNewUsername}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={handleAddCreator}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>
                {loading ? 'Adding...' : 'Start Monitoring'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
  },
  creatorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  creatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorInfo: {
    marginLeft: 16,
    flex: 1,
  },
  creatorUsername: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 16,
  },
  addButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
