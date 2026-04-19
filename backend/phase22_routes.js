import express from 'express';

const router = express.Router();

// Phase 22: E-commerce & Shopping

// Create Product
router.post('/products/create', async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const product = {
      id: `product_${Date.now()}`,
      name,
      description,
      price,
      category,
      stock: 100,
      created_at: new Date().toISOString()
    };
    res.json({
      success: true,
      product,
      message: 'Product created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to Cart
router.post('/cart/add', async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const cart = {
      id: 'cart_123',
      items: [
        { product_id, quantity, price: 29.99 }
      ],
      total: 29.99,
      recommendations: ['Product A', 'Product B']
    };
    res.json({
      success: true,
      cart,
      message: 'Item added to cart'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process Checkout
router.post('/checkout', async (req, res) => {
  try {
    const { cart_id, payment_method } = req.body;
    const order = {
      order_id: `order_${Date.now()}`,
      status: 'processing',
      total: 29.99,
      payment_status: 'completed',
      tracking_number: 'TRACK123456'
    };
    res.json({
      success: true,
      order,
      message: 'Order placed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Inventory
router.get('/inventory', async (req, res) => {
  try {
    const inventory = [
      { product_id: 1, name: 'Product A', stock: 50, reorder_level: 10 },
      { product_id: 2, name: 'Product B', stock: 25, reorder_level: 15 },
      { product_id: 3, name: 'Product C', stock: 5, reorder_level: 20, needs_reorder: true }
    ];
    res.json({
      success: true,
      inventory,
      low_stock_items: 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;