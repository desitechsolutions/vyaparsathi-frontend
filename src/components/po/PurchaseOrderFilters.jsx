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
      justifyContent="space-between"
      width="100%"
      sx={{ mt: 1, mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, flexWrap: 'wrap' }}
    >
      <TextField
        label="Search PO Number"
        name="poNumber"
        value={search.poNumber}
        onChange={handleSearchChange}
        size="small"
        variant="outlined"
        sx={{ flex: '1 1 200px', minWidth: '180px' }}
      />
      <Autocomplete
        options={allSuppliers}
        value={allSuppliers.find((s) => s.id === search.supplierId) || null}
        getOptionLabel={(option) => option?.name || ''}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        onChange={(_, value) => setSearch((prev) => ({ ...prev, supplierId: value ? value.id : '' }))}
        renderInput={(params) => <TextField {...params} label="Supplier" size="small" />}
        sx={{ flex: '1 1 200px', minWidth: '180px' }}
      />
      <FormControl size="small" sx={{ flex: '1 1 150px', minWidth: '120px' }}>
        <InputLabel>Status</InputLabel>
        <Select
          label="Status"
          name="status"
          value={search.status}
          onChange={handleSearchChange}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="DRAFT">Draft</MenuItem>
          <MenuItem value="SUBMITTED">Submitted</MenuItem>
          <MenuItem value="PARTIALLY_RECEIVED">Partially Received</MenuItem>
          <MenuItem value="RECEIVED">Received</MenuItem>
          <MenuItem value="CANCELLED">Cancelled</MenuItem>
        </Select>
      </FormControl>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddNew}
        sx={{ 
          whiteSpace: 'nowrap', 
          flexShrink: 0,
          height: '40px'
        }}
      >
        New PO
      </Button>
    </Stack>
  );
};

export default PurchaseOrderFilters;