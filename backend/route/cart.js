import express from 'express';
import { authenticate } from '../services/session.js';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../services/cartService.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', async (req, res, next) => {
  try {
    res.json(await getCart(req.authUserId));
  } catch (error) {
    next(error);
  }
});

router.post('/me', async (req, res, next) => {
  const { productId, quantity, size, color } = req.body ?? {};
  if (typeof productId !== 'string' || !productId.trim()) {
    return res.status(400).json({ error: 'productId required' });
  }

  try {
    const cart = await addToCart(req.authUserId, {
      productId: productId.trim(),
      quantity,
      ...(typeof size === 'string' ? { size: size.trim() } : {}),
      ...(typeof color === 'string' ? { color: color.trim() } : {}),
    });
    if (!cart) return res.status(404).json({ error: 'Product not found' });
    return res.json(cart);
  } catch (error) {
    return next(error);
  }
});

router.put('/me/:productId', async (req, res, next) => {
  const { quantity } = req.body ?? {};
  if (quantity === undefined || typeof quantity !== 'number' || Number.isNaN(quantity)) {
    return res.status(400).json({ error: 'quantity must be a number' });
  }

  try {
    const result = await updateCartItem(req.authUserId, req.params.productId, quantity);
    if (result === 'invalid') return res.status(400).json({ error: 'Invalid quantity' });
    if (result === 'missing') return res.status(404).json({ error: 'Item not found' });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.delete('/me/:productId', async (req, res, next) => {
  try {
    res.json(await removeFromCart(req.authUserId, req.params.productId));
  } catch (error) {
    next(error);
  }
});

router.delete('/me', async (req, res, next) => {
  try {
    res.json(await clearCart(req.authUserId));
  } catch (error) {
    next(error);
  }
});

export default router;
