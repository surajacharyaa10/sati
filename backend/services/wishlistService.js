// Simple in-memory wishlist service
const wishlists = {};

export function addToWishlist(userId, productId) {
  if (!wishlists[userId]) wishlists[userId] = [];
  if (!wishlists[userId].includes(productId)) {
    wishlists[userId].push(productId);
  }
  return wishlists[userId];
}

export function getWishlist(userId) {
  return wishlists[userId] || [];
}
