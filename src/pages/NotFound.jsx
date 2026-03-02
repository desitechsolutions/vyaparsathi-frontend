import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '70vh', 
        textAlign: 'center', 
        p: 3 
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 100, color: 'primary.light', mb: 2, opacity: 0.5 }} />
      
      <Typography variant="h2" fontWeight="800" color="primary" gutterBottom>
        404
      </Typography>
      
      <Typography variant="h5" fontWeight="600" gutterBottom>
        Lost in the Clouds?
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 450, mb: 4 }}>
        We couldn't find the page you're looking for. It might have been moved, 
        or the URL might have a small typo.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)} // Takes them exactly where they came from
          sx={{ borderRadius: '8px', px: 3 }}
        >
          Go Back
        </Button>
        
        <Button 
          variant="contained" 
          startIcon={<HomeIcon />} 
          onClick={() => navigate('/dashboard')}
          sx={{ borderRadius: '8px', px: 3, boxShadow: 3 }}
        >
          Dashboard
        </Button>
      </Stack>
    </Box>
  );
};

export default NotFound; // THIS IS CRUCIAL