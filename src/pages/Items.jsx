import React, { useState, useEffect } from 'react';
// @mui/x-data-grid અને અન્ય જરૂરી લાઇબ્રેરીઓને યોગ્ય રીતે ચલાવવા માટે CDN linksનો ઉપયોગ કરવામાં આવ્યો છે.
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter
} from 'https://cdn.jsdelivr.net/npm/@mui/x-data-grid@7.10.2/build/index.js';
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
  Autocomplete,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  DialogContentText,
  Tooltip,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/system';

// આ એન્વાયર્નમેન્ટમાં તમારી api.js અને constants.js ફાઇલો ઉપલબ્ધ ન હોવાથી,
// અહીં ડેમોન્સ્ટ્રેશન માટે મોક ડેટા અને ફંક્શન્સનો ઉપયોગ કરવામાં આવ્યો છે.
// જ્યારે તમે તમારા પ્રોજેક્ટમાં આ કોડનો ઉપયોગ કરો, ત્યારે આ મોક કોડને તમારી
// વાસ્તવિક ફાઇલોના imports સાથે બદલી શકો છો.

// Mock API calls for demonstration purposes.
const fetchItems = async () => {
  console.log('Fetching items from API...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    data: [
      {
        id: 'item1',
        name: 'Classic T-Shirt',
        description: 'A comfortable cotton T-shirt.',
        category: 'Men - Tops - T-Shirts',
        brandName: 'BrandA',
        variants: [
          { id: 1, sku: 'TSHIRT-S-BLK', unit: 'piece', pricePerUnit: 15.00, gstRate: '12%', color: 'Black', size: 'S', design: 'Solid', photoUrl: 'https://placehold.co/100x100/A0A0A0/ffffff?text=TS' },
          { id: 2, sku: 'TSHIRT-M-BLK', unit: 'piece', pricePerUnit: 15.00, gstRate: '12%', color: 'Black', size: 'M', design: 'Solid', photoUrl: 'https://placehold.co/100x100/A0A0A0/ffffff?text=TS' },
        ]
      },
      {
        id: 'item2',
        name: 'Leather Wallet',
        description: 'A premium leather wallet.',
        category: 'Accessories - Wallets',
        brandName: 'BrandB',
        variants: [
          { id: 3, sku: 'WALLET-BRN', unit: 'piece', pricePerUnit: 50.00, gstRate: '18%', color: 'Brown', size: 'One Size', design: 'Textured', photoUrl: 'https://placehold.co/100x100/8B4513/ffffff?text=Wallet' }
        ]
      }
    ]
  };
};

const createItem = async (formData) => {
  console.log('Creating item with data:', Object.fromEntries(formData.entries()));
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true };
};

const updateItem = async (itemId, formData) => {
  console.log(`Updating item ${itemId} with data:`, Object.fromEntries(formData.entries()));
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true };
};

const deleteItemVariant = async (variantId) => {
  console.log(`Deleting variant ${variantId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

const getItemById = async (itemId) => {
  console.log(`Fetching item ${itemId}`);
  await new Promise(resolve => setTimeout(resolve, 750));
  // This is a simplified mock. In a real app, this would get a single item.
  const allItems = (await fetchItems()).data;
  const item = allItems.find(item => item.id === itemId);
  return item;
};

// Mock constants for the Autocomplete options.
const clothingCategories = {
  Men: {
    Tops: ['T-Shirts', 'Shirts', 'Hoodies'],
    Bottoms: ['Jeans', 'Trousers'],
  },
  Women: {
    Tops: ['Blouses', 'Sweaters'],
    Bottoms: ['Skirts', 'Leggings'],
  },
};
const clothingSizes = {
  Tops: ['S', 'M', 'L', 'XL'],
  Bottoms: ['28', '30', '32', '34'],
};
const clothingColors = ['Black', 'White', 'Blue', 'Red', 'Green'];
const clothingDesigns = {
  Tops: ['Solid', 'Striped', 'Graphic Print'],
  Bottoms: ['Distressed', 'Plain', 'Textured'],
};
const clothingUnits = ['piece', 'dozen', 'meter', 'kg'];

// Styled component for a hidden file input
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

// Utility function to flatten nested constant objects for Autocomplete options
const flattenOptions = (options) => {
  const flattened = [];
  if (Array.isArray(options)) {
    return options;
  }
  for (const key in options) {
    if (Array.isArray(options[key])) {
      options[key].forEach(val => flattened.push(val));
    } else {
      for (const subKey in options[key]) {
        options[key][subKey].forEach(val => flattened.push(`${key} - ${subKey} - ${val}`));
      }
    }
  }
  return [...new Set(flattened)];
};

// Reusable toolbar with a quick search box and an 'add' button.
const CustomToolbar = ({ onAddItemClick }) => (
  <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 1 }}>
    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
      Items
    </Typography>
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <GridToolbarQuickFilter placeholder="Search items..." />
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddItemClick}
        sx={{ display: { xs: 'none', md: 'flex' } }}
      >
        Add Item
      </Button>
      <IconButton
        color="primary"
        onClick={onAddItemClick}
        sx={{ display: { xs: 'flex', md: 'none' } }}
      >
        <AddIcon />
      </IconButton>
    </Box>
  </GridToolbarContainer>
);

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [step, setStep] = useState(0);
  const [itemFormData, setItemFormData] = useState({ name: '', description: '', category: '', brandName: '' });
  const [variantList, setVariantList] = useState([]);
  const [currentVariant, setCurrentVariant] = useState({ sku: '', unit: '', pricePerUnit: '', size: '', color: '', design: '', gstRate: '', photoFile: null, photoPreviewUrl: null });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);

  // Load items from API
  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchItems();
      if (Array.isArray(res.data)) {
        const rows = res.data.flatMap(item =>
          (item.variants || []).map(variant => ({
            id: variant.id,
            itemId: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            brandName: item.brandName,
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

  useEffect(() => {
    loadItems();
  }, []);

  // Generic handler for all text input changes
  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemFormData(prev => ({ ...prev, [name]: value }));
    setDialogError(null);
  };

  // Generic handler for all variant input changes
  const handleCurrentVariantChange = (e) => {
    const { name, value } = e.target;
    setCurrentVariant(prev => ({ ...prev, [name]: value }));
    setDialogError(null);
  };

  // Handle file upload for current variant
  const handleCurrentVariantFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCurrentVariant(prev => ({ ...prev, photoFile: file, photoPreviewUrl: previewUrl }));
    }
    setDialogError(null);
  };

  // Add current variant to the list
  const addVariantToList = () => {
    if (!currentVariant.unit || !currentVariant.pricePerUnit || !currentVariant.sku) {
      setDialogError('SKU, Unit and Price per Unit are required for each variant.');
      return;
    }
    setVariantList(prev => [...prev, { ...currentVariant, id: prev.length + 1 }]);
    setCurrentVariant({ sku: '', unit: '', pricePerUnit: '', size: '', color: '', design: '', gstRate: '', photoFile: null, photoPreviewUrl: null });
    setDialogError(null);
  };

  // Handle multi-step form submission (Add)
  const handleMultiStepSubmit = async () => {
    if (!itemFormData.name || !itemFormData.category || variantList.length === 0) {
      setDialogError('Item name, category, and at least one variant are required.');
      return;
    }
    setIsSubmitting(true);
    setDialogError(null);
    try {
      const formData = new FormData();
      formData.append('itemDto', new Blob([JSON.stringify(itemFormData)], { type: 'application/json' }));
      variantList.forEach((variant, index) => {
        // Exclude photoFile and photoPreviewUrl from the DTO
        const { photoFile, photoPreviewUrl, ...variantDto } = variant;
        formData.append('variantDtoList', new Blob([JSON.stringify(variantDto)], { type: 'application/json' }));
        if (photoFile) formData.append('photos', photoFile, `variant_${index}_${photoFile.name}`);
      });
      await createItem(formData);
      handleDialogClose();
      loadItems();
    } catch (err) {
      console.error('Error creating item and variants:', err);
      setDialogError('Failed to create item and variants. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle multi-step form update (Edit)
  const handleMultiStepUpdate = async () => {
    if (!itemFormData.name || !itemFormData.category || variantList.length === 0) {
      setDialogError('Item name, category, and at least one variant are required.');
      return;
    }
    setIsSubmitting(true);
    setDialogError(null);
    try {
      const formData = new FormData();
      formData.append('itemDto', new Blob([JSON.stringify(itemFormData)], { type: 'application/json' }));
      variantList.forEach((variant, index) => {
        const { photoFile, photoPreviewUrl, ...variantDto } = variant;
        formData.append('variantDtoList', new Blob([JSON.stringify(variantDto)], { type: 'application/json' }));
        if (photoFile) formData.append('photos', photoFile, `variant_${index}_${photoFile.name}`);
      });
      await updateItem(selectedItemId, formData);
      handleDialogClose();
      loadItems();
    } catch (err) {
      console.error('Error updating item and variants:', err);
      setDialogError('Failed to update item and variants. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit item
  const handleEditItem = async (itemId) => {
    try {
      const item = await getItemById(itemId);
      if (item) {
        setItemFormData({
          name: item.name || '',
          description: item.description || '',
          category: item.category || '',
          brandName: item.brandName || '',
        });
        setVariantList(item.variants || []);
        setCurrentVariant({ sku: '', unit: '', pricePerUnit: '', size: '', color: '', design: '', gstRate: '', photoFile: null, photoPreviewUrl: null });
        setSelectedItemId(itemId);
        setOpenEditDialog(true);
        setStep(0);
        setDialogError(null);
      } else {
        throw new Error('Item not found.');
      }
    } catch (err) {
      console.error('Edit item error:', err);
      setError('Failed to load item for editing.');
    }
  };

  // Handle deletion of a variant
  const handleDeleteVariant = (variantId) => {
    setSelectedVariantId(variantId);
    setOpenDeleteConfirm(true);
  };

  // Final delete action from confirmation dialog
  const confirmDeleteVariant = async () => {
    setOpenDeleteConfirm(false);
    setError(null);
    try {
      await deleteItemVariant(selectedVariantId);
      loadItems();
    } catch (err) {
      console.error('Delete variant error:', err);
      setError('Failed to delete variant.');
    }
  };

  // Define columns for DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 200 },
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 120 },
    { field: 'brandName', headerName: 'Brand', flex: 1, minWidth: 120 },
    { field: 'sku', headerName: 'SKU', flex: 1, minWidth: 150 },
    { field: 'size', headerName: 'Size', width: 100 },
    { field: 'color', headerName: 'Color', width: 100 },
    { field: 'design', headerName: 'Design', flex: 1, minWidth: 120 },
    { field: 'unit', headerName: 'Unit', width: 100 },
    { field: 'pricePerUnit', headerName: 'Price', type: 'number', width: 120 },
    { field: 'gstRate', headerName: 'GST Rate', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
          <Tooltip title="Edit Item">
            <IconButton color="primary" onClick={() => handleEditItem(params.row.itemId)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Variant">
            <IconButton color="error" onClick={() => handleDeleteVariant(params.row.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  // Helper function to reset all dialog states
  const handleDialogClose = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setStep(0);
    setItemFormData({ name: '', description: '', category: '', brandName: '' });
    setVariantList([]);
    setCurrentVariant({ sku: '', unit: '', pricePerUnit: '', size: '', color: '', design: '', gstRate: '', photoFile: null, photoPreviewUrl: null });
    setDialogError(null);
  };

  // Steps for the multi-step dialog
  const steps = ['Item Details', 'Add Variants', 'Review & Save'];

  const getStepContent = (step) => {
    return (
      <Box>
        {dialogError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDialogError(null)}>
            {dialogError}
          </Alert>
        )}
        {step === 0 && (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField
              label="Name"
              name="name"
              value={itemFormData.name}
              onChange={handleItemFormChange}
              required
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={itemFormData.description}
              onChange={handleItemFormChange}
              fullWidth
            />
            <Autocomplete
              freeSolo
              options={flattenOptions(clothingCategories)}
              value={itemFormData.category || ''}
              onChange={(e, newValue) => setItemFormData({ ...itemFormData, category: newValue || '' })}
              renderInput={(params) => <TextField {...params} label="Category" required />}
            />
            <TextField
              label="Brand Name"
              name="brandName"
              value={itemFormData.brandName}
              onChange={handleItemFormChange}
              fullWidth
            />
          </Box>
        )}
        {step === 1 && (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField
              label="SKU"
              name="sku"
              value={currentVariant.sku}
              onChange={handleCurrentVariantChange}
              required
              fullWidth
            />
            <Autocomplete
              freeSolo
              options={flattenOptions(clothingSizes)}
              value={currentVariant.size || ''}
              onChange={(e, newValue) => setCurrentVariant({ ...currentVariant, size: newValue || '' })}
              renderInput={(params) => <TextField {...params} label="Size" />}
            />
            <Autocomplete
              freeSolo
              options={clothingColors}
              value={currentVariant.color || ''}
              onChange={(e, newValue) => setCurrentVariant({ ...currentVariant, color: newValue || '' })}
              renderInput={(params) => <TextField {...params} label="Color" />}
            />
            <Autocomplete
              freeSolo
              options={flattenOptions(clothingDesigns)}
              value={currentVariant.design || ''}
              onChange={(e, newValue) => setCurrentVariant({ ...currentVariant, design: newValue || '' })}
              renderInput={(params) => <TextField {...params} label="Design" />}
            />
            <Autocomplete
              freeSolo
              options={clothingUnits}
              value={currentVariant.unit || ''}
              onChange={(e, newValue) => setCurrentVariant({ ...currentVariant, unit: newValue || '' })}
              renderInput={(params) => <TextField {...params} label="Unit" required />}
            />
            <TextField
              label="Price per Unit"
              name="pricePerUnit"
              type="number"
              value={currentVariant.pricePerUnit || ''}
              onChange={handleCurrentVariantChange}
              required
              fullWidth
            />
            <TextField
              label="GST Rate"
              name="gstRate"
              type="number"
              value={currentVariant.gstRate || ''}
              onChange={handleCurrentVariantChange}
              fullWidth
            />
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
                <VisuallyHiddenInput type="file" onChange={handleCurrentVariantFileChange} />
              </Button>
              {currentVariant.photoPreviewUrl && (
                <Box sx={{ mt: 2, border: '1px solid #ccc', borderRadius: '8px', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={currentVariant.photoPreviewUrl}
                    alt="Photo Preview"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Box>
            <Button variant="contained" onClick={addVariantToList} sx={{ gridColumn: '1 / -1' }}>
              Add Variant to List
            </Button>
            {variantList.length > 0 && (
              <Paper elevation={2} sx={{ mt: 2, p: 2 }}>
                <Typography variant="h6" gutterBottom>Added Variants</Typography>
                <List dense>
                  {variantList.map((variant, index) => (
                    <ListItem key={variant.id || index} disablePadding>
                      <ListItemText
                        primary={`Variant ${index + 1}: SKU - ${variant.sku}, Price - ₹${variant.pricePerUnit}`}
                        secondary={`Size: ${variant.size || 'N/A'}, Color: ${variant.color || 'N/A'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        )}
        {step === 2 && (
          <Box>
            <Typography variant="h6">Review Item and Variants</Typography>
            <Typography variant="body1">Item Name: {itemFormData.name}</Typography>
            <Typography variant="body1">Category: {itemFormData.category}</Typography>
            <Typography variant="body1">Brand: {itemFormData.brandName}</Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>Variants:</Typography>
            <List>
              {variantList.map((variant, index) => (
                <ListItem key={variant.id || index}>
                  <ListItemText
                    primary={`Variant ${index + 1}: SKU - ${variant.sku}, Unit - ${variant.unit}, Price - ₹${variant.pricePerUnit}, GST - ${variant.gstRate}`}
                    secondary={`Size: ${variant.size || 'N/A'}, Color: ${variant.color || 'N/A'}, Design: ${variant.design || 'N/A'}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  const handleNext = () => {
    setDialogError(null);
    if (step === 0) {
      if (!itemFormData.name || !itemFormData.category) {
        setDialogError('Name and Category are required fields.');
        return;
      }
    } else if (step === 1) {
      if (variantList.length === 0) {
        setDialogError('At least one variant is required.');
        return;
      }
    }
    setStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setStep((prevActiveStep) => prevActiveStep - 1);
    setDialogError(null);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3} sx={{ height: '75vh', width: '100%' }}>
          <DataGrid
            rows={items}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            slots={{ toolbar: CustomToolbar }}
            slotProps={{ toolbar: { onAddItemClick: () => { handleDialogClose(); setOpenAddDialog(true); } } }}
            sx={{ boxShadow: 0, border: 0 }}
          />
        </Paper>
      )}

      {/* Multi-Step Add Dialog */}
      <Dialog open={openAddDialog} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle>Add Item and Variants</DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {getStepContent(step)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button disabled={step === 0 || isSubmitting} onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={step === steps.length - 1 ? handleMultiStepSubmit : handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : (step === steps.length - 1 ? 'Save' : 'Next')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Multi-Step Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle>Edit Item and Variants</DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {getStepContent(step)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button disabled={step === 0 || isSubmitting} onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={step === steps.length - 1 ? handleMultiStepUpdate : handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : (step === steps.length - 1 ? 'Update' : 'Next')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this variant? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={confirmDeleteVariant} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
export default Items;
