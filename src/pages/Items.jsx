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
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import { fetchItems, createItem } from '../services/api';

// A simple initial state for the form, helping to reset it easily.
const initialFormState = {
  sku: '',
  name: '',
  category: '',
  size: '',
  color: '',
  design: '',
  unit: '',
  pricePerUnit: '',
  hsn: '',
  gstRate: '',
  photoFile: null,
  photoPreviewUrl: null
};

// Reusable toolbar with a quick search box and an 'add' button.
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

// A custom styled component for the hidden file input.
// This is the standard and secure way to handle file uploads in HTML/React.
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

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
        const rows = res.data.flatMap(item =>
            (item.variants || []).map(variant => ({
            id: variant.id,
            name: item.name,
            description: item.description,
            ...variant,
            }))
        );
        setItems(rows);
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

  // Generic handler for all text input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler for file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, photoFile: file, photoPreviewUrl: previewUrl }));
    }
  };

  // Handle form submission for adding a new item
  const handleSubmit = async () => {
    // Basic validation to prevent submitting an empty form
    if (!formData.name || !formData.sku) {
      setError('SKU and Name are required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createItem(formData);
      setOpen(false);
      setFormData(initialFormState);
      // Revoke the object URL to free up memory
      if (formData.photoPreviewUrl) {
        URL.revokeObjectURL(formData.photoPreviewUrl);
      }
      // Reload items after successful submission
      loadItems();
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to create item. Please check your API service and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define columns for the DataGrid. Added new fields here.
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'sku', headerName: 'SKU', flex: 1, minWidth: 150 },
    { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 200 },
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 120 },
    { field: 'size', headerName: 'Size', width: 100 },
    { field: 'color', headerName: 'Color', width: 100 },
    { field: 'design', headerName: 'Design', flex: 1, minWidth: 120 },
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
              name="sku"
              value={formData.sku}
              onChange={handleFormChange}
              required
              fullWidth
            />
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              fullWidth
            />
            <TextField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Size"
              name="size"
              value={formData.size}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Color"
              name="color"
              value={formData.color}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Design"
              name="design"
              value={formData.design}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Price per Unit"
              name="pricePerUnit"
              type="number"
              value={formData.pricePerUnit}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="HSN"
              name="hsn"
              value={formData.hsn}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="GST Rate"
              name="gstRate"
              value={formData.gstRate}
              onChange={handleFormChange}
              fullWidth
            />

            {/* File Upload Section */}
            <Box sx={{ gridColumn: '1 / -1', mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                Upload Photo
                <VisuallyHiddenInput type="file" onChange={handleFileChange} />
              </Button>
              {/* Display the selected file name */}
              <TextField
                label="Selected Photo"
                value={formData.photoFile ? formData.photoFile.name : ''}
                InputProps={{
                  readOnly: true,
                }}
                fullWidth
              />
              {/* Image Preview */}
              {formData.photoPreviewUrl && (
                <Box
                  sx={{
                    mt: 2,
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={formData.photoPreviewUrl}
                    alt="Photo Preview"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Box>
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
