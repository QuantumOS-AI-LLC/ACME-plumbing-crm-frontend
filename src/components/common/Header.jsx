import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Avatar,
  Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../hooks/useAuth';

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
  const getInitials = (name) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
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
          Get Connected
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" size="large">
            <Badge badgeContent={3} color="error">
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
    </StyledAppBar>
  );
};

export default Header;
