import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";

import PageHeader from "../components/common/PageHeader";
import EstimateCard from "../components/estimates/EstimateCard";
import EstimateDetailsModal from "../components/estimates/EstimateDetailsModal"; // ADD THIS IMPORT
import { toast } from "sonner";
import { AuthContext } from "../contexts/AuthContext";
import { useEstimates } from "../contexts/EstimatesContext";
import CreateEstimateForm from "../components/estimates/CreateEstimateForm";

const ESTIMATE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const EstimatesPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("active");
  const [openForm, setOpenForm] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);

  // ADD THESE MODAL STATES
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Use EstimatesContext
  const {
    estimates,
    loading,
    error,
    loadEstimates,
    updateEstimateInState,
    addEstimateToState,
  } = useEstimates();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusFilters = () => {
    switch (activeTab) {
      case "active":
        return [ESTIMATE_STATUS.PENDING];
      case "accepted":
        return [ESTIMATE_STATUS.ACCEPTED];
      case "rejected":
        return [ESTIMATE_STATUS.REJECTED];
      default:
        return [];
    }
  };

  const filteredEstimates = estimates.filter((estimate) => {
    if (activeTab === "reports") return true;
    const statusFilters = getStatusFilters();
    return statusFilters.includes(estimate.status);
  });

  // UPDATE THIS FUNCTION TO OPEN THE MODAL
  const handleViewEstimate = (estimate) => {
    console.log("View estimate:", estimate.id);
    setSelectedEstimate(estimate);
    setDetailsModalOpen(true);
  };

  // ADD THIS FUNCTION TO CLOSE THE MODAL
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedEstimate(null);
  };

  const handleOpenForm = (estimate = null) => {
    setEditingEstimate(estimate);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingEstimate(null);
  };

  // Updated to use context methods after form submission
  const handleFormSubmit = async (newEstimate) => {
    try {
      // Close the form first
      handleCloseForm();

      // Show success message
      toast.success(
        editingEstimate
          ? "Estimate updated successfully"
          : "Estimate created successfully"
      );

      // Use context methods to update state
      if (editingEstimate) {
        updateEstimateInState(newEstimate);
      } else {
        addEstimateToState(newEstimate);
      }
    } catch (error) {
      console.error("Error after form submission:", error);
      toast.error("Failed to refresh estimates data");
    }
  };

  // Updated to use context methods after update
  const handleUpdate = async (updatedEstimate) => {
    try {
      // Update the estimates state using context
      updateEstimateInState(updatedEstimate);
    } catch (error) {
      console.error("Error after update:", error);
      // Fallback: refresh estimates data
      await loadEstimates();
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    loadEstimates();
  };

  return (
    <Box>
      <PageHeader
        title="Estimates"
        action={true}
        actionText="Add Estimate"
        onAction={() => handleOpenForm()}
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="estimate tabs"
        >
          <Tab label="Active Estimates" value="active" />
          <Tab label="Accepted" value="accepted" />
          <Tab label="Rejected" value="rejected" />
          <Tab label="Reports" value="reports" />
        </Tabs>
      </Box>

      <CreateEstimateForm
        open={openForm}
        handleCloseForm={handleCloseForm}
        handleFormSubmit={handleFormSubmit}
        estimate={editingEstimate}
      />

      {/* ADD THIS MODAL COMPONENT */}
      <EstimateDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        estimate={selectedEstimate}
      />

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography color="error">{error}</Typography>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleRefresh}
          >
            Retry
          </Button>
        </Box>
      ) : activeTab !== "reports" ? (
        <>
          {/* Add refresh button for better UX */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: 2,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          <Grid container spacing={3}>
            {filteredEstimates.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1">
                    No{" "}
                    {activeTab === "active"
                      ? "active"
                      : activeTab === "accepted"
                      ? "accepted"
                      : "rejected"}{" "}
                    estimates found.
                  </Typography>
                </Box>
              </Grid>
            ) : (
              filteredEstimates.map((estimate) => (
                <Grid item xs={12} key={estimate.id}>
                  <EstimateCard
                    estimate={estimate}
                    onClick={() => handleViewEstimate(estimate)}
                    onViewClick={handleViewEstimate}
                    onUpdate={handleUpdate}
                    onEdit={() => handleOpenForm(estimate)}
                  />
                </Grid>
              ))
            )}
          </Grid>
        </>
      ) : (
        <Box>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Total Estimates
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {estimates.length}
                </Typography>
                <Typography variant="body2" color="success.main" mt={0.5}>
                  All time
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Pending Estimates
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {
                    estimates.filter(
                      (e) => e.status === ESTIMATE_STATUS.PENDING
                    ).length
                  }
                </Typography>
                <Typography variant="body2" color="success.main" mt={0.5}>
                  Awaiting response
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Acceptance Rate
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {estimates.length > 0
                    ? Math.round(
                        (estimates.filter(
                          (e) => e.status === ESTIMATE_STATUS.ACCEPTED
                        ).length /
                          estimates.length) *
                          100
                      )
                    : 0}
                  %
                </Typography>
                <Typography variant="body2" color="success.main" mt={0.5}>
                  Overall rate
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Total Value (Accepted)
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  $
                  {estimates
                    .filter((e) => e.status === ESTIMATE_STATUS.ACCEPTED)
                    .reduce((sum, e) => sum + (e.bidAmount || 0), 0)
                    .toLocaleString()}
                </Typography>
                <Typography variant="body2" color="success.main" mt={0.5}>
                  Converted to jobs
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Estimate Performance
            </Typography>
            <Box
              sx={{
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#f5f5f5",
                borderRadius: 1,
              }}
            >
              <Typography>Conversion Rate Chart</Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default EstimatesPage;
