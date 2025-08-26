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
import SaveIcon from '@mui/icons-material/Save';
import { styled } from '@mui/system';

import {
  fetchItems,
  createItem,
  updateItem,
  deleteItemVariant,
} from '../services/api';

import {
  clothingCategories,
  clothingSizes,
  clothingColors,
  clothingDesigns,
  clothingUnits,
} from '../ui/constants';

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

const initialVariantState = {
  unit: '', pricePerUnit: '', size: '', color: '', design: '', gstRate: '',
  photoFile: null, photoPreviewUrl: null, lowStockThreshold: ''
};

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openEditVariantDialog, setOpenEditVariantDialog] = useState(false);
  const [step, setStep] = useState(0);
  const [itemFormData, setItemFormData] = useState({ name: '', description: '', category: '', brandName: '' });
  const [variantList, setVariantList] = useState([]);
  const [currentVariant, setCurrentVariant] = useState({ ...initialVariantState });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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

  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemFormData(prev => ({ ...prev, [name]: value }));
    setDialogError(null);
  };

  const handleCurrentVariantChange = (e) => {
    const { name, value } = e.target;
    setCurrentVariant(prev => ({ ...prev, [name]: value }));
    setDialogError(null);
  };

  const handleCurrentVariantFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCurrentVariant(prev => ({ ...prev, photoFile: file, photoPreviewUrl: previewUrl }));
    }
    setDialogError(null);
  };

  // Add or update a variant in variantList
  const addOrUpdateVariantToList = () => {
    if (!currentVariant.unit || !currentVariant.pricePerUnit ) {
      setDialogError('Unit and Price per Unit are required for each variant.');
      return;
    }
    if (editingVariantIndex !== null) {
      setVariantList(prev => prev.map((v, idx) => idx === editingVariantIndex ? { ...currentVariant } : v));
      setEditingVariantIndex(null);
    } else {
      setVariantList(prev => [...prev, { ...currentVariant, id: prev.length + 1 + Math.random() }]);
    }
    setCurrentVariant({ ...initialVariantState });
    setDialogError(null);
    setOpenEditVariantDialog(false);
  };

  // Start editing a variant in the local variantList
  const handleEditVariantInList = (index) => {
    setCurrentVariant({ ...variantList[index] });
    setEditingVariantIndex(index);
    setOpenEditVariantDialog(true);
    setDialogError(null);
  };

  // Delete a variant from variantList locally (before saving)
  const handleDeleteVariantInList = (index) => {
    setVariantList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMultiStepSubmit = async () => {
    if (!itemFormData.name || !itemFormData.category || variantList.length === 0) {
      setDialogError('Item name, category, and at least one variant are required.');
      return;
    }
    setIsSubmitting(true);
    setDialogError(null);
    try {
      // Bundle variants into itemDto
      const itemDto = {
        ...itemFormData,
        variants: variantList.map(({ photoFile, photoPreviewUrl, ...rest }) => rest)
      };
      const formData = new FormData();
      formData.append('itemDto', new Blob([JSON.stringify(itemDto)], { type: 'application/json' }));

      // Only append photos if present
      variantList.forEach((variant, index) => {
        if (variant.photoFile) {
          formData.append('photos', variant.photoFile, `variant_${index}_${variant.photoFile.name}`);
        }
      });

      await createItem(formData);
      setSuccessMessage("Item saved successfully!");
      handleDialogClose();
      loadItems();
    } catch (err) {
      console.error('Error creating item and variants:', err);
      setDialogError('Failed to create item and variants. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiStepUpdate = async () => {
    if (!itemFormData.name || !itemFormData.category || variantList.length === 0) {
      setDialogError('Item name, category, and at least one variant are required.');
      return;
    }
    setIsSubmitting(true);
    setDialogError(null);
    try {
      const itemDto = {
        ...itemFormData,
        variants: variantList.map(({ photoFile, photoPreviewUrl, ...rest }) => rest)
      };
      const formData = new FormData();
      formData.append('itemDto', new Blob([JSON.stringify(itemDto)], { type: 'application/json' }));

      variantList.forEach((variant, index) => {
        if (variant.photoFile) {
          formData.append('photos', variant.photoFile, `variant_${index}_${variant.photoFile.name}`);
        }
      });

      await updateItem(selectedItemId, formData);
      setSuccessMessage("Item updated successfully!");
      handleDialogClose();
      loadItems();
    } catch (err) {
      console.error('Error updating item and variants:', err);
      setDialogError('Failed to update item and variants. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit handler using local state (no API call)
  const handleEditItem = (itemId, variantId) => {
    // Find the item and all its variants from items state
    const itemRows = items.filter(i => i.itemId === itemId);
    if (itemRows.length > 0) {
      const item = itemRows[0];
      setItemFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        brandName: item.brandName || '',
      });
      const allVariants = itemRows.map(i => ({
        id: i.id,
        unit: i.unit,
        pricePerUnit: i.pricePerUnit,
        size: i.size,
        color: i.color,
        design: i.design,
        gstRate: i.gstRate,
        photoUrl: i.photoUrl,
        lowStockThreshold: i.lowStockThreshold || ''
      }));
      setVariantList(allVariants);
      setCurrentVariant({ ...initialVariantState });
      setEditingVariantIndex(null);
      setSelectedItemId(itemId);
      setOpenEditDialog(true);
      setStep(0);
      setDialogError(null);
    } else {
      setError('Item not found.');
    }
  };

  const handleDeleteVariant = (variantId) => {
    setSelectedVariantId(variantId);
    setOpenDeleteConfirm(true);
  };

  const confirmDeleteVariant = async () => {
    setOpenDeleteConfirm(false);
    setError(null);
    try {
      await deleteItemVariant(selectedVariantId);
      setSuccessMessage("Variant deleted successfully!");
      loadItems();
    } catch (err) {
      console.error('Delete variant error:', err);
      setError('Failed to delete variant.');
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Tooltip
          title={
            <>
              {params.row.description && (
                <div>
                  <strong>Description:</strong> {params.row.description}
                </div>
              )}
              {params.row.design && (
                <div>
                  <strong>Design:</strong> {params.row.design}
                </div>
              )}
            </>
          }
          arrow
          placement="top"
        >
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 120 },
    { field: 'brandName', headerName: 'Brand', flex: 1, minWidth: 120 },
    { field: 'sku', headerName: 'SKU', flex: 1, minWidth: 120 },
    { field: 'size', headerName: 'Size', width: 90 },
    { field: 'color', headerName: 'Color', width: 90 },
    {
      field: 'pricePerUnit',
      headerName: 'Price',
      type: 'number',
      width: 110,
      valueFormatter: ({ value }) => `₹${value}`,
    },
    {
      field: 'gstRate',
      headerName: 'GST (%)',
      width: 100,
      valueFormatter: ({ value }) => value ? `${value}%` : '',
    },
    {
      field: 'lowStockThreshold',
      headerName: 'Low Stock Threshold',
      width: 160,
      valueFormatter: ({ value }) => value !== undefined && value !== null && value !== '' ? value : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      renderCell: (params) => (
        <>
          <Tooltip title="Edit Item">
            <IconButton color="primary" onClick={() => handleEditItem(params.row.itemId, params.row.id)}>
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

  const handleDialogClose = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setOpenEditVariantDialog(false);
    setStep(0);
    setItemFormData({ name: '', description: '', category: '', brandName: '' });
    setVariantList([]);
    setCurrentVariant({ ...initialVariantState });
    setDialogError(null);
    setEditingVariantIndex(null);
  };

  const steps = ['Item Details', 'Add Variants', 'Review & Save'];

  // Variant add/edit form for dialog and popover
  const getVariantFormFields = () => (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
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
      <Tooltip
        title={
          <span>
            Set the minimum stock level for this variant.<br />
            When stock falls below this value, you’ll get a low stock alert.<br />
            <b>Tip:</b> Use a higher value for fast-selling or critical items.
          </span>
        }
        placement="top"
        arrow
      >
        <TextField
          label="Low Stock Threshold"
          name="lowStockThreshold"
          type="number"
          value={currentVariant.lowStockThreshold || ''}
          onChange={handleCurrentVariantChange}
          fullWidth
          InputProps={{ inputProps: { min: 0 } }}
          helperText="You'll be alerted when stock drops below this value."
        />
      </Tooltip>
      <Box sx={{ gridColumn: '1 / -1', mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          fullWidth
        >
          Upload Photo (optional)
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
    </Box>
  );

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
          <Box>
            {getVariantFormFields()}
            <Button
              variant="contained"
              startIcon={editingVariantIndex !== null ? <SaveIcon /> : <AddIcon />}
              onClick={addOrUpdateVariantToList}
              sx={{ mt: 2 }}
              color={editingVariantIndex !== null ? "success" : "primary"}
            >
              {editingVariantIndex !== null ? "Update Variant" : "Add Variant to List"}
            </Button>
            {variantList.length > 0 && (
              <Paper elevation={2} sx={{ mt: 2, p: 2 }}>
                <Typography variant="h6" gutterBottom>Added Variants</Typography>
                <List dense>
                  {variantList.map((variant, index) => (
                    <ListItem
                      key={variant.id || index}
                      secondaryAction={
                        <>
                          <Tooltip title="Edit">
                            <IconButton edge="end" color="primary" onClick={() => handleEditVariantInList(index)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton edge="end" color="error" onClick={() => handleDeleteVariantInList(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      }
                    >
                      <ListItemText
                        primary={`Variant ${index + 1}: Price - ₹${variant.pricePerUnit}`}
                        secondary={`Size: ${variant.size || 'N/A'}, Color: ${variant.color || 'N/A'}, Design: ${variant.design || 'N/A'}, Low Stock Threshold: ${variant.lowStockThreshold || '-'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            {/* Edit Variant Dialog for local variant list (for better UX on mobile, open as dialog) */}
            <Dialog open={openEditVariantDialog} onClose={() => setOpenEditVariantDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Edit Variant</DialogTitle>
              <DialogContent>
                {getVariantFormFields()}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenEditVariantDialog(false)}>Cancel</Button>
                <Button variant="contained" onClick={addOrUpdateVariantToList} color="success">
                  Save
                </Button>
              </DialogActions>
            </Dialog>
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
                    primary={`Variant ${index + 1}: Unit - ${variant.unit}, Price - ₹${variant.pricePerUnit}, GST - ${variant.gstRate}, Low Stock Threshold: ${variant.lowStockThreshold || '-'}`}
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
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
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
    </>
  );
};

export default Items;