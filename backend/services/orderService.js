// Simple in-memory order service
const orders = [];

export function createOrder(userId, items) {
  const order = {
    id: orders.length + 1,
    userId,
    items,
    createdAt: new Date(),
  };
  orders.push(order);
  return order;
}

export function getOrdersByUser(userId) {
  return orders.filter((o) => o.userId === userId);
}
