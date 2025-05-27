import React, { useState } from 'react';
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
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';

const StyledAppBar = styled(AppBar)(({ theme, ismobile }) => ({
  background: 'linear-gradient(to right, #873ECE, #FF1493)',
  borderRadius: 0,
  boxShadow: 'none',
  width: ismobile === 'true' ? '100%' : `calc(100% - 240px)`,
  left: ismobile === 'true' ? 0 : 240,
  transition: theme.transitions.create(['width', 'left'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const Header = ({ isMobile, onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const { isConnected, connectionError } = useSocket();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  
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
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  const handleViewAll = () => {
    handleNotificationClose();
    navigate('/notifications');
  };
  
  const getInitials = (name) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
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
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <StyledAppBar 
      position="fixed" 
      ismobile={isMobile ? 'true' : 'false'}
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
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 500 }}>
          ACME PLUMBING SOLUTION
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            color="inherit" 
            size="large"
            onClick={handleNotificationClick}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton sx={{ ml: 1 }} color="inherit">
            <Avatar 
              sx={{ width: 32, height: 32, bgcolor: 'rgba(255, 255, 255, 0.2)' }}
            >
              {getInitials(user?.data?.name)}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>
      
      {/* Simple Menu for Notifications */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                onClick={() => handleNotificationItemClick(notification)}
                sx={{ 
                  whiteSpace: 'normal',
                  bgcolor: notification.isRead ? 'transparent' : 'action.hover'
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={notification.isRead ? 400 : 600}
                  >
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatRelativeTime(notification.createdAt)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={handleViewAll}>
              <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
                View All
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </StyledAppBar>
  );
};

export default Header;
