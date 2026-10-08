import express from 'express';
import { authenticate } from '../services/session.js';
import {
  createOrderFromCart,
  getOrdersByUser,
  getOrderById,
} from '../services/orderService.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', async (req, res, next) => {
  try {
    res.json(await getOrdersByUser(req.authUserId));
  } catch (error) {
    next(error);
  }
});

router.post('/me', async (req, res, next) => {
  try {
    const order = await createOrderFromCart(req.authUserId);
    if (!order) return res.status(400).json({ error: 'Your cart is empty' });
    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
});

router.get('/me/:orderId', async (req, res, next) => {
  try {
    const order = await getOrderById(req.authUserId, req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json(order);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid order ID' });
    return next(error);
  }
});

export default router;
