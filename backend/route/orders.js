import express from 'express';
import mongoose from 'mongoose';
import { authenticate, requireAdmin } from '../services/session.js';
import {
  createOrderFromCart,
  getOrdersByUser,
  getOrderById,
} from '../services/orderService.js';
import Order from '../module/order.js';
import Payment from '../module/payment.js';
import User from '../module/user.js';

const router = express.Router();

router.use(authenticate);

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

// List all customer orders for admin dashboard
router.get('/all', requireAdmin, async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    const validUserIds = orders
      .map((o) => o.user)
      .filter((u) => u && mongoose.isValidObjectId(u));
    const users = await User.find({ _id: { $in: validUserIds } }).select('name email').lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const orderIds = orders.map((o) => o._id);
    const payments = await Payment.find({ orderId: { $in: orderIds } }).lean();
    const paymentMap = new Map(payments.map((p) => [p.orderId.toString(), p]));

    const result = orders.map((o) => {
      const p = paymentMap.get(o._id.toString());
      const u = typeof o.user === 'object' && o.user?.name ? o.user : userMap.get(String(o.user));
      const isAdminTest = typeof o.user === 'string' && o.user.startsWith('admin-');
      return {
        ...o,
        id: o._id.toString(),
        payment: p || null,
        customerName: u?.name ? u.name : (isAdminTest ? 'Administrator (Test)' : 'Customer'),
        customerEmail: u?.email ? u.email : (isAdminTest ? (process.env.ADMIN_USERNAME || 'admin@sati.com') : ''),
      };
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }
});

// Update an order's fulfillment status
router.patch('/:orderId/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    await order.save();

    const payment = await Payment.findOne({ orderId: order._id }).lean();
    return res.json({
      ...order.toObject(),
      id: order._id.toString(),
      payment,
    });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid order ID' });
    next(error);
  }
});

// ─── Customer Endpoints ───────────────────────────────────────────────────────

router.get('/me', async (req, res, next) => {
  try {
    res.json(await getOrdersByUser(req.authUserId));
  } catch (error) {
    next(error);
  }
});

router.post('/me', async (req, res, next) => {
  try {
    const { address, phoneNumber } = req.body;
    const order = await createOrderFromCart(req.authUserId, address, phoneNumber);
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
    const payment = await Payment.findOne({ orderId: order._id }).lean();
    return res.json({ ...order.toObject(), id: order._id.toString(), payment });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid order ID' });
    return next(error);
  }
});

export default router;
