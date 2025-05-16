import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";
import { updateJob } from "../../services/api"; // Assumed API service

const JOB_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const statusOptions = [
  { value: JOB_STATUS.OPEN, label: "Open" },
  { value: JOB_STATUS.IN_PROGRESS, label: "In Progress" },
  { value: JOB_STATUS.COMPLETED, label: "Completed" },
  { value: JOB_STATUS.CANCELLED, label: "Cancelled" },
];

const JobEditModal = ({ open, onClose, job, onUpdate }) => {
  const [formData, setFormData] = useState(job);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0); // 0: Job Details, 1: Client Info

  // Sync formData with job prop changes
  useEffect(() => {
    setFormData(job);
    setErrors({});
  }, [job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Job Name is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.price || formData.price <= 0)
      newErrors.price = "Valid price is required";
    if (!formData.startDate) newErrors.startDate = "Start Date is required";
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      const updatedJob = await updateJob(job.id, formData); // API call
      onUpdate(updatedJob); // Update parent state
      onClose(); // Close modal
    } catch (err) {
      setErrors({ general: "Failed to update job. Please try again." });
      console.error("Error updating job:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)", // Consistent blur
      }}
    >
      <Box
        sx={{
          width: { xs: "95%", sm: 500 }, // Compact width
          maxWidth: 600,
          bgcolor: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
          border: "2px solid transparent",
          p: { xs: 2.5, sm: 3.5 },
          position: "relative",
          animation: "slideInBounce 0.5s ease-out",
          "@keyframes slideInBounce": {
            "0%": { transform: "translateY(100%)", opacity: 0 },
            "80%": { transform: "translateY(-10px)", opacity: 1 },
            "100%": { transform: "translateY(0)", opacity: 1 },
          },
        }}
      >
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            fontWeight: 800,
            color: "#6d28d9",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "1px",
            background: "linear-gradient(to right, #6d28d9, #f97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Edit Job
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          sx={{
            mb: 3,
            "& .MuiTab-root": {
              color: "#4b5563",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                color: "#6d28d9",
              },
            },
            "& .Mui-selected": {
              color: "#6d28d9 !important",
            },
            "& .MuiTabs-indicator": {
              background: "linear-gradient(to right, #6d28d9, #f97316)",
              height: "3px",
            },
          }}
        >
          <Tab label="Job Details" />
          <Tab label="Client Info" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Job Name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#6d28d9",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#6d28d9",
                      boxShadow: "0 0 8px rgba(109, 40, 217, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    "&.Mui-focused": {
                      color: "#6d28d9",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#dc2626",
                    fontSize: "0.8rem",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.address}
                helperText={errors.address}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#6d28d9",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#6d28d9",
                      boxShadow: "0 0 8px rgba(109, 40, 217, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    "&.Mui-focused": {
                      color: "#6d28d9",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#dc2626",
                    fontSize: "0.8rem",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Price"
                name="price"
                type="number"
                value={formData.price || ""}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.price}
                helperText={errors.price}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#6d28d9",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#6d28d9",
                      boxShadow: "0 0 8px rgba(109, 40, 217, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    "&.Mui-focused": {
                      color: "#6d28d9",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#dc2626",
                    fontSize: "0.8rem",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Status"
                name="status"
                select
                value={formData.status || JOB_STATUS.OPEN}
                onChange={handleChange}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#6d28d9",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#6d28d9",
                      boxShadow: "0 0 8px rgba(109, 40, 217, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    "&.Mui-focused": {
                      color: "#6d28d9",
                    },
                  },
                }}
              >
                {statusOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    sx={{
                      "&:hover": {
                        bgcolor: "#f3e8ff",
                        color: "#6d28d9",
                      },
                    }}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                name="startDate"
                type="datetime-local"
                value={
                  formData.startDate
                    ? new Date(formData.startDate).toISOString().slice(0, 16)
                    : ""
                }
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.startDate}
                helperText={errors.startDate}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#6d28d9",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#6d28d9",
                      boxShadow: "0 0 8px rgba(109, 40, 217, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    "&.Mui-focused": {
                      color: "#6d28d9",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#dc2626",
                    fontSize: "0.8rem",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                name="endDate"
                type="datetime-local"
                value={
                  formData.endDate
                    ? new Date(formData.endDate).toISOString().slice(0, 16)
                    : ""
                }
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#6d28d9",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#6d28d9",
                      boxShadow: "0 0 8px rgba(109, 40, 217, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    "&.Mui-focused": {
                      color: "#6d28d9",
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Box
            sx={{
              p: 2,
              bgcolor: "#f1f5f9",
              borderRadius: "12px",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Client Name"
                  name="clientName"
                  value={formData.client?.name || ""}
                  disabled
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      bgcolor: "#e5e7eb",
                      "& fieldset": {
                        borderColor: "#d1d5db",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#4b5563",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Client Email"
                  name="clientEmail"
                  value={formData.client?.email || ""}
                  disabled
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      bgcolor: "#e5e7eb",
                      "& fieldset": {
                        borderColor: "#d1d5db",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#4b5563",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Client Phone"
                  name="clientPhone"
                  value={formData.client?.phoneNumber || ""}
                  disabled
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      bgcolor: "#e5e7eb",
                      "& fieldset": {
                        borderColor: "#d1d5db",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#4b5563",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {errors.general && (
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: "#fee2e2",
              color: "#dc2626",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {errors.general}
          </Typography>
        )}

        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: "12px",
              color: "#ffffff",
              bgcolor: "#6b7280",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                bgcolor: "#4b5563",
                transform: "scale(1.05)",
              },
              "&:disabled": {
                bgcolor: "#d1d5db",
                color: "#9ca3af",
              },
              transition: "all 0.2s",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: "12px",
              background: "linear-gradient(to right, #6d28d9, #f97316)",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(to right, #5b21b6, #ea580c)",
                transform: "scale(1.05)",
              },
              "&:disabled": {
                background: "#d1d5db",
                color: "#9ca3af",
              },
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default JobEditModal;