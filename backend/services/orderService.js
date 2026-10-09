import Order, { ORDER_STATUSES } from '../module/order.js';
import Product from '../module/product.js';
import { clearCart, getCart } from './cartService.js';

export { ORDER_STATUSES };

const roundMoney = (value) => Math.round(value * 100) / 100;

// Creates an order from a user's server-side cart: product snapshots and prices
// are taken from the database, so client-supplied amounts are never trusted.
export async function createOrderFromCart(userId) {
  const cart = await getCart(userId);
  if (cart.length === 0) return null;

  const items = [];
  for (const line of cart) {
    const product = await Product.findOne({ _id: line.id, active: true });
    if (!product) continue;

    items.push({
      productId: line.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice ?? undefined,
      image: product.image,
      alt: product.alt,
      size: line.size,
      color: line.color,
      quantity: line.quantity,
    });
  }

  if (items.length === 0) return null;

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const totalSavings = roundMoney(
    items.reduce(
      (sum, item) => sum + Math.max((item.originalPrice ?? item.price) - item.price, 0) * item.quantity,
      0,
    ),
  );

  const order = await Order.create({ user: userId, items, subtotal, totalSavings });
  await clearCart(userId);
  return order;
}

export async function getOrdersByUser(userId) {
  // Admin sessions use a non-ObjectId id ("admin-<timestamp>"), which would
  // throw a CastError in Order.find. Admins have no order history.
  if (typeof userId === "string" && userId.startsWith("admin-")) {
    return [];
  }
  return Order.find({ user: userId }).sort({ createdAt: -1 });
}

export async function getOrderById(userId, orderId) {
  return Order.findOne({ _id: orderId, user: userId });
}
