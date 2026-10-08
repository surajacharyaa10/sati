// Simple in-memory cart service
const carts = {};

export function addToCart(userId, productId, quantity = 1) {
  if (!carts[userId]) carts[userId] = [];
  const existing = carts[userId].find((p) => p.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    carts[userId].push({ productId, quantity });
  }
  return carts[userId];
}

export function getCart(userId) {
  return carts[userId] || [];
}
