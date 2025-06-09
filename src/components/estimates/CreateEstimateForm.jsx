import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  createEstimate,
  updateEstimate,
  fetchContacts,
} from "../../services/api";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import { AuthContext } from "../../contexts/AuthContext";
import { useEstimates } from "../../contexts/EstimatesContext";
import { useNotifications } from "../../contexts/NotificationContext"; // Add this import
import { toast } from "sonner";
import { useWebhook } from "../../hooks/webHook";

const ESTIMATE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const CreateEstimateForm = ({
  open,
  handleCloseForm,
  handleFormSubmit,
  estimate,
}) => {
  const { user } = useContext(AuthContext);
  const { addEstimateToState, updateEstimateInState } = useEstimates();
  const { addNotification } = useNotifications(); // Add this line

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
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const { sendWebhook } = useWebhook();
  // Update createdBy when user changes
  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({ ...prev, createdBy: user.id }));
    }
  }, [user]);

  // Load clients when component mounts
  useEffect(() => {
    const loadClients = async () => {
      try {
        setClientLoading(true);
        const response = await fetchContacts();
        setClients(response.data || []);
      } catch (err) {
        console.error("Error loading clients:", err);
        setError("Failed to load clients.");
        toast.error("Failed to load clients");
      } finally {
        setClientLoading(false);
      }
    };

    if (open) {
      loadClients();
    }
  }, [open]);

  // Initialize form data when editing or creating
  useEffect(() => {
    if (estimate) {
      setFormData({
        leadName: estimate.leadName || "",
        address: estimate.address || "",
        scope: estimate.scope || "",
        bidAmount: estimate.bidAmount?.toString() || "",
        startDate: estimate.startDate
          ? new Date(estimate.startDate).toISOString().slice(0, 10)
          : "",
        status: estimate.status || ESTIMATE_STATUS.PENDING,
        notes: estimate.notes || "",
        clientId: estimate.clientId || "",
        createdBy: estimate.createdBy || user?.id || "",
      });
      setSelectedClient(estimate.client || null);
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
      });
      setSelectedClient(null);
    }
    setError(null);
  }, [estimate, user, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "clientId") {
      const client = clients.find((c) => c.id === value);
      setSelectedClient(client || null);
    }
  };

  const validateForm = () => {
    const bidAmountValue = parseFloat(formData.bidAmount);

    if (!formData.leadName.trim()) {
      setError("Lead name is required.");
      return false;
    }

    if (!formData.address.trim()) {
      setError("Address is required.");
      return false;
    }

    if (!formData.scope.trim()) {
      setError("Scope is required.");
      return false;
    }

    if (!formData.clientId) {
      setError("Please select a client.");
      return false;
    }

    if (isNaN(bidAmountValue) || bidAmountValue < 0) {
      setError("Please enter a valid bid amount.");
      return false;
    }

    if (!formData.startDate) {
      setError("Start date is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      if (!validateForm()) {
        return;
      }

      setLoading(true);

      try {
        const estimateData = {
          leadName: formData.leadName.trim(),
          address: formData.address.trim(),
          scope: formData.scope.trim(),
          bidAmount: parseFloat(formData.bidAmount),
          startDate: formData.startDate
            ? new Date(formData.startDate).toISOString()
            : null,
          status: formData.status,
          notes: formData.notes.trim() || null,
          clientId: formData.clientId,
          createdBy: formData.createdBy,
        };

        let response;
        if (estimate) {
          response = await updateEstimate(estimate.id, estimateData);

          // Construct the complete updated estimate object
          const completeUpdatedEstimate = {
            ...estimate, // Preserve original data
            ...response.data, // Update with API response data
            ...estimateData, // Update with form data
            client: selectedClient, // Preserve client data
          };

          // Update local state (this will also update dashboard stats)
          updateEstimateInState(completeUpdatedEstimate);

          const webHookData = {
            webhookEvent: "EstimateUpdated",
            ...response.data,
            estimateId: response.data.id,
          };

          await sendWebhook({ payload: webHookData });

          toast.success("Estimate updated successfully");
        } else {
          response = await createEstimate(estimateData);

          console.log("Estimate created:", response.data.id);

          // Construct the complete new estimate object
          const completeNewEstimate = {
            ...response.data,
            client: selectedClient,
          };

          // Add to local state (this will also update dashboard stats)
          addEstimateToState(completeNewEstimate);

          const webHookData = {
            webhookEvent: "EstimateAdded",
            ...response.data,
            estimateId: response.data.id,
          };

          await sendWebhook({ payload: webHookData });

          // Create notification for new estimate
          const estimateNotification = {
            id: `estimate-${response.data.id}-${Date.now()}`,
            title: "New Estimate Created! 📊",
            message: `Estimate "${formData.leadName.trim()}" has been created for client: ${
              selectedClient?.name || "N/A"
            }. Amount: $${parseFloat(formData.bidAmount).toLocaleString()}`,
            createdAt: new Date().toISOString(),
            isRead: false,
            relatedId: response.data.id,
          };

          // Add notification to context (this will trigger toast)
          addNotification(estimateNotification);
        }

        // Notify parent component - it will handle refetching (for backward compatibility)
        if (handleFormSubmit) {
          handleFormSubmit(response.data);
        }

        // Reset form if creating new estimate
        if (!estimate) {
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
          });
          setSelectedClient(null);
        }
      } catch (err) {
        console.error("Error saving estimate:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to save estimate. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      formData,
      estimate,
      user,
      handleFormSubmit,
      validateForm,
      selectedClient,
      addNotification,
    ]
  );

  const handleClose = () => {
    if (!loading) {
      setError(null);
      handleCloseForm();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} disableEscapeKeyDown={loading}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: "80%", md: "700px" },
          maxHeight: "90vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 0,
        }}
      >
        <Paper elevation={0} sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 3,
              borderBottom: "1px solid",
              borderColor: "divider",
              pb: 2,
            }}
          >
            <AssignmentOutlinedIcon
              color="primary"
              sx={{ mr: 2, fontSize: 32 }}
            />
            <Typography
              color="primary"
              variant="h5"
              component="h2"
              sx={{ fontWeight: 600 }}
            >
              {estimate ? "Edit Estimate" : "Create New Estimate"}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Lead Name"
                  name="leadName"
                  value={formData.leadName}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AssignmentOutlinedIcon
                          fontSize="small"
                          color="action"
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Status"
                  name="status"
                  select
                  value={formData.status}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  disabled={loading}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  fullWidth
                  required
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnOutlinedIcon
                          fontSize="small"
                          color="action"
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Scope"
                  name="scope"
                  value={formData.scope}
                  onChange={handleChange}
                  fullWidth
                  required
                  multiline
                  rows={3}
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionOutlinedIcon
                          fontSize="small"
                          color="action"
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Bid Amount"
                  name="bidAmount"
                  type="number"
                  value={formData.bidAmount}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  inputProps={{ min: 0, step: "0.01" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyOutlinedIcon
                          fontSize="small"
                          color="action"
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayOutlinedIcon
                          fontSize="small"
                          color="action"
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Client"
                  name="clientId"
                  select
                  value={formData.clientId}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  disabled={clientLoading || loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineOutlinedIcon
                          fontSize="small"
                          color="action"
                        />
                      </InputAdornment>
                    ),
                  }}
                >
                  {clientLoading ? (
                    <MenuItem value="">Loading clients...</MenuItem>
                  ) : clients.length === 0 ? (
                    <MenuItem value="">No clients available</MenuItem>
                  ) : (
                    clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>

              {selectedClient && (
                <Grid item xs={12}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, fontWeight: 600 }}
                    >
                      Selected Client Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedClient.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body2">
                          {selectedClient.phoneNumber || "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body2">
                          {selectedClient.email || "Not provided"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  label="Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NotesOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 2,
              }}
            >
              <Button
                onClick={handleClose}
                disabled={loading}
                variant="outlined"
                color="inherit"
                sx={{ minWidth: 100 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || clientLoading || !user?.id}
                sx={{ minWidth: 120 }}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading
                  ? estimate
                    ? "Updating..."
                    : "Creating..."
                  : estimate
                  ? "Update Estimate"
                  : "Create Estimate"}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Modal>
  );
};

export default CreateEstimateForm;
