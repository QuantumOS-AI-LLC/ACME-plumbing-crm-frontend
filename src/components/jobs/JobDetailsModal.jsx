import {
    Modal,
    Typography,
    Box,
    Grid,
    Button,
    LinearProgress,
    Alert,
    Snackbar,
} from "@mui/material";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { fetchJob } from "../../services/api";

const isDueDateApproaching = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = (due - today) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays >= 0;
};

const JobDetailsModal = ({ handleClose, open, job }) => {
    const [loading, setLoading] = useState(false);
    const [invoiceChecking, setInvoiceChecking] = useState(false);
    const [error, setError] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");

    const formatDate = (date) => {
        return date ? format(new Date(date), "MMM dd, yyyy") : "Not set";
    };

    const displayName = job?.name || "";

    // Reset states when modal closes
    useEffect(() => {
        if (!open) {
            setLoading(false);
            setInvoiceChecking(false);
            setError(null);
        }
    }, [open]);

    const checkInvoiceStatus = async (jobId, maxAttempts = 10) => {
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await fetchJob(jobId);

                if (response?.data?.invoiceUrl) {
                    return response.data.invoiceUrl;
                }

                // Wait 3 seconds before next check
                await new Promise((resolve) => setTimeout(resolve, 3000));
                attempts++;
            } catch (error) {
                console.error("Error checking invoice status:", error);
                throw error;
            }
        }

        return null;
    };

    const refreshAndViewInvoice = async () => {
        setError(null);
        setLoading(true);

        try {
            // Always fetch the latest job data first to ensure we have the most recent invoice URL
            const response = await fetchJob(job.id);

            if (response?.data?.invoiceUrl) {
                // Add a small delay to ensure the invoice file is fully updated
                setTimeout(() => {
                    window.open(response.data.invoiceUrl, "_blank");
                    setLoading(false);
                    setNotificationMessage("Invoice opened with latest data");
                    setShowNotification(true);
                }, 1000);
            } else {
                // Invoice doesn't exist yet, check if it's being generated
                setLoading(false);
                setInvoiceChecking(true);
                setNotificationMessage("Waiting for invoice generation...");
                setShowNotification(true);

                const invoiceUrl = await checkInvoiceStatus(job.id);

                if (invoiceUrl) {
                    // Invoice is now ready
                    window.open(invoiceUrl, "_blank");
                    setNotificationMessage("Invoice generated and opened!");
                    setShowNotification(true);

                    // Update the job object if possible
                    if (job) {
                        job.invoiceUrl = invoiceUrl;
                    }
                } else {
                    // Invoice still not ready after waiting
                    setError(
                        "Invoice is still being generated. Please try again in a few moments."
                    );
                    setNotificationMessage("Invoice generation in progress");
                    setShowNotification(true);
                }
            }
        } catch (err) {
            setError("Failed to fetch latest invoice. Please try again.");
            console.error("Error in refreshAndViewInvoice:", err);
        } finally {
            setLoading(false);
            setInvoiceChecking(false);
        }
    };

    const viewInvoice = refreshAndViewInvoice;

    const isProcessing = loading || invoiceChecking;

    return (
        <>
            <Modal
                open={open}
                onClose={!isProcessing ? handleClose : undefined}
                aria-labelledby="job-details-modal"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(2px)",
                }}
            >
                <Box
                    sx={{
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,
                        maxWidth: 600,
                        width: "90%",
                        maxHeight: "80vh",
                        overflowY: "auto",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Typography
                        id="job-details-modal"
                        variant="h5"
                        gutterBottom
                        sx={{
                            color: "primary.main",
                            fontWeight: "bold",
                            mb: 3,
                            pb: 1,
                            borderBottom: "2px solid",
                            borderColor: "primary.light",
                        }}
                    >
                        {displayName}
                    </Typography>

                    {error && (
                        <Alert
                            severity="warning"
                            sx={{ mb: 2 }}
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}

                    {invoiceChecking && (
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                            >
                                Checking invoice status...
                            </Typography>
                            <LinearProgress />
                        </Box>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: "medium" }}
                            >
                                Client
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: "text.primary",
                                    fontWeight: "medium",
                                }}
                            >
                                {job?.client?.name || "N/A"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: "medium" }}
                            >
                                Address
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary" }}
                            >
                                {job?.address || "N/A"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: "medium" }}
                            >
                                {job?.status === "completed"
                                    ? "Completed Date"
                                    : "Start Date"}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary" }}
                            >
                                {formatDate(
                                    job?.status === "completed"
                                        ? job?.completedDate
                                        : job?.startDate
                                )}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: "medium" }}
                            >
                                Price
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: "success.main",
                                    fontWeight: "bold",
                                }}
                            >
                                ${job?.price?.toLocaleString() || "N/A"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: "medium" }}
                            >
                                Invoice Status
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: job?.invoiceUrl
                                        ? "success.main"
                                        : "text.secondary",
                                    fontWeight: "medium",
                                }}
                            >
                                {invoiceChecking
                                    ? "Refreshing..."
                                    : job?.invoiceUrl
                                    ? "Ready"
                                    : "Pending"}
                            </Typography>
                        </Grid>
                        {job?.status === "in_progress" &&
                            typeof job?.progress === "number" && (
                                <Grid item xs={12}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontWeight: "medium" }}
                                    >
                                        Progress
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "text.primary", mb: 1 }}
                                    >
                                        {job.progress}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={job.progress}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor:
                                                "action.disabledBackground",
                                            "& .MuiLinearProgress-bar": {
                                                backgroundColor:
                                                    job.progress >= 80
                                                        ? "success.main"
                                                        : "primary.main",
                                                borderRadius: 4,
                                            },
                                        }}
                                    />
                                </Grid>
                            )}
                        {job?.dueDate && (
                            <Grid item xs={12} sm={6}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontWeight: "medium" }}
                                >
                                    Due Date
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: isDueDateApproaching(job.dueDate)
                                            ? "warning.main"
                                            : "text.primary",
                                        fontWeight: isDueDateApproaching(
                                            job.dueDate
                                        )
                                            ? "bold"
                                            : "normal",
                                    }}
                                >
                                    {formatDate(job.dueDate)}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>

                    <Box
                        sx={{
                            mt: 4,
                            display: "flex",
                            justifyContent: "flex-end",
                            pt: 2,
                            borderTop: "1px solid",
                            borderColor: "divider",
                            gap: 2,
                        }}
                    >
                        <Button
                            variant="outlined"
                            onClick={viewInvoice}
                            disabled={isProcessing}
                            sx={{
                                borderColor: "primary.main",
                                color: "primary.main",
                                "&:hover": {
                                    borderColor: "primary.dark",
                                    bgcolor: "primary.light",
                                    color: "white",
                                },
                                "&:disabled": {
                                    borderColor: "action.disabledBackground",
                                    color: "action.disabled",
                                },
                                px: 4,
                                py: 1,
                                borderRadius: 1,
                                position: "relative",
                                minWidth: 150,
                            }}
                        >
                            {invoiceChecking
                                ? "Refreshing Invoice..."
                                : loading
                                ? "Opening..."
                                : !job?.invoiceUrl
                                ? "Check Invoice"
                                : "View Invoice"}
                            {isProcessing && (
                                <CircularProgress
                                    size={20}
                                    sx={{
                                        color: "primary.main",
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        marginTop: "-10px",
                                        marginLeft: "-10px",
                                    }}
                                />
                            )}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleClose}
                            disabled={isProcessing}
                            sx={{
                                bgcolor: "primary.main",
                                "&:hover": {
                                    bgcolor: "primary.dark",
                                },
                                "&:disabled": {
                                    bgcolor: "action.disabledBackground",
                                },
                                px: 4,
                                py: 1,
                                borderRadius: 1,
                            }}
                        >
                            Close
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default JobDetailsModal;
