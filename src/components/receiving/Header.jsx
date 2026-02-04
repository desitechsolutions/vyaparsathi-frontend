import React from 'react';
import { Box, Typography, IconButton, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';

/**
 * Professional Header Component
 * @param {Function} onBack - Callback for the back button
 * @param {String} title - Main page title
 * @param {React.ReactNode} children - Optional action buttons/elements for the right side
 * @param {String} subtitle - Optional secondary text below title
 */
const Header = ({ onBack, title, children, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      component="header" 
      sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center', 
        justifyContent: 'space-between',
        mb: { xs: 3, md: 5 },
        gap: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {onBack && (
          <Tooltip title="Go Back" arrow>
            <IconButton 
              onClick={onBack} 
              sx={{ 
                mr: { xs: 1, md: 2 },
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { bgcolor: 'primary.light', color: 'white' }
              }}
              aria-label="back"
            >
              <ArrowBackOutlinedIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}
        
        <Box>
          <Typography 
            variant={isMobile ? 'h5' : 'h4'} 
            component="h1" 
            sx={{ 
              fontWeight: 800, 
              color: 'text.primary',
              letterSpacing: '-0.5px',
              lineHeight: 1.2
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Action Slot: Place for buttons like "Add New", "Save", etc. */}
      {children && (
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5, 
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'flex-start' : 'flex-end'
        }}>
          {children}
        </Box>
      )}
    </Box>
  );
};

export default Header;