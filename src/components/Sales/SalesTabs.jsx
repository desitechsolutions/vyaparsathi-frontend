import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

const SalesTabs = ({ value, onChange }) => (
  <Tabs value={value} onChange={(e, newValue) => onChange(newValue)} centered>
    <Tab label="Create Sale" />
    <Tab label="Sales History" />
  </Tabs>
);

SalesTabs.Panel = ({ value, index, children, noPadding }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    style={noPadding
      ? { flex: 1, minHeight: 0, display: value === index ? 'flex' : 'none', flexDirection: 'column' }
      : { flex: 1, minHeight: 0, overflow: 'auto', display: value === index ? 'block' : 'none' }}
  >
    <Box sx={noPadding ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' } : { p: 3 }}>{children}</Box>
  </div>
);

export default SalesTabs;