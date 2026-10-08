import express from 'express';
import { addToCart, getCart } from '../services/cartService.js';

const router = express.Router();

router.post('/:userId', (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required' });
  const cart = addToCart(req.params.userId, productId, quantity);
  res.json(cart);
});

router.get('/:userId', (req, res) => {
  res.json(getCart(req.params.userId));
});

export default router;
