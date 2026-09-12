import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
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

export default function Phase22Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const createProduct = async () => {
    if (!productName.trim() || !productPrice.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/ecommerce/products/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          name: productName,
          description: 'High quality product',
          price: parseFloat(productPrice),
          category: 'general'
        })
      });
      const data = await response.json();
      if (data.success) {
        setProducts([data.product, ...products]);
        setProductName('');
        setProductPrice('');
      }
    } catch (error) {
      console.error('Create product error:', error);
    }
    setLoading(false);
  };

  const addToCart = async (productId: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/ecommerce/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1
        })
      });
      const data = await response.json();
      if (data.success) {
        setCart([...cart, data.cart.items[0]]);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  const checkout = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/ecommerce/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          cart_id: 'cart_123',
          payment_method: 'card'
        })
      });
      const data = await response.json();
      if (data.success) {
        setCart([]);
        alert(`Order placed! Tracking: ${data.order.tracking_number}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#10B981', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="cart" size={48} color="white" />
        <Text style={styles.headerTitle}>E-Commerce & Shopping</Text>
        <Text style={styles.headerSubtitle}>AI-powered shopping experience</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Shopping Cart Summary */}
        {cart.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cart" size={24} color="#10B981" />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Shopping Cart ({cart.length})</Text>
            </View>
            
            <View style={[styles.cartSummary, { backgroundColor: theme.background }]}>
              <View style={styles.cartRow}>
                <Text style={[styles.cartLabel, { color: theme.textSecondary }]}>Items:</Text>
                <Text style={[styles.cartValue, { color: theme.text }]}>{cart.length}</Text>
              </View>
              <View style={styles.cartRow}>
                <Text style={[styles.cartLabel, { color: theme.textSecondary }]}>Subtotal:</Text>
                <Text style={[styles.cartValue, { color: theme.text }]}>${(cart.length * 29.99).toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkoutButton, { backgroundColor: '#10B981' }]}
              onPress={checkout}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Ionicons name="card" size={20} color="white" />
                  <Text style={styles.checkoutButtonText}>Checkout Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Create Product */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle" size={24} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Add New Product</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Product name..."
            placeholderTextColor={theme.textSecondary}
            value={productName}
            onChangeText={setProductName}
          />

          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Price ($)..."
            placeholderTextColor={theme.textSecondary}
            value={productPrice}
            onChangeText={setProductPrice}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#3B82F6' }]}
            onPress={createProduct}
            disabled={loading || !productName.trim() || !productPrice.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Add Product</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Featured Products */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured Products</Text>
          </View>
          
          <View style={styles.productsGrid}>
            {[
              { id: 1, name: 'Premium Headphones', price: 299, rating: 4.8, stock: 50 },
              { id: 2, name: 'Wireless Mouse', price: 79, rating: 4.5, stock: 120 },
              { id: 3, name: 'Laptop Stand', price: 49, rating: 4.7, stock: 85 },
              { id: 4, name: 'USB-C Hub', price: 39, rating: 4.6, stock: 200 }
            ].map((product, idx) => (
              <View key={idx} style={[styles.productCard, { backgroundColor: theme.background }]}>
                <View style={[styles.productImage, { backgroundColor: '#10B981' + '20' }]}>
                  <Ionicons name="cube" size={32} color="#10B981" />
                </View>
                <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{product.name}</Text>
                <View style={styles.productRating}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.ratingText, { color: theme.text }]}>{product.rating}</Text>
                </View>
                <Text style={[styles.productPrice, { color: '#10B981' }]}>${product.price}</Text>
                <TouchableOpacity
                  style={[styles.addCartButton, { backgroundColor: '#10B981' }]}
                  onPress={() => addToCart(product.id.toString())}
                >
                  <Ionicons name="cart" size={16} color="white" />
                  <Text style={styles.addCartText}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={24} color="#EC4899" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Recommendations</Text>
          </View>
          
          <Text style={[styles.recommendText, { color: theme.textSecondary }]}>
            Based on your browsing history and preferences
          </Text>

          {[
            { name: 'Keyboard (Mechanical)', price: 149, match: 95 },
            { name: 'Monitor 27"', price: 399, match: 88 },
            { name: 'Desk Lamp (LED)', price: 59, match: 82 }
          ].map((item, idx) => (
            <View key={idx} style={[styles.recommendCard, { backgroundColor: theme.background }]}>
              <View style={[styles.recommendIcon, { backgroundColor: '#EC4899' + '20' }]}>
                <Ionicons name="cube-outline" size={24} color="#EC4899" />
              </View>
              <View style={styles.recommendInfo}>
                <Text style={[styles.recommendName, { color: theme.text }]}>{item.name}</Text>
                <View style={styles.recommendMeta}>
                  <Text style={[styles.recommendPrice, { color: '#10B981' }]}>${item.price}</Text>
                  <View style={[styles.matchBadge, { backgroundColor: '#EC4899' + '20' }]}>
                    <Text style={[styles.matchText, { color: '#EC4899' }]}>{item.match}% match</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={[styles.viewButton, { backgroundColor: '#EC4899' }]}>
                <Ionicons name="eye" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Inventory Status */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={24} color="#6366F1" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Inventory Status</Text>
          </View>
          
          <View style={styles.inventoryStats}>
            {[
              { label: 'Total Items', value: '250', color: '#10B981' },
              { label: 'Low Stock', value: '12', color: '#F59E0B' },
              { label: 'Out of Stock', value: '3', color: '#EF4444' }
            ].map((stat, idx) => (
              <View key={idx} style={[styles.statCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Created Products */}
        {products.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Products</Text>
            {products.map((product, idx) => (
              <View key={idx} style={[styles.createdProductCard, { backgroundColor: theme.background }]}>
                <View style={styles.createdProductInfo}>
                  <Text style={[styles.createdProductName, { color: theme.text }]}>{product.name}</Text>
                  <Text style={[styles.createdProductPrice, { color: '#10B981' }]}>${product.price}</Text>
                </View>
                <View style={[styles.stockBadge, { backgroundColor: '#10B981' + '20' }]}>
                  <Text style={[styles.stockText, { color: '#10B981' }]}>{product.stock} in stock</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  cartSummary: { padding: 16, borderRadius: 12, marginBottom: 16 },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cartLabel: { fontSize: 14 },
  cartValue: { fontSize: 14, fontWeight: '600' },
  checkoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  checkoutButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: { width: '48%', padding: 12, borderRadius: 12 },
  productImage: { width: '100%', height: 100, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  productName: { fontSize: 14, fontWeight: '600', marginBottom: 8, minHeight: 36 },
  productRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  ratingText: { fontSize: 12, fontWeight: '600' },
  productPrice: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  addCartButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, gap: 6 },
  addCartText: { color: 'white', fontSize: 13, fontWeight: '600' },
  recommendText: { fontSize: 13, marginBottom: 16 },
  recommendCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  recommendIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  recommendInfo: { flex: 1 },
  recommendName: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  recommendMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recommendPrice: { fontSize: 14, fontWeight: '700' },
  matchBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  matchText: { fontSize: 11, fontWeight: '600' },
  viewButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  inventoryStats: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 11, textAlign: 'center' },
  createdProductCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginBottom: 12 },
  createdProductInfo: { flex: 1 },
  createdProductName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  createdProductPrice: { fontSize: 16, fontWeight: '700' },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  stockText: { fontSize: 11, fontWeight: '600' },
});