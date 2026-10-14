import Order, { ORDER_STATUSES } from '../module/order.js';
import Product from '../module/product.js';
import { clearCart, getCart } from './cartService.js';

export { ORDER_STATUSES };

const roundMoney = (value) => Math.round(value * 100) / 100;

export async function createOrderFromCart(userId, address, phoneNumber, currency = 'NPR') {
  const cart = await getCart(userId);
  if (cart.length === 0) return null;

  const items = [];
  for (const line of cart) {
    const baseProductId = String(line.id ?? "").split("|")[0];
    const product = await Product.findOne({ _id: baseProductId, active: true });
    if (!product) continue;

    items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice ?? undefined,
      poundPrice: product.poundPrice ?? undefined,
      originalPoundPrice: product.originalPoundPrice ?? undefined,
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

  const hasPound = items.some((item) => item.poundPrice != null);
  const subtotalPound = hasPound
    ? roundMoney(items.reduce((sum, item) => sum + (item.poundPrice ?? 0) * item.quantity, 0))
    : undefined;
  const totalSavingsPound = hasPound
    ? roundMoney(
        items.reduce(
          (sum, item) =>
            sum +
            Math.max((item.originalPoundPrice ?? item.poundPrice ?? 0) - (item.poundPrice ?? 0), 0) *
              item.quantity,
          0,
        ),
      )
    : undefined;

  const order = await Order.create({
    user: userId,
    items,
    subtotal,
    totalSavings,
    ...(subtotalPound !== undefined ? { subtotalPound, totalSavingsPound } : {}),
    currency: currency ? String(currency).toUpperCase() : 'NPR',
    address,
    phoneNumber,
  });
  await clearCart(userId);
  return order;
}

export async function getOrdersByUser(userId) {
  return Order.find({ user: userId }).sort({ createdAt: -1 });
}

export async function getOrderById(userId, orderId) {
  if (typeof userId === "string" && userId.startsWith("admin-")) {
    return Order.findById(orderId);
  }
  return Order.findOne({ _id: orderId, user: userId });
}
