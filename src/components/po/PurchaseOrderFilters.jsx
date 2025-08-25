import React from 'react';
import { TextField, Button, Autocomplete, FormControl, InputLabel, Select, MenuItem, Stack } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const PurchaseOrderFilters = ({ search, setSearch, allSuppliers, onAddNew }) => {
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearch((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      alignItems="center"
      justifyContent="space-between" // Distribute space evenly
      width="100%"
      sx={{ mt: 1, mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, flexWrap: 'wrap' }} // Allow wrapping
    >
      <TextField
        label="Search PO Number"
        name="poNumber"
        value={search.poNumber}
        onChange={handleSearchChange}
        size="small"
        variant="outlined"
        fullWidth
        sx={{ flex: '1 1 auto', maxWidth: '250px' }} // Limit width but allow flexibility
      />
      <Autocomplete
        options={allSuppliers}
        value={allSuppliers.find((s) => String(s.id) === String(search.supplierId)) || null}
        getOptionLabel={(option) => option?.name || ''}
        isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
        onChange={(_, value) => setSearch((prev) => ({ ...prev, supplierId: value ? String(value.id) : '' }))}
        renderInput={(params) => <TextField {...params} label="Supplier" size="small" />}
        sx={{ flex: '1 1 auto', maxWidth: '250px' }} // Limit width but allow flexibility
      />
      <FormControl size="small" sx={{ flex: '1 1 auto', maxWidth: '200px' }}>
        <InputLabel>Status</InputLabel>
        <Select
          label="Status"
          name="status"
          value={search.status}
          onChange={handleSearchChange}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Received">Received</MenuItem>
          <MenuItem value="Cancelled">Cancelled</MenuItem>
        </Select>
      </FormControl>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddNew}
        sx={{ 
          whiteSpace: 'nowrap', 
          minWidth: '150px', // Increased width
          flexShrink: 0, // Prevent shrinking
          height: '40px' // Consistent height
        }}
      >
        New PO
      </Button>
    </Stack>
  );
};

export default PurchaseOrderFilters;