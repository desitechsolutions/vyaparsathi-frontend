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
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// This code assumes you have the following files and functions.
import { fetchItems, createItem } from '../services/api';

// A simple initial state for the form, helping to reset it easily
const initialFormState = {
  sku: '',
  name: '',
  unit: '',
  pricePerUnit: '',
  hsn: '',
  gstRate: '',
  photoPath: ''
};

// Reusable toolbar with a quick search box and a title
const CustomToolbar = ({ onAddClick }) => {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        Items
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <GridToolbarQuickFilter placeholder="Search items..." />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddClick}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          Add Item
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

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState(null);

  // Function to load item data from the API
  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchItems();
      // Ensure res.data is an array before mapping
      if (Array.isArray(res.data)) {
        setItems(res.data.map(item => ({ ...item, id: item.itemId })));
      } else {
        throw new Error('API response is not an array.');
      }
    } catch (err) {
      console.error('Items fetch error:', err);
      setError('Failed to load items. Please check your API service.');
    } finally {
      setLoading(false);
    }
  };

  // Effect to load data on component mount
  useEffect(() => {
    loadItems();
  }, []);

  // Handle form submission for adding a new item
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createItem(formData);
      setOpen(false);
      setFormData(initialFormState);
      // Reload items after successful submission
      loadItems();
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to create item. Please check your API service and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define columns for the DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'sku', headerName: 'SKU', flex: 1, minWidth: 150 },
    { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 200 },
    { field: 'unit', headerName: 'Unit', width: 100 },
    { field: 'pricePerUnit', headerName: 'Price', type: 'number', width: 120 },
    { field: 'hsn', headerName: 'HSN', width: 100 },
    { field: 'gstRate', headerName: 'GST Rate', width: 100 },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Item Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100vh - 200px)'
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: '75vh', width: '100%', '& .MuiDataGrid-cell--textCenter': { textAlign: 'center' } }}>
          <DataGrid
            rows={items}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            slots={{
              toolbar: CustomToolbar,
            }}
            slotProps={{
              toolbar: { onAddClick: () => setOpen(true) },
            }}
            sx={{
              boxShadow: 2,
              border: 1,
              borderColor: 'divider',
              '& .MuiDataGrid-cell:hover': {
                color: 'primary.main',
              },
            }}
          />
        </Box>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              fullWidth
            />
            <TextField
              label="Price per Unit"
              type="number"
              value={formData.pricePerUnit}
              onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
              fullWidth
            />
            <TextField
              label="HSN"
              value={formData.hsn}
              onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
              fullWidth
            />
            <TextField
              label="GST Rate"
              value={formData.gstRate}
              onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
              fullWidth
            />
            <TextField
              label="Photo Path"
              value={formData.photoPath}
              onChange={(e) => setFormData({ ...formData, photoPath: e.target.value })}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
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

export default Items;
