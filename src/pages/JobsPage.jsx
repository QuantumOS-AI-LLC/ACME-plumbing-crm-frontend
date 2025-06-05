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
import { fetchJobs, updateJob } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import JobCard from "../components/jobs/JobCard";
import AddJobModal from "../components/jobs/AddJobModal";

// Constants matching backend
const JOB_STATUS = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

const JobsPage = () => {
    const [activeTab, setActiveTab] = useState("open");
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 0,
    });

    const pages = [...Array(pagination.totalPages).keys()];

const loadJobs = async () => {
    try {
        setLoading(true);
        setError(null); // Clear previous errors

        const params = {
            page: pagination.page,
            limit: pagination.limit,
        };

        let combinedJobs = [];
        let combinedTotalItems = 0;

        if (activeTab === "open") {
            const response = await fetchJobs({
                ...params,
                status: JOB_STATUS.OPEN,
            });
            combinedJobs = response.data || [];
            combinedTotalItems = response.pagination?.total || 0;
        } else if (activeTab === "in_progress") {
            const response = await fetchJobs({
                ...params,
                status: JOB_STATUS.IN_PROGRESS,
            });
            combinedJobs = response.data || [];
            combinedTotalItems = response.pagination?.total || 0;
        } else if (activeTab === "completed") {
            const response = await fetchJobs({
                ...params,
                status: JOB_STATUS.COMPLETED,
            });
            combinedJobs = response.data || [];
            combinedTotalItems = response.pagination?.total || 0;
        } else if (activeTab === "cancelled") {
            const response = await fetchJobs({
                ...params,
                status: JOB_STATUS.CANCELLED,
            });
            combinedJobs = response.data || [];
            combinedTotalItems = response.pagination?.total || 0;
        }

        setJobs(combinedJobs);
        setPagination((prev) => ({
            ...prev,
            totalPages: Math.ceil(combinedTotalItems / pagination.limit),
            totalItems: combinedTotalItems,
        }));
    } catch (error) {
        console.error("Error loading jobs:", error);
        setError("Failed to load jobs. Please try again.");
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        loadJobs();
    }, [pagination.page, activeTab]); // Add activeTab as a dependency

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setPagination((prevState) => ({
            ...prevState,
            page: 1, // Reset to first page on tab change
        }));
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
        // Update the jobs state directly with the updated job
        setJobs((prevJobs) =>
            prevJobs.map((job) =>
                job.id === updatedJob.id ? { ...job, ...updatedJob } : job
            )
        );

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

            // Update the jobs state directly
            setJobs((prevJobs) =>
                prevJobs.map((job) =>
                    job.id === jobId ? { ...job, status: newStatus } : job
                )
            );

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

    // Handle job creation
    const handleJobCreated = () => {
        loadJobs(); // Refresh jobs list
    };

    // For pagination
    const handlePageChange = (newPage) => {
        if (newPage !== pagination.page) {
            setPagination((prevState) => ({
                ...prevState,
                page: newPage,
            }));
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
                        onClick={loadJobs} // Use loadJobs instead of reloading the page
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
                                            : activeTab === "cancelled"}{" "}
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
            {activeTab !== "reports" && (
                <Box sx={{ textAlign: "center", mt: 4 }}>
                    <Button
                        variant="outlined"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        sx={{ px: 1, mr: 0.5, minWidth: "32px" }}
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
                            disabled={pagination.page === page + 1}
                            sx={{ px: 1, mx: 0.5, minWidth: "32px" }}
                        >
                            {page + 1}
                        </Button>
                    ))}

                    <Button
                        variant="outlined"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        sx={{ px: 1, ml: 0.5, minWidth: "32px" }}
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
