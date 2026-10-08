import Cart from '../module/cart.js';
import Product from '../module/product.js';

// Cart lines persist productId/quantity/size/color; product data (name, price,
// image, alt) is joined on read so the API matches the frontend CartItem type
// and prices always come from the database, never the client.
export async function getCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) return [];

  const products = await Product.find({ _id: { $in: cart.items.map((item) => item.productId) } });
  const byId = new Map(products.map((product) => [product._id.toString(), product]));

  return cart.items
    .filter((item) => byId.has(item.productId))
    .map((item) => {
      const product = byId.get(item.productId);
      return {
        id: item.productId,
        name: product.name,
        price: product.price,
        ...(product.originalPrice !== undefined && product.originalPrice !== null
          ? { originalPrice: product.originalPrice }
          : {}),
        image: product.image,
        alt: product.alt,
        ...(item.size ? { size: item.size } : {}),
        ...(item.color ? { color: item.color } : {}),
        quantity: item.quantity,
      };
    });
}

async function loadOrCreateCart(userId) {
  const existing = await Cart.findOne({ user: userId });
  if (existing) return existing;

  try {
    return await Cart.create({ user: userId, items: [] });
  } catch (error) {
    if (error.code === 11000) {
      // Concurrent request created the cart first.
      return Cart.findOne({ user: userId });
    }
    throw error;
  }
}

export async function addToCart(userId, { productId, quantity = 1, size, color }) {
  const product = await Product.findOne({ _id: productId, active: true });
  if (!product) return null;

  const amount = Math.trunc(Number(quantity)) || 1;
  const cart = await loadOrCreateCart(userId);
  const existing = cart.items.find(
    (item) => item.productId === productId && item.size === size && item.color === color,
  );

  if (existing) {
    existing.quantity = Math.min(existing.quantity + amount, 99);
  } else {
    cart.items.push({
      productId,
      quantity: Math.min(Math.max(amount, 1), 99),
      ...(size ? { size } : {}),
      ...(color ? { color } : {}),
    });
  }

  await cart.save();
  return getCart(userId);
}

export async function updateCartItem(userId, productId, quantity) {
  const amount = Math.trunc(Number(quantity));
  if (!Number.isFinite(amount)) return 'invalid';

  const cart = await Cart.findOne({ user: userId });
  if (!cart) return 'missing';

  if (amount < 1) return removeFromCart(userId, productId);

  const item = cart.items.find((line) => line.productId === productId);
  if (!item) return 'missing';

  item.quantity = Math.min(amount, 99);
  await cart.save();
  return getCart(userId);
}

export async function removeFromCart(userId, productId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return [];

  cart.items = cart.items.filter((line) => line.productId !== productId);
  await cart.save();
  return getCart(userId);
}

export async function clearCart(userId) {
  await Cart.findOneAndUpdate({ user: userId }, { items: [] });
  return [];
}
