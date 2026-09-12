import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
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

export default function Phase27Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([
    { id: 'light_1', name: 'Living Room Light', type: 'light', status: false, value: 0 },
    { id: 'ac_1', name: 'Bedroom AC', type: 'ac', status: false, value: 22 },
    { id: 'lock_1', name: 'Front Door Lock', type: 'lock', status: true, value: 0 },
  ]);
  const [energyUsage, setEnergyUsage] = useState<any>(null);
  const [cameras, setCameras] = useState<any[]>([]);

  const controlDevice = async (deviceId: string, action: string, value: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/smarthome/device/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          device_id: deviceId,
          action,
          value
        })
      });
      const data = await response.json();
      if (data.success) {
        setDevices(devices.map(d => 
          d.id === deviceId ? { ...d, status: value, value } : d
        ));
      }
    } catch (error) {
      console.error('Control device error:', error);
    }
    setLoading(false);
  };

  const loadEnergyUsage = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/smarthome/energy/usage`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setEnergyUsage(data.usage);
      }
    } catch (error) {
      console.error('Load energy error:', error);
    }
  };

  const loadCameras = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/smarthome/security/cameras`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setCameras(data.cameras);
      }
    } catch (error) {
      console.error('Load cameras error:', error);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'light': return 'bulb';
      case 'ac': return 'snow';
      case 'lock': return 'lock-closed';
      default: return 'power';
    }
  };

  React.useEffect(() => {
    loadEnergyUsage();
    loadCameras();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#F59E0B', '#EF4444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="home" size={48} color="white" />
        <Text style={styles.headerTitle}>Smart Home & IoT</Text>
        <Text style={styles.headerSubtitle}>Connected home automation</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Device Control */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="power" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Device Control</Text>
          </View>
          
          {devices.map((device, idx) => (
            <View key={idx} style={[styles.deviceCard, { backgroundColor: theme.background }]}>
              <View style={[styles.deviceIcon, { backgroundColor: device.status ? '#10B981' + '20' : theme.card }]}>
                <Ionicons name={getDeviceIcon(device.type) as any} size={24} color={device.status ? '#10B981' : theme.textSecondary} />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={[styles.deviceName, { color: theme.text }]}>{device.name}</Text>
                <Text style={[styles.deviceStatus, { color: device.status ? '#10B981' : theme.textSecondary }]}>
                  {device.status ? 'ON' : 'OFF'}
                </Text>
              </View>
              <Switch
                value={device.status}
                onValueChange={(val) => controlDevice(device.id, 'toggle', val)}
                trackColor={{ false: theme.textSecondary, true: '#10B981' }}
                thumbColor={device.status ? '#fff' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        {/* Energy Monitor */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={24} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Energy Monitor</Text>
            <TouchableOpacity onPress={loadEnergyUsage} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
          
          {energyUsage ? (
            <View>
              <View style={styles.energyStats}>
                {[
                  { label: 'Today', value: energyUsage.today, unit: 'kWh', color: '#10B981' },
                  { label: 'This Week', value: energyUsage.this_week, unit: 'kWh', color: '#3B82F6' },
                  { label: 'This Month', value: energyUsage.this_month, unit: 'kWh', color: '#F59E0B' },
                ].map((stat, idx) => (
                  <View key={idx} style={[styles.energyStat, { backgroundColor: theme.background }]}>
                    <Text style={[styles.energyValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={[styles.energyLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                    <Text style={[styles.energyUnit, { color: theme.textSecondary }]}>{stat.unit}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.costBox, { backgroundColor: theme.background }]}>
                <Text style={[styles.costLabel, { color: theme.textSecondary }]}>Total Cost</Text>
                <Text style={[styles.costValue, { color: '#EF4444' }]}>${energyUsage.cost}</Text>
              </View>

              {energyUsage.devices?.map((device: any, idx: number) => (
                <View key={idx} style={styles.consumptionRow}>
                  <Text style={[styles.consumptionName, { color: theme.text }]}>{device.name}</Text>
                  <View style={styles.consumptionBar}>
                    <View style={[styles.consumptionFill, { width: `${device.percentage}%`, backgroundColor: '#F59E0B' }]} />
                  </View>
                  <Text style={[styles.consumptionValue, { color: theme.textSecondary }]}>{device.consumption} kWh</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Tap refresh to load energy data</Text>
          )}
        </View>

        {/* Security Cameras */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Security Cameras</Text>
            <TouchableOpacity onPress={loadCameras} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          
          {cameras.length > 0 ? (
            cameras.map((camera, idx) => (
              <TouchableOpacity key={idx} style={[styles.cameraCard, { backgroundColor: theme.background }]}>
                <View style={[styles.cameraIcon, { backgroundColor: camera.status === 'online' ? '#10B981' + '20' : '#EF4444' + '20' }]}>
                  <Ionicons name="videocam" size={24} color={camera.status === 'online' ? '#10B981' : '#EF4444'} />
                </View>
                <View style={styles.cameraInfo}>
                  <Text style={[styles.cameraName, { color: theme.text }]}>{camera.name}</Text>
                  <View style={styles.cameraStatus}>
                    <View style={[styles.statusDot, { backgroundColor: camera.status === 'online' ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.statusText, { color: theme.textSecondary }]}>{camera.status}</Text>
                  </View>
                </View>
                <Ionicons name="play-circle" size={32} color="#3B82F6" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Tap refresh to load cameras</Text>
          )}
        </View>

        {/* Automation Scenes */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={24} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Automation Scenes</Text>
          </View>
          
          {[
            { name: 'Good Morning', icon: 'sunny', color: '#F59E0B', actions: 3 },
            { name: 'Leave Home', icon: 'exit', color: '#3B82F6', actions: 5 },
            { name: 'Good Night', icon: 'moon', color: '#8B5CF6', actions: 4 },
            { name: 'Movie Time', icon: 'film', color: '#EF4444', actions: 2 },
          ].map((scene, idx) => (
            <TouchableOpacity key={idx} style={[styles.sceneCard, { backgroundColor: theme.background }]}>
              <View style={[styles.sceneIcon, { backgroundColor: scene.color + '20' }]}>
                <Ionicons name={scene.icon as any} size={24} color={scene.color} />
              </View>
              <View style={styles.sceneInfo}>
                <Text style={[styles.sceneName, { color: theme.text }]}>{scene.name}</Text>
                <Text style={[styles.sceneActions, { color: theme.textSecondary }]}>{scene.actions} actions</Text>
              </View>
              <TouchableOpacity style={[styles.playButton, { backgroundColor: scene.color }]}>
                <Ionicons name="play" size={16} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  refreshButton: { padding: 4 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  deviceIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  deviceStatus: { fontSize: 12, fontWeight: '600' },
  energyStats: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  energyStat: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  energyValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  energyLabel: { fontSize: 11, marginBottom: 2 },
  energyUnit: { fontSize: 10 },
  costBox: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  costLabel: { fontSize: 13, marginBottom: 8 },
  costValue: { fontSize: 28, fontWeight: '700' },
  consumptionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  consumptionName: { fontSize: 13, width: 80 },
  consumptionBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  consumptionFill: { height: '100%', borderRadius: 4 },
  consumptionValue: { fontSize: 12, width: 60, textAlign: 'right' },
  placeholderText: { fontSize: 14, textAlign: 'center', padding: 20 },
  cameraCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  cameraIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  cameraInfo: { flex: 1 },
  cameraName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cameraStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12 },
  sceneCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  sceneIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  sceneInfo: { flex: 1 },
  sceneName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  sceneActions: { fontSize: 12 },
  playButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});