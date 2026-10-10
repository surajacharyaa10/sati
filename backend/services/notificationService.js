import Notification from '../module/notification.js';

export async function getAllNotifications({ activeOnly = false } = {}) {
  const filter = activeOnly ? { active: true } : {};
  return Notification.find(filter).sort({ createdAt: -1 });
}

export async function getNotificationById(id) {
  return Notification.findById(id);
}

export async function createNotification(data) {
  return Notification.create(data);
}

export async function updateNotification(id, data) {
  return Notification.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    context: 'query',
  });
}

export async function deleteNotification(id) {
  return Notification.findByIdAndDelete(id);
}
