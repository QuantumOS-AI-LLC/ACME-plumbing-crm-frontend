import React, { useState, useEffect } from "react";
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
import { createJob, fetchJobs } from "../../services/api";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

const AddJobModal = ({ open, onClose, onJobCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    price: "",
    status: "open",
    startDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
    clientId: "",
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setClientLoading(true);
        const response = await fetchJobs();
        setClients(response.data || []);
      } catch (err) {
        setError("Failed to load clients.");
      } finally {
        setClientLoading(false);
      }
    };
    loadClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.name || !formData.address || !formData.price || !formData.clientId) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const jobData = {
        ...formData,
        price: parseFloat(formData.price),
        startDate: new Date(formData.startDate).toISOString(),
      };
      await createJob(jobData);
      onJobCreated();
      onClose();
    } catch (err) {
      setError("Failed to create job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
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
            <WorkOutlineIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
            <Typography color="primary"  variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Create New Job
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
                  label="Job Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkOutlineIcon fontSize="small" color="action" />
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
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyOutlinedIcon fontSize="small" color="action" />
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
                  InputLabelProps={{ shrink: true }}
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
                  disabled={clientLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineOutlinedIcon fontSize="small" color="action" />
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
                onClick={onClose}
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
                disabled={loading || clientLoading}
                sx={{ minWidth: 120 }}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? "Creating..." : "Create Job"}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Modal>
  );
};

export default AddJobModal;