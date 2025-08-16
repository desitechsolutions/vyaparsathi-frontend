import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

const SalesTabs = ({ value, onChange }) => (
  <Tabs value={value} onChange={(e, newValue) => onChange(newValue)} centered>
    <Tab label="Create Sale" />
    <Tab label="Sales History" />
  </Tabs>
);

SalesTabs.Panel = ({ value, index, children }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

export default SalesTabs;