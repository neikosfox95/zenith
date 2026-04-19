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
import Constants from 'expo-constants';

export default function Phase26Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [textToTranslate, setTextToTranslate] = useState('');
  const [itinerary, setItinerary] = useState<any>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [translation, setTranslation] = useState<any>(null);

  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

  const planTrip = async () => {
    if (!destination || !duration) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/travel/trip/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          destination,
          duration: parseInt(duration),
          preferences: {}
        })
      });
      const data = await response.json();
      if (data.success) {
        setItinerary(data.itinerary);
      }
    } catch (error) {
      console.error('Plan trip error:', error);
    }
    setLoading(false);
  };

  const findNearbyPlaces = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/travel/location/nearby?lat=40.7128&lon=-74.0060&type=restaurant`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setNearbyPlaces(data.places);
      }
    } catch (error) {
      console.error('Find nearby error:', error);
    }
  };

  const translateText = async () => {
    if (!textToTranslate.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/travel/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          text: textToTranslate,
          source_lang: 'en',
          target_lang: 'es'
        })
      });
      const data = await response.json();
      if (data.success) {
        setTranslation(data.translation);
      }
    } catch (error) {
      console.error('Translate error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#06B6D4', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="airplane" size={48} color="white" />
        <Text style={styles.headerTitle}>Travel & Location</Text>
        <Text style={styles.headerSubtitle}>AI travel assistant</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Trip Planner */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map" size={24} color="#06B6D4" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Trip Planner</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Destination (e.g., Paris)"
            placeholderTextColor={theme.textSecondary}
            value={destination}
            onChangeText={setDestination}
          />

          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Duration (days)"
            placeholderTextColor={theme.textSecondary}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#06B6D4' }]}
            onPress={planTrip}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="map-outline" size={20} color="white" />
                <Text style={styles.actionButtonText}>Generate Itinerary</Text>
              </>
            )}
          </TouchableOpacity>

          {itinerary && (
            <View style={[styles.itineraryBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.itineraryTitle, { color: theme.text }]}>{itinerary.destination}</Text>
              <Text style={[styles.itineraryMeta, { color: theme.textSecondary }]}>{itinerary.duration} days trip</Text>
              {itinerary.days?.map((day: any, idx: number) => (
                <View key={idx} style={styles.dayCard}>
                  <Text style={[styles.dayTitle, { color: theme.text }]}>Day {day.day}</Text>
                  {day.activities?.map((activity: string, aidx: number) => (
                    <Text key={aidx} style={[styles.activityText, { color: theme.textSecondary }]}>• {activity}</Text>
                  ))}
                </View>
              ))}
              <Text style={[styles.costText, { color: '#10B981' }]}>Estimated: ${itinerary.estimated_cost}</Text>
            </View>
          )}
        </View>

        {/* Nearby Places */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="navigate" size={24} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Nearby Places</Text>
            <TouchableOpacity onPress={findNearbyPlaces} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          
          {nearbyPlaces.length > 0 ? (
            nearbyPlaces.map((place, idx) => (
              <View key={idx} style={[styles.placeCard, { backgroundColor: theme.background }]}>
                <View style={[styles.placeIcon, { backgroundColor: '#3B82F6' + '20' }]}>
                  <Ionicons name="location" size={20} color="#3B82F6" />
                </View>
                <View style={styles.placeInfo}>
                  <Text style={[styles.placeName, { color: theme.text }]}>{place.name}</Text>
                  <View style={styles.placeMeta}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={[styles.placeRating, { color: theme.textSecondary }]}>{place.rating}</Text>
                    <Text style={[styles.placeDistance, { color: theme.textSecondary }]}>• {place.distance} km</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Tap refresh to load nearby places</Text>
          )}
        </View>

        {/* Translator */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="language" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Real-time Translation</Text>
          </View>
          
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Enter text to translate..."
            placeholderTextColor={theme.textSecondary}
            value={textToTranslate}
            onChangeText={setTextToTranslate}
            multiline
            numberOfLines={3}
          />

          <View style={styles.langRow}>
            <View style={[styles.langBadge, { backgroundColor: '#10B981' + '20' }]}>
              <Text style={[styles.langText, { color: '#10B981' }]}>EN</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={theme.textSecondary} />
            <View style={[styles.langBadge, { backgroundColor: '#3B82F6' + '20' }]}>
              <Text style={[styles.langText, { color: '#3B82F6' }]}>ES</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={translateText}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="language" size={20} color="white" />
                <Text style={styles.actionButtonText}>Translate</Text>
              </>
            )}
          </TouchableOpacity>

          {translation && (
            <View style={[styles.translationBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.translatedText, { color: theme.text }]}>{translation.translated}</Text>
              <Text style={[styles.confidence, { color: theme.textSecondary }]}>Confidence: {(translation.confidence * 100).toFixed(0)}%</Text>
            </View>
          )}
        </View>

        {/* Bookings */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Booking</Text>
          </View>
          
          {[
            { type: 'Flight', icon: 'airplane', color: '#3B82F6' },
            { type: 'Hotel', icon: 'bed', color: '#10B981' },
            { type: 'Experience', icon: 'ticket', color: '#F59E0B' }
          ].map((booking, idx) => (
            <TouchableOpacity key={idx} style={[styles.bookingCard, { backgroundColor: theme.background }]}>
              <View style={[styles.bookingIcon, { backgroundColor: booking.color + '20' }]}>
                <Ionicons name={booking.icon as any} size={24} color={booking.color} />
              </View>
              <Text style={[styles.bookingType, { color: theme.text }]}>Book {booking.type}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
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
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  textArea: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  itineraryBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  itineraryTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  itineraryMeta: { fontSize: 13, marginBottom: 16 },
  dayCard: { marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  dayTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  activityText: { fontSize: 13, marginBottom: 4, paddingLeft: 8 },
  costText: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  placeCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  placeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  placeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  placeRating: { fontSize: 12 },
  placeDistance: { fontSize: 12 },
  placeholderText: { fontSize: 14, textAlign: 'center', padding: 20 },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
  langBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  langText: { fontSize: 14, fontWeight: '700' },
  translationBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  translatedText: { fontSize: 16, marginBottom: 8 },
  confidence: { fontSize: 12 },
  bookingCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  bookingIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  bookingType: { flex: 1, fontSize: 15, fontWeight: '600' },
});