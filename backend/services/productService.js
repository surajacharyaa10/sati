import Product from '../module/product.js';

// Mirrors client/lib/store-products.ts so the backend is the single source of truth.
const categorySpecifications = {};
const audienceColors = {};
const reviewStats = {};
const productSeeds = [];

export const buildSeedProducts = () => [];

export async function seedProductsIfEmpty() {
  const count = await Product.countDocuments();
  if (count > 0) return;

  await Product.insertMany([]);
  console.log(`Seeded 0 products`);
}

export async function getAllProducts({ audience, category, label } = {}) {
  const filter = { active: true };
  if (audience) filter.audience = audience;
  if (category) filter.category = category;
  if (label) filter.label = label;

  return Product.find(filter).sort({ name: 1 });
}

export async function getProductById(id) {
  return Product.findOne({ _id: id, active: true });
}

export async function createProduct(data) {
  const product = new Product(data);
  return product.save();
}

export async function getProductsByIds(ids) {
  return Product.find({ _id: { $in: ids } });
}

export async function updateProduct(id, data) {
  return Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    context: 'query',
  });
}

export async function deleteProduct(id) {
  // Soft delete: cart lines and past orders keep referencing the product id.
  return Product.findOneAndUpdate({ _id: id }, { active: false }, { new: true });
}
