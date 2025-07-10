import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PageHeader from "../components/common/PageHeader";
import JobCard from "../components/jobs/JobCard";
import { fetchJobsByContactId, updateJob } from "../services/api";
import { toast } from "sonner";

// Constants matching backend
const JOB_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const ContactJobsPage = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("open");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0,
  });

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

  const loadContactJobs = useCallback(
    async (page, status, search) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchJobsByContactId(contactId, {
          page,
          limit: pagination.limit,
          status,
          search,
        });
        if (response.success) {
          setJobs(response.data);
          setPagination(response.pagination);
          // Store contact info from API response
          if (response.contactInfo) {
            setContactInfo(response.contactInfo);
          }
        } else {
          setError(response.message || "Failed to fetch jobs.");
        }
      } catch (err) {
        console.error("Error loading contact jobs:", err);
        setError("Failed to load jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [contactId, pagination.limit]
  );

  useEffect(() => {
    if (contactId) {
      const statusFilter = getStatusFilters(activeTab);
      loadContactJobs(
        1, // Always load first page on tab change
        statusFilter.length > 0 ? statusFilter[0] : null,
        "" // No search term on initial load or tab change
      );
    }
  }, [contactId, activeTab, loadContactJobs]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm(""); // Clear search when changing tabs
  };

  // Handle search button click
  const handleSearchClick = () => {
    const statusFilter = getStatusFilters(activeTab);
    loadContactJobs(
      1,
      statusFilter.length > 0 ? statusFilter[0] : null,
      searchTerm.trim()
    );
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    // Reload jobs without search term
    const statusFilter = getStatusFilters(activeTab);
    loadContactJobs(
      1,
      statusFilter.length > 0 ? statusFilter[0] : null,
      ""
    );
  };

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearchClick();
    }
  };

  // Handle job update (from edit modal)
  const handleJobUpdate = useCallback((updatedJob) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    );
    // Optionally, if the status changes, you might want to re-fetch or adjust the tab
    // For simplicity, we'll just update the job in the current list.
  }, []);

  // Handle job status change (from status dropdown)
  const handleStatusChange = useCallback(
    async (jobId, newStatus) => {
      try {
        await updateJob(jobId, { status: newStatus });
        const jobToUpdate = jobs.find((job) => job.id === jobId);
        if (jobToUpdate) {
          const updatedJob = { ...jobToUpdate, status: newStatus };
          setJobs((prevJobs) =>
            prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
          );
          // If the status changes to a different tab, reload jobs for the current tab
          const statusFilter = getStatusFilters(activeTab);
          if (statusFilter[0] !== newStatus) {
            loadContactJobs(
              pagination.page,
              statusFilter.length > 0 ? statusFilter[0] : null,
              "" // Don't carry search term when status changes
            );
          }
        }
      } catch (error) {
        console.error("Error updating job status:", error);
        toast.error("Failed to update job status");
      }
    },
    [jobs, activeTab, pagination.page, loadContactJobs]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage !== pagination.page) {
        const statusFilter = getStatusFilters(activeTab);
        loadContactJobs(
          newPage,
          statusFilter.length > 0 ? statusFilter[0] : null,
          "" // Don't carry search term when paginating
        );
      }
    },
    [pagination.page, activeTab, loadContactJobs]
  );

  const handleRetry = useCallback(() => {
    const statusFilter = getStatusFilters(activeTab);
    loadContactJobs(
      pagination.page,
      statusFilter.length > 0 ? statusFilter[0] : null,
      "" // Don't carry search term on retry
    );
  }, [activeTab, pagination.page, loadContactJobs]);

  const totalPages = Math.max(
    Math.floor(Number(pagination.totalPages) || 0), 
    jobs.length > 0 ? 1 : 0
  );
  const pages = totalPages > 0 ? [...Array(totalPages).keys()] : [];

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <Box>
      {/* Back Button and Header Section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        gap: 2
      }}>
        <IconButton
          onClick={handleBackClick}
          sx={{
            color: 'text.primary',
            padding: '8px',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'primary.main',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowBackIcon sx={{ fontSize: '1.5rem' }} />
        </IconButton>
        
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {contactInfo 
              ? `Jobs for ${contactInfo.name}` 
              : loading 
              ? "Loading..." 
              : "Jobs for Contact"
            }
          </Typography>
        </Box>
      </Box>

      {/* Enhanced Search Section - Full Width Button */}
      <Box sx={{ mb: 3, width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            gap: 2,
            width: "100%",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <TextField
            label="Search jobs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            size="medium"
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                transition: "all 0.3s ease",
                height: "48px",
                fontSize: "0.95rem",
                "&:hover": {
                  boxShadow: "0 2px 8px rgba(156, 39, 176, 0.15)",
                },
                "&.Mui-focused": {
                  boxShadow: "0 4px 12px rgba(156, 39, 176, 0.25)",
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

          <Button
            variant="contained"
            color="primary"
            onClick={handleSearchClick}
            disabled={!searchTerm.trim() || loading}
            sx={{
              height: "48px",
              minWidth: { xs: "100%", sm: "200px" },
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.9rem",
              textTransform: "none",
              color: "#ffffff",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: (theme) =>
                `0 3px 12px ${theme.palette.primary.main}40`,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: (theme) =>
                  `0 5px 16px ${theme.palette.primary.main}50`,
                color: "#ffffff",
              },
              "&:active": {
                transform: "translateY(0px)",
                color: "#ffffff",
              },
              "&:disabled": {
                transform: "none",
                boxShadow: "none",
                color: "rgba(255, 255, 255, 0.7)",
              },
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
              <SearchIcon sx={{ fontSize: "1rem", color: "#ffffff" }} />
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
      ) : (
        <>
          <Grid container spacing={3}>
            {jobs.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1">
                    No {activeTab.replace("_", " ")} jobs found for this
                    contact.
                  </Typography>
                  {searchTerm && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Search term: "{searchTerm}"
                    </Typography>
                  )}
                </Box>
              </Grid>
            ) : (
              jobs.map((job) => (
                <Grid item xs={12} key={job.id}>
                  <JobCard
                    job={job}
                    onClick={() => console.log("View job:", job.id)}
                    onUpdate={handleJobUpdate}
                    onStatusChange={handleStatusChange}
                  />
                </Grid>
              ))
            )}
          </Grid>
        </>
      )}

      {/* Fixed Pagination Section */}
      {jobs.length > 0 && totalPages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 4,
            gap: 1,
          }}
        >
          {/* Previous Button */}
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
                backgroundColor: "#f5f5f5",
              },
              "&:disabled": {
                opacity: 0.5,
              },
            }}
          >
            <ChevronLeftIcon />
          </Button>

          {/* Page Numbers */}
          {pages.map((page) => (
            <Button
              key={page}
              variant={pagination.page === page + 1 ? "contained" : "outlined"}
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
                        backgroundColor: "#f5f5f5",
                      },
                    }),
              }}
            >
              {page + 1}
            </Button>
          ))}

          {/* Next Button */}
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
                backgroundColor: "#f5f5f5",
              },
              "&:disabled": {
                opacity: 0.5,
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

export default ContactJobsPage;