import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Typography,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Constants matching backend
const EVENT_TYPE = {
  JOB: "job",
  ESTIMATE: "estimate",
  MEETING: "meeting",
  OTHER: "other",
};

const EVENT_TYPE_LABELS = {
  // [EVENT_TYPE.JOB]: "Job",
  // [EVENT_TYPE.ESTIMATE]: "Estimate",
  [EVENT_TYPE.MEETING]: "Meeting",
  [EVENT_TYPE.OTHER]: "Other",
};

const CalendarEventModal = ({
  open,
  onClose,
  onSubmit,
  initialData = null,
  selectedDate = null,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    eventType: EVENT_TYPE.MEETING,
    relatedId: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to convert datetime-local string to Date object
  const parseDateTimeLocal = (dateTimeString) => {
    if (!dateTimeString) return null;
    return new Date(dateTimeString);
  };

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Editing existing event
        setFormData({
          title: initialData.title || "",
          description: initialData.description || "",
          startTime: formatDateTimeLocal(initialData.startTime),
          endTime: formatDateTimeLocal(initialData.endTime),
          location: initialData.location || "",
          eventType: initialData.eventType || EVENT_TYPE.MEETING,
          relatedId: initialData.relatedId || "",
        });
      } else {
        // Creating new event
        const defaultStartTime = selectedDate
          ? new Date(selectedDate)
          : new Date();
        const defaultEndTime = new Date(
          defaultStartTime.getTime() + 60 * 60 * 1000
        ); // +1 hour

        setFormData({
          title: "",
          description: "",
          startTime: formatDateTimeLocal(defaultStartTime),
          endTime: formatDateTimeLocal(defaultEndTime),
          location: "",
          eventType: EVENT_TYPE.MEETING,
          relatedId: "",
        });
      }
      setErrors({});
    }
  }, [open, initialData, selectedDate]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (!formData.eventType) {
      newErrors.eventType = "Event type is required";
    }

    // Date validation
    if (formData.startTime && formData.endTime) {
      const startDate = parseDateTimeLocal(formData.startTime);
      const endDate = parseDateTimeLocal(formData.endTime);

      if (endDate <= startDate) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        // Convert datetime-local strings to ISO strings for backend
        startTime: parseDateTimeLocal(formData.startTime).toISOString(),
        endTime: parseDateTimeLocal(formData.endTime).toISOString(),
        // Remove empty optional fields
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        relatedId: null,
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      // Handle error (show notification, etc.)
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      eventType: EVENT_TYPE.MEETING,
      relatedId: "",
    });
    setErrors({});
    setLoading(false);
    onClose();
  };

  const isEditing = Boolean(initialData);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 500, overflowX: "hidden" },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {isEditing ? "Edit Event" : "Create New Event"}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Title */}
          <TextField
            label="Title"
            value={formData.title}
            onChange={handleInputChange("title")}
            error={Boolean(errors.title)}
            helperText={errors.title}
            fullWidth
            required
          />

          {/* Event Type */}
          <FormControl fullWidth required error={Boolean(errors.eventType)}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={formData.eventType}
              onChange={handleInputChange("eventType")}
              label="Event Type"
            >
              {Object.entries(EVENT_TYPE).map(([key, value]) => (
                <MenuItem key={value} value={value}>
                  {EVENT_TYPE_LABELS[value]}
                </MenuItem>
              ))}
            </Select>
            {errors.eventType && (
              <Typography
                variant="caption"
                color="error"
                sx={{ ml: 2, mt: 0.5 }}
              >
                {errors.eventType}
              </Typography>
            )}
          </FormControl>

          {/* Date and Time */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Start Time"
              type="datetime-local"
              value={formData.startTime}
              onChange={handleInputChange("startTime")}
              error={Boolean(errors.startTime)}
              helperText={errors.startTime}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ flex: 1 }}
            />

            <TextField
              label="End Time"
              type="datetime-local"
              value={formData.endTime}
              onChange={handleInputChange("endTime")}
              error={Boolean(errors.endTime)}
              helperText={errors.endTime}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Location */}
          <TextField
            label="Location"
            value={formData.location}
            onChange={handleInputChange("location")}
            fullWidth
            multiline
            rows={2}
          />

          {/* Description */}
          <TextField
            label="Description"
            value={formData.description}
            onChange={handleInputChange("description")}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalendarEventModal;
