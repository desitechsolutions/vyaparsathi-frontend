import React, { useMemo } from 'react';
import { Tabs, Tab, Box } from '@mui/material';

const SalesTabs = ({ value, onChange }) => {
  const handleChange = useMemo(() => (e, newValue) => onChange(newValue), [onChange]);

  return (
    <Box sx={{
      borderBottom: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      px: { xs: 1, md: 2 },
    }}>
      <Tabs
        value={value}
        onChange={handleChange}
        sx={{
          minHeight: 44,
          '& .MuiTabs-indicator': {
            bgcolor: 'primary.main',
            height: 2,
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'text.secondary',
            minHeight: 44,
            py: 1,
            px: 2,
            '&.Mui-selected': {
              color: 'text.primary',
              fontWeight: 600,
            },
          },
        }}
      >
        <Tab label="Create Sale" />
        <Tab label="Sales History" />
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