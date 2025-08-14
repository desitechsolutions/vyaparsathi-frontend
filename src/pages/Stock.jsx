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
import { fetchStock, addStock } from '../services/api';

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

// A simple initial state for the form, helping to reset it easily
const initialFormState = { itemId: '', quantity: '', batch: '' };

const Stock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState(null);

  // Function to load stock data from the API
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
      console.error('Stock fetch error:', err);
      setError('Failed to load stock items. Please check your API service.');
    } finally {
      setLoading(false);
    }
  };

  // Effect to load data on component mount
  useEffect(() => {
    loadStock();
  }, []);

  // Handle form submission for adding new stock
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await addStock(formData);
      setOpen(false);
      setFormData(initialFormState);
      // Reload stock after successful submission
      loadStock();
    } catch (err) {
      console.error('Error adding stock:', err);
      setError('Failed to add stock. Please check your API service and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { field: 'id', headerName: 'Item ID', width: 150 },
    { field: 'totalQuantity', headerName: 'Total Quantity', width: 150 },
    { field: 'batch', headerName: 'Batch', flex: 1, minWidth: 150 },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Stock Management
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
            rows={stock}
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
        maxWidth="xs"
      >
        <DialogTitle>Add Stock</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Item ID"
              value={formData.itemId}
              onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Batch"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              fullWidth
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
