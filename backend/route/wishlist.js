import express from 'express';
import { addToWishlist, getWishlist } from '../services/wishlistService.js';

const router = express.Router();

router.post('/:userId', (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required' });
  const list = addToWishlist(req.params.userId, productId);
  res.json(list);
});

router.get('/:userId', (req, res) => {
  res.json(getWishlist(req.params.userId));
});

export default router;
