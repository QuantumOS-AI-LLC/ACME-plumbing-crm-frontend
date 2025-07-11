import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Button,
    Divider,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Pagination,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PageHeader from "../components/common/PageHeader";
import { useNotifications } from "../contexts/NotificationContext";

const NotificationsPage = () => {
    const [tabValue, setTabValue] = useState(0);
    const {
        notifications,
        loading,
        pagination,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
    } = useNotifications();

    // Filter notifications by date range
    const filterNotificationsByDate = (notifications, dateFilter) => {
        if (!dateFilter) return notifications;

        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        return notifications.filter((notification) => {
            const notificationDate = new Date(notification.createdAt);

            switch (dateFilter) {
                case "today":
                    return notificationDate >= today;
                case "yesterday":
                    const yesterdayEnd = new Date(yesterday);
                    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
                    return (
                        notificationDate >= yesterday &&
                        notificationDate < yesterdayEnd
                    );
                case "last7days":
                    return notificationDate >= lastWeek;
                default:
                    return true;
            }
        });
    };

    // Get current filter settings based on tab
    const getCurrentFilters = () => {
        let isRead, dateFilter;

        switch (tabValue) {
            case 0: // All
                isRead = undefined;
                dateFilter = null;
                break;
            case 1: // Unread
                isRead = false;
                dateFilter = null;
                break;
            case 2: // Read
                isRead = true;
                dateFilter = null;
                break;
            case 3: // Today
                isRead = undefined;
                dateFilter = "today";
                break;
            case 4: // Yesterday
                isRead = undefined;
                dateFilter = "yesterday";
                break;
            case 5: // Last 7 days
                isRead = undefined;
                dateFilter = "last7days";
                break;
            default:
                isRead = undefined;
                dateFilter = null;
        }

        return { isRead, dateFilter };
    };

    useEffect(() => {
        // Load notifications based on tab value
        const { isRead } = getCurrentFilters();
        loadNotifications(1, 10, isRead);
    }, [tabValue, loadNotifications]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handlePageChange = (event, page) => {
        const { isRead } = getCurrentFilters();
        loadNotifications(page, 10, isRead);
    };

    const handleMarkAsRead = async (id) => {
        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleDelete = async (id) => {
        await removeNotification(id);
    };

    // Format relative time (e.g., "2 hours ago")
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return "just now";
        if (diffMin < 60)
            return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
        if (diffHour < 24)
            return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
        if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

        return date.toLocaleDateString();
    };

    // Get filtered notifications for display
    const getDisplayNotifications = () => {
        const { dateFilter } = getCurrentFilters();
        return filterNotificationsByDate(notifications, dateFilter);
    };

    const displayNotifications = getDisplayNotifications();

    return (
        <Box>
            <PageHeader title="Notifications" />

            <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="notification tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab label="All" />
                        <Tab label="Unread" />
                        <Tab label="Read" />
                        <Tab label="Today" />
                        <Tab label="Yesterday" />
                        <Tab label="Last 7 days" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        variant="outlined"
                        onClick={handleMarkAllAsRead}
                        disabled={
                            loading ||
                            !displayNotifications.some((n) => !n.isRead)
                        }
                    >
                        Mark all as read
                    </Button>
                </Box>

                <Divider />

                {loading ? (
                    <Box
                        sx={{ display: "flex", justifyContent: "center", p: 4 }}
                    >
                        <CircularProgress />
                    </Box>
                ) : displayNotifications.length > 0 ? (
                    <List disablePadding>
                        {displayNotifications.map((notification) => (
                            <React.Fragment key={notification.id}>
                                <ListItem
                                    sx={{
                                        bgcolor: notification.isRead
                                            ? "transparent"
                                            : "action.hover",
                                        py: 1.5,
                                    }}
                                    secondaryAction={
                                        <Box>
                                            {!notification.isRead && (
                                                <IconButton
                                                    edge="end"
                                                    aria-label="mark as read"
                                                    onClick={() =>
                                                        handleMarkAsRead(
                                                            notification.id
                                                        )
                                                    }
                                                    sx={{ mr: 1 }}
                                                >
                                                    <CheckCircleIcon />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={() =>
                                                    handleDelete(
                                                        notification.id
                                                    )
                                                }
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight={
                                                    notification.isRead
                                                        ? 400
                                                        : 600
                                                }
                                            >
                                                {notification.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {notification.message}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {formatRelativeTime(
                                                        notification.createdAt
                                                    )}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="body1" color="text.secondary">
                            {tabValue === 3 && "No notifications from today"}
                            {tabValue === 4 &&
                                "No notifications from yesterday"}
                            {tabValue === 5 &&
                                "No notifications from the last 7 days"}
                            {tabValue < 3 && "No notifications found"}
                        </Typography>
                    </Box>
                )}

                {!loading && pagination.pages > 1 && (
                    <Box
                        sx={{ display: "flex", justifyContent: "center", p: 2 }}
                    >
                        <Pagination
                            count={pagination.pages}
                            page={pagination.page}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default NotificationsPage;
