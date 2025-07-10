import React, { useState, useEffect, useMemo } from "react";
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
    Breadcrumbs,
    Link,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import PersonIcon from "@mui/icons-material/Person";
import PageHeader from "../components/common/PageHeader";
import SimpleJobList from "../components/jobs/SimpleJobList";
import { fetchContact } from "../services/api";
import {
    generateFakeJobsForContact,
    filterJobsByStatus,
    getJobCountsByStatus,
} from "../utils/fakeJobData";
import { toast } from "sonner";

const ContactJobsPage = () => {
    const { contactId } = useParams();
    const navigate = useNavigate();
    const [contact, setContact] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("open");

    useEffect(() => {
        const loadContactAndJobs = async () => {
            try {
                setLoading(true);
                const response = await fetchContact(contactId);
                if (response && response.data) {
                    setContact(response.data);
                    // Generate fake jobs for this contact
                    const fakeJobs = generateFakeJobsForContact(
                        response.data.id,
                        response.data.name,
                        response.data.address
                    );
                    setJobs(fakeJobs);
                }
            } catch (error) {
                console.error("Error loading contact and jobs:", error);
                toast.error("Failed to load contact jobs. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (contactId) {
            loadContactAndJobs();
        }
    }, [contactId]);

    const filteredJobs = useMemo(() => {
        let filtered = filterJobsByStatus(jobs, activeTab);

        if (searchTerm.trim()) {
            filtered = filtered.filter(
                (job) =>
                    job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    job.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    }, [jobs, activeTab, searchTerm]);

    const jobCounts = useMemo(() => getJobCountsByStatus(jobs), [jobs]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSearchTerm(""); // Clear search when changing tabs
    };

    const handleSearchClick = () => {
        // Search is handled automatically through filteredJobs memo
    };

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            handleSearchClick();
        }
    };

    const handleBackToContact = () => {
        navigate(`/contacts/${contactId}`);
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 400,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!contact) {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="error">Contact not found</Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => navigate("/contacts")}
                >
                    Back to Contacts
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Breadcrumb Navigation */}
            <Box sx={{ mb: 2 }}>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link
                        color="inherit"
                        href="/contacts"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate("/contacts");
                        }}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                        }}
                    >
                        Contacts
                    </Link>
                    <Link
                        color="inherit"
                        href={`/contacts/${contactId}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleBackToContact();
                        }}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                        }}
                    >
                        <PersonIcon sx={{ mr: 0.5, fontSize: 16 }} />
                        {contact.name}
                    </Link>
                    <Typography color="text.primary">All Jobs</Typography>
                </Breadcrumbs>
            </Box>
            <PageHeader
                title={`Jobs for ${contact.name}`}
                subtitle={`${jobCounts.total} total jobs`}
                showBackButton={true}
                onBack={handleBackToContact}
            />

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="contact job tabs"
                >
                    <Tab label={`Open Jobs (${jobCounts.open})`} value="open" />
                    <Tab
                        label={`In Progress (${jobCounts.in_progress})`}
                        value="in_progress"
                    />
                    <Tab
                        label={`Completed (${jobCounts.completed})`}
                        value="completed"
                    />
                    <Tab
                        label={`Cancelled (${jobCounts.cancelled})`}
                        value="cancelled"
                    />
                </Tabs>
            </Box>
            {/* Jobs List */}
            <Paper sx={{ p: 3, mb: 3 }}>
                {filteredJobs.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            {searchTerm.trim()
                                ? `No jobs found matching "${searchTerm}"`
                                : `No ${activeTab.replace(
                                      "_",
                                      " "
                                  )} jobs found for ${contact.name}.`}
                        </Typography>
                    </Box>
                ) : (
                    <SimpleJobList jobs={filteredJobs} />
                )}
            </Paper>
            {/* Summary Stats */}
            {filteredJobs.length > 0 && (
                <Paper sx={{ p: 3, mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Summary for {contact.name}
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    {jobCounts.total}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Total Jobs
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography
                                    variant="h4"
                                    color="success.main"
                                    fontWeight="bold"
                                >
                                    {jobCounts.completed}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Completed
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography
                                    variant="h4"
                                    color="warning.main"
                                    fontWeight="bold"
                                >
                                    {jobCounts.in_progress}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    In Progress
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography
                                    variant="h4"
                                    color="info.main"
                                    fontWeight="bold"
                                >
                                    {jobCounts.open}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Open Jobs
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default ContactJobsPage;
