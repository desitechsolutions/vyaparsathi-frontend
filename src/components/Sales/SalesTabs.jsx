import React, { useMemo } from 'react';
import { Tabs, Tab, Box, alpha } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';

const SalesTabs = ({ value, onChange }) => {
  const handleChange = useMemo(() => (e, newValue) => onChange(newValue), [onChange]);

  return (
    <Box sx={{
      borderBottom: '1px solid',
      borderColor: 'divider',
      bgcolor: alpha('#0f766e', 0.02),
    }}>
      <Tabs
        value={value}
        onChange={handleChange}
        centered
        sx={{
          minHeight: 48,
          '& .MuiTabs-indicator': {
            background: 'linear-gradient(90deg, #0f766e 0%, #14b8a6 100%)',
            height: 3,
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#64748b',
            transition: 'all 0.2s ease',
            minHeight: 48,
            py: 1,
            px: 2,
            '&:hover': {
              color: '#0f766e',
              bgcolor: alpha('#0f766e', 0.05),
            },
            '&.Mui-selected': {
              color: '#0f766e',
              fontWeight: 800,
            },
          },
        }}
      >
        <Tab
          label="Create Sale"
          icon={<LocalShippingIcon sx={{ fontSize: 18, mr: 0.5 }} />}
          iconPosition="start"
        />
        <Tab
          label="Sales History"
          icon={<HistoryIcon sx={{ fontSize: 18, mr: 0.5 }} />}
          iconPosition="start"
        />
      </Tabs>
    </Box>
  );
};

SalesTabs.Panel = ({ value, index, children, noPadding }) => {
  const isVisible = value === index;

  return (
    <div
      role="tabpanel"
      hidden={!isVisible}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      aria-hidden={!isVisible}
      style={{
        flex: 1,
        minHeight: 0,
        display: isVisible ? 'flex' : 'none',
        flexDirection: noPadding ? 'column' : 'block',
        overflow: noPadding ? 'hidden' : 'auto',
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: noPadding ? 'flex' : 'block',
          flexDirection: noPadding ? 'column' : 'unset',
          overflow: noPadding ? 'auto' : 'visible',
          p: noPadding ? 0 : 3,
          animation: isVisible ? 'fadeIn 0.2s ease-in' : 'none',
          '@keyframes fadeIn': {
            from: {
              opacity: 0,
            },
            to: {
              opacity: 1,
            },
          },
        }}
      >
        {children}
      </Box>
    </div>
  );
};

export default SalesTabs;