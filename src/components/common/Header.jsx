import React, { useState, useEffect, useRef } from "react";
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    IconButton,
    Avatar,
    Badge,
    Menu,
    MenuItem,
    Divider,
    Button,
    Snackbar,
    Alert,
    Slide,
    Stack,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../contexts/NotificationContext";
import { useSocket } from "../../contexts/SocketContext";

const StyledAppBar = styled(AppBar)(({ theme, ismobile }) => ({
    background: "linear-gradient(to right, #873ECE, #FF1493)",
    borderRadius: 0,
    boxShadow: "none",
    width: ismobile === "true" ? "100%" : `calc(100% - 240px)`,
    left: ismobile === "true" ? 0 : 240,
    transition: theme.transitions.create(["width", "left"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
}));

// Toast notification container
const ToastContainer = styled(Box)(({ theme }) => ({
    position: "fixed",
    top: 80,
    right: 20,
    zIndex: 9999,
    width: 350,
    maxWidth: "90vw",
}));

// Individual toast notification
const ToastNotification = styled(Box)(({ theme }) => ({
    background: "white",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    padding: "16px",
    marginBottom: "8px",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
        transform: "translateX(-5px)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
    },
}));

function SlideTransition(props) {
    return <Slide {...props} direction="left" />;
}

const Header = ({ isMobile, onMenuClick }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { unreadCount, notifications, markAsRead, markAllAsRead } =
        useNotifications();
    const { isConnected, connectionError } = useSocket();
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
    const [toastNotifications, setToastNotifications] = useState([]);
    const [lastNotificationTime, setLastNotificationTime] = useState(null);

    // Track new notifications and show as toasts
    useEffect(() => {
        if (notifications.length > 0) {
            const latestNotification = notifications[0];
            const notificationTime = new Date(
                latestNotification.createdAt
            ).getTime();

            // Only show toast for new notifications (not on initial load)
            if (
                lastNotificationTime &&
                notificationTime > lastNotificationTime
            ) {
                const toastId = `toast-${latestNotification.id}-${Date.now()}`;
                const newToast = {
                    ...latestNotification,
                    toastId,
                    showToast: true,
                };

                setToastNotifications((prev) => [
                    newToast,
                    ...prev.slice(0, 2),
                ]); // Max 3 toasts

                // Auto-remove toast after 5 seconds
                setTimeout(() => {
                    setToastNotifications((prev) =>
                        prev.filter((toast) => toast.toastId !== toastId)
                    );
                }, 5000);
            }

            setLastNotificationTime(
                Math.max(
                    lastNotificationTime || 0,
                    ...notifications.map((n) => new Date(n.createdAt).getTime())
                )
            );
        }
    }, [notifications, lastNotificationTime]);

    const handleNotificationClick = (event) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

    const handleNotificationItemClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        handleNotificationClose();
        // Navigate based on notification type if needed
        // navigate(`/some-path/${notification.relatedId}`);
    };

    const handleToastClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        // Remove from toast list
        setToastNotifications((prev) =>
            prev.filter((toast) => toast.toastId !== notification.toastId)
        );
        // Navigate if needed
        // navigate(`/some-path/${notification.relatedId}`);
    };

    const handleToastClose = (toastId) => {
        setToastNotifications((prev) =>
            prev.filter((toast) => toast.toastId !== toastId)
        );
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead();
        // Clear all toasts
        setToastNotifications([]);
    };

    const handleViewAll = () => {
        handleNotificationClose();
        navigate("/notifications");
    };

    const getInitials = (name) => {
        if (!name) return "G";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
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
        <>
            <StyledAppBar
                position="fixed"
                ismobile={isMobile ? "true" : "false"}
            >
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={onMenuClick}
                            sx={{ mr: 1 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, fontWeight: 500 }}
                    >
                        ACME PLUMBING SOLUTION
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                            color="inherit"
                            size="large"
                            onClick={handleNotificationClick}
                            sx={{
                                // Add pulse animation for new notifications
                                animation:
                                    unreadCount > 0
                                        ? "pulse 2s infinite"
                                        : "none",
                                "@keyframes pulse": {
                                    "0%": {
                                        transform: "scale(1)",
                                    },
                                    "50%": {
                                        transform: "scale(1.1)",
                                    },
                                    "100%": {
                                        transform: "scale(1)",
                                    },
                                },
                            }}
                        >
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                        <IconButton sx={{ ml: 1 }} color="inherit">
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: "rgba(255, 255, 255, 0.2)",
                                }}
                            >
                                {getInitials(user?.data?.name)}
                            </Avatar>
                        </IconButton>
                    </Box>
                </Toolbar>

                {/* Regular Notification Menu */}
                <Menu
                    anchorEl={notificationAnchorEl}
                    open={Boolean(notificationAnchorEl)}
                    onClose={handleNotificationClose}
                    PaperProps={{
                        sx: { width: 320, maxHeight: 400 },
                    }}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                    <Box
                        sx={{
                            px: 2,
                            py: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={500}>
                            Notifications
                        </Typography>
                        {unreadCount > 0 && (
                            <Button size="small" onClick={handleMarkAllAsRead}>
                                Mark all as read
                            </Button>
                        )}
                    </Box>
                    <Divider />

                    {notifications.length === 0 ? (
                        <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                                No notifications
                            </Typography>
                        </MenuItem>
                    ) : (
                        <>
                            {notifications.slice(0, 5).map((notification) => (
                                <MenuItem
                                    key={notification.id}
                                    onClick={() =>
                                        handleNotificationItemClick(
                                            notification
                                        )
                                    }
                                    sx={{
                                        whiteSpace: "normal",
                                        bgcolor: notification.isRead
                                            ? "transparent"
                                            : "action.hover",
                                    }}
                                >
                                    <Box sx={{ width: "100%" }}>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={
                                                notification.isRead ? 400 : 600
                                            }
                                        >
                                            {notification.title}
                                        </Typography>
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
                                    </Box>
                                </MenuItem>
                            ))}
                            <Divider />
                            <MenuItem onClick={handleViewAll}>
                                <Typography
                                    variant="body2"
                                    color="primary"
                                    sx={{ width: "100%", textAlign: "center" }}
                                >
                                    View All
                                </Typography>
                            </MenuItem>
                        </>
                    )}
                </Menu>
            </StyledAppBar>

            {/* Toast Notifications */}
            <ToastContainer>
                <Stack spacing={1}>
                    {toastNotifications.map((notification) => (
                        <Slide
                            key={notification.toastId}
                            direction="left"
                            in={true}
                            mountOnEnter
                            unmountOnExit
                        >
                            <ToastNotification
                                onClick={() => handleToastClick(notification)}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <Box sx={{ flex: 1, pr: 1 }}>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={600}
                                            color="primary"
                                        >
                                            {notification.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 0.5 }}
                                        >
                                            {notification.message}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ mt: 0.5, display: "block" }}
                                        >
                                            {formatRelativeTime(
                                                notification.createdAt
                                            )}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToastClose(
                                                notification.toastId
                                            );
                                        }}
                                        sx={{ color: "grey.400" }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </ToastNotification>
                        </Slide>
                    ))}
                </Stack>
            </ToastContainer>
        </>
    );
};

export default Header;
