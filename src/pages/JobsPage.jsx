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
    const [activeTab, setActiveTab] = useState("current");
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadJobs = async () => {
        try {
            setLoading(true);
            const response = await fetchJobs({
                page: 1,
                limit: 50,
            });
            console.log("Jobs API response:", response);
            if (response && response.data) {
                setJobs(response.data);
            } else {
                console.error("Unexpected API response format:", response);
                setJobs([]);
            }
        } catch (error) {
            console.error("Error loading jobs:", error);
            setError("Failed to load jobs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const getStatusFilters = () => {
        switch (activeTab) {
            case "current":
                return [JOB_STATUS.OPEN, JOB_STATUS.IN_PROGRESS];
            case "completed":
                return [JOB_STATUS.COMPLETED];
            case "cancelled":
                return [JOB_STATUS.CANCELLED];
            default:
                return [];
        }
    };

    const filteredJobs = jobs.filter((job) => {
        if (activeTab === "reports") return true;
        const statusFilters = getStatusFilters();
        return statusFilters.includes(job.status);
    });

    // Handle job update (from edit modal)
    const handleJobUpdate = async (job) => {
        try {
            await updateJob(job.id, job);

            // If status changed, auto-switch to the correct tab
            if (job.status === JOB_STATUS.COMPLETED) {
                setActiveTab("completed");
            } else if (job.status === JOB_STATUS.CANCELLED) {
                setActiveTab("cancelled");
            } else if (
                job.status === JOB_STATUS.OPEN ||
                job.status === JOB_STATUS.IN_PROGRESS
            ) {
                setActiveTab("current");
            }

            loadJobs(); // Refresh jobs list
        } catch (error) {
            console.error("Error updating job:", error);
        }
    };

    // Status change handler (from status dropdown)
    const handleStatusChange = async (jobId, newStatus) => {
        try {
            await updateJob(jobId, { status: newStatus });

            // Auto-switch to the correct tab
            if (newStatus === JOB_STATUS.COMPLETED) {
                setActiveTab("completed");
            } else if (newStatus === JOB_STATUS.CANCELLED) {
                setActiveTab("cancelled");
            } else if (
                newStatus === JOB_STATUS.OPEN ||
                newStatus === JOB_STATUS.IN_PROGRESS
            ) {
                setActiveTab("current");
            }

            loadJobs(); // Refresh jobs list
        } catch (error) {
            console.error("Error updating job status:", error);
        }
    };

    // Handle job creation
    const handleJobCreated = () => {
        loadJobs(); // Refresh jobs list
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
                    <Tab label="Current Jobs" value="current" />
                    <Tab label="Completed" value="completed" />
                    <Tab label="Cancelled" value="cancelled" />
                    <Tab label="Reports" value="reports" />
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
                        {filteredJobs.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <Typography variant="body1">
                                        No{" "}
                                        {activeTab === "current"
                                            ? "current"
                                            : activeTab === "completed"
                                            ? "completed"
                                            : "cancelled"}{" "}
                                        jobs found.
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            filteredJobs.map((job) => (
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
