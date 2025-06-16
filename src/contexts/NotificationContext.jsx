import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback,
} from "react";
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../services/api";
import { useSocketNotifications } from "../hooks/useSocketNotifications";
import { useNotificationSettings } from "./NotificationSettingsContext";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [allNotifications, setAllNotifications] = useState([]); // Store all notifications
    const [notifications, setNotifications] = useState([]); // Filtered notifications for display
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
    });

    // Socket.IO real-time notifications
    const socketNotifications = useSocketNotifications();

    // Notification settings for filtering
    const {
        filterNotifications,
        isNotificationTypeEnabled,
        getNotificationTypeFromNotification,
    } = useNotificationSettings();

    // Check if user is authenticated
    const isAuthenticated = useCallback(() => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        const isLoggedIn =
            localStorage.getItem("isLoggedIn") ||
            sessionStorage.getItem("isLoggedIn");
        return !!(token && isLoggedIn === "true");
    }, []);

    // Apply notification filtering
    const applyNotificationFiltering = useCallback(
        (notificationList) => {
            if (
                !filterNotifications ||
                typeof filterNotifications !== "function"
            ) {
                return notificationList; // Return unfiltered if filterNotifications is not available
            }
            return filterNotifications(notificationList);
        },
        [filterNotifications]
    );

    // Load notifications
    const loadNotifications = useCallback(
        async (page = 1, limit = 10, isRead) => {
            // Check authentication before making API call
            if (!isAuthenticated()) {
                // console.log(
                //     "User not authenticated, skipping notification fetch"
                // );
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await fetchNotifications(page, limit, isRead);

                if (response.success) {
                    // Store all notifications
                    setAllNotifications(response.data);

                    // Filter notifications based on settings
                    const filteredNotifications = applyNotificationFiltering(
                        response.data
                    );
                    setNotifications(filteredNotifications);

                    // Update pagination for filtered results
                    setPagination({
                        ...response.pagination,
                        total: filteredNotifications.length,
                        pages: Math.ceil(filteredNotifications.length / limit),
                    });

                    // Update unreadCount only if fetching unread notifications
                    if (isRead === false) {
                        const filteredUnreadCount =
                            filteredNotifications.filter(
                                (n) => !n.isRead
                            ).length;
                        setUnreadCount(filteredUnreadCount);
                    }
                }
            } catch (err) {
                setError("Failed to load notifications");
                console.error("Error loading notifications:", err);
            } finally {
                setLoading(false);
            }
        },
        [isAuthenticated, applyNotificationFiltering]
    );

    // Mark notification as read
    const markAsRead = useCallback(
        async (id) => {
            if (!isAuthenticated()) {
                // console.log(
                //     "User not authenticated, cannot mark notification as read"
                // );
                return;
            }

            try {
                // Optimistically update UI for both arrays
                setAllNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                );
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));

                // Emit WebSocket event for real-time update
                if (socketNotifications?.markAsRead) {
                    socketNotifications.markAsRead(id);
                }

                // Persist to server via API
                const response = await markNotificationAsRead(id);
                if (!response.success) {
                    // Rollback on failure for both arrays
                    setAllNotifications((prev) =>
                        prev.map((n) =>
                            n.id === id ? { ...n, isRead: false } : n
                        )
                    );
                    setNotifications((prev) =>
                        prev.map((n) =>
                            n.id === id ? { ...n, isRead: false } : n
                        )
                    );
                    setUnreadCount((prev) => prev + 1);
                    throw new Error("Failed to mark notification as read");
                }
                return response;
            } catch (err) {
                setError("Failed to mark notification as read");
                console.error("Error marking notification as read:", err);
                throw err;
            }
        },
        [socketNotifications, isAuthenticated]
    );

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!isAuthenticated()) {
            // console.log(
            //     "User not authenticated, cannot mark all notifications as read"
            // );
            return;
        }

        try {
            // Optimistically update UI for both arrays
            setAllNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            );
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);

            // Emit WebSocket event
            if (socketNotifications?.markAllAsRead) {
                socketNotifications.markAllAsRead();
            }

            // Persist to server via API
            const response = await markAllNotificationsAsRead();
            if (!response.success) {
                // Rollback on failure (reload notifications)
                await loadNotifications(1, pagination.limit, false);
                throw new Error("Failed to mark all notifications as read");
            }
            return response;
        } catch (err) {
            setError("Failed to mark all notifications as read");
            console.error("Error marking all notifications as read:", err);
            throw err;
        }
    }, [
        socketNotifications,
        loadNotifications,
        pagination.limit,
        isAuthenticated,
    ]);

    // Delete notification
    const removeNotification = useCallback(
        async (id) => {
            if (!isAuthenticated()) {
                // console.log(
                //     "User not authenticated, cannot delete notification"
                // );
                return;
            }

            try {
                // Optimistically update UI for both arrays
                const notificationToRemove = allNotifications.find(
                    (n) => n.id === id
                );
                setAllNotifications((prev) => prev.filter((n) => n.id !== id));
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                if (notificationToRemove && !notificationToRemove.isRead) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }

                // Emit WebSocket event
                if (socketNotifications?.removeNotification) {
                    socketNotifications.removeNotification(id);
                }

                // Persist to server via API
                const response = await deleteNotification(id);
                if (!response.success) {
                    // Rollback on failure for both arrays
                    setAllNotifications((prev) => [
                        notificationToRemove,
                        ...prev,
                    ]);
                    setNotifications((prev) => [notificationToRemove, ...prev]);
                    if (notificationToRemove && !notificationToRemove.isRead) {
                        setUnreadCount((prev) => prev + 1);
                    }
                    throw new Error("Failed to delete notification");
                }
                return response;
            } catch (err) {
                setError("Failed to delete notification");
                console.error("Error deleting notification:", err);
                throw err;
            }
        },
        [allNotifications, socketNotifications, isAuthenticated]
    );

    // Add a new notification (used with WebSocket)
    const addNotification = useCallback(
        (notification) => {
            // Add to all notifications first
            setAllNotifications((prev) => [notification, ...prev]);

            // Check if this notification type is enabled
            const notificationType = getNotificationTypeFromNotification
                ? getNotificationTypeFromNotification(notification)
                : null;
            const isEnabled = isNotificationTypeEnabled
                ? isNotificationTypeEnabled(notificationType)
                : true;

            // Only add to displayed notifications if the type is enabled
            if (isEnabled) {
                setNotifications((prev) => [notification, ...prev]);
                if (!notification.isRead) {
                    setUnreadCount((prev) => prev + 1);
                }
            }
        },
        [getNotificationTypeFromNotification, isNotificationTypeEnabled]
    );

    // Handle WebSocket notifications
    useEffect(() => {
        // Only setup WebSocket if user is authenticated
        if (
            !isAuthenticated() ||
            !socketNotifications?.socket ||
            !socketNotifications?.isConnected
        )
            return;

        const { socket } = socketNotifications;

        // Listen for new notifications
        socket.on("newNotification", (notification) => {
            addNotification({
                id: notification.id,
                title: notification.title,
                message: notification.message,
                createdAt: notification.createdAt || new Date().toISOString(),
                isRead: false,
                relatedId: notification.relatedId || null,
            });
        });

        // Handle server confirmation of read status
        socket.on("notificationMarkedAsRead", ({ notificationId }) => {
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        });

        // Handle server confirmation of all notifications marked as read
        socket.on("allNotificationsMarkedAsRead", () => {
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
        });

        // Handle server confirmation of deleted notification
        socket.on("notificationDeleted", ({ notificationId }) => {
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId)
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        });

        // Handle WebSocket reconnection
        socket.on("connect", () => {
            // Reload notifications to sync with server (only if authenticated)
            if (isAuthenticated()) {
                loadNotifications(1, pagination.limit, false);
            }
        });

        // Handle WebSocket errors
        socket.on("connect_error", (err) => {
            setError("WebSocket connection failed");
            console.error("WebSocket connection error:", err);
        });

        // Clean up listeners on unmount
        return () => {
            socket.off("newNotification");
            socket.off("notificationMarkedAsRead");
            socket.off("allNotificationsMarkedAsRead");
            socket.off("notificationDeleted");
            socket.off("connect");
            socket.off("connect_error");
        };
    }, [
        socketNotifications,
        addNotification,
        loadNotifications,
        pagination.limit,
        isAuthenticated,
    ]);

    // Initial load for total unread count and notifications
    useEffect(() => {
        const fetchInitialData = async () => {
            // CHECK: Only fetch if user is authenticated
            if (!isAuthenticated()) {
                // console.log(
                //     "User not authenticated, skipping initial notification fetch"
                // );
                return;
            }

            try {
                // Fetch unread notifications to set initial unreadCount
                const response = await fetchNotifications(1, 1, false);
                if (response.success && response.pagination) {
                    setUnreadCount(response.pagination.total);
                } else {
                    setUnreadCount(0);
                }
                // Load initial notifications
                await loadNotifications(1, pagination.limit, undefined);
            } catch (err) {
                setError("Failed to fetch initial data");
                console.error("Error fetching initial data:", err);
            }
        };

        fetchInitialData();
    }, [loadNotifications, pagination.limit, isAuthenticated]);

    // Re-filter notifications when settings change
    useEffect(() => {
        if (allNotifications.length > 0 && filterNotifications) {
            const filteredNotifications =
                applyNotificationFiltering(allNotifications);
            setNotifications(filteredNotifications);

            // Recalculate unread count for filtered notifications
            const filteredUnreadCount = filteredNotifications.filter(
                (n) => !n.isRead
            ).length;
            setUnreadCount(filteredUnreadCount);

            // Update pagination for filtered results
            setPagination((prev) => ({
                ...prev,
                total: filteredNotifications.length,
                pages: Math.ceil(filteredNotifications.length / prev.limit),
            }));
        }
    }, [allNotifications, applyNotificationFiltering, filterNotifications]);

    // Reset state when user logs out
    useEffect(() => {
        if (!isAuthenticated()) {
            setNotifications([]);
            setAllNotifications([]);
            setUnreadCount(0);
            setError(null);
            setPagination({
                total: 0,
                page: 1,
                limit: 10,
                pages: 0,
            });
        }
    }, [isAuthenticated]);

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        pagination,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        addNotification,
        isAuthenticated, // Export this for components to use
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
