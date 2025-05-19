import React, { useState, useEffect, useContext } from "react";
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
import { fetchEstimates, createEstimate, updateEstimate } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import EstimateCard from "../components/estimates/EstimateCard";
import { toast } from "sonner";
import { AuthContext } from "../contexts/AuthContext";
import CreateEstimateForm from "../components/estimates/CreateEstimateForm";

const ESTIMATE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const EstimatesPage = () => {
  const { user } = useContext(AuthContext);
  console.log("User:", user);
  const [activeTab, setActiveTab] = useState("active");
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState({
    leadName: "",
    address: "",
    scope: "",
    bidAmount: "",
    startDate: "",
    status: "pending", 
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

  useEffect(() => {
    const loadEstimates = async () => {
      try {
        setLoading(true);
        const response = await fetchEstimates({
          page: 1,
          limit: 50,
        });

        console.log("Estimates API response:", response);

        if (response && response.data) {
          setEstimates(response.data);
        } else {
          console.error("Unexpected API response format:", response);
          setEstimates([]);
        }
      } catch (error) {
        console.error("Error loading estimates:", error);
        setError("Failed to load estimates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadEstimates();
  }, []);

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

  const handleViewEstimate = (estimate) => {
    console.log("View estimate:", estimate.id);
  };

  const handleOpenForm = () => {
    setEditingEstimate(null);
    setFormData({
      leadName: "",
      address: "",
      scope: "",
      bidAmount: "",
      startDate: "",
      status: "pending",
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
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingEstimate(null);
    setFormData({
      leadName: "",
      address: "",
      scope: "",
      bidAmount: "",
      startDate: "",
      status: "pending",
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
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("client.")) {
      const clientField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        client: {
          ...prev.client,
          [clientField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async () => {
    try {
      // ভ্যালিডেশন
      if (!formData.leadName || !formData.address || !formData.clientId) {
        toast.error("Please fill in all required fields.", {
          position: "bottom-right",
          duration: 5000,
          icon: "❌",
        });
        return;
      }

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
        clientId: formData.clientId, // ক্লায়েন্ট UUID
        createdBy: formData.createdBy, // ব্যবহারকারীর UUID
      };

      if (editingEstimate) {
        // EDIT MODE
        await updateEstimate(editingEstimate.id, estimateData);
        toast.success("Estimate updated successfully");
      } else {
        // CREATE MODE
        await createEstimate(estimateData);
        toast.success("Estimate created successfully");
      }

      // এস্টিমেট রিফ্রেশ
      const response = await fetchEstimates({ page: 1, limit: 50 });
      if (response && response.data) {
        setEstimates(response.data);
      }
      handleCloseForm();
    } catch (error) {
      console.error("Error saving estimate:", error);
      toast.error(
        editingEstimate
          ? "Failed to update estimate."
          : "Failed to create estimate.",
        {
          position: "bottom-right",
          duration: 5000,
          icon: "❌",
        }
      );
    }
  };

  return (
    <Box>
      <PageHeader
        title="Estimates"
        action={true}
        actionText="Add Estimate"
        onAction={handleOpenForm}
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
        handleFormChange={handleFormChange}
        handleFormSubmit={handleFormSubmit}
        formData={formData}
        editingEstimate={editingEstimate}
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
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      ) : activeTab !== "reports" ? (
        <>
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
                    onClick={() =>
                      console.log("View estimate details:", estimate.id)
                    }
                    onViewClick={handleViewEstimate}
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