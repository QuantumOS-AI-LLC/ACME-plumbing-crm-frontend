import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  List,
  Button,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
  Alert,
  InputAdornment,
} from "@mui/material";
import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import { toast } from "sonner";

import { ServiceViewModal } from "../components/services/ServiceViewModal";
import { ServiceListItem } from "../components/services/ServiceListItem";
import AddServiceModal from "../components/services/AddServiceModal";
import {
  fetchServices,
  deleteService as deleteServiceAPI,
  updateService as updateServiceAPI,
} from "../services/api";
import { useWebhook } from "../hooks/webHook";

const MyServicesPage = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const { sendWebhook } = useWebhook();
  // Pagination and filtering state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
    sortBy: "createdAt",
    order: "desc",
  });

  // Load services from API
  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        order: filters.order,
      };

      // Add filters if they exist
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const response = await fetchServices(params);

      if (response.success) {
        setServices(response.data);
        setPagination((prev) => ({
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages,
        }));
      } else {
        throw new Error(response.message || "Failed to fetch services");
      }
    } catch (err) {
      console.error("Error loading services:", err);
      setError(err.message || "Failed to load services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Load services on component mount and when filters/pagination change
  useEffect(() => {
    loadServices();
  }, [
    pagination.page,
    pagination.limit,
    filters.status,
    filters.category,
    filters.sortBy,
    filters.order,
  ]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        loadServices();
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const handleView = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
  };

  const handleServiceCreated = (newService) => {
    loadServices(); // Reload services to get updated list
  };

  const handleServiceUpdated = async (updatedService) => {
    try {
      const response = await updateServiceAPI(
        updatedService.id,
        updatedService
      );

      const webHookData = {
        ...response.data,
        serviceId: updatedService.id,
        webhookEvent: "serviceUpdated",
      };

      await sendWebhook({ payload: webHookData });
      if (response.success) {
        toast.success("Service updated successfully!");
        loadServices(); // Reload services
        setModalOpen(false);
        setSelectedService(null);
      } else {
        throw new Error(response.message || "Failed to update service");
      }
    } catch (err) {
      console.error("Error updating service:", err);
      toast.error(err.message || "Failed to update service");
    }
  };

  const handleServiceDeleted = async (serviceId) => {
    try {
      const response = await deleteServiceAPI(serviceId);
      if (response.success) {
        toast.success("Service deleted successfully!");
        loadServices(); // Reload services
        setModalOpen(false);
        setSelectedService(null);
      } else {
        throw new Error(response.message || "Failed to delete service");
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      toast.error(err.message || "Failed to delete service");
    }
  };

  const handleAddService = () => {
    setAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedService(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    // Reset to page 1 when filters change, BUT NOT FOR SEARCH (as it has its own debounced handler)
    if (field !== "search" && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (event) => {
    const newLimit = event.target.value;
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1, // Reset to first page when changing limit
    }));
  };

  // Format price for display
  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `$${price.toFixed(2)}`;
    }
    return price || "N/A";
  };

  // Transform service data to match component expectations
  const transformServiceForDisplay = (service) => ({
    ...service,
    skills: service.tags || [], // Map tags to skills for compatibility
    color: getCategoryColor(service.category),
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case "Emergency":
      case "Installation":
        return "#8A2BE2";
      case "Repair":
      case "Maintenance":
        return "#3498db";
      default:
        return "#8A2BE2";
    }
  };

  return (
    <Box>
      {/* Header with Add Service Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#2c3e50" }}>
          My Services
        </Typography>
        <Tooltip title="Add New Service" arrow>
          <Button
            onClick={handleAddService}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "8px",
              boxShadow: "none",
              "&:hover": {
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              },
            }}
          >
            Add Service
          </Button>
        </Tooltip>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: "12px" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Search services..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Emergency">Emergency</MenuItem>
                <MenuItem value="Installation">Installation</MenuItem>
                <MenuItem value="Repair">Repair</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="category">Category</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Order</InputLabel>
              <Select
                value={filters.order}
                label="Order"
                onChange={(e) => handleFilterChange("order", e.target.value)}
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Per Page</InputLabel>
              <Select
                value={pagination.limit}
                label="Per Page"
                onChange={handleLimitChange}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Services Content */}
      <Box>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
            }}
          >
            <CircularProgress sx={{ color: "#8A2BE2" }} />
          </Box>
        ) : services.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="body1">
              {error ? "Failed to load services." : "No services found."}
            </Typography>
            {!error && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddService}
                sx={{ mt: 2 }}
              >
                Add Your First Service
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Paper
              sx={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(138, 43, 226, 0.1)",
                border: "1px solid rgba(138, 43, 226, 0.1)",
                backgroundColor: "#ffffff",
                mb: 3,
              }}
            >
              <List sx={{ p: 3 }}>
                {services.map((service, index) => (
                  <ServiceListItem
                    key={service.id}
                    service={transformServiceForDisplay(service)}
                    isLast={index === services.length - 1}
                    onView={handleView}
                  />
                ))}
              </List>
            </Paper>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 3,
                }}
              >
                <Pagination
                  count={pagination.pages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}

            {/* Results Summary */}
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} services
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Modals */}
      <ServiceViewModal
        open={modalOpen}
        onClose={handleCloseModal}
        service={selectedService}
        onServiceUpdate={handleServiceUpdated}
        onServiceDelete={handleServiceDeleted}
      />
      <AddServiceModal
        open={addModalOpen}
        onClose={handleCloseAddModal}
        onServiceCreated={handleServiceCreated}
      />
    </Box>
  );
};

export default MyServicesPage;
