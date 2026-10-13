import express from 'express';
import { authenticate } from '../services/session.js';
import { getEsewaPaymentHash, verifyEsewaPayment } from '../config/esewa.js';
import { createOrderFromCart } from '../services/orderService.js';
import Order from '../module/order.js';
import Product from '../module/product.js';
import Payment from '../module/payment.js';

const router = express.Router();

router.post('/initialize', authenticate, async (req, res) => {
  try {
    const order = await createOrderFromCart(req.authUserId, req.body.address, req.body.phoneNumber);
    if (!order) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const paymentHash = await getEsewaPaymentHash({
      amount: order.subtotal,
      transaction_uuid: order._id.toString(),
    });

    return res.json({
      success: true,
      payment: paymentHash,
      order,
      esewaConfig: {
        form_url: `${process.env.ESEWA_GATEWAY_URL.replace(/\/+$/, '')}/api/epay/main/v2/form`,
        amount: order.subtotal,
        transaction_uuid: order._id.toString(),
        product_code: process.env.ESEWA_PRODUCT_CODE,
        product_service_charge: 0,
        product_delivery_charge: 0,
        tax_amount: 0,
        total_amount: order.subtotal,
        success_url: `${process.env.BACKEND_URI}/api/esewa/complete-payment`,
        failure_url: `${process.env.CLIENT_ORIGIN}/payment-failed`,
        signed_field_names: paymentHash.signed_field_names,
        signature: paymentHash.signature,
      },
    });
  } catch (error) {
    console.error('eSewa initialize error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});


router.post('/initialize-item', authenticate, async (req, res) => {
  try {
    const { productId, totalPrice, quantity = 1, size, color } = req.body;

    const product = await Product.findOne({
      _id: productId,
      active: true,
    });

    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Product not found',
      });
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const amount = Number(totalPrice) || product.price * qty;
    const savings = Math.max((product.originalPrice ?? product.price) - product.price, 0) * qty;

    // Create a standalone order for this single direct item (cart is NOT touched or cleared)
    const order = await Order.create({
      user: req.authUserId,
      items: [{
        productId: product._id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice ?? undefined,
        image: product.image,
        alt: product.alt,
        size: size || undefined,
        color: color || undefined,
        quantity: qty,
      }],
      subtotal: amount,
      totalSavings: savings,
      address: req.body.address || '',
      phoneNumber: req.body.phoneNumber || '',
    });

    const paymentHash = await getEsewaPaymentHash({
      amount: amount,
      transaction_uuid: order._id.toString(),
    });

    return res.json({
      success: true,
      payment: paymentHash,
      order,
      esewaConfig: {
        form_url: `${process.env.ESEWA_GATEWAY_URL.replace(/\/+$/, '')}/api/epay/main/v2/form`,
        amount: amount,
        transaction_uuid: order._id.toString(),
        product_code: process.env.ESEWA_PRODUCT_CODE,
        product_service_charge: 0,
        product_delivery_charge: 0,
        tax_amount: 0,
        total_amount: amount,
        success_url: `${process.env.BACKEND_URI}/api/esewa/complete-payment`,
        failure_url: `${process.env.CLIENT_ORIGIN}/payment-failed`,
        signed_field_names: paymentHash.signed_field_names,
        signature: paymentHash.signature,
      },
    });
  } catch (error) {
    console.error('eSewa initialize-item error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});


router.get('/complete-payment', async (req, res) => {
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ success: false, message: 'Missing payment data from eSewa' });
  }

  try {
    const paymentInfo = await verifyEsewaPayment(data);

    const order = await Order.findById(paymentInfo.response.transaction_uuid);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Record the payment
    const paymentData = await Payment.create({
      pidx: paymentInfo.decodedData.transaction_code,
      transactionId: paymentInfo.decodedData.transaction_code,
      orderId: order._id,
      amount: order.subtotal,
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: 'esewa',
      status: 'success',
    });

    // Mark the order as confirmed
    order.status = 'confirmed';
    await order.save();

    // Redirect user to the success slip page on the frontend
    const clientOrigin = process.env.CLIENT_ORIGIN;
    return res.redirect(`${clientOrigin}/payment-success?orderId=${order._id}&gateway=esewa`);
  } catch (error) {
    console.error('eSewa complete-payment error:', error.message);
    const clientOrigin = process.env.CLIENT_ORIGIN;
    return res.redirect(`${clientOrigin}/payment-failed?reason=${encodeURIComponent(error.message)}`);
  }
});

export default router;
