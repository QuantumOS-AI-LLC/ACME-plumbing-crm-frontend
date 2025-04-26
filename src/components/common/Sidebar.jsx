import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  VpnKey as PasswordIcon,
  AccessTime as TimeZoneIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../hooks/useAuth';

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 240,
  height: '100vh',
  background: 'linear-gradient(to bottom, #9D4EE9 0%, #8A2BE2 100%)',
  color: 'white',
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 1200,
  display: 'flex',
  flexDirection: 'column',
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
  margin: '4px 8px 4px 16px',
  borderRadius: '0 24px 24px 0',
  backgroundColor: selected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
  '&:hover': {
    backgroundColor: selected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
  }
}));

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
    { text: 'Company Settings', icon: <SettingsIcon />, path: '/company-settings' },
    { text: 'Change Password', icon: <PasswordIcon />, path: '/change-password' },
    { text: 'Set Time Zone', icon: <TimeZoneIcon />, path: '/set-time-zone' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  ];
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleItemClick = (path) => {
    navigate(path);
    if (onClose) onClose(); // Close drawer when item is clicked (mobile only)
  };
  
  return (
    <SidebarContainer>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ mr: 2, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
            {user?.name ? user.name.charAt(0) : 'U'}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {user?.name || 'User Name'}
            </Typography>
            <Typography variant="caption">
              {user?.company || 'Company Name'}
            </Typography>
          </Box>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ pt: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <StyledListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleItemClick(item.path)}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: '40px' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </StyledListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              py: 2
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: '40px' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </Box>
    </SidebarContainer>
  );
};

export default Sidebar;
