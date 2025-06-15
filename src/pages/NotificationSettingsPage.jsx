import React, { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Switch,
    Button,
    Alert,
    CircularProgress,
} from "@mui/material";
import PageHeader from "../components/common/PageHeader";
import { useNotificationSettings } from "../contexts/NotificationSettingsContext";

const NotificationSettingsPage = () => {
    const {
        settings,
        loading,
        saving,
        error,
        updateSettings,
        toggleSetting,
        getSettingForType,
        eventTypeMap,
    } = useNotificationSettings();

    const [success, setSuccess] = useState(false);

    // channelKey: 'emailEnabled', 'smsEnabled', or 'appEnabled'
    // frontendEventTypeId: 'newEstimate', 'estimateAccepted', etc.
    const handleToggle = (channelKey, frontendEventTypeId) => {
        toggleSetting(channelKey, frontendEventTypeId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSuccess(false);
        const result = await updateSettings(settings);

        if (result) {
            setSuccess(true);
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        }
    };

    const notificationTypes = [
        { id: "newEstimate", label: "New Estimate Request" },
        { id: "estimateAccepted", label: "Estimate Accepted" },
        { id: "jobComplete", label: "Job Complete" },
        { id: "paymentReceived", label: "Payment Received" },
        { id: "dailySummary", label: "Daily Summary" },
    ];

    return (
        <Box>
            <PageHeader title="Notification Settings" />

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
                            Notification settings updated successfully!
                        </Alert>
                    )}

                    <Typography variant="body1" paragraph>
                        Choose how you want to be notified about different
                        events:
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Notification</TableCell>
                                        <TableCell align="center">
                                            Email
                                        </TableCell>
                                        <TableCell align="center">
                                            SMS
                                        </TableCell>
                                        <TableCell align="center">
                                            App
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {notificationTypes.map((type) => {
                                        const currentSetting =
                                            getSettingForType(type.id);
                                        const emailEnabled = currentSetting
                                            ? currentSetting.emailEnabled
                                            : false;
                                        const smsEnabled = currentSetting
                                            ? currentSetting.smsEnabled
                                            : false;
                                        const appEnabled = currentSetting
                                            ? currentSetting.appEnabled
                                            : false;

                                        return (
                                            <TableRow key={type.id}>
                                                <TableCell
                                                    component="th"
                                                    scope="row"
                                                >
                                                    {type.label}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Switch
                                                        checked={emailEnabled}
                                                        onChange={() =>
                                                            handleToggle(
                                                                "emailEnabled",
                                                                type.id
                                                            )
                                                        }
                                                        color="primary"
                                                        disabled={
                                                            currentSetting ===
                                                            undefined
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Switch
                                                        checked={smsEnabled}
                                                        onChange={() =>
                                                            handleToggle(
                                                                "smsEnabled",
                                                                type.id
                                                            )
                                                        }
                                                        color="primary"
                                                        disabled={
                                                            currentSetting ===
                                                            undefined
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Switch
                                                        checked={appEnabled}
                                                        onChange={() =>
                                                            handleToggle(
                                                                "appEnabled",
                                                                type.id
                                                            )
                                                        }
                                                        color="primary"
                                                        disabled={
                                                            currentSetting ===
                                                            undefined
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                mt: 3,
                            }}
                        >
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Settings"}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            )}
        </Box>
    );
};

export default NotificationSettingsPage;
