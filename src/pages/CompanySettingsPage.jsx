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
import { fetchCompanySettings, updateCompanySettings } from "../services/api";
import PageHeader from "../components/common/PageHeader";

const CompanySettingsPage = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
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
        const response = await fetchCompanySettings();
        if (response && response.data) {
          setFormData({
            companyName: response.data.companyName || "",
            companyAddress: response.data.companyAddress || "",
            phoneNumber: response.data.phoneNumber || "",
            email: response.data.email || "",
            website: response.data.website || "",
          });
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
      console.log("Form data",formData);
      await updateCompanySettings(formData);
      setSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating company settings:", error);
      setError("Failed to update company settings. Please try again.");
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
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Address"
                  name="companyAddress"
                  value={formData.companyAddress}
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
                sx={{ display: "flex", justifyContent: "flex-end" }}
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
