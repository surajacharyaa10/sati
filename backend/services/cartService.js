import Cart from '../module/cart.js';
import Product from '../module/product.js';

// Cart lines persist productId/quantity/size/color; product data (name, price,
// image, alt) is joined on read so the API matches the frontend CartItem type
// and prices always come from the database, never the client.

// The product page builds variant ids like "base:Color:Size". Split them back
// into the base product id plus the variant's color and size so the line can
// be looked up and stored correctly.
function normalizeLine(id, size, color) {
  const parts = String(id ?? "").split(":");
  let productId = id;
  let lineSize = typeof size === "string" ? size : undefined;
  let lineColor = typeof color === "string" ? color : undefined;

  if (parts.length >= 3) {
    productId = parts.slice(0, -2).join(":");
    lineColor = lineColor ?? parts[parts.length - 2];
    lineSize = lineSize ?? parts[parts.length - 1];
  }

  return { productId, size: lineSize, color: lineColor };
}

// Cart page round-trips a unique id per line as "productId|size|color" so each
// variant of a product is addressable on its own.
function parseItemId(id) {
  const [productId, size, color] = String(id ?? "").split("|");
  return { productId, size: size || undefined, color: color || undefined };
}

function lineId(item) {
  return `${item.productId}|${item.size ?? ""}|${item.color ?? ""}`;
}

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
        id: lineId(item),
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
  const { productId: baseId, size: lineSize, color: lineColor } = normalizeLine(productId, size, color);
  const product = await Product.findOne({ _id: baseId, active: true });
  if (!product) return null;

  const amount = Math.trunc(Number(quantity)) || 1;
  const cart = await loadOrCreateCart(userId);
  const existing = cart.items.find(
    (item) => item.productId === baseId && item.size === lineSize && item.color === lineColor,
  );

  if (existing) {
    existing.quantity = Math.min(existing.quantity + amount, 99);
  } else {
    cart.items.push({
      productId: baseId,
      quantity: Math.min(Math.max(amount, 1), 99),
      ...(lineSize ? { size: lineSize } : {}),
      ...(lineColor ? { color: lineColor } : {}),
    });
  }

  await cart.save();
  return getCart(userId);
}

export async function updateCartItem(userId, id, quantity) {
  const amount = Math.trunc(Number(quantity));
  if (!Number.isFinite(amount)) return 'invalid';

  const { productId, size, color } = parseItemId(id);
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return 'missing';

  if (amount < 1) return removeFromCart(userId, id);

  const item = cart.items.find(
    (line) => line?.productId === productId && line?.size === size && line?.color === color,
  );
  if (!item) return 'missing';

  item.quantity = Math.min(amount, 99);
  await cart.save();
  return getCart(userId);
}

export async function removeFromCart(userId, id) {
  const { productId, size, color } = parseItemId(id);
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return [];

  cart.items = cart.items.filter(
    (line) => !(line?.productId === productId && line?.size === size && line?.color === color),
  );
  await cart.save();
  return getCart(userId);
}

export async function replaceCart(userId, items) {
  const cart = await loadOrCreateCart(userId);
  cart.items = items.map((item) => {
    const { productId, size, color } = normalizeLine(item.id, item.size, item.color);
    return {
      productId,
      quantity: Math.min(Math.max(Number(item.quantity) || 1, 1), 99),
      ...(typeof size === "string" ? { size } : {}),
      ...(typeof color === "string" ? { color } : {}),
    };
  });
  await cart.save();
  return getCart(userId);
}

export async function clearCart(userId) {
  await Cart.findOneAndUpdate({ user: userId }, { items: [] });
  return [];
}