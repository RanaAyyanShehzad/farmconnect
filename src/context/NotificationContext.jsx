import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

const API_BASE = "https://agrofarm-vd8i.onrender.com/api";

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          limit: params.limit || "50",
          page: params.page || "1",
          ...(params.isRead !== undefined && { isRead: params.isRead }),
        });

        const response = await axios.get(
          `${API_BASE}/notifications?${queryParams.toString()}`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setNotifications(response.data.data.notifications || []);
          setUnreadCount(response.data.data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Don't show error toast for notifications to avoid spam
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await axios.patch(
        `${API_BASE}/notifications/read-all`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/notifications/${notificationId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setNotifications((prev) => {
          const deleted = prev.find((n) => n._id === notificationId);
          const newList = prev.filter((n) => n._id !== notificationId);
          if (deleted && !deleted.isRead) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return newList;
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }, []);

  // Fetch notifications on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
