import React, { useState, useEffect, useMemo } from 'react';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Box,
  Typography,
  Container,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { fetchStock, addStock, fetchItemVariants } from '../services/api';

// Reusable toolbar with a quick search box and a title
const CustomToolbar = ({ onAddClick }) => {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        Stock Items
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <GridToolbarQuickFilter placeholder="Search stock..." />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddClick}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          Add Stock
        </Button>
        <IconButton
          color="primary"
          onClick={onAddClick}
          sx={{ display: { xs: 'flex', md: 'none' } }}
        >
          <AddIcon />
        </IconButton>
      </Box>
    </GridToolbarContainer>
  );
};

// 1. Add costPerUnit to the initial form state
const initialFormState = { itemVariantId: '', quantity: '', batch: '', costPerUnit: '' };

const Stock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState(null);
  const [itemVariants, setItemVariants] = useState([]);

  // Load current stock
  const loadStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchStock();
      if (Array.isArray(res.data)) {
        setStock(res.data.map(item => ({ ...item, id: item.itemVariantId })));
      } else {
        throw new Error('API response is not an array.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load stock items.');
    } finally {
      setLoading(false);
    }
  };

  // Load item variants for dropdown
  const loadItemVariants = async () => {
    try {
      const res = await fetchItemVariants();
      setItemVariants(res.data);
    } catch (err) {
      console.error('Failed to load item variants', err);
    }
  };

  useEffect(() => {
    loadStock();
    loadItemVariants();
  }, []);

  // Submit add stock
  const handleSubmit = async () => {
    // 2. Add validation for costPerUnit
    if (!formData.itemVariantId || !formData.quantity || !formData.costPerUnit) {
      setError('Please select an item and enter both Quantity and Cost Per Unit.');
      return;
    }
    setIsSubmitting(true);
    try {
      // 3. Send the complete DTO including costPerUnit
      await addStock({
        itemVariantId: formData.itemVariantId,
        quantity: parseFloat(formData.quantity),
        costPerUnit: parseFloat(formData.costPerUnit),
        batch: formData.batch || null,
      });
      setOpen(false);
      setFormData(initialFormState);
      loadStock();
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to add stock. Please check the values and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Memoize the selected variant to avoid re-calculating on every render
  const selectedVariant = useMemo(() => {
    return itemVariants.find(v => v.id === formData.itemVariantId);
  }, [formData.itemVariantId, itemVariants]);

  const columns = [
    { field: 'itemName', headerName: 'Item Name', flex: 1.5, minWidth: 200 },
    { field: 'sku', headerName: 'SKU', flex: 1, minWidth: 120 },
    { field: 'color', headerName: 'Color', flex: 0.8, minWidth: 100 },
    { field: 'size', headerName: 'Size', flex: 0.8, minWidth: 100 },
    { field: 'totalQuantity', headerName: 'Total Qty', flex: 0.8, minWidth: 100, type: 'number' },
    { field: 'unit', headerName: 'Unit', flex: 0.7, minWidth: 80 },
    { field: 'pricePerUnit', headerName: 'Selling Price', flex: 1, minWidth: 120, type: 'number',
      valueFormatter: (params) => `₹${params.value.toFixed(2)}`
    },
    { field: 'batch', headerName: 'Last Batch', flex: 1, minWidth: 120 },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Stock Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: '70vh', width: '100%' }}>
          <DataGrid
            rows={stock}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            slots={{ toolbar: CustomToolbar }}
            slotProps={{ toolbar: { onAddClick: () => setOpen(true) } }}
            sx={{ border: 0 }}
          />
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Stock</DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ display: 'grid', gap: 3, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Item Variant</InputLabel>
              <Select
                value={formData.itemVariantId}
                onChange={(e) =>
                  setFormData({ ...formData, itemVariantId: e.target.value })
                }
              >
                {itemVariants.map((variant) => (
                  <MenuItem key={variant.id} value={variant.id}>
                    {`${variant.itemName} (${variant.color}, ${variant.size}) - SKU: ${variant.sku}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 5. UX Improvement: Show the selling price for context */}
            {selectedVariant && (
              <TextField
                label="Current Selling Price"
                value={selectedVariant.pricePerUnit.toFixed(2)}
                InputProps={{
                  readOnly: true,
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="This is the current selling price for this item, for your reference.">
                        <InfoOutlinedIcon color="action" />
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
                variant="filled"
                fullWidth
              />
            )}

            {/* 6. Add the Cost Per Unit text field */}
            <TextField
              label="Cost Per Unit (Purchase Price)"
              type="number"
              value={formData.costPerUnit}
              onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
              required
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0 }
              }}
            />

            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              fullWidth
              InputProps={{ inputProps: { min: 0 } }}
            />

            <TextField
              label="Batch / Lot Number (Optional)"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={20} />}
          >
            {isSubmitting ? 'Saving...' : 'Save Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Stock;