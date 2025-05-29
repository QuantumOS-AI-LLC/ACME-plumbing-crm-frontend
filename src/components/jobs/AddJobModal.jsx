import React, { useState, useEffect, useContext } from "react";
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    MenuItem,
    CircularProgress,
    Alert,
    Grid,
    Paper,
    Divider,
    InputAdornment,
} from "@mui/material";
import { createJob, fetchContacts } from "../../services/api";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import { AuthContext } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { useWebhook } from "../../hooks/webHook";

const AddJobModal = ({ open, onClose, onJobCreated }) => {
    const { user } = useContext(AuthContext);
    const { sendWebhook } = useWebhook();
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        price: "",
        status: "open",
        startDate: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
        endDate: "", // Optional field from schema
        clientId: "",
        createdBy: user?.id || "", // This matches the schema field name
    });
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clientLoading, setClientLoading] = useState(true);

    // Update createdBy when user changes
    useEffect(() => {
        if (user?.id) {
            setFormData((prev) => ({ ...prev, createdBy: user.id }));
        }
    }, [user]);

    useEffect(() => {
        const loadClients = async () => {
            try {
                setClientLoading(true);
                const response = await fetchContacts();
                console.log("Clients Data:", response.data);
                setClients(response.data || []);
            } catch (err) {
                console.error("Error loading clients:", err);
                setError("Failed to load clients.");
            } finally {
                setClientLoading(false);
            }
        };

        if (open) {
            loadClients();
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Validate all required fields according to schema
        if (
            !formData.name ||
            !formData.address ||
            !formData.price ||
            !formData.clientId ||
            !formData.createdBy
        ) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        // Validate price
        const priceValue = parseFloat(formData.price);
        if (isNaN(priceValue) || priceValue < 0) {
            setError("Please enter a valid price.");
            setLoading(false);
            return;
        }

        try {
            // Prepare data according to Prisma schema
            const jobData = {
                name: formData.name,
                address: formData.address,
                price: priceValue,
                status: formData.status,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate
                    ? new Date(formData.endDate).toISOString()
                    : null,
                clientId: formData.clientId,
                createdBy: formData.createdBy,
                activity: "",
            };

            console.log("Job Data being sent:", jobData);

            await createJob(jobData);
            // Send to N8N webhook (if configured)

            const webHookData = {
                ...jobData,
                webhookEvent: "JobCreated",
            };

            await sendWebhook({ payload: webHookData });

            // Reset form after successful creation
            setFormData({
                name: "",
                address: "",
                price: "",
                status: "open",
                startDate: new Date().toISOString().split("T")[0],
                endDate: "",
                clientId: "",
                createdBy: user?.id || "",
            });

            onJobCreated();
            onClose();
        } catch (err) {
            console.error("Error creating job:", err);

            // Better error handling
            let errorMessage = "Failed to create job. Please try again.";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: { xs: "90%", sm: "80%", md: "700px" },
                    maxHeight: "90vh",
                    overflowY: "auto",
                    bgcolor: "background.paper",
                    boxShadow: 24,
                    borderRadius: 2,
                    p: 0,
                }}
            >
                <Paper elevation={0} sx={{ p: 3 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 3,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            pb: 2,
                        }}
                    >
                        <WorkOutlineIcon
                            color="primary"
                            sx={{ mr: 2, fontSize: 32 }}
                        />
                        <Typography
                            color="primary"
                            variant="h5"
                            component="h2"
                            sx={{ fontWeight: 600 }}
                        >
                            Create New Job
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Job Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <WorkOutlineIcon
                                                    fontSize="small"
                                                    color="action"
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Status"
                                    name="status"
                                    select
                                    value={formData.status}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                    size="small"
                                >
                                    <MenuItem value="open">Open</MenuItem>
                                    <MenuItem value="in_progress">
                                        In Progress
                                    </MenuItem>
                                    <MenuItem value="completed">
                                        Completed
                                    </MenuItem>
                                    <MenuItem value="cancelled">
                                        Cancelled
                                    </MenuItem>
                                </TextField>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    multiline
                                    rows={2}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LocationOnOutlinedIcon
                                                    fontSize="small"
                                                    color="action"
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Price"
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                    size="small"
                                    inputProps={{ min: 0, step: "0.01" }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AttachMoneyOutlinedIcon
                                                    fontSize="small"
                                                    color="action"
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Client"
                                    name="clientId"
                                    select
                                    value={formData.clientId}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                    size="small"
                                    disabled={clientLoading}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutlineOutlinedIcon
                                                    fontSize="small"
                                                    color="action"
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                >
                                    {clientLoading ? (
                                        <MenuItem value="">
                                            Loading clients...
                                        </MenuItem>
                                    ) : clients.length === 0 ? (
                                        <MenuItem value="">
                                            No clients available
                                        </MenuItem>
                                    ) : (
                                        clients.map((client) => (
                                            <MenuItem
                                                key={client.id}
                                                value={client.id}
                                            >
                                                {client.name}
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Start Date"
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarTodayOutlinedIcon
                                                    fontSize="small"
                                                    color="action"
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="End Date (Optional)"
                                    name="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EventOutlinedIcon
                                                    fontSize="small"
                                                    color="action"
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 2,
                                mt: 2,
                            }}
                        >
                            <Button
                                onClick={onClose}
                                disabled={loading}
                                variant="outlined"
                                color="inherit"
                                sx={{ minWidth: 100 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading || clientLoading || !user?.id}
                                sx={{ minWidth: 120 }}
                                startIcon={
                                    loading ? (
                                        <CircularProgress size={20} />
                                    ) : null
                                }
                            >
                                {loading ? "Creating..." : "Create Job"}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </Box>
        </Modal>
    );
};

export default AddJobModal;
