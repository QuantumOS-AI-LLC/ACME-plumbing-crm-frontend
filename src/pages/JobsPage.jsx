import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Grid,
    Paper,
    Divider,
    Button,
    CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { updateJob } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import JobCard from "../components/jobs/JobCard";
import AddJobModal from "../components/jobs/AddJobModal";
import { useJobs } from "../contexts/JobsContext";

// Constants matching backend
const JOB_STATUS = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

const JobsPage = () => {
    const [activeTab, setActiveTab] = useState("open");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Use Jobs context with pagination
    const {
        jobs,
        loading,
        error,
        pagination,
        loadJobsWithPagination,
        updateJobInState,
    } = useJobs();

    // Ensure at least 1 page if there are jobs
    const totalPages = Math.max(pagination.totalPages, jobs.length > 0 ? 2 : 0);
    const pages = [...Array(totalPages).keys()];

    // Debug pagination state
    console.log("Pagination Debug:", {
        originalTotalPages: pagination.totalPages,
        calculatedTotalPages: totalPages,
        currentPage: pagination.page,
        totalItems: pagination.totalItems,
        jobsLength: jobs.length,
        activeTab,
        pages: pages.length,
    });

    // Load jobs when component mounts or tab changes
    useEffect(() => {
        const statusFilter = getStatusFilters();
        loadJobsWithPagination(
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
            case "open":
                return [JOB_STATUS.OPEN];
            case "in_progress":
                return [JOB_STATUS.IN_PROGRESS];
            case "completed":
                return [JOB_STATUS.COMPLETED];
            case "cancelled":
                return [JOB_STATUS.CANCELLED];
            default:
                return [];
        }
    };

    // Handle job update (from edit modal)
    const handleJobUpdate = (updatedJob) => {
        // Use context to update job state (this will also update dashboard stats)
        updateJobInState(updatedJob);

        // Auto-switch to the correct tab based on the updated job's status
        if (updatedJob.status === JOB_STATUS.OPEN) {
            setActiveTab("open");
        } else if (updatedJob.status === JOB_STATUS.IN_PROGRESS) {
            setActiveTab("in_progress");
        } else if (updatedJob.status === JOB_STATUS.COMPLETED) {
            setActiveTab("completed");
        } else if (updatedJob.status === JOB_STATUS.CANCELLED) {
            setActiveTab("cancelled");
        }
    };

    // Handle job status change (from status dropdown)
    const handleStatusChange = async (jobId, newStatus) => {
        try {
            await updateJob(jobId, { status: newStatus });

            // Find the job and update it using context
            const jobToUpdate = jobs.find((job) => job.id === jobId);
            if (jobToUpdate) {
                const updatedJob = { ...jobToUpdate, status: newStatus };
                updateJobInState(updatedJob);
            }

            // Auto-switch to the correct tab
            if (newStatus === JOB_STATUS.COMPLETED) {
                setActiveTab("completed");
            } else if (newStatus === JOB_STATUS.CANCELLED) {
                setActiveTab("cancelled");
            } else if (newStatus === JOB_STATUS.OPEN) {
                setActiveTab("open");
            } else if (newStatus === JOB_STATUS.IN_PROGRESS) {
                setActiveTab("in_progress");
            }
        } catch (error) {
            console.error("Error updating job status:", error);
        }
    };

    // Handle job creation - no need to refresh, context will handle it
    const handleJobCreated = () => {
        // Jobs are automatically added to context by AddJobModal
        // No need to refresh manually
    };

    // For pagination
    const handlePageChange = (newPage) => {
        if (newPage !== pagination.page) {
            const statusFilter = getStatusFilters();
            loadJobsWithPagination(
                newPage,
                statusFilter.length > 0 ? statusFilter[0] : null
            );
        }
    };

    return (
        <Box>
            <PageHeader
                title="Jobs"
                action={true}
                actionText="Add Job"
                onAction={() => setIsModalOpen(true)}
            />

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="job tabs"
                >
                    <Tab label="Open Jobs" value="open" />
                    <Tab label="In Progress" value="in_progress" />
                    <Tab label="Completed" value="completed" />
                    <Tab label="Cancelled" value="cancelled" />
                </Tabs>
            </Box>

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
                        {jobs.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <Typography variant="body1">
                                        No{" "}
                                        {activeTab === "open"
                                            ? "open"
                                            : activeTab === "in_progress"
                                            ? "in progress"
                                            : activeTab === "completed"
                                            ? "completed"
                                            : "cancelled"}{" "}
                                        jobs found.
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            jobs.map((job) => (
                                <Grid item xs={12} key={job.id}>
                                    <JobCard
                                        job={job}
                                        onClick={() =>
                                            console.log("View job:", job.id)
                                        }
                                        onUpdate={handleJobUpdate}
                                        onStatusChange={handleStatusChange}
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
                                    Jobs Completed (30d)
                                </Typography>
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    {
                                        jobs.filter(
                                            (job) =>
                                                job.status ===
                                                JOB_STATUS.COMPLETED
                                        ).length
                                    }
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    mt={0.5}
                                >
                                    From past 30 days
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
                                    Gross Closed Deals
                                </Typography>
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    $
                                    {jobs
                                        .filter(
                                            (job) =>
                                                job.status ===
                                                JOB_STATUS.COMPLETED
                                        )
                                        .reduce(
                                            (sum, job) =>
                                                sum + (job.price || 0),
                                            0
                                        )
                                        .toLocaleString()}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    mt={0.5}
                                >
                                    Total value
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
                                    Jobs In Progress
                                </Typography>
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    {
                                        jobs.filter(
                                            (job) =>
                                                job.status ===
                                                JOB_STATUS.IN_PROGRESS
                                        ).length
                                    }
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    mt={0.5}
                                >
                                    Currently active
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
                                    Open Jobs
                                </Typography>
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    {
                                        jobs.filter(
                                            (job) =>
                                                job.status === JOB_STATUS.OPEN
                                        ).length
                                    }
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    mt={0.5}
                                >
                                    Not yet started
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" mb={2}>
                            Monthly Performance
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
                            <Typography>Jobs vs. Revenue Chart</Typography>
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* Pagination controller */}
            {activeTab !== "reports" && jobs.length > 0 && (
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

            {/* Add Job Modal */}
            <AddJobModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onJobCreated={handleJobCreated}
            />
        </Box>
    );
};

export default JobsPage;
