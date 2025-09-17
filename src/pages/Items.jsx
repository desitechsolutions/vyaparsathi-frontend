import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
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
  Grid,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { styled } from '@mui/system';

import {
  fetchItems,
  createItem,
  updateItem,
  deleteItemVariant,
  fetchStock,
  fetchCategories,
} from '../services/api';

import {
  clothingSizes,
  clothingColors,
  clothingDesigns,
  clothingUnits,
  clothingFabrics,
  clothingSeasons,
  clothingFits,
} from '../ui/constants';

const API_BASE_URL = 'http://localhost:8080';

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
  if (!options) return [];
  if (Array.isArray(options)) return options;
  
  const flattened = new Set();
  Object.values(options).forEach(value => {
    if (Array.isArray(value)) {
      value.forEach(val => flattened.add(val));
    } else if (typeof value === 'object') {
      Object.values(value).forEach(subValue => {
        if (Array.isArray(subValue)) {
          subValue.forEach(val => flattened.add(val));
        }
      });
    }
  });
  return Array.from(flattened);
};

const initialVariantState = {
  unit: '', pricePerUnit: '', size: '', color: '', design: '', gstRate: '',
  photoFile: null, photoPreviewUrl: null, lowStockThreshold: '',
  fit: '',
};

const CustomToolbar = ({ onAddItemClick }) => {
  const { t } = useTranslation();
  return (
    <GridToolbarContainer sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <GridToolbarFilterButton />
        <GridToolbarColumnsButton />
        <GridToolbarDensitySelector />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <GridToolbarQuickFilter
          variant="outlined"
          size="small"
          placeholder={t('itemsPage.searchPlaceholder')}
          debounceMs={300}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddItemClick}
        >
          {t('itemsPage.addItem')}
        </Button>
      </Box>
    </GridToolbarContainer>
  );
};

const VariantDetailDisplay = ({ item, stockData, onDeleteVariant }) => {
  const stockLookup = useMemo(() => {
    const map = new Map();
    if (stockData) {
      stockData.forEach(stockItem => {
        map.set(stockItem.itemVariantId, stockItem.totalQuantity);
      });
    }
    return map;
  }, [stockData]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, bgcolor: 'grey.50', borderRadius: 2 }}>
      <Grid container spacing={2}>
        {(item.variants || []).length > 0 ? (
          item.variants.map((variant) => {
            const currentStock = stockLookup.get(variant.id) ?? 0;
            const hasStock = currentStock > 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={variant.id}>
                <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">SKU: {variant.sku || 'N/A'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {variant.size || ''} {variant.color || ''} {variant.design || ''} {variant.fit || ''}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body1" fontWeight="bold">₹{variant.pricePerUnit}</Typography>
                      <Typography variant="body2" color={hasStock ? 'text.primary' : 'error.main'}>
                        Stock: {currentStock} {variant.unit}
                      </Typography>
                      <Typography variant="body2">GST: {variant.gstRate || 0}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                      <Tooltip title={hasStock ? "Cannot delete variant, stock exists" : "Delete this variant"}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={hasStock}
                            onClick={() => onDeleteVariant(variant.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                  {variant.photoPath && (
                    <Box sx={{ height: 140, overflow: 'hidden', borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.5, bgcolor: '#f5f5f5' }}>
                      <img 
                        src={`${API_BASE_URL}${variant.photoPath}`} 
                        alt={`${variant.size} ${variant.color}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
              No variants found for this item.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

const Items = () => {
  const [allItems, setAllItems] = useState([]);
  const [itemsWithVariants, setItemsWithVariants] = useState([]);
  const [itemsWithoutVariants, setItemsWithoutVariants] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openViewVariantsDialog, setOpenViewVariantsDialog] = useState(false);
  const [variantsToView, setVariantsToView] = useState({ name: '', variants: [] });
  const [step, setStep] = useState(0);
  const [itemFormData, setItemFormData] = useState({ name: '', description: '', categoryId: '', brandName: '', fabric: '', season: '' });
  const [variantList, setVariantList] = useState([]);
  const [currentVariant, setCurrentVariant] = useState({ ...initialVariantState });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [apiCategories, setApiCategories] = useState([]);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, stockRes, categoriesRes] = await Promise.all([fetchItems(), fetchStock(), fetchCategories()]);

      if (Array.isArray(itemsRes.data)) {
        setAllItems(itemsRes.data);
        const withVariants = itemsRes.data.filter(item => item.variants && item.variants.length > 0);
        const withoutVariants = itemsRes.data.filter(item => !item.variants || item.variants.length === 0);
        setItemsWithVariants(withVariants);
        setItemsWithoutVariants(withoutVariants);
      } else {
        throw new Error('API response for items is not an array.');
      }

      if (Array.isArray(stockRes.data)) {
        setStockData(stockRes.data);
      } else {
        throw new Error('API response for stock is not an array.');
      }
      
      if (Array.isArray(categoriesRes.data)) {
        setApiCategories(categoriesRes.data);
      } else {
        throw new Error('API response for categories is not an array.');
      }

    } catch (err) {
      console.error('Data fetch error:', err);
      showSnackbar('Failed to load data. Please check API service.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      // Create a new File object (a clone) to avoid reference issues.
      // This is crucial when the same file is used for multiple variants.
      const newFile = new File([file], file.name, { type: file.type });
      const previewUrl = URL.createObjectURL(newFile);
      setCurrentVariant(prev => ({ ...prev, photoFile: newFile, photoPreviewUrl: previewUrl }));
    }
    setDialogError(null);
  };

  const addOrUpdateVariantToList = () => {
    if (!currentVariant.unit || !currentVariant.pricePerUnit) {
      setDialogError('Unit and Price per Unit are required for each variant.');
      return;
    }
    if (editingVariantIndex !== null) {
      setVariantList(prev => prev.map((v, idx) => idx === editingVariantIndex ? { ...currentVariant } : v));
      setEditingVariantIndex(null);
    } else {
      setVariantList(prev => [...prev, { ...currentVariant, id: `local_${Date.now()}` }]);
    }
    setCurrentVariant({ ...initialVariantState });
    setDialogError(null);
  };

  const handleEditVariantInList = (index) => {
    setCurrentVariant({ ...variantList[index] });
    setEditingVariantIndex(index);
    setDialogError(null);
  };

  const handleDeleteVariantInList = (index) => {
    setVariantList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMultiStepSubmit = async () => {
    if (!itemFormData.name || !itemFormData.categoryId || variantList.length === 0) {
      setDialogError('Item name, category, and at least one variant are required.');
      return;
    }
    setIsSubmitting(true);
    setDialogError(null);
    try {
      const formData = new FormData();
      const variantsPayload = [];

      variantList.forEach((variant) => {
        const { photoFile, photoPreviewUrl, id, ...rest } = variant;
        variantsPayload.push(rest);
        
        if (photoFile) {
          const photoIndex = variantsPayload.length - 1;
          formData.append(`variant_photo_${photoIndex}`, photoFile, photoFile.name);
        }
      });

      const itemDto = { ...itemFormData, variants: variantsPayload };
      formData.append('itemDto', new Blob([JSON.stringify(itemDto)], { type: 'application/json' }));

      await createItem(formData);
      showSnackbar("Item saved successfully!", 'success');
      handleDialogClose();
      loadData();
    } catch (err) {
      console.error('Error creating item and variants:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create item. Please try again.';
      setDialogError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiStepUpdate = async () => {
    if (!itemFormData.name || !itemFormData.categoryId || variantList.length === 0) {
      setDialogError('Item name, category, and at least one variant are required.');
      return;
    }
    setIsSubmitting(true);
    setDialogError(null);
    try {
      const formData = new FormData();
      const variantsPayload = [];

      variantList.forEach((variant) => {
        const { photoFile, photoPreviewUrl, id, ...rest } = variant;
        const newVariant = { ...rest };
        if (id && !String(id).startsWith('local_')) {
          newVariant.id = id;
        }
        variantsPayload.push(newVariant);

        if (photoFile) {
          const photoIndex = variantsPayload.length - 1;
          formData.append(`variant_photo_${photoIndex}`, photoFile, photoFile.name);
        }
      });

      const itemDto = { id: selectedItemId, ...itemFormData, variants: variantsPayload };
      formData.append('itemDto', new Blob([JSON.stringify(itemDto)], { type: 'application/json' }));

      await updateItem(selectedItemId, formData);
      showSnackbar("Item updated successfully!", 'success');
      handleDialogClose();
      loadData();
    } catch (err) {
      console.error('Error updating item and variants:', err);
      setDialogError('Failed to update item and variants. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageItem = (itemId) => {
    const itemToManage = allItems.find(item => item.id === itemId);
    if (itemToManage) {
      setItemFormData({
        name: itemToManage.name || '',
        description: itemToManage.description || '',
        categoryId: itemToManage.categoryId || '',
        brandName: itemToManage.brandName || '',
        fabric: itemToManage.fabric || '',
        season: itemToManage.season || '',
      });
      
      const allVariants = (itemToManage.variants || []).map(v => ({
        id: v.id, unit: v.unit, pricePerUnit: v.pricePerUnit, size: v.size, color: v.color,
        design: v.design, gstRate: v.gstRate, photoUrl: v.photoPath, lowStockThreshold: v.lowStockThreshold || '',
        fit: v.fit || '',
        sku: v.sku, currentStock: v.currentStock
      }));

      setVariantList(allVariants);
      setCurrentVariant({ ...initialVariantState });
      setEditingVariantIndex(null);
      setSelectedItemId(itemId);
      setOpenEditDialog(true);
      setStep(0);
      setDialogError(null);
    } else {
      showSnackbar('Item not found.', 'error');
    }
  };

  const handleDeleteVariant = (variantId) => {
    setSelectedVariantId(variantId);
    setOpenDeleteConfirm(true);
  };

  const confirmDeleteVariant = async () => {
    setOpenDeleteConfirm(false);
    try {
      await deleteItemVariant(selectedVariantId);
      showSnackbar("Variant deleted successfully!", 'success');
      setOpenViewVariantsDialog(false);
      loadData();
    } catch (err) {
      console.error('Delete variant error:', err);
      showSnackbar('Failed to delete variant. See console for details.', 'error');
    }
  };

  const handleViewVariants = (item) => {
    setVariantsToView(item);
    setOpenViewVariantsDialog(true);
  };

  const { t } = useTranslation();
  const columns = [
    { field: 'name', headerName: t('itemsPage.columns.name'), flex: 1.5, minWidth: 200 },
    { field: 'categoryName', headerName: t('itemsPage.columns.category'), flex: 1, minWidth: 150 },
    { field: 'brandName', headerName: t('itemsPage.columns.brand'), flex: 1, minWidth: 150 },
    { 
      field: 'variants', 
      headerName: t('itemsPage.columns.variants', 'Variants'), 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.row.variants?.length || 0
    },
    {
      field: 'actions',
      headerName: t('itemsPage.columns.actions'),
      width: 120,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title={t('itemsPage.variant.reviewTitle', 'View Variants')}>
            <IconButton color="default" onClick={() => handleViewVariants(params.row)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('itemsPage.editDialogTitle', 'Manage Item & Variants')}>
            <IconButton color="primary" onClick={() => handleManageItem(params.row.id)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleDialogClose = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setStep(0);
    setItemFormData({ name: '', description: '', categoryId: '', brandName: '', fabric: '', season: '' });
    setVariantList([]);
    setCurrentVariant({ ...initialVariantState });
    setDialogError(null);
    setEditingVariantIndex(null);
    setSelectedItemId(null);
  };

  const steps = [t('itemsPage.stepper.itemDetails'), t('itemsPage.stepper.addVariants'), t('itemsPage.stepper.reviewAndSave')];

  const getVariantFormFields = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}><Autocomplete freeSolo options={flattenOptions(clothingSizes)} value={currentVariant.size || ''} onChange={(e, newValue) => setCurrentVariant({ ...currentVariant, size: newValue || '' })} renderInput={(params) => <TextField {...params} label={t('itemsPage.form.size')} variant="outlined" />} /></Grid>
      <Grid item xs={12} sm={6}><Autocomplete freeSolo options={clothingColors} value={currentVariant.color || ''} onChange={(e, newValue) => setCurrentVariant({ ...currentVariant, color: newValue || '' })} renderInput={(params) => <TextField {...params} label={t('itemsPage.form.color')} variant="outlined" />} /></Grid>
      <Grid item xs={12} sm={6}><Autocomplete freeSolo options={flattenOptions(clothingDesigns)} value={currentVariant.design || ''} onChange={(e, newValue) => setCurrentVariant({ ...currentVariant, design: newValue || '' })} renderInput={(params) => <TextField {...params} label={t('itemsPage.form.design')} variant="outlined" />} /></Grid>
      <Grid item xs={12} sm={6}><Autocomplete freeSolo options={clothingFits} value={currentVariant.fit || ''} onChange={(e, newValue) => setCurrentVariant({ ...currentVariant, fit: newValue || '' })} renderInput={(params) => <TextField {...params} label={t('itemsPage.form.fit', 'Fit')} variant="outlined" />} /></Grid>
      <Grid item xs={12} sm={6}><Autocomplete freeSolo options={clothingUnits} value={currentVariant.unit || ''} onChange={(e, newValue) => setCurrentVariant({ ...currentVariant, unit: newValue || '' })} renderInput={(params) => <TextField {...params} label={t('itemsPage.form.unit')} required variant="outlined" />} /></Grid>
      <Grid item xs={12} sm={6}><TextField label={t('itemsPage.form.pricePerUnit')} name="pricePerUnit" type="number" value={currentVariant.pricePerUnit || ''} onChange={handleCurrentVariantChange} required fullWidth variant="outlined" /></Grid>
      <Grid item xs={12} sm={6}><TextField label={t('itemsPage.form.gstRate')} name="gstRate" type="number" value={currentVariant.gstRate || ''} onChange={handleCurrentVariantChange} fullWidth variant="outlined" /></Grid>
      <Grid item xs={12} sm={6}>
        <Tooltip title={t('itemsPage.form.lowStockHelper')} placement="top" arrow>
          <TextField label={t('itemsPage.form.lowStockThreshold')} name="lowStockThreshold" type="number" value={currentVariant.lowStockThreshold || ''} onChange={handleCurrentVariantChange} fullWidth variant="outlined" InputProps={{ inputProps: { min: 0 } }} />
        </Tooltip>
      </Grid>
      <Grid item xs={12}>
        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth>
          {t('itemsPage.form.uploadPhoto')}
          <VisuallyHiddenInput type="file" accept="image/*" onChange={handleCurrentVariantFileChange} />
        </Button>
        {(currentVariant.photoPreviewUrl || currentVariant.photoUrl) && (
          <Box sx={{ mt: 2, p: 1, border: '1px dashed grey', borderRadius: 2, textAlign: 'center' }}>
            <img src={currentVariant.photoPreviewUrl || `${API_BASE_URL}${currentVariant.photoUrl}`} alt="Preview" style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain' }} />
          </Box>
        )}
      </Grid>
    </Grid>
  );

  const getStepContent = (step) => {
    return (
      <Box>
        {dialogError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDialogError(null)}>{dialogError}</Alert>}
        {step === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label={t('itemsPage.form.name')} name="name" value={itemFormData.name} onChange={handleItemFormChange} required fullWidth variant="outlined" /></Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={apiCategories}
                getOptionLabel={(option) => option.name || ''}
                value={apiCategories.find(cat => cat.id === itemFormData.categoryId) || null}
                onChange={(e, newValue) => setItemFormData(prev => ({ ...prev, categoryId: newValue ? newValue.id : '' }))}
                renderInput={(params) => <TextField {...params} label={t('itemsPage.form.category')} required variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}><TextField label={t('itemsPage.form.brandName')} name="brandName" value={itemFormData.brandName} onChange={handleItemFormChange} fullWidth variant="outlined" /></Grid>
            <Grid item xs={12} sm={6}><Autocomplete freeSolo options={clothingFabrics} value={itemFormData.fabric || ''} onChange={(e, newValue) => setItemFormData({ ...itemFormData, fabric: newValue || '' })} renderInput={(params) => <TextField {...params} label={t('itemsPage.form.fabric', 'Fabric')} variant="outlined" />} /></Grid>
            <Grid item xs={12} sm={6}><Autocomplete freeSolo options={clothingSeasons} value={itemFormData.season || ''} onChange={(e, newValue) => setItemFormData({ ...itemFormData, season: newValue || '' })} renderInput={(params) => <TextField {...params} label={t('itemsPage.form.season', 'Season')} variant="outlined" />} /></Grid>
            <Grid item xs={12}><TextField label={t('itemsPage.form.description')} name="description" value={itemFormData.description} onChange={handleItemFormChange} fullWidth multiline rows={2} variant="outlined" /></Grid>
          </Grid>
        )}
        {step === 1 && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>{editingVariantIndex !== null ? "Edit Variant Details" : "Add a New Variant"}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {editingVariantIndex !== null ? "Modify the details below and click 'Update Variant'." : "Fill the form below to add a new variant to this item."}
                </Typography>
                {getVariantFormFields()}
                <Button variant="contained" startIcon={editingVariantIndex !== null ? <SaveIcon /> : <AddIcon />} onClick={addOrUpdateVariantToList} sx={{ mt: 2 }} color={editingVariantIndex !== null ? "success" : "primary"}>
                  {editingVariantIndex !== null ? "Update Variant" : "Add Variant to List"}
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>Current Variants for this Item ({variantList.length})</Typography>
              {variantList.length > 0 ? (
                <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <List dense>
                    {variantList.map((variant, index) => (
                      <ListItem key={variant.id || index} divider selected={editingVariantIndex === index}
                        secondaryAction={
                          <>
                            <Tooltip title="Edit this variant"><IconButton edge="end" color="primary" onClick={() => handleEditVariantInList(index)}><EditIcon /></IconButton></Tooltip>
                            <Tooltip title="Remove this variant from list"><IconButton edge="end" color="error" onClick={() => handleDeleteVariantInList(index)}><DeleteIcon /></IconButton></Tooltip>
                          </>
                        }
                      >
                        <ListItemText
                          primary={`Price: ₹${variant.pricePerUnit} | Unit: ${variant.unit}`}
                          secondary={`Size: ${variant.size || 'N/A'}, Color: ${variant.color || 'N/A'}, GST: ${variant.gstRate || '0'}%`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center', p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                  No variants have been added for this item yet. <br/> Use the form on the left to add the first one.
                </Typography>
              )}
            </Grid>
          </Grid>
        )}
        {step === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>Review & Save</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6">Item Details</Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Name:</Typography></Grid>
                <Grid item xs={6}><Typography>{itemFormData.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Category:</Typography></Grid>
                <Grid item xs={6}><Typography>{apiCategories.find(c => c.id === itemFormData.categoryId)?.name || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Brand:</Typography></Grid>
                <Grid item xs={6}><Typography>{itemFormData.brandName || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Fabric:</Typography></Grid>
                <Grid item xs={6}><Typography>{itemFormData.fabric || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Season:</Typography></Grid>
                <Grid item xs={6}><Typography>{itemFormData.season || 'N/A'}</Typography></Grid>
              </Grid>
            </Paper>
            <Typography variant="h6" sx={{ mt: 2 }}>Variants ({variantList.length})</Typography>
            <List>
              {variantList.map((variant, index) => (
                <ListItem key={variant.id || index} divider>
                  <ListItemText
                    primary={`Variant ${index + 1}: Price - ₹${variant.pricePerUnit}, Unit - ${variant.unit}`}
                    secondary={`Size: ${variant.size || 'N/A'}, Color: ${variant.color || 'N/A'}, Design: ${variant.design || 'N/A'}, Fit: ${variant.fit || 'N/A'}, GST: ${variant.gstRate || '0'}%, Low Stock: ${variant.lowStockThreshold || '-'}`}
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
    if (step === 0 && (!itemFormData.name || !itemFormData.categoryId)) {
      setDialogError('Name and Category are required fields.');
      return;
    }
    if (step === 1 && variantList.length === 0) {
      setDialogError('At least one variant is required.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    setDialogError(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('itemsPage.title')}
      </Typography>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : (
        <>
          {itemsWithoutVariants.length > 0 && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon color="action" /> {t('itemsPage.awaitingVariants', 'Items Awaiting Variants')} <Chip label={itemsWithoutVariants.length} color="warning" size="small" />
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List dense>
                  {itemsWithoutVariants.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem
                        secondaryAction={
                          <Button variant="outlined" size="small" onClick={() => handleManageItem(item.id)}>
                            {t('itemsPage.actions.manage', 'Manage')}
                          </Button>
                        }
                      >
                        <ListItemText
                          primary={item.name}
                          secondary={`${t('itemsPage.columns.category', 'Category')}: ${item.categoryName || t('itemsPage.notAvailable', 'N/A')} | ${t('itemsPage.columns.brand', 'Brand')}: ${item.brandName || t('itemsPage.notAvailable', 'N/A')}`}
                        />
                      </ListItem>
                      {index < itemsWithoutVariants.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
          <Paper elevation={2} sx={{ width: '100%', height: 'auto' }}>
            <DataGrid
              rows={itemsWithVariants}
              columns={columns}
              autoHeight
              getRowId={(row) => row.id}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              slots={{ toolbar: CustomToolbar }}
              slotProps={{ toolbar: { onAddItemClick: () => { handleDialogClose(); setOpenAddDialog(true); } } }}
              sx={{ border: 0, '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' } }}
            />
          </Paper>
        </>
      )}
      <Dialog open={openAddDialog || openEditDialog} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {openAddDialog ? t('itemsPage.addDialogTitle') : t('itemsPage.editDialogTitle', 'Manage Item')}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Stepper activeStep={step} sx={{ mb: 3 }}>
            {Object.values(t('itemsPage.stepper', { returnObjects: true }))?.map((label, idx) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
          {getStepContent(step)}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleDialogClose} disabled={isSubmitting}>{t('itemsPage.actions.cancel')}</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button disabled={step === 0 || isSubmitting} onClick={handleBack}>{t('itemsPage.actions.back')}</Button>
          <Button variant="contained" onClick={step === steps.length - 1 ? (openAddDialog ? handleMultiStepSubmit : handleMultiStepUpdate) : handleNext} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (step === steps.length - 1 ? (openAddDialog ? t('itemsPage.actions.save', 'Save Item') : t('itemsPage.actions.update', 'Update Item')) : t('itemsPage.actions.next', 'Next'))}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle>{t('itemsPage.deleteDialogTitle')}</DialogTitle>
        <DialogContent><DialogContentText>{t('itemsPage.deleteDialogText')}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>{t('itemsPage.actions.cancel')}</Button>
          <Button onClick={confirmDeleteVariant} color="error" variant="contained">{t('itemsPage.actions.delete')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openViewVariantsDialog} onClose={() => setOpenViewVariantsDialog(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {t('itemsPage.variant.reviewTitle', 'Variants for')} {variantsToView.name}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <VariantDetailDisplay item={variantsToView} stockData={stockData} onDeleteVariant={handleDeleteVariant} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewVariantsDialog(false)}>{t('itemsPage.actions.cancel', 'Close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Items;