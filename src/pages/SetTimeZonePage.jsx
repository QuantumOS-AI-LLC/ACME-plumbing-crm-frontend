import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  // fetchTimeZone,
  updateTimeZone,
  fetchUserProfile,
} from "../services/api";
import PageHeader from "../components/common/PageHeader";

// Common time zones
const timeZones = [
  { value: "America/New_York", label: "Eastern Time (ET) - New York" },
  { value: "America/Chicago", label: "Central Time (CT) - Chicago" },
  { value: "America/Denver", label: "Mountain Time (MT) - Denver" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles" },
  { value: "America/Anchorage", label: "Alaska Time - Anchorage" },
  { value: "Pacific/Honolulu", label: "Hawaii Time - Honolulu" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT) - London" },
  { value: "Europe/Paris", label: "Central European Time (CET) - Paris" },
  { value: "Asia/Tokyo", label: "Japan Standard Time - Tokyo" },
  { value: "Australia/Sydney", label: "Australian Eastern Time - Sydney" },
];

const SetTimeZonePage = () => {
  const [selectedTimeZone, setSelectedTimeZone] = useState("America/New_York");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadTimeZone = async () => {
      try {
        setLoading(true);
        const response = await fetchUserProfile();
        console.log("fetch time", response);
        if (response?.data?.user?.timezone) {
          setSelectedTimeZone(response.data.user.timezone);
        }
      } catch (error) {
        console.error("Error loading time zone:", error);
        setError("Failed to load time zone. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTimeZone();
  }, []);

  const handleChange = (e) => {
    setSelectedTimeZone(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await updateTimeZone({ timezone: selectedTimeZone });
      setSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating time zone:", error);
      setError("Failed to update time zone. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Get current time in selected time zone
  const getCurrentTimeInTimeZone = () => {
    try {
      const options = {
        timeZone: selectedTimeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      return new Date().toLocaleTimeString("en-US", options);
    } catch (error) {
      return "Unable to determine time for selected time zone";
    }
  };

  return (
    <Box>
      <PageHeader title="Set Time Zone" />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Time zone updated successfully!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="timezone-select-label">Time Zone</InputLabel>
              <Select
                labelId="timezone-select-label"
                id="timezone-select"
                value={selectedTimeZone}
                label="Time Zone"
                onChange={handleChange}
              >
                {timeZones.map((tz) => (
                  <MenuItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                mb: 3,
                bgcolor: "background.default",
                p: 2,
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Your current time zone is set to:
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {timeZones.find((tz) => tz.value === selectedTimeZone)?.label ||
                  selectedTimeZone}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Current local time:
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {getCurrentTimeInTimeZone()}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Time Zone"}
              </Button>
            </Box>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default SetTimeZonePage;
