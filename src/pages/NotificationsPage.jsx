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

    useEffect(() => {
        // Load notifications based on tab value
        const isRead =
            tabValue === 0 ? undefined : tabValue === 1 ? false : true;
        loadNotifications(1, 10, isRead);
    }, [tabValue, loadNotifications]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handlePageChange = (event, page) => {
        const isRead =
            tabValue === 0 ? undefined : tabValue === 1 ? false : true;
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

    return (
        <Box>
            <PageHeader title="Notifications" />

            <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="notification tabs"
                    >
                        <Tab label="All" />
                        <Tab label="Unread" />
                        <Tab label="Read" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        variant="outlined"
                        onClick={handleMarkAllAsRead}
                        disabled={
                            loading || !notifications.some((n) => !n.isRead)
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
                ) : notifications.length > 0 ? (
                    <List disablePadding>
                        {notifications.map((notification) => (
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
                            No notifications found
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
