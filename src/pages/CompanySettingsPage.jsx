import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    fetchCompanyProfile,
    updateCompanyProfile, // Changed from updateCompanySettings
} from "../services/api";
import PageHeader from "../components/common/PageHeader";
import { useAuth } from "../hooks/useAuth";

const CompanySettingsPage = () => {
    const { user, updateUserData } = useAuth(); // Added useAuth
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phoneNumber: "",
        email: "",
        website: "",
    });
    const [initialFormData, setInitialFormData] = useState({ // Added initialFormData
        name: "",
        address: "",
        phoneNumber: "",
        email: "",
        website: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const loadCompanySettings = async () => {
            try {
                setLoading(true);
                const response = await fetchCompanyProfile();
                // console.log("Company Profile Response:", response);
                if (response && response.success && response.data) {
                    const fetchedData = {
                        name: response.data.name || "",
                        address: response.data.address || "",
                        phoneNumber: response.data.phoneNumber || "",
                        email: response.data.email || "",
                        website: response.data.website || "",
                    };
                    setFormData(fetchedData);
                    setInitialFormData(fetchedData); // Set initialFormData here
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (error) {
                console.error("Error loading company settings:", error);
                setError("Failed to load company settings. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadCompanySettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);
            
            const changedData = {};
            for (const key in formData) {
                if (formData[key] !== initialFormData[key]) {
                    changedData[key] = formData[key];
                }
            }

            if (Object.keys(changedData).length === 0) {
                setSuccess(true); // Or a different message like "No changes to save"
                setError("No changes detected to save.");
                setTimeout(() => {
                    setSuccess(false);
                    setError(null);
                }, 3000);
                setSaving(false);
                return;
            }

            // console.log("Sending changed data:", changedData);
            await updateCompanyProfile(changedData); // Send only changed data
            setSuccess(true);
            setInitialFormData(formData); // Update initialFormData after successful save

            // Update AuthContext
            if (user && updateUserData) {
                const updatedUser = {
                    ...user,
                    company: {
                        ...user.company,
                        ...formData 
                    }
                };
                updateUserData(updatedUser);
            }

            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (error) {
            console.error("Error updating company settings:", error);
            setError("Failed to update company settings. Please try again.");
            if (error.response?.data?.message) {
                setError(error.response.data.message); // Display specific backend errors
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <PageHeader title="Company Settings" />

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper sx={{ p: 3 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Company settings updated successfully!
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Company Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Company Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Business Phone"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Business Email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://example.com"
                                />
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            )}
        </Box>
    );
};

export default CompanySettingsPage;
