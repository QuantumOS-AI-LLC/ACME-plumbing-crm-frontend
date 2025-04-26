import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme, bgcolor, height = '120px' }) => ({
  background: bgcolor || 'linear-gradient(45deg, #8A2BE2 0%, #9D4EE9 100%)',
  borderRadius: '10px',
  height,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  }
}));

const GradientCard = ({ 
  icon, 
  title, 
  bgcolor, 
  height,
  onClick,
  orientation = 'vertical' // vertical or horizontal
}) => {
  return (
    <StyledCard bgcolor={bgcolor} height={height} onClick={onClick}>
      <CardContent sx={{ 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        alignItems: 'center',
        p: orientation === 'vertical' ? 2 : '12px !important', // Override MUI's padding
      }}>
        {icon}
        <Typography 
          variant="h6" 
          sx={{ 
            ml: orientation === 'horizontal' ? 1 : 0,
            mt: orientation === 'vertical' ? 1 : 0
          }}
        >
          {title}
        </Typography>
      </CardContent>
    </StyledCard>
  );
};

export default GradientCard;
