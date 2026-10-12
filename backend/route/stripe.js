import express from 'express';
import { createCheckoutSession } from '../services/stripeService.js';

const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'products array is required' });
    }

    const session = await createCheckoutSession(products);
    return res.json(session);
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
