import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { toast } from "sonner";
import { createService } from "../../services/api";
import { useWebhook } from "../../hooks/webHook";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 640 },
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
  p: { xs: 3, sm: 4 },
  borderRadius: "12px",
  transition: "transform 0.2s ease-out",
};

const AddServiceModal = ({ open, onClose, onServiceCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    tags: [],
    includedServices: [],
  });
  const [newTag, setNewTag] = useState("");
  const [newIncludedService, setNewIncludedService] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    category: "",
    price: "",
  });
  const { sendWebhook } = useWebhook();

  const validateForm = () => {
    const errors = {
      name: "",
      category: "",
      price: "",
    };
    let isValid = true;

    // Name validation (required, min 2 characters)
    if (!formData.name.trim()) {
      errors.name = "Service name is required";
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = "Service name must be at least 2 characters";
      isValid = false;
    }

    // Category validation (required)
    if (!formData.category) {
      errors.category = "Category is required";
      isValid = false;
    }

    // Price validation (must be a valid number if provided)
    if (
      formData.price &&
      (isNaN(formData.price) || parseFloat(formData.price) < 0)
    ) {
      errors.price = "Price must be a valid positive number";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error for the field being edited
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddIncludedService = () => {
    if (
      newIncludedService.trim() &&
      !formData.includedServices.includes(newIncludedService.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        includedServices: [...prev.includedServices, newIncludedService.trim()],
      }));
      setNewIncludedService("");
    }
  };

  const handleRemoveIncludedService = (serviceToRemove) => {
    setFormData((prev) => ({
      ...prev,
      includedServices: prev.includedServices.filter(
        (service) => service !== serviceToRemove
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare service data for API
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        price: formData.price ? parseFloat(formData.price) : 0,
        duration: formData.duration.trim() || null,
        tags: formData.tags,
        includedServices: formData.includedServices,
        status: "active",
      };

      // Call the real API
      const response = await createService(serviceData);

      console.log("Service creation response:", response);

      const webHookData = {
        ...response.data,
        webhookEvent: "serviceCreated",
        serviceId: response.data.id,
      };
      await sendWebhook({ payload: webHookData });

      if (response.success) {
        if (onServiceCreated) {
          onServiceCreated(response.data);
        }

        onClose();

        // Reset form
        setFormData({
          name: "",
          description: "",
          category: "",
          price: "",
          duration: "",
          tags: [],
          includedServices: [],
        });
        setValidationErrors({ name: "", category: "", price: "" });

        toast.success("Service created successfully!");
      } else {
        throw new Error(response.message || "Failed to create service");
      }
    } catch (err) {
      console.error("Error creating service:", err);
      setError(err.message || "Failed to create service. Please try again.");
      toast.error(err.message || "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      duration: "",
      tags: [],
      includedServices: [],
    });
    setValidationErrors({ name: "", category: "", price: "" });
    setError(null);
    setNewTag("");
    setNewIncludedService("");
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight="600" color="primary.main">
            Add New Service
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{
              p: 0.5,
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
                backgroundColor: "grey.100",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <form onSubmit={handleSubmit}>
          {/* Service Information Section */}
          <Typography
            variant="subtitle1"
            fontWeight="500"
            color="text.primary"
            sx={{ mb: 2 }}
          >
            Service Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                variant="outlined"
                size="small"
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                placeholder="e.g., Emergency Plumbing Repair"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      boxShadow: "0 0 0 2px rgba(138, 43, 226, 0.1)",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                variant="outlined"
                size="small"
                placeholder="Describe what this service includes..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      boxShadow: "0 0 0 2px rgba(138, 43, 226, 0.1)",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                variant="outlined"
                error={!!validationErrors.category}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      boxShadow: "0 0 0 2px rgba(138, 43, 226, 0.1)",
                    },
                  },
                }}
              >
                <InputLabel>Category *</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label="Category *"
                  size="small"
                  required
                >
                  <MenuItem value="Emergency Repair">Emergency Repair</MenuItem>
                  <MenuItem value="Installation">Installation</MenuItem>
                  <MenuItem value="Repair">Repair</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
              {validationErrors.category && (
                <Typography
                  variant="caption"
                  color="error.main"
                  sx={{ ml: 1.5, mt: 0.5, display: "block" }}
                >
                  {validationErrors.category}
                </Typography>
              )}
            </Grid>
          </Grid>

          {/* Pricing & Duration Section */}
          <Divider sx={{ my: 3, borderColor: "grey.200" }} />
          <Typography
            variant="subtitle1"
            fontWeight="500"
            color="text.primary"
            sx={{ mb: 2 }}
          >
            Pricing & Duration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price ($)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                placeholder="e.g., 150.00"
                inputProps={{ min: 0, step: 0.01 }}
                error={!!validationErrors.price}
                helperText={validationErrors.price}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      boxShadow: "0 0 0 2px rgba(138, 43, 226, 0.1)",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                placeholder="e.g., Same day"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      boxShadow: "0 0 0 2px rgba(138, 43, 226, 0.1)",
                    },
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Tags Section */}
          <Divider sx={{ my: 3, borderColor: "grey.200" }} />
          <Typography
            variant="subtitle1"
            fontWeight="500"
            color="text.primary"
            sx={{ mb: 2 }}
          >
            Tags
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              mb: 2,
            }}
          >
            {formData.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                sx={{
                  backgroundColor: "rgba(138, 43, 226, 0.1)",
                  color: "primary.main",
                  "& .MuiChip-deleteIcon": {
                    color: "primary.main",
                    "&:hover": { color: "error.main" },
                  },
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              label="Add tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              variant="outlined"
              size="small"
              placeholder="e.g., Emergency Response"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    boxShadow: "0 0 0 2px rgba(138, 43, 226, 0.1)",
                  },
                },
              }}
            />
            <Button
              variant="outlined"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "500",
                px: 2,
                py: 0.5,
                minWidth: "80px",
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderColor: "primary.dark",
                  backgroundColor: "rgba(138, 43, 226, 0.05)",
                },
                "&.Mui-disabled": {
                  borderColor: "grey.300",
                  color: "grey.400",
                },
              }}
            >
              Add
            </Button>
          </Box>

          {/* Included Services Section */}
          <Divider sx={{ my: 3, borderColor: "grey.200" }} />
          <Typography
            variant="subtitle1"
            fontWeight="500"
            color="text.primary"
            sx={{ mb: 2 }}
          >
            Included Services
          </Typography>

          {/* Add Included Service Input */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Add included service"
              value={newIncludedService}
              onChange={(e) => setNewIncludedService(e.target.value)}
              variant="outlined"
              size="small"
              placeholder="e.g., Drain Cleaning"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddIncludedService();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    boxShadow: "0 0 0 2px rgba(138, 43, 226, 0.1)",
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddIncludedService}
              disabled={!newIncludedService.trim()}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "500",
                px: 2,
                py: 0.5,
                minWidth: "100px",
                "&:disabled": {
                  backgroundColor: "grey.300",
                  color: "grey.600",
                },
              }}
            >
              Add
            </Button>
          </Box>

          {/* Included Services List */}
          {formData.includedServices.length > 0 ? (
            <List
              sx={{
                p: 0,
                backgroundColor: "rgba(0,0,0,0.02)",
                borderRadius: "8px",
              }}
            >
              {formData.includedServices.map((service, index) => (
                <ListItem
                  key={index}
                  sx={{
                    borderRadius: "8px",
                    mb: 0.5,
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.05)",
                    },
                  }}
                  secondaryAction={
                    <Tooltip title="Remove service" arrow>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveIncludedService(service)}
                        sx={{
                          color: "error.main",
                          "&:hover": {
                            backgroundColor: "rgba(244, 67, 54, 0.1)",
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          color: "text.primary",
                        }}
                      >
                        {service}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box
              sx={{
                p: 3,
                textAlign: "center",
                backgroundColor: "rgba(0,0,0,0.02)",
                borderRadius: "8px",
                border: "2px dashed rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                No included services added yet. Add some services above to get
                started.
              </Typography>
            </Box>
          )}

          {/* Error Message */}
          {error && (
            <Typography
              color="error.main"
              variant="body2"
              sx={{
                mt: 2,
                fontWeight: "500",
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                p: 1,
                borderRadius: "8px",
              }}
            >
              {error}
            </Typography>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              mt: 4,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              onClick={handleClose}
              disabled={loading}
              variant="outlined"
              sx={{
                borderColor: "grey.300",
                color: "text.primary",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "500",
                px: 3,
                py: 1,
                "&:hover": {
                  borderColor: "grey.400",
                  backgroundColor: "grey.50",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                loading ||
                !!validationErrors.name ||
                !!validationErrors.category ||
                !!validationErrors.price
              }
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "500",
                px: 3,
                py: 1,
                "&:disabled": {
                  backgroundColor: "grey.300",
                  color: "grey.600",
                },
              }}
            >
              {loading ? "Creating..." : "Create Service"}
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default AddServiceModal;
