import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const ScheduleItem = ({ title, time, color = 'primary', onClick }) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:last-child': {
          borderBottom: 'none',
        },
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FiberManualRecordIcon sx={{ fontSize: 12, color, mr: 1.5 }} />
        <Typography variant="body2">{title}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">{time}</Typography>
    </Box>
  );
};

export default ScheduleItem;
