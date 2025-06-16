import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  FormControlLabel, // Import FormControlLabel
  Switch, // Import Switch
} from "@mui/material";
import { fetchUserProfile, updateUserProfile } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import { useAuth } from "../hooks/useAuth";
import useGPSLocation from "../hooks/useGPSLocation"; // Import the new hook
import LocationMap from "../components/common/LocationMap"; // Import the new map component
import { useLoadScript } from '@react-google-maps/api'; // Import useLoadScript
import { formatLocationToDms } from '../utils/locationHelpers'; // Import the new helper function
import { toggleLiveTracking, updateLocation } from '../services/api'; // Import new API functions
import { useSocket } from "../contexts/SocketContext"; // Import socket context
import GoogleCalendarSettings from '../components/profile/GoogleCalendarSettings'; // Import Google Calendar component

const ProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const { 
    isConnected, 
    connectionError, 
    isLocationSharing, 
    locationError, 
    startLocationSharing, 
    stopLocationSharing, 
    updateLocation: socketUpdateLocation 
  } = useSocket();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    // title: "", // title is not part of the current user object structure based on task
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isGpsTrackingEnabled, setIsGpsTrackingEnabled] = useState(false); // Add state for GPS toggle

  const { location, error: gpsError } = useGPSLocation(isGpsTrackingEnabled, socketUpdateLocation); // Use the new hook with socket callback

  const { isLoaded, loadError } = useLoadScript({ // Use the useLoadScript hook
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  // Effect to handle location updates and push to backend
  useEffect(() => {
    if (isGpsTrackingEnabled && location) {
      const sendLocationUpdate = async () => {
        try {
          await updateLocation(location.latitude, location.longitude);
          /* console.log(`Location updated on backend: Lat ${location.latitude}, Lng ${location.longitude}`); */
        } catch (error) {
          console.error("Failed to update location on backend:", error);
        }
      };

      sendLocationUpdate();
    }
  }, [isGpsTrackingEnabled, location]); // Call this effect when tracking is enabled and location changes


  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetchUserProfile();

        if (response && response.data) {
          setFormData({
            name: response.data.user?.name || "",
            email: response.data.user?.email || "",
            phoneNumber: response.data.user?.phoneNumber || "",
          });
          // Set initial state of GPS toggle from fetched profile data
          if (response.data.user?.isLiveTrackingEnabled !== undefined) {
            setIsGpsTrackingEnabled(response.data.user.isLiveTrackingEnabled);
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        setError("Failed to load user profile. Please try again.");

        setError("Failed to load user profile. Please try again.");

        // Fallback to user context data if API fails
        if (user) {
          setFormData({
            name: user.name || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || user.phone || "", // Accommodate if user context uses 'phone'
            // title: user.title || "",
          });
          // Set initial state of GPS toggle from user context if available
          if (user.isLiveTrackingEnabled !== undefined) {
             setIsGpsTrackingEnabled(user.isLiveTrackingEnabled);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await updateUserProfile(formData);
      setSuccess(true);

      if (updateUserData) {
        const updatedUserContextData = {
          ...user,
          ...formData
        };
        updateUserData(updatedUserContextData);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating user profile:", error);
      setError("Failed to update user profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "G";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Handle toggle change and call backend API + socket
  const handleGpsToggleChange = async (event) => {
    const isChecked = event.target.checked;
    setIsGpsTrackingEnabled(isChecked);
    
    try {
      // Call existing API
      await toggleLiveTracking(isChecked);
      /* console.log(`Live tracking ${isChecked ? 'enabled' : 'disabled'} on backend.`); */
      
      // Start/stop socket location sharing
      if (isChecked) {
        startLocationSharing();
      } else {
        stopLocationSharing();
      }
    } catch (error) {
      console.error("Failed to toggle live tracking on backend:", error);
      // Optionally revert the toggle state in UI or show an error message
      setIsGpsTrackingEnabled(!isChecked); // Revert toggle state on API error
    }
  };


  return (
    <Box>
      <PageHeader title="Profile Settings" />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mr: 3,
                bgcolor: "primary.main",
                fontSize: "2rem",
              }}
            >
              {getInitials(formData.name)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={500}>
                {formData.name}
              </Typography>
              {/* <Typography variant="body1" color="text.secondary">
                {formData.title || "No title set"}
              </Typography> */}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Profile updated successfully!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>

              {/* <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Job Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                />
              </Grid> */}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </Grid>

              {/* GPS Tracking Setting */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isGpsTrackingEnabled}
                      onChange={handleGpsToggleChange} // Call the new handler
                      name="gpsTrackingEnabled"
                      color="primary"
                    />
                  }
                  label="Enable Live GPS Tracking"
                />
                
                {/* Socket Status Indicators */}
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color={isConnected ? "success.main" : "error.main"}>
                    Socket: {isConnected ? "Connected" : "Disconnected"}
                  </Typography>
                  {isGpsTrackingEnabled && (
                    <Typography variant="body2" color={isLocationSharing ? "success.main" : "warning.main"}>
                      Location Sharing: {isLocationSharing ? "Active" : "Inactive"}
                    </Typography>
                  )}
                  {connectionError && (
                    <Typography variant="body2" color="error.main">
                      Connection Error: {connectionError}
                    </Typography>
                  )}
                  {locationError && (
                    <Typography variant="body2" color="error.main">
                      Location Error: {locationError}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Placeholder for Live Location Display */}
              {isGpsTrackingEnabled && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Live Location:
                  </Typography>
                  {gpsError ? (
                    <Typography variant="body1" color="error">
                      Error: {gpsError}
                    </Typography>
                  ) : location ? (
                    <Box>
                      <Typography variant="body1">
                        Latitude (Decimal): {location.latitude}, Longitude (Decimal): {location.longitude}
                      </Typography>
                      <Typography variant="body1">
                        Latitude (DMS): {formatLocationToDms(location.latitude, location.longitude).latitudeDms}, Longitude (DMS): {formatLocationToDms(location.latitude, location.longitude).longitudeDms}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body1">
                      Fetching location...
                    </Typography>
                  )}
                  {location && isLoaded && !loadError && ( // Conditionally render map when loaded
                     <Box sx={{ mt: 2 }}>
                       <LocationMap latitude={location.latitude} longitude={location.longitude} isLoaded={isLoaded} />
                     </Box>
                   )}
                   {loadError && (
                     <Typography variant="body1" color="error" sx={{ mt: 2 }}>
                       Error loading map: {loadError.message}
                     </Typography>
                   )}
                   {!isLoaded && !loadError && isGpsTrackingEnabled && (
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        Loading map...
                      </Typography>
                   )}
                </Grid>
              )}

              {/* Google Calendar Integration Section */}
              <Grid item xs={12}>
                <GoogleCalendarSettings />
              </Grid>

              <Grid
                item
                xs={12}
                sx={{ display: "flex", justifyContent: "flex-end" }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default ProfilePage;
