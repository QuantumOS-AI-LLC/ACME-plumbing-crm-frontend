import {
    Modal,
    Typography,
    Box,
    Grid,
    Button,
    LinearProgress,
} from "@mui/material";
import { format } from "date-fns";

const isDueDateApproaching = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = (due - today) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays >= 0;
};

const JobDetailsModal = ({ handleClose, open, job }) => {
    const formatDate = (date) => {
        return date ? format(new Date(date), "MMM dd, yyyy") : "Not set";
    };

    const displayName = job?.leadName || job?.client?.name || "Job Details";

    const viewInvoice = () => {
        // Open invoice in new tab
        window.open(
            "https://i.ibb.co/39nJNNh5/Invoice-Aarav-Patel-20250522.jpg",
            "_blank"
        );
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
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
                            sx={{ color: "text.primary", fontWeight: "medium" }}
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
                            sx={{ color: "success.main", fontWeight: "bold" }}
                        >
                            ${job?.price?.toLocaleString() || "N/A"}
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
                        sx={{
                            borderColor: "primary.main",
                            color: "primary.main",
                            "&:hover": {
                                borderColor: "primary.dark",
                                bgcolor: "primary.light",
                                color: "white",
                            },
                            px: 4,
                            py: 1,
                            borderRadius: 1,
                        }}
                    >
                        View Invoice
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleClose}
                        sx={{
                            bgcolor: "primary.main",
                            "&:hover": {
                                bgcolor: "primary.dark",
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
    );
};

export default JobDetailsModal;
