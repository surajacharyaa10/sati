import express from 'express';
import { createOrder, getOrdersByUser } from '../services/orderService.js';

const router = express.Router();

router.post('/:userId', (req, res) => {
  const { items } = req.body;
  if (!items) return res.status(400).json({ error: 'items required' });
  const order = createOrder(req.params.userId, items);
  res.status(201).json(order);
});

router.get('/:userId', (req, res) => {
  res.json(getOrdersByUser(req.params.userId));
});

export default router;
