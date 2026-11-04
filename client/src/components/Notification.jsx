import React, { useEffect } from 'react';
import { useNotificationStore } from '../store.js';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

const Notification = ({ notification }) => {
  if (!notification) return null;

  const removeNotification = useNotificationStore((state) => state.removeNotification);

  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, removeNotification]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[notification.type] || 'bg-blue-500';

  const icon = {
    success: <FiCheckCircle className="w-5 h-5" />,
    error: <FiAlertCircle className="w-5 h-5" />,
    warning: <FiAlertCircle className="w-5 h-5" />,
    info: <FiInfo className="w-5 h-5" />
  }[notification.type];

  return (
    <div className={`${bgColor} text-white p-4 rounded-lg shadow-lg flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        {icon}
        <span>{notification.message}</span>
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="hover:opacity-75"
      >
        <FiX className="w-5 h-5" />
      </button>
    </div>
  );
};

export const NotificationContainer = () => {
  const notifications = useNotificationStore((state) => state.notifications);

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default Notification;
