import express from 'express';

const router = express.Router();

// Phase 27: Smart Home & IoT Integration

// Control Device
router.post('/device/control', async (req, res) => {
  try {
    const { device_id, action, value } = req.body;
    const result = {
      device_id,
      action,
      value,
      status: 'success',
      timestamp: new Date().toISOString(),
      new_state: value
    };
    res.json({
      success: true,
      result,
      message: `Device ${device_id} ${action} completed`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Energy Usage
router.get('/energy/usage', async (req, res) => {
  try {
    const usage = {
      today: 45.2,
      this_week: 320,
      this_month: 1350,
      unit: 'kWh',
      cost: 150.50,
      devices: [
        { name: 'HVAC', consumption: 25.5, percentage: 56 },
        { name: 'Lighting', consumption: 10.2, percentage: 23 },
        { name: 'Appliances', consumption: 9.5, percentage: 21 }
      ]
    };
    res.json({
      success: true,
      usage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Camera Feeds
router.get('/security/cameras', async (req, res) => {
  try {
    const cameras = [
      { id: 'cam_1', name: 'Front Door', status: 'online', stream_url: 'https://example.com/stream1' },
      { id: 'cam_2', name: 'Backyard', status: 'online', stream_url: 'https://example.com/stream2' },
      { id: 'cam_3', name: 'Garage', status: 'offline', stream_url: null }
    ];
    res.json({
      success: true,
      cameras,
      alerts: [
        { camera: 'cam_1', type: 'motion_detected', time: '5 minutes ago' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;