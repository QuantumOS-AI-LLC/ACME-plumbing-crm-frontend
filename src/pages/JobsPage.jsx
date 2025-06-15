import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Grid,
    Paper,
    Button,
    CircularProgress,
    TextField,
    InputAdornment,
    IconButton,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { updateJob } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import JobCard from "../components/jobs/JobCard";
import AddJobModal from "../components/jobs/AddJobModal";
import { useJobs } from "../contexts/JobsContext";
import { toast } from "sonner";
import _ from "lodash";

// Constants matching backend
const JOB_STATUS = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

const JobsPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("open");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        jobs,
        loading,
        error,
        pagination,
        loadJobsWithPagination,
        updateJobInState,
    } = useJobs();

    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    // Ensure at least 1 page if there are jobs
    const totalPages = Math.max(pagination.totalPages, jobs.length > 0 ? 1 : 0);
    const pages = [...Array(totalPages).keys()];

    const getStatusFilters = (tab) => {
        switch (tab) {
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

    // Load jobs when debounced search term or tab changes
    useEffect(() => {
        const statusFilter = getStatusFilters(activeTab);
        console.log("Loading jobs with:", {
            activeTab,
            debouncedSearchTerm,
            statusFilter,
            status: statusFilter.length > 0 ? statusFilter[0] : null,
        });

        loadJobsWithPagination(
            1,
            statusFilter.length > 0 ? statusFilter[0] : null,
            debouncedSearchTerm
        );
    }, [activeTab, debouncedSearchTerm]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSearchTerm(""); // This will trigger the debounce and eventually clear debouncedSearchTerm
    };

    // Handle search button click
    const handleSearchClick = () => {
        if (searchTerm.trim()) {
            const statusFilter = getStatusFilters(activeTab);
            loadJobsWithPagination(
                1,
                statusFilter.length > 0 ? statusFilter[0] : null,
                searchTerm.trim()
            );
        }
    };

    // Handle clear search
    const handleClearSearch = () => {
        setSearchTerm("");
        // This will trigger the debounce and reload jobs without search
    };

    // Handle Enter key press
    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            handleSearchClick();
        }
    };

    // Handle job update (from edit modal)
    const handleJobUpdate = useCallback(
        (updatedJob) => {
            updateJobInState(updatedJob);
            if (updatedJob.status === JOB_STATUS.OPEN) {
                setActiveTab("open");
            } else if (updatedJob.status === JOB_STATUS.IN_PROGRESS) {
                setActiveTab("in_progress");
            } else if (updatedJob.status === JOB_STATUS.COMPLETED) {
                setActiveTab("completed");
            } else if (updatedJob.status === JOB_STATUS.CANCELLED) {
                setActiveTab("cancelled");
            }
        },
        [updateJobInState]
    );

    // Handle job status change (from status dropdown)
    const handleStatusChange = useCallback(
        async (jobId, newStatus) => {
            try {
                await updateJob(jobId, { status: newStatus });
                const jobToUpdate = jobs.find((job) => job.id === jobId);
                if (jobToUpdate) {
                    const updatedJob = { ...jobToUpdate, status: newStatus };
                    updateJobInState(updatedJob);
                }
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
                toast.error("Failed to update job status");
            }
        },
        [jobs, updateJobInState]
    );

    // Handle job creation
    const handleJobCreated = useCallback(() => {
        // Jobs are automatically added to context by AddJobModal
        // Refresh the current tab
        const statusFilter = getStatusFilters(activeTab);
        loadJobsWithPagination(
            1,
            statusFilter.length > 0 ? statusFilter[0] : null,
            debouncedSearchTerm
        );
    }, [activeTab, debouncedSearchTerm]);

    // Handle pagination
    const handlePageChange = useCallback(
        (newPage) => {
            if (newPage !== pagination.page) {
                const statusFilter = getStatusFilters(activeTab);
                loadJobsWithPagination(
                    newPage,
                    statusFilter.length > 0 ? statusFilter[0] : null,
                    debouncedSearchTerm
                );
            }
        },
        [pagination.page, activeTab, debouncedSearchTerm]
    );

    const handleRetry = useCallback(() => {
        const statusFilter = getStatusFilters(activeTab);
        loadJobsWithPagination(
            1,
            statusFilter.length > 0 ? statusFilter[0] : null,
            debouncedSearchTerm
        );
    }, [activeTab, debouncedSearchTerm]);

    return (
        <Box>
            <PageHeader
                title="Jobs"
                action={true}
                actionText="Add Job"
                onAction={() => setIsModalOpen(true)}
            />

            {/* Enhanced Search Section - Full Width Button */}
            <Box sx={{ mb: 3, width: "100%" }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "stretch",
                        gap: 2,
                        width: "100%", // Full width container
                        // Stack on mobile, side by side on larger screens
                        flexDirection: { xs: "column", sm: "row" },
                    }}
                >
                    <TextField
                        label="Search jobs"
                        value={searchTerm}
                        onChange={(e) => {
                            console.log(
                                "Search term changed to:",
                                e.target.value
                            );
                            setSearchTerm(e.target.value);
                        }}
                        onKeyPress={handleKeyPress}
                        fullWidth
                        size="medium"
                        sx={{
                            flex: 1,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                transition: "all 0.3s ease",
                                height: "48px", // Reduced height
                                fontSize: "0.95rem",
                                "&:hover": {
                                    boxShadow:
                                        "0 2px 8px rgba(156, 39, 176, 0.15)",
                                },
                                "&.Mui-focused": {
                                    boxShadow:
                                        "0 4px 12px rgba(156, 39, 176, 0.25)",
                                },
                            },
                            "& .MuiInputLabel-root": {
                                fontSize: "0.95rem",
                            },
                        }}
                        variant="outlined"
                        placeholder="Enter job name..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon
                                        sx={{
                                            color: "primary.main",
                                            fontSize: "1.1rem",
                                        }}
                                    />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleClearSearch}
                                        edge="end"
                                        size="small"
                                        sx={{
                                            color: "text.secondary",
                                            "&:hover": {
                                                color: "error.main",
                                                backgroundColor: "error.light",
                                                opacity: 0.1,
                                            },
                                        }}
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Full Width Search Button with White Text */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSearchClick}
                        disabled={!searchTerm.trim() || loading}
                        sx={{
                            height: "48px", // Match TextField height
                            minWidth: { xs: "100%", sm: "200px" }, // Wider on desktop
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            textTransform: "none",
                            color: "#ffffff", // Force white text
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: (theme) =>
                                `0 3px 12px ${theme.palette.primary.main}40`,
                            "&:hover": {
                                transform: "translateY(-1px)",
                                boxShadow: (theme) =>
                                    `0 5px 16px ${theme.palette.primary.main}50`,
                                color: "#ffffff", // Keep white on hover
                            },
                            "&:active": {
                                transform: "translateY(0px)",
                                color: "#ffffff", // Keep white on active
                            },
                            "&:disabled": {
                                transform: "none",
                                boxShadow: "none",
                                color: "rgba(255, 255, 255, 0.7)", // Semi-transparent white when disabled
                            },
                            // Subtle shine effect
                            position: "relative",
                            overflow: "hidden",
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "100%",
                                height: "100%",
                                background:
                                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                                transition: "left 0.6s",
                            },
                            "&:hover::before": {
                                left: "100%",
                            },
                        }}
                        startIcon={
                            <SearchIcon
                                sx={{ fontSize: "1rem", color: "#ffffff" }}
                            />
                        }
                    >
                        {loading ? "Searching" : "Search"}
                    </Button>
                </Box>
            </Box>

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
                        onClick={handleRetry}
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
                                        No {activeTab.replace("_", " ")} jobs
                                        found.
                                    </Typography>
                                    {debouncedSearchTerm && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1 }}
                                        >
                                            Search term: "{debouncedSearchTerm}"
                                        </Typography>
                                    )}
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
                                      }
                                    : {
                                          color: "#666",
                                          borderColor: "#e0e0e0",
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
                        }}
                    >
                        <ChevronRightIcon />
                    </Button>
                </Box>
            )}

            <AddJobModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onJobCreated={handleJobCreated}
            />
        </Box>
    );
};

export default JobsPage;
