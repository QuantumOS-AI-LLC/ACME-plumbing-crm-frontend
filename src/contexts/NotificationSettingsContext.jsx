import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback,
} from "react";
import {
    fetchNotificationSettings,
    updateNotificationSettings,
} from "../services/api";

const NotificationSettingsContext = createContext();

export const useNotificationSettings = () =>
    useContext(NotificationSettingsContext);

// Define the mapping between frontend identifiers and backend eventType strings
const eventTypeMap = {
    newEstimate: "new_estimate",
    estimateAccepted: "estimate_accepted",
    jobComplete: "job_complete",
    paymentReceived: "payment_received",
    dailySummary: "daily_summary",
};

// Reverse mapping for converting backend eventType back to frontend id
const reverseEventTypeMap = Object.fromEntries(
    Object.entries(eventTypeMap).map(([key, value]) => [value, key])
);

export const NotificationSettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Check if user is authenticated
    const isAuthenticated = useCallback(() => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        const isLoggedIn =
            localStorage.getItem("isLoggedIn") ||
            sessionStorage.getItem("isLoggedIn");
        return !!(token && isLoggedIn === "true");
    }, []);

    // Load notification settings
    const loadSettings = useCallback(async () => {
        if (!isAuthenticated()) {
            // console.log(
            //     "User not authenticated, skipping notification settings fetch"
            // );
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const apiResponse = await fetchNotificationSettings();

            if (
                apiResponse &&
                apiResponse.success &&
                Array.isArray(apiResponse.data)
            ) {
                setSettings(apiResponse.data);
            } else if (
                apiResponse &&
                apiResponse.data &&
                Array.isArray(apiResponse.data.data)
            ) {
                setSettings(apiResponse.data.data);
            } else {
                console.warn(
                    "Received notification settings in unexpected format:",
                    apiResponse
                );
                setSettings([]);
            }
        } catch (error) {
            console.error("Error loading notification settings:", error);
            setError("Failed to load notification settings. Please try again.");
            setSettings([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Update notification settings
    const updateSettings = useCallback(
        async (newSettings) => {
            if (!isAuthenticated()) {
                // console.log(
                //     "User not authenticated, cannot update notification settings"
                // );
                return false;
            }

            try {
                setSaving(true);
                setError(null);

                await updateNotificationSettings(newSettings);
                setSettings(newSettings);
                return true;
            } catch (error) {
                console.error("Error updating notification settings:", error);
                setError(
                    "Failed to update notification settings. Please try again."
                );
                return false;
            } finally {
                setSaving(false);
            }
        },
        [isAuthenticated]
    );

    // Toggle a specific notification setting
    const toggleSetting = useCallback((channelKey, frontendEventTypeId) => {
        const backendEventType = eventTypeMap[frontendEventTypeId];
        if (!backendEventType) {
            console.error(
                `Unknown frontendEventTypeId: ${frontendEventTypeId}`
            );
            return;
        }

        setSettings((prevSettings) =>
            prevSettings.map((setting) => {
                if (setting.eventType === backendEventType) {
                    return {
                        ...setting,
                        [channelKey]: !setting[channelKey],
                    };
                }
                return setting;
            })
        );
    }, []);

    // Check if a notification type is enabled for app notifications
    const isNotificationTypeEnabled = useCallback(
        (notificationType) => {
            if (!notificationType) return true; // Default to enabled if no type specified

            // Convert notification type to backend event type
            const backendEventType =
                eventTypeMap[notificationType] || notificationType;

            // Find the setting for this notification type
            const setting = settings.find(
                (s) => s.eventType === backendEventType
            );

            // If no setting found, default to enabled
            if (!setting) return true;

            // Check if app notifications are enabled for this type
            return setting.appEnabled === true;
        },
        [settings]
    );

    // Get notification type from notification object
    const getNotificationTypeFromNotification = useCallback((notification) => {
        // Try to extract notification type from the notification object
        // This might be in different fields depending on your backend implementation
        if (notification.type) {
            return reverseEventTypeMap[notification.type] || notification.type;
        }
        if (notification.eventType) {
            return (
                reverseEventTypeMap[notification.eventType] ||
                notification.eventType
            );
        }
        if (notification.category) {
            return (
                reverseEventTypeMap[notification.category] ||
                notification.category
            );
        }

        // Try to infer from title or message (fallback)
        const title = notification.title?.toLowerCase() || "";
        const message = notification.message?.toLowerCase() || "";

        if (title.includes("estimate") && title.includes("request"))
            return "newEstimate";
        if (title.includes("estimate") && title.includes("accepted"))
            return "estimateAccepted";
        if (title.includes("job") && title.includes("complete"))
            return "jobComplete";
        if (title.includes("payment") && title.includes("received"))
            return "paymentReceived";
        if (title.includes("daily") && title.includes("summary"))
            return "dailySummary";

        // Check message content as well
        if (message.includes("estimate") && message.includes("request"))
            return "newEstimate";
        if (message.includes("estimate") && message.includes("accepted"))
            return "estimateAccepted";
        if (message.includes("job") && message.includes("complete"))
            return "jobComplete";
        if (message.includes("payment") && message.includes("received"))
            return "paymentReceived";
        if (message.includes("daily") && message.includes("summary"))
            return "dailySummary";

        // Default to unknown type (will be enabled by default)
        return null;
    }, []);

    // Filter notifications based on settings
    const filterNotifications = useCallback(
        (notifications) => {
            if (!Array.isArray(notifications)) return [];

            return notifications.filter((notification) => {
                const notificationType =
                    getNotificationTypeFromNotification(notification);
                return isNotificationTypeEnabled(notificationType);
            });
        },
        [getNotificationTypeFromNotification, isNotificationTypeEnabled]
    );

    // Get setting for a specific notification type
    const getSettingForType = useCallback(
        (frontendEventTypeId) => {
            const backendEventType = eventTypeMap[frontendEventTypeId];
            return settings.find((s) => s.eventType === backendEventType);
        },
        [settings]
    );

    // Initial load
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Reset state when user logs out
    useEffect(() => {
        if (!isAuthenticated()) {
            setSettings([]);
            setError(null);
            setLoading(false);
        }
    }, [isAuthenticated]);

    const value = {
        settings,
        loading,
        saving,
        error,
        loadSettings,
        updateSettings,
        toggleSetting,
        isNotificationTypeEnabled,
        getNotificationTypeFromNotification,
        filterNotifications,
        getSettingForType,
        eventTypeMap,
        reverseEventTypeMap,
        isAuthenticated,
    };

    return (
        <NotificationSettingsContext.Provider value={value}>
            {children}
        </NotificationSettingsContext.Provider>
    );
};

export default NotificationSettingsContext;
