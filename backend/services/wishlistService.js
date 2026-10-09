import Wishlist from '../module/wishlist.js';

async function loadOrCreateWishlist(userId) {
  const existing = await Wishlist.findOne({ user: userId });
  if (existing) return existing;

  try {
    return await Wishlist.create({ user: userId, productIds: [] });
  } catch (error) {
    if (error.code === 11000) {
      return Wishlist.findOne({ user: userId });
    }
    throw error;
  }
}

export async function getWishlist(userId) {
  const wishlist = await Wishlist.findOne({ user: userId });
  return wishlist ? wishlist.productIds : [];
}

export async function addToWishlist(userId, productId) {
  const wishlist = await loadOrCreateWishlist(userId);
  if (!wishlist.productIds.includes(productId)) {
    wishlist.productIds.push(productId);
    await wishlist.save();
  }
  return wishlist.productIds;
}

export async function removeFromWishlist(userId, productId) {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) return [];

  wishlist.productIds = wishlist.productIds.filter((id) => id !== productId);
  await wishlist.save();
  return wishlist.productIds;
}

export async function replaceWishlist(userId, productIds) {
  const unique = [...new Set(productIds)];
  const wishlist = await loadOrCreateWishlist(userId);
  wishlist.productIds = unique;
  await wishlist.save();
  return unique;
}

export async function toggleWishlistItem(userId, productId) {
  const wishlist = await loadOrCreateWishlist(userId);
  const index = wishlist.productIds.indexOf(productId);

  if (index === -1) {
    wishlist.productIds.push(productId);
  } else {
    wishlist.productIds.splice(index, 1);
  }

  await wishlist.save();
  return { productIds: wishlist.productIds, added: index === -1 };
}
