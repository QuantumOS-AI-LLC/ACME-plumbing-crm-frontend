import React from "react";
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
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  VpnKey as PasswordIcon,
  AccessTime as TimeZoneIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  BuildCircle as ServicesIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { useAuth } from "../../hooks/useAuth";

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 240,
  // minWidth:240,
  height: "100vh",
  background: "linear-gradient(to bottom, #9D4EE9 0%, #8A2BE2 100%)",
  color: "white",
  position: "fixed",
  left: 0,
  top: 0,
  zIndex: 1200,
  display: "flex",
  flexDirection: "column",
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
  margin: "4px 8px 4px 0px",
  borderRadius: "0 24px 24px 0",
  backgroundColor: selected ? "rgba(255, 255, 255, 0.2)" : "transparent",
  "&:hover": {
    backgroundColor: selected
      ? "rgba(255, 255, 255, 0.25)"
      : "rgba(255, 255, 255, 0.1)",
  },
}));

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "My Services", icon: <ServicesIcon />, path: "/my-services" },
    { text: "Profile", icon: <ProfileIcon />, path: "/profile" },
    {
      text: "Company Settings",
      icon: <SettingsIcon />,
      path: "/company-settings",
    },
    {
      text: "Change Password",
      icon: <PasswordIcon />,
      path: "/change-password",
    },
    { text: "Set Time Zone", icon: <TimeZoneIcon />, path: "/set-time-zone" },
    {
      text: "Notifications",
      icon: <NotificationsIcon />,
      path: "/notifications",
    },
    {
      text: "Notification Settings",
      icon: <NotificationsActiveIcon />,
      path: "/notification-settings",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleItemClick = (path) => {
    navigate(path);
    if (onClose) onClose(); // Close drawer when item is clicked (mobile only)
  };
  const getInitials = (name) => {
    if (!name) return "G";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <SidebarContainer>
      <Box
        sx={{
          py: 2,
          px: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              mr: 2,
              bgcolor: "rgba(255, 255, 255, 0.2)",
              width: "48px",
              height: "48px",
            }}
          >
            {getInitials(user?.data?.name)}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {user?.name || "Guest"}
            </Typography>
          </Box>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        <List sx={{ pt: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <StyledListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleItemClick(item.path)}
              >
                <ListItemIcon sx={{ color: "white", minWidth: "36px" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </StyledListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
              py: 2,
            }}
          >
            <ListItemIcon sx={{ color: "white", minWidth: "40px" }}>
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
