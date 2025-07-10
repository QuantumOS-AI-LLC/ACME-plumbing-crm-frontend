import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    Chip,
    TextField
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideoCallIcon from '@mui/icons-material/VideoCall';

const CallDurationSelector = ({
    open,
    onClose,
    onCreateCall,
    contactName,
    loading = false
}) => {
    const [selectedDuration, setSelectedDuration] = useState(30);
    const [customDuration, setCustomDuration] = useState('');

    const durationOptions = [
        { value: 15, label: '15 minutes', description: 'Quick consultation' },
        { value: 30, label: '30 minutes', description: 'Standard call' },
        { value: 45, label: '45 minutes', description: 'Extended discussion' },
        { value: 60, label: '60 minutes', description: 'Full consultation' },
        { value: 'custom', label: 'Custom', description: 'Set a specific duration' }
    ];

    const handleDurationChange = (event) => {
        const value = event.target.value;
        setSelectedDuration(value);
        if (value !== 'custom') {
            setCustomDuration('');
        }
    };

    const handleCustomDurationChange = (event) => {
        setCustomDuration(event.target.value);
    };

    const handleCreateCall = () => {
        const duration = selectedDuration === 'custom' ? parseInt(customDuration, 10) : selectedDuration;
        if (duration > 0) {
            onCreateCall(duration);
        }
    };

    const selectedOption = durationOptions.find(option => option.value === selectedDuration);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }
            }}
        >
            <DialogTitle sx={{ 
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
            }}>
                <Box
                    sx={{
                        p: 1,
                        borderRadius: '50%',
                        backgroundColor: 'success.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <VideoCallIcon />
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Create Video Call
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        for {contactName}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                        Select call duration:
                    </Typography>
                    
                    <FormControl fullWidth>
                        <InputLabel id="duration-select-label">Duration</InputLabel>
                        <Select
                            labelId="duration-select-label"
                            value={selectedDuration}
                            label="Duration"
                            onChange={handleDurationChange}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        >
                            {durationOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        width: '100%'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTimeIcon 
                                                sx={{ 
                                                    fontSize: 18, 
                                                    color: 'primary.main' 
                                                }} 
                                            />
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {option.label}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {option.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedDuration === 'custom' && (
                        <TextField
                            label="Custom Duration (minutes)"
                            type="number"
                            value={customDuration}
                            onChange={handleCustomDurationChange}
                            fullWidth
                            margin="normal"
                            sx={{ mt: 2 }}
                        />
                    )}
                </Box>

                {selectedOption && (
                    <Box
                        sx={{
                            p: 2,
                            backgroundColor: 'success.50',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'success.200'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 18, color: 'success.main' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                                Call Duration: {selectedDuration === 'custom' ? `${customDuration} minutes` : selectedOption.label}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {selectedOption.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label="Auto-expires after duration"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                            />
                            <Chip
                                label="5-minute warning"
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                            />
                            <Chip
                                label="Secure guest link"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                            />
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button 
                    onClick={onClose}
                    sx={{ 
                        borderRadius: 2,
                        px: 3
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleCreateCall}
                    variant="contained"
                    color="success"
                    disabled={loading}
                    startIcon={<VideoCallIcon />}
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                    }}
                >
                    {loading ? 'Creating Call...' : 'Create Video Call'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CallDurationSelector;
