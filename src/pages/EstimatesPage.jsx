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
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import PageHeader from "../components/common/PageHeader";
import EstimateCard from "../components/estimates/EstimateCard";
import EstimateDetailsModal from "../components/estimates/EstimateDetailsModal";
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

    // Modal states
    const [selectedEstimate, setSelectedEstimate] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    // Use Estimates context with pagination
    const {
        estimates,
        loading,
        error,
        pagination,
        loadEstimatesWithPagination,
        updateEstimateInState,
    } = useEstimates();

    // Ensure at least 1 page if there are estimates
    const totalPages = Math.max(
        pagination.totalPages,
        estimates.length > 0 ? 2 : 0
    );
    const pages = [...Array(totalPages).keys()];

    // Debug pagination state
    console.log("Estimates Pagination Debug:", {
        originalTotalPages: pagination.totalPages,
        calculatedTotalPages: totalPages,
        currentPage: pagination.page,
        totalItems: pagination.totalItems,
        estimatesLength: estimates.length,
        activeTab,
        pages: pages.length,
    });

    // Load estimates when component mounts or tab changes
    useEffect(() => {
        const statusFilter = getStatusFilters();
        loadEstimatesWithPagination(
            1,
            statusFilter.length > 0 ? statusFilter[0] : null
        );
    }, [activeTab]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        // The pagination reset will be handled in the useEffect
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

    // Handle estimate view modal
    const handleViewEstimate = (estimate) => {
        console.log("View estimate:", estimate.id);
        setSelectedEstimate(estimate);
        setDetailsModalOpen(true);
    };

    // Close details modal
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

    // Updated to use context instead of refetching
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

            // No need to refetch - context handles updates automatically
        } catch (error) {
            console.error("Error after form submission:", error);
            toast.error("Failed to refresh estimates data");
        }
    };

    // Updated to use context for updates
    const handleUpdate = async (updatedEstimate) => {
        try {
            // Use context to update estimate state (this will also update dashboard stats)
            updateEstimateInState(updatedEstimate);
        } catch (error) {
            console.error("Error after update:", error);
        }
    };

    // For pagination
    const handlePageChange = (newPage) => {
        if (newPage !== pagination.page) {
            const statusFilter = getStatusFilters();
            loadEstimatesWithPagination(
                newPage,
                statusFilter.length > 0 ? statusFilter[0] : null
            );
        }
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
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </Button>
                </Box>
            ) : activeTab !== "reports" ? (
                <>
                    <Grid container spacing={3}>
                        {estimates.length === 0 ? (
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
                            estimates.map((estimate) => (
                                <Grid item xs={12} key={estimate.id}>
                                    <EstimateCard
                                        estimate={estimate}
                                        onClick={() =>
                                            handleViewEstimate(estimate)
                                        }
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
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mb={1}
                                >
                                    Total Estimates
                                </Typography>
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    {estimates.length}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    mt={0.5}
                                >
                                    All time
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 3 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mb={1}
                                >
                                    Pending Estimates
                                </Typography>
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    {
                                        estimates.filter(
                                            (e) =>
                                                e.status ===
                                                ESTIMATE_STATUS.PENDING
                                        ).length
                                    }
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    mt={0.5}
                                >
                                    Awaiting response
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 3 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mb={1}
                                >
                                    Acceptance Rate
                                </Typography>
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    {estimates.length > 0
                                        ? Math.round(
                                              (estimates.filter(
                                                  (e) =>
                                                      e.status ===
                                                      ESTIMATE_STATUS.ACCEPTED
                                              ).length /
                                                  estimates.length) *
                                                  100
                                          )
                                        : 0}
                                    %
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    mt={0.5}
                                >
                                    Overall rate
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{ p: 3 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mb={1}
                                >
                                    Total Value (Accepted)
                                </Typography>
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    $
                                    {estimates
                                        .filter(
                                            (e) =>
                                                e.status ===
                                                ESTIMATE_STATUS.ACCEPTED
                                        )
                                        .reduce(
                                            (sum, e) =>
                                                sum + (e.bidAmount || 0),
                                            0
                                        )
                                        .toLocaleString()}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    mt={0.5}
                                >
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

            {/* Pagination controller */}
            {activeTab !== "reports" && estimates.length > 0 && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        mt: 4,
                        gap: 1,
                    }}
                >
                    <Button
                        variant="outlined"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        sx={{
                            minWidth: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            color: "#666",
                            borderColor: "#e0e0e0",
                            "&:hover": {
                                borderColor: "#9c27b0",
                                backgroundColor: "#f3e5f5",
                            },
                        }}
                    >
                        <ChevronLeftIcon />
                    </Button>

                    {pages.map((page) => (
                        <Button
                            key={page}
                            variant={
                                pagination.page === page + 1
                                    ? "contained"
                                    : "outlined"
                            }
                            onClick={() => handlePageChange(page + 1)}
                            sx={{
                                minWidth: "40px",
                                height: "40px",
                                borderRadius: "8px",
                                ...(pagination.page === page + 1
                                    ? {
                                          backgroundColor: "#9c27b0",
                                          color: "#fff",
                                          "&:hover": {
                                              backgroundColor: "#7b1fa2",
                                          },
                                      }
                                    : {
                                          color: "#666",
                                          borderColor: "#e0e0e0",
                                          "&:hover": {
                                              borderColor: "#9c27b0",
                                              backgroundColor: "#f3e5f5",
                                          },
                                      }),
                            }}
                        >
                            {page + 1}
                        </Button>
                    ))}

                    <Button
                        variant="outlined"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= totalPages}
                        sx={{
                            minWidth: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            color: "#666",
                            borderColor: "#e0e0e0",
                            "&:hover": {
                                borderColor: "#9c27b0",
                                backgroundColor: "#f3e5f5",
                            },
                        }}
                    >
                        <ChevronRightIcon />
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default EstimatesPage;
