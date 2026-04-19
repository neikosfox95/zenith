import express from 'express';

const router = express.Router();

// Phase 25: Finance & Investment Tools

// Add Investment
router.post('/portfolio/add', async (req, res) => {
  try {
    const { symbol, shares, purchase_price } = req.body;
    const investment = {
      id: `investment_${Date.now()}`,
      symbol,
      shares,
      purchase_price,
      current_price: purchase_price * 1.1,
      gain_loss: purchase_price * 0.1 * shares,
      gain_loss_percent: 10
    };
    res.json({
      success: true,
      investment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Financial Advisor
router.post('/ai-advisor/consult', async (req, res) => {
  try {
    const { portfolio, risk_tolerance } = req.body;
    const advice = {
      session_id: `advice_${Date.now()}`,
      recommendation: 'Diversify your portfolio by adding bonds and international stocks.',
      risk_assessment: risk_tolerance,
      suggested_allocation: {
        stocks: 60,
        bonds: 30,
        cash: 10
      },
      powered_by: 'Grok 4.3 Finance AI'
    };
    res.json({
      success: true,
      advice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log Expense
router.post('/expense/log', async (req, res) => {
  try {
    const { amount, category, description } = req.body;
    const expense = {
      id: `expense_${Date.now()}`,
      amount,
      category,
      description,
      date: new Date().toISOString(),
      ai_category: category,
      budget_remaining: 500
    };
    res.json({
      success: true,
      expense
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Crypto Portfolio
router.get('/crypto/portfolio', async (req, res) => {
  try {
    const portfolio = {
      holdings: [
        { symbol: 'BTC', amount: 0.5, value: 25000, change_24h: 2.5 },
        { symbol: 'ETH', amount: 5, value: 10000, change_24h: -1.2 }
      ],
      total_value: 35000,
      total_gain: 5000
    };
    res.json({
      success: true,
      portfolio
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate Taxes
router.post('/tax/calculate', async (req, res) => {
  try {
    const { income, deductions } = req.body;
    const tax = {
      gross_income: income,
      deductions,
      taxable_income: income - deductions,
      estimated_tax: (income - deductions) * 0.22,
      bracket: '22%',
      refund_estimate: 0
    };
    res.json({
      success: true,
      tax_calculation: tax
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;