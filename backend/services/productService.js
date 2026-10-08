// Simple in-memory product service
const products = [
  {
    id: 1,
    name: 'Product 1',
    originalPrice: 1000,
    salePrice: 800,
    image: '/assets/image1.jpeg',
  },
  {
    id: 2,
    name: 'Product 2',
    originalPrice: 2000,
    salePrice: 1500,
    image: '/assets/image2.jpeg',
  },
];

export function getAllProducts() {
  return products;
}

export function getProductById(id) {
  return products.find((p) => p.id === Number(id));
}
