import React, { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

const initialFormState = { itemVariantId: '', quantity: '', batch: '' };

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
      const res = await fetchItemVariants(); // Should return id, itemName, sku, color, size, unit
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
    if (!formData.itemVariantId || !formData.quantity) {
      setError('Please select item and enter quantity.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addStock({
        itemVariantId: formData.itemVariantId,
        quantity: parseFloat(formData.quantity),
        batch: formData.batch || null,
      });
      setOpen(false);
      setFormData(initialFormState);
      loadStock();
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to add stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { field: 'itemName', headerName: 'Item Name', width: 180 },
    { field: 'sku', headerName: 'SKU', width: 120 },
    { field: 'unit', headerName: 'Unit', width: 80 },
    { field: 'color', headerName: 'Color', width: 100 },
    { field: 'size', headerName: 'Size', width: 100 },
    { field: 'design', headerName: 'Design', width: 120 },
    { field: 'totalQuantity', headerName: 'Total Qty', width: 100 },
    { field: 'batch', headerName: 'Batch', width: 120 },
    { field: 'pricePerUnit', headerName: 'Price/Unit', width: 120 },
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
          />
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Stock</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Item Variant</InputLabel>
              <Select
                value={formData.itemVariantId}
                onChange={(e) =>
                  setFormData({ ...formData, itemVariantId: e.target.value })
                }
                required
              >
                {itemVariants.map((variant) => (
                  <MenuItem key={variant.id} value={variant.id}>
                    {variant.itemName} | {variant.sku} | {variant.color} | {variant.size} | {variant.unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />

            <TextField
              label="Batch"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={20} />}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Stock;
