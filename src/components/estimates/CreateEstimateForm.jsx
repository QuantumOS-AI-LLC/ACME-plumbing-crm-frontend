import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { createEstimate, updateEstimate } from "../../services/api";

const ESTIMATE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const statusOptions = [
  { value: ESTIMATE_STATUS.PENDING, label: "Pending" },
  { value: ESTIMATE_STATUS.ACCEPTED, label: "Accepted" },
  { value: ESTIMATE_STATUS.REJECTED, label: "Rejected" },
];

export default function CreateEstimateForm({
  open = false,
  handleCloseForm,
  handleFormSubmit,
  editingEstimate,
  user,
}) {
  const [formData, setFormData] = useState({
    leadName: "",
    address: "",
    scope: "",
    bidAmount: "",
    startDate: "",
    status: ESTIMATE_STATUS.PENDING,
    notes: "",
    clientId: "",
    createdBy: user?.id || "",
    client: {
      id: "",
      name: "",
      phoneNumber: "",
      email: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);


  // Sync formData with editingEstimate
  useEffect(() => {
    if (editingEstimate) {
      setFormData({
        leadName: editingEstimate.leadName || "",
        address: editingEstimate.address || "",
        scope: editingEstimate.scope || "",
        bidAmount: editingEstimate.bidAmount?.toString() || "",
        startDate: editingEstimate.startDate
          ? new Date(editingEstimate.startDate).toISOString().slice(0, 10)
          : "",
        status: editingEstimate.status || ESTIMATE_STATUS.PENDING,
        notes: editingEstimate.notes || "",
        clientId: editingEstimate.clientId || "",
        createdBy: editingEstimate.createdBy || user?.id || "",
        client: {
          id: editingEstimate.client?.id || "",
          name: editingEstimate.client?.name || "",
          phoneNumber: editingEstimate.client?.phoneNumber || "",
          email: editingEstimate.client?.email || "",
        },
      });
    } else {
      setFormData({
        leadName: "",
        address: "",
        scope: "",
        bidAmount: "",
        startDate: "",
        status: ESTIMATE_STATUS.PENDING,
        notes: "",
        clientId: "",
        createdBy: user?.id || "",
        client: {
          id: "",
          name: "",
          phoneNumber: "",
          email: "",
        },
      });
    }
    setErrors({});
  }, [editingEstimate, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("client.")) {
      const clientField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        client: { ...prev.client, [clientField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleClientSelect = (clientId) => {
    const selectedClient = clients.find((client) => client.id === clientId);
    setFormData((prev) => ({
      ...prev,
      clientId,
      client: {
        id: selectedClient?.id || "",
        name: selectedClient?.name || "",
        phoneNumber: selectedClient?.phoneNumber || "",
        email: selectedClient?.email || "",
      },
    }));
    setErrors((prev) => ({ ...prev, clientId: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.leadName) newErrors.leadName = "Lead Name is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.scope) newErrors.scope = "Scope is required";
    if (!formData.bidAmount || parseFloat(formData.bidAmount) <= 0)
      newErrors.bidAmount = "Valid bid amount is required";
    if (!formData.startDate) newErrors.startDate = "Start Date is required";
    if (!formData.clientId) newErrors.clientId = "Client is required";
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

      const estimateData = {
        leadName: formData.leadName,
        address: formData.address,
        scope: formData.scope,
        bidAmount: parseFloat(formData.bidAmount) || 0,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : null,
        status: formData.status,
        notes: formData.notes || null,
        clientId: formData.clientId,
        createdBy: formData.createdBy,
      };

      if (editingEstimate) {
        await updateEstimate(editingEstimate.id, estimateData);
      } else {
        await createEstimate(estimateData);
      }
      handleFormSubmit();
    } catch (err) {
      setErrors({ general: "Failed to save estimate. Please try again." });
      console.error("Error saving estimate:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseForm}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "20px",
          background: "#ffffff",
          maxWidth: "600px",
          width: "calc(100% - 32px)",
          mx: 2,
          my: 2,
          overflow: "hidden",
          border: "2px solid #8A2BE2",
          animation: "slideInBounce 0.5s ease-out",
          "@keyframes slideInBounce": {
            "0%": { transform: "translateY(100%)", opacity: 0 },
            "80%": { transform: "translateY(-10px)", opacity: 1 },
            "100%": { transform: "translateY(0)", opacity: 1 },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "transparent",
          color: "#8A2BE2",
          fontWeight: 800,
          fontSize: "1.5rem",
          py: 2,
          px: 2.5,
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {editingEstimate ? "Edit Estimate" : "Add New Estimate"}
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, overflowY: "auto" }}>
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
                color: "#8A2BE2",
              },
            },
            "& .Mui-selected": {
              color: "#8A2BE2 !important",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#8A2BE2",
              height: "3px",
            },
          }}
        >
          <Tab label="Estimate Details" />
          <Tab label="Client Info" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Lead Name"
                name="leadName"
                value={formData.leadName || ""}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.leadName}
                helperText={errors.leadName}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#8A2BE2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#8A2BE2",
                      boxShadow: "0 0 8px rgba(138, 43, 226, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    fontSize: "0.875rem",
                    "&.Mui-focused": {
                      color: "#8A2BE2",
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
                      borderColor: "#8A2BE2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#8A2BE2",
                      boxShadow: "0 0 8px rgba(138, 43, 226, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    fontSize: "0.875rem",
                    "&.Mui-focused": {
                      color: "#8A2BE2",
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
                label="Scope"
                name="scope"
                value={formData.scope || ""}
                onChange={handleChange}
                fullWidth
                required
                multiline
                rows={3}
                error={!!errors.scope}
                helperText={errors.scope}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#8A2BE2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#8A2BE2",
                      boxShadow: "0 0 8px rgba(138, 43, 226, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    fontSize: "0.875rem",
                    "&.Mui-focused": {
                      color: "#8A2BE2",
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
                label="Bid Amount"
                name="bidAmount"
                type="number"
                value={formData.bidAmount || ""}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.bidAmount}
                helperText={errors.bidAmount}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#8A2BE2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#8A2BE2",
                      boxShadow: "0 0 8px rgba(138, 43, 226, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    fontSize: "0.875rem",
                    "&.Mui-focused": {
                      color: "#8A2BE2",
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
              <FormControl
                fullWidth
                required
                error={!!errors.status}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#8A2BE2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#8A2BE2",
                      boxShadow: "0 0 8px rgba(138, 43, 226, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    fontSize: "0.875rem",
                    "&.Mui-focused": {
                      color: "#8A2BE2",
                    },
                  },
                }}
              >
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status || ESTIMATE_STATUS.PENDING}
                  onChange={handleChange}
                  label="Status"
                >
                  {statusOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      sx={{
                        "&:hover": {
                          bgcolor: "#f3e8ff",
                          color: "#8A2BE2",
                        },
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate || ""}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors.startDate}
                helperText={errors.startDate}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#8A2BE2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#8A2BE2",
                      boxShadow: "0 0 8px rgba(138, 43, 226, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    fontSize: "0.875rem",
                    "&.Mui-focused": {
                      color: "#8A2BE2",
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
                label="Notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#8A2BE2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#8A2BE2",
                      boxShadow: "0 0 8px rgba(138, 43, 226, 0.3)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#4b5563",
                    fontSize: "0.875rem",
                    "&.Mui-focused": {
                      color: "#8A2BE2",
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
                <FormControl
                  fullWidth
                  required
                  error={!!errors.clientId}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      bgcolor: editingEstimate ? "#e5e7eb" : "#f8fafc",
                      "& fieldset": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover fieldset": {
                        borderColor: "#8A2BE2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#8A2BE2",
                        boxShadow: "0 0 8px rgba(138, 43, 226, 0.3)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#4b5563",
                      fontSize: "0.875rem",
                      "&.Mui-focused": {
                        color: "#8A2BE2",
                      },
                    },
                    "& .MuiFormHelperText-root": {
                      color: "#dc2626",
                      fontSize: "0.8rem",
                    },
                  }}
                >
                  <InputLabel id="client-label">Select Client</InputLabel>
                  <Select
                    labelId="client-label"
                    name="clientId"
                    value={formData.clientId || ""}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    label="Select Client"
                    disabled={!!editingEstimate}
                  >
                    {clients.map((client) => (
                      <MenuItem
                        key={client.id}
                        value={client.id}
                        sx={{
                          "&:hover": {
                            bgcolor: "#f3e8ff",
                            color: "#8A2BE2",
                          },
                        }}
                      >
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.clientId && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, fontSize: "0.8rem" }}
                    >
                      {errors.clientId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Client Name"
                  name="client.name"
                  value={formData.client.name || ""}
                  onChange={handleChange}
                  fullWidth
                  disabled
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
                      fontSize: "0.875rem",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone Number"
                  name="client.phoneNumber"
                  value={formData.client.phoneNumber || ""}
                  onChange={handleChange}
                  fullWidth
                  disabled
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
                      fontSize: "0.875rem",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  name="client.email"
                  type="email"
                  value={formData.client.email || ""}
                  onChange={handleChange}
                  fullWidth
                  disabled
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
                      fontSize: "0.875rem",
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
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#f1f5f9", justifyContent: "flex-end" }}>
        <Button
          onClick={handleCloseForm}
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
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
          sx={{
            flex: 1,
            py: 1.5,
            borderRadius: "12px",
            backgroundColor: "#8A2BE2",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "#7a1fd9",
              transform: "scale(1.05)",
            },
            "&:disabled": {
              backgroundColor: "#d1d5db",
              color: "#9ca3af",
            },
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          {editingEstimate ? "Update Estimate" : "Create Estimate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}