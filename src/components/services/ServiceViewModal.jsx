import {
  Box,
  Dialog,
  DialogActions,
  IconButton,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
  Fade,
  Grid,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const ServiceViewModal = ({
  open,
  onClose,
  service,
  onServiceUpdate,
  onServiceDelete,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Edit form state
  const [editedData, setEditedData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
    tags: [],
    includedServices: [],
    status: "active",
  });

  // Input states for adding new items
  const [newTagInput, setNewTagInput] = useState("");
  const [newIncludedServiceInput, setNewIncludedServiceInput] = useState("");

  // Initialize edit data when service changes
  useEffect(() => {
    if (service) {
      setEditedData({
        name: service.name || "",
        description: service.description || "",
        price:
          typeof service.price === "number"
            ? service.price.toString()
            : service.price || "",
        duration: service.duration || "",
        category: service.category || "",
        tags: service.tags || [],
        includedServices: service.includedServices || [],
        status: service.status || "active",
      });
    }
  }, [service]);

  if (!service) return null;

  const getCategoryColor = (category) => {
    switch (category) {
      case "Emergency":
        return {
          color: "#f44336",
          bgColor: "#ffebee",
        };
      case "Installation":
        return {
          color: "#8A2BE2",
          bgColor: "#f3e5f5",
        };
      case "Repair":
        return {
          color: "#2196f3",
          bgColor: "#e3f2fd",
        };
      case "Maintenance":
        return {
          color: "#4caf50",
          bgColor: "#e8f5e9",
        };
      default:
        return {
          color: "#8A2BE2",
          bgColor: "#f3e5f5",
        };
    }
  };

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `$${price.toFixed(2)}`;
    }
    return price || "N/A";
  };

  const handleEditMode = () => {
    setIsEditMode(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setError(null);
    setNewTagInput("");
    setNewIncludedServiceInput("");
    // Reset to original data
    setEditedData({
      name: service.name || "",
      description: service.description || "",
      price:
        typeof service.price === "number"
          ? service.price.toString()
          : service.price || "",
      duration: service.duration || "",
      category: service.category || "",
      tags: service.tags || [],
      includedServices: service.includedServices || [],
      status: service.status || "active",
    });
  };

  // Helper function to detect changed fields
  const getChangedFields = (original, edited) => {
    const changes = {};

    // Compare name
    const trimmedName = edited.name.trim();
    if (original.name !== trimmedName) {
      changes.name = trimmedName;
    }

    // Compare description (handle null/empty)
    const trimmedDescription = edited.description.trim() || null;
    if (original.description !== trimmedDescription) {
      changes.description = trimmedDescription;
    }

    // Compare price with string comparison to prevent false positives
    const originalPriceStr =
      original.price === null || original.price === undefined
        ? ""
        : original.price.toString();
    const editedPriceStr =
      edited.price === null || edited.price === undefined
        ? ""
        : edited.price.toString();

    if (originalPriceStr !== editedPriceStr) {
      // Convert to proper format for API
      let newPrice = null;
      if (
        edited.price !== "" &&
        edited.price !== null &&
        edited.price !== undefined
      ) {
        const parsed = parseFloat(edited.price);
        if (!isNaN(parsed)) {
          newPrice = parsed;
        }
      }
      changes.price = newPrice;
    }

    // Compare duration (handle null/empty)
    const trimmedDuration = edited.duration.trim() || null;
    if (original.duration !== trimmedDuration) {
      changes.duration = trimmedDuration;
    }

    // Compare category
    if (original.category !== edited.category) {
      changes.category = edited.category;
    }

    // Compare status
    if (original.status !== edited.status) {
      changes.status = edited.status;
    }

    // Compare tags array (deep comparison)
    const originalTags = original.tags || [];
    const editedTags = edited.tags || [];
    // Create copies for sorting to avoid mutating original arrays
    const sortedOriginalTags = [...originalTags].sort();
    const sortedEditedTags = [...editedTags].sort();

    if (
      JSON.stringify(sortedOriginalTags) !== JSON.stringify(sortedEditedTags)
    ) {
      changes.tags = editedTags;
    }

    // Compare includedServices array (deep comparison)
    const originalServices = original.includedServices || [];
    const editedServices = edited.includedServices || [];
    // Create copies for sorting to avoid mutating original arrays
    const sortedOriginalServices = [...originalServices].sort();
    const sortedEditedServices = [...editedServices].sort();

    if (
      JSON.stringify(sortedOriginalServices) !==
      JSON.stringify(sortedEditedServices)
    ) {
      changes.includedServices = editedServices;
    }

    // Debug logging to help identify issues
    console.log("Change detection debug:", {
      original: {
        price: original.price,
        priceStr: originalPriceStr,
        includedServices: original.includedServices,
        tags: original.tags,
      },
      edited: {
        price: edited.price,
        priceStr: editedPriceStr,
        includedServices: edited.includedServices,
        tags: edited.tags,
      },
      changes,
    });

    return changes;
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setError(null);

      // Detect only the changed fields
      const changedFields = getChangedFields(service, editedData);

      // Check if there are any changes
      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected");
        setIsEditMode(false);
        setLoading(false);
        return;
      }

      // Log the changes for debugging
      console.log("Sending only changed fields:", changedFields);

      // Create update object with only changed fields
      const updateData = {
        id: service.id,
        ...changedFields,
      };

      if (onServiceUpdate) {
        await onServiceUpdate(updateData);
        setIsEditMode(false);

        // Show success message with what was changed
        const changedFieldNames = Object.keys(changedFields).join(", ");
        toast.success(`Updated: ${changedFieldNames}`);
      }
    } catch (err) {
      console.error("Error saving changes:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      if (onServiceDelete) {
        await onServiceDelete(service.id);
      }
      setShowDeleteConfirmation(false);
    } catch (err) {
      console.error("Error deleting service:", err);
      toast.error(err.message || "Failed to delete service");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !editedData.tags.includes(newTagInput.trim())) {
      setEditedData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTagInput.trim()],
      }));
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditedData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddIncludedService = () => {
    if (
      newIncludedServiceInput.trim() &&
      !editedData.includedServices.includes(newIncludedServiceInput.trim())
    ) {
      setEditedData((prev) => ({
        ...prev,
        includedServices: [
          ...prev.includedServices,
          newIncludedServiceInput.trim(),
        ],
      }));
      setNewIncludedServiceInput("");
    }
  };

  const handleRemoveIncludedService = (serviceToRemove) => {
    setEditedData((prev) => ({
      ...prev,
      includedServices: prev.includedServices.filter(
        (svc) => svc !== serviceToRemove
      ),
    }));
  };

  const categoryColors = getCategoryColor(service.category);

  // Simplified detail item component
  const DetailItem = ({ label, value, isEditing, editComponent }) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          display: "block",
          fontWeight: 500,
          letterSpacing: "0.5px",
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      {isEditing ? (
        editComponent
      ) : (
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            color: "text.primary",
          }}
        >
          {value || "Not specified"}
        </Typography>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          maxHeight: "90vh",
        },
      }}
      TransitionComponent={Fade}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              mb: 1,
            }}
          >
            {service.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Chip
              label={service.category}
              sx={{
                backgroundColor: categoryColors.bgColor,
                color: categoryColors.color,
                fontWeight: 600,
                borderRadius: "6px",
                textTransform: "capitalize",
              }}
              icon={
                <CategoryIcon
                  sx={{
                    color: categoryColors.color + " !important",
                  }}
                />
              }
            />
            <Chip
              label={service.status}
              size="small"
              sx={{
                backgroundColor:
                  service.status === "active" ? "#e8f5e9" : "#ffebee",
                color: service.status === "active" ? "#4caf50" : "#f44336",
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {!isEditMode ? (
            <>
              <Tooltip title="Edit Service" arrow>
                <IconButton
                  onClick={handleEditMode}
                  sx={{
                    backgroundColor: "rgba(138, 43, 226, 0.1)",
                    color: "primary.main",
                    mr: 1,
                    "&:hover": {
                      backgroundColor: "rgba(138, 43, 226, 0.2)",
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Service" arrow>
                <IconButton
                  onClick={handleDeleteClick}
                  sx={{
                    backgroundColor: "rgba(244, 67, 54, 0.1)",
                    color: "error.main",
                    mr: 1,
                    "&:hover": {
                      backgroundColor: "rgba(244, 67, 54, 0.2)",
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Save Changes" arrow>
                <IconButton
                  onClick={handleSaveChanges}
                  disabled={loading}
                  sx={{
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    color: "success.main",
                    mr: 1,
                    "&:hover": {
                      backgroundColor: "rgba(76, 175, 80, 0.2)",
                    },
                    "&:disabled": {
                      backgroundColor: "rgba(0,0,0,0.05)",
                      color: "rgba(0,0,0,0.3)",
                    },
                  }}
                >
                  <SaveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel" arrow>
                <IconButton
                  onClick={handleCancelEdit}
                  disabled={loading}
                  sx={{
                    backgroundColor: "rgba(244, 67, 54, 0.1)",
                    color: "error.main",
                    mr: 1,
                    "&:hover": {
                      backgroundColor: "rgba(244, 67, 54, 0.2)",
                    },
                  }}
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          <IconButton
            onClick={onClose}
            sx={{
              backgroundColor: "rgba(0,0,0,0.05)",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.1)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, overflowY: "auto" }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Service Details Section */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            mb: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <DescriptionIcon sx={{ mr: 1, color: "primary.main" }} />
          Service Details
        </Typography>

        {isEditMode ? (
          // Edit Mode
          <Box>
            <DetailItem
              label="Service Name"
              isEditing={true}
              editComponent={
                <TextField
                  value={editedData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                  placeholder="Service Name"
                  required
                />
              }
            />

            <DetailItem
              label="Description"
              isEditing={true}
              editComponent={
                <TextField
                  multiline
                  rows={3}
                  value={editedData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  variant="outlined"
                  fullWidth
                  size="small"
                  placeholder="Describe what this service includes..."
                />
              }
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Price ($)"
                  isEditing={true}
                  editComponent={
                    <TextField
                      type="number"
                      value={editedData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      variant="outlined"
                      size="small"
                      fullWidth
                      placeholder="150.00"
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Duration"
                  isEditing={true}
                  editComponent={
                    <TextField
                      value={editedData.duration}
                      onChange={(e) =>
                        handleInputChange("duration", e.target.value)
                      }
                      variant="outlined"
                      size="small"
                      fullWidth
                      placeholder="e.g., Same day"
                    />
                  }
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Category"
                  isEditing={true}
                  editComponent={
                    <FormControl fullWidth size="small">
                      <Select
                        value={editedData.category}
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                      >
                        <MenuItem value="Emergency">Emergency</MenuItem>
                        <MenuItem value="Installation">Installation</MenuItem>
                        <MenuItem value="Repair">Repair</MenuItem>
                        <MenuItem value="Maintenance">Maintenance</MenuItem>
                      </Select>
                    </FormControl>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Status"
                  isEditing={true}
                  editComponent={
                    <FormControl fullWidth size="small">
                      <Select
                        value={editedData.status}
                        onChange={(e) =>
                          handleInputChange("status", e.target.value)
                        }
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="archived">Archived</MenuItem>
                      </Select>
                    </FormControl>
                  }
                />
              </Grid>
            </Grid>

            <DetailItem
              label="Tags"
              isEditing={true}
              editComponent={
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <TextField
                      placeholder="Add tag"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{ flexGrow: 1 }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddTag}
                      size="small"
                      disabled={!newTagInput.trim()}
                      sx={{
                        minWidth: "auto",
                        px: 2,
                        textTransform: "none",
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    {editedData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(138, 43, 226, 0.1)",
                          color: "primary.main",
                          "& .MuiChip-deleteIcon": {
                            color: "primary.main",
                            "&:hover": {
                              color: "error.main",
                            },
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              }
            />
          </Box>
        ) : (
          // View Mode
          <Box>
            <DetailItem label="Description" value={service.description} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Price" value={formatPrice(service.price)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Duration" value={service.duration} />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Category" value={service.category} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Status" value={service.status} />
              </Grid>
            </Grid>

            <DetailItem
              label="Tags"
              value={
                service.tags && service.tags.length > 0
                  ? service.tags.join(", ")
                  : "No tags"
              }
            />
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Included Services Section */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            mb: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <CheckCircleIcon sx={{ mr: 1, color: "primary.main" }} />
          Included Services
        </Typography>

        {isEditMode && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
            }}
          >
            <TextField
              label="Add included service"
              variant="outlined"
              size="small"
              fullWidth
              value={newIncludedServiceInput}
              onChange={(e) => setNewIncludedServiceInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddIncludedService();
                }
              }}
              placeholder="e.g., Drain Cleaning"
            />
            <Button
              variant="contained"
              onClick={handleAddIncludedService}
              disabled={!newIncludedServiceInput.trim()}
              startIcon={<AddIcon />}
              sx={{
                minWidth: "auto",
                px: 2,
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              Add
            </Button>
          </Box>
        )}

        {/* Services List */}
        {(isEditMode ? editedData.includedServices : service.includedServices)
          ?.length > 0 ? (
          <List sx={{ p: 0 }}>
            {(isEditMode
              ? editedData.includedServices
              : service.includedServices
            ).map((svc, index) => (
              <ListItem
                key={index}
                sx={{
                  borderRadius: "8px",
                  mb: 1,
                  backgroundColor: "rgba(0,0,0,0.02)",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.05)",
                  },
                }}
                secondaryAction={
                  isEditMode && (
                    <Tooltip title="Remove service" arrow>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveIncludedService(svc)}
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
                  )
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
                      {svc}
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
              {isEditMode
                ? "No included services added yet. Add some services above to get started."
                : "No included services added yet."}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Divider />
      <DialogActions
        sx={{
          p: 2,
          backgroundColor: "#f8f9fa",
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          disabled={loading}
          sx={{
            minWidth: "120px",
            borderRadius: "6px",
            textTransform: "none",
            fontWeight: 500,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteConfirmation}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          },
        }}
        TransitionComponent={Fade}
      >
        <Box
          sx={{
            p: 3,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <DeleteIcon
              sx={{
                fontSize: 32,
                color: "error.main",
              }}
            />
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 1,
            }}
          >
            Delete Service
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              mb: 1,
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to delete{" "}
            <strong style={{ color: "#333" }}>"{service.name}"</strong>?
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "error.main",
              fontWeight: 500,
              mb: 3,
            }}
          >
            This action cannot be undone.
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
            }}
          >
            <Button
              onClick={handleCancelDelete}
              variant="outlined"
              disabled={loading}
              sx={{
                minWidth: "100px",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
                borderColor: "rgba(0,0,0,0.2)",
                color: "text.secondary",
                "&:hover": {
                  borderColor: "rgba(0,0,0,0.3)",
                  backgroundColor: "rgba(0,0,0,0.05)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              disabled={loading}
              sx={{
                minWidth: "100px",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
                backgroundColor: "error.main",
                "&:hover": {
                  backgroundColor: "error.dark",
                },
                "&:disabled": {
                  backgroundColor: "rgba(244, 67, 54, 0.3)",
                },
              }}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Dialog>
  );
};
