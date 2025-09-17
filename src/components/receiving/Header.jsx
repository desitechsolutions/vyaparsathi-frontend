import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';

const Header = ({ onBack, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
    {onBack && (
      <IconButton onClick={onBack} sx={{ mr: 2 }}>
        <ArrowBackOutlinedIcon />
      </IconButton>
    )}
    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
      {title}
    </Typography>
  </Box>
);

export default Header;