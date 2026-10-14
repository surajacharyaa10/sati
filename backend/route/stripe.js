import express from 'express';
import { createCheckoutSession, verifyStripeSession } from '../services/stripeService.js';
import { optionalAuth } from '../services/session.js';
import { createOrderFromCart } from '../services/orderService.js';
import Order from '../module/order.js';
import Payment from '../module/payment.js';
import Product from '../module/product.js';

const router = express.Router();

router.post('/create-checkout-session', optionalAuth, async (req, res) => {
  try {
    const { products } = req.body;
    let orderId = req.body.orderId;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'products array is required' });
    }

    const user = req.authUserId || 'guest';

    // If direct single item is passed (Buy Now), create standalone order without touching cart
    if (req.body.directItem && !orderId) {
      try {
        const { productId, quantity = 1, size, color } = req.body.directItem;
        const p = await Product.findOne({ _id: productId, active: true });
        if (p) {
          const qty = Math.max(1, Number(quantity) || 1);
          const hasPound = p.poundPrice != null;
          const order = await Order.create({
            user,
            items: [{
              productId: p._id.toString(),
              name: p.name,
              price: p.price,
              originalPrice: p.originalPrice ?? undefined,
              poundPrice: p.poundPrice ?? undefined,
              originalPoundPrice: p.originalPoundPrice ?? undefined,
              image: p.image,
              alt: p.alt || '',
              size: size || undefined,
              color: color || undefined,
              quantity: qty,
            }],
            subtotal: p.price * qty,
            totalSavings: Math.max((p.originalPrice ?? p.price) - p.price, 0) * qty,
            ...(hasPound ? {
              subtotalPound: p.poundPrice * qty,
              totalSavingsPound: Math.max((p.originalPoundPrice ?? p.poundPrice) - p.poundPrice, 0) * qty,
            } : {}),
            currency: req.body.currency ? String(req.body.currency).toUpperCase() : 'NPR',
            address: req.body.address || '',
            phoneNumber: req.body.phoneNumber || '',
          });
          orderId = order._id.toString();
        }
      } catch (err) {
        console.warn('Could not create direct order for Stripe checkout:', err.message);
      }
    }

    // Standard cart or products checkout
    if (!orderId) {
      try {
        if (req.authUserId) {
          const cartOrder = await createOrderFromCart(
            req.authUserId,
            req.body.address,
            req.body.phoneNumber,
            req.body.currency ? String(req.body.currency).toUpperCase() : 'NPR'
          );
          if (cartOrder) {
            orderId = cartOrder._id.toString();
          }
        }
      } catch (err) {
        console.warn('Could not create order from cart before Stripe checkout:', err.message);
      }
    }

    // Fallback: create Order from products array so items are never lost
    if (!orderId && products && products.length > 0) {
      try {
        const items = products.map((prod, idx) => ({
          productId: String(prod.productId || `prod_${idx}`),
          name: prod.name || prod.dish || 'Product',
          price: Number(prod.price) || 0,
          originalPrice: prod.originalPrice != null ? Number(prod.originalPrice) : undefined,
          poundPrice: prod.poundPrice != null ? Number(prod.poundPrice) : undefined,
          originalPoundPrice: prod.originalPoundPrice != null ? Number(prod.originalPoundPrice) : undefined,
          image: prod.image || prod.imgdata || '',
          alt: prod.alt || '',
          quantity: Number(prod.quantity || prod.qnty || 1),
        }));
        const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
        const order = await Order.create({
          user,
          items,
          subtotal,
          totalSavings: 0,
          currency: req.body.currency ? String(req.body.currency).toUpperCase() : 'NPR',
          address: req.body.address || '',
          phoneNumber: req.body.phoneNumber || '',
        });
        orderId = order._id.toString();
      } catch (err) {
        console.warn('Could not create fallback order before Stripe checkout:', err.message);
      }
    }

    const session = await createCheckoutSession(
      products,
      orderId,
      req.body.address || '',
      req.body.phoneNumber || '',
      req.body.currency || 'usd'
    );
    return res.json({ ...session, orderId });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await verifyStripeSession(sessionId);

    let order = null;
    const orderId = session.client_reference_id || session.metadata?.orderId;

    if (orderId) {
      order = await Order.findById(orderId);
      if (order && (!order.address || !order.phoneNumber)) {
        if (!order.address && session.metadata?.address) {
          order.address = session.metadata.address;
        }
        if (!order.phoneNumber && session.metadata?.phoneNumber) {
          order.phoneNumber = session.metadata.phoneNumber;
        }
        await order.save();
      }
    }

    // If order was not found in DB, reconstruct it from Stripe line items so customer slip always has items!
    if (!order && session.line_items?.data && session.line_items.data.length > 0) {
      try {
        const items = session.line_items.data.map((item, idx) => {
          const prodObj = typeof item.price?.product === 'object' ? item.price.product : null;
          const name = prodObj?.name || item.description || `Product ${idx + 1}`;
          const image = prodObj?.images?.[0] || '';
          return {
            productId: prodObj?.id || `item_${idx}`,
            name,
            price: (item.price?.unit_amount || 0) / 100,
            quantity: item.quantity || 1,
            image,
            alt: name,
          };
        });

        const user = session.customer_details?.email || 'guest';
        const addressMeta = session.metadata?.address || '';
        const phoneMeta = session.metadata?.phoneNumber || '';
        order = await Order.create({
          user,
          items,
          subtotal: (session.amount_total || 0) / 100,
          totalSavings: 0,
          address: addressMeta,
          phoneNumber: phoneMeta,
          status: session.payment_status === 'paid' ? 'confirmed' : 'pending',
        });
      } catch (err) {
        console.warn('Could not reconstruct order from line_items:', err.message);
      }
    }

    if (order && session.payment_status === 'paid') {
      if (order.status === 'pending') {
        order.status = 'confirmed';
        await order.save();
      }

      // Record payment in Payment collection
      await Payment.findOneAndUpdate(
        { transactionId: session.id },
        {
          transactionId: session.id,
          pidx: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
          orderId: order._id,
          amount: (session.amount_total || 0) / 100,
          paymentGateway: 'stripe',
          status: 'success',
          dataFromVerificationReq: {
            customer_details: session.customer_details,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
            currency: session.currency,
          },
        },
        { upsert: true, new: true },
      );
    }

    return res.json({
      success: true,
      paid: session.payment_status === 'paid',
      session: {
        id: session.id,
        payment_intent: session.payment_intent,
        payment_status: session.payment_status,
        amount_total: (session.amount_total || 0) / 100,
        currency: session.currency,
        customer_email: session.customer_details?.email,
        customer_name: session.customer_details?.name,
      },
      order,
    });
  } catch (error) {
    console.error('Verify Stripe session error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
