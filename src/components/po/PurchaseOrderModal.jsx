import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Box, Typography, Grid, TextField, Button, IconButton, List, ListItem, CircularProgress, Autocomplete, InputAdornment, Divider, Chip
} from '@mui/material';
import { styled } from '@mui/system';
import { Add as AddIcon, Delete as DeleteIcon, NoteAdd as NoteAddIcon } from '@mui/icons-material';
import { fetchItemVariants } from '../../services/api';

// --- Styled Components for Modal ---
const StyledModal = styled(Modal)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(5px)',
});

const ModalContent = styled(Box)({
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  padding: '2rem',
  width: '90%',
  maxWidth: '800px',
  maxHeight: '90vh',
  overflowY: 'auto',
});

const initialFormState = {
  poNumber: '',
  supplierId: null,
  orderDate: '',
  expectedDeliveryDate: '',
  items: [{ id: Date.now(), itemVariantId: '', quantity: '', unitCost: '' }],
  notes: '',
  totalAmount: '',
};

const PurchaseOrderModal = ({ open, onClose, mode, selectedPo, onSubmit, allSuppliers, showSnackbar }) => {
  const [formPo, setFormPo] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [itemVariantOptions, setItemVariantOptions] = useState({});
  const [itemVariantLoading, setItemVariantLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Avoid fetching on every keystroke by tracking last search per index
  const lastSearchRef = React.useRef({});

  // Preload item variants when opening in "create" mode
  useEffect(() => {
    if (open && mode === 'create') {
      fetchItemVariants({ search: '' })
        .then((res) => setItemVariantOptions({ 0: res.data || res }))
        .catch(() => showSnackbar('Failed to fetch item variants.', 'error'));
    }
  }, [open, mode, showSnackbar]);

  useEffect(() => {
    if (open) {
      setFormErrors({});
      if (mode === 'create') {
        setFormPo(initialFormState);
      } else if (selectedPo) {
        setFormPo({
          ...selectedPo,
          supplierId: selectedPo.supplierId ? String(selectedPo.supplierId) : null,
          orderDate: selectedPo.orderDate?.split('T')[0] || '',
          expectedDeliveryDate: selectedPo.expectedDeliveryDate?.split('T')[0] || '',
          totalAmount: Number(selectedPo.totalAmount).toFixed(2),
          notes: selectedPo.notes || '',
          items: selectedPo.items.map(item => ({
            ...item,
            id: item.id || Date.now(),
            itemVariantId: item.itemVariantId || ''
          }))
        });
        // Preload item variants for edit mode based on existing items
        selectedPo.items.forEach((item, index) => {
          if (item.itemVariantId && !itemVariantOptions[index]) {
            fetchItemVariants({ search: '' })
              .then((res) => {
                setItemVariantOptions(prev => ({
                  ...prev,
                  [index]: res.data || res
                }));
              })
              .catch(() => showSnackbar('Failed to fetch item variants.', 'error'));
          }
        });
      }
    }
  // eslint-disable-next-line
  }, [open, mode, selectedPo, showSnackbar]);

  // Automatic Total Calculation
  useEffect(() => {
    if (mode !== 'view') {
      const total = formPo.items.reduce((acc, item) => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unitCost) || 0;
        return acc + qty * cost;
      }, 0);
      setFormPo(prev => ({ ...prev, totalAmount: total.toFixed(2) }));
    }
  }, [formPo.items, mode]);

  // Debounced fetch for item variants (per index, only on input, not on select)
  const fetchVariantOptions = useCallback(
    debounce((inputValue, index) => {
      // Prevent refetching for same input
      if (lastSearchRef.current[index] === inputValue) return;
      lastSearchRef.current[index] = inputValue;

      setItemVariantLoading(true);
      fetchItemVariants({ search: inputValue })
        .then((res) => {
          setItemVariantOptions((prev) => ({ ...prev, [index]: res.data || res }));
        })
        .catch(() => showSnackbar('Failed to fetch item variants.', 'error'))
        .finally(() => setItemVariantLoading(false));
    }, 400),
    [showSnackbar]
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormPo(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (_, value) => {
    setFormPo(prev => ({ ...prev, supplierId: value ? String(value.id) : null }));
  };

  const handleItemChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...formPo.items];
    // Allow empty string for quantity/unitCost for better typing UX
    if (name === 'quantity' || name === 'unitCost') {
      if (value === '' || /^\d+$/.test(value)) {
        newItems[index] = { ...newItems[index], [name]: value };
      }
    } else {
      newItems[index] = { ...newItems[index], [name]: value };
    }
    setFormPo(prev => ({ ...prev, items: newItems }));
  };
  
  const handleItemVariantChange = (value, index) => {
    const newItems = [...formPo.items];
    newItems[index] = { ...newItems[index], itemVariantId: value ? value.id : '' };
    setFormPo((prev) => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setFormPo(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), itemVariantId: '', quantity: '', unitCost: '' }],
    }));
    // Optionally, fetch all variants for the new row
    fetchItemVariants({ search: '' })
      .then((res) => setItemVariantOptions(prev => ({
        ...prev,
        [formPo.items.length]: res.data || res
      })))
      .catch(() => showSnackbar('Failed to fetch item variants.', 'error'));
  };

  const handleRemoveItem = (index) => {
    setFormPo(prev => ({ ...prev, items: formPo.items.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formPo.poNumber) errors.poNumber = 'PO Number is required.';
    if (!formPo.supplierId) errors.supplierId = 'Supplier is required.';
    if (!formPo.orderDate) errors.orderDate = 'Order Date is required.';
    if (formPo.items.some(item => !item.itemVariantId || !item.quantity || !item.unitCost)) {
      errors.items = 'All item fields (Variant, Quantity, Unit Cost) are required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const result = await onSubmit(mode, formPo, selectedPo?.id);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else if (result.error?.toLowerCase().includes('po number')) {
      setFormErrors(prev => ({ ...prev, poNumber: 'This PO number is already used.' }));
    }
  };

  const renderViewMode = () => {
    if (!selectedPo) return <Typography>No Purchase Order selected.</Typography>; // Null check
    const supplier = allSuppliers.find(s => String(s.id) === String(selectedPo.supplierId));
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={2}>Purchase Order Details</Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}> <Typography><strong>PO Number:</strong> {selectedPo.poNumber}</Typography> </Grid>
            <Grid item xs={12} sm={6}> <Typography><strong>Supplier:</strong> {supplier?.name || 'N/A'}</Typography> </Grid>
            <Grid item xs={12} sm={6}> <Typography><strong>Order Date:</strong> {new Date(selectedPo.orderDate).toLocaleDateString()}</Typography> </Grid>
            <Grid item xs={12} sm={6}> <Typography><strong>Expected Delivery:</strong> {new Date(selectedPo.expectedDeliveryDate).toLocaleDateString()}</Typography> </Grid>
            <Grid item xs={12}> <Typography><strong>Notes:</strong> {selectedPo.notes || '—'}</Typography> </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" mt={2} mb={1}>Items</Typography>
        <List sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2 }}>
          {selectedPo.items.map((item, index) => (
            <ListItem key={index} divider>
              <Box>
                <Typography><strong>Variant SKU:</strong> {item.sku || item.itemVariantId || 'N/A'}</Typography>
                <Typography><strong>Quantity:</strong> {item.quantity}</Typography>
                <Typography><strong>Unit Cost:</strong> ₹{Number(item.unitCost).toFixed(2)}</Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };
  
  const renderFormMode = () => (
     <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
            {mode === 'edit' ? 'Edit Purchase Order' : 'Create New Purchase Order'}
        </Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
            <TextField label="PO Number" name="poNumber" value={formPo.poNumber} onChange={handleFormChange} fullWidth error={!!formErrors.poNumber} helperText={formErrors.poNumber} disabled={mode === 'edit'} required />
            </Grid>
            <Grid item xs={12} sm={6}>
            <Autocomplete options={allSuppliers} value={allSuppliers.find(s => String(s.id) === String(formPo.supplierId)) || null} getOptionLabel={(option) => option?.name || ''} onChange={handleSupplierChange} isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)} renderInput={(params) => <TextField {...params} label="Supplier" error={!!formErrors.supplierId} helperText={formErrors.supplierId} required />} />
            </Grid>
            <Grid item xs={12} sm={6}>
            <TextField label="Order Date" type="date" name="orderDate" value={formPo.orderDate} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} error={!!formErrors.orderDate} helperText={formErrors.orderDate} required />
            </Grid>
            <Grid item xs={12} sm={6}>
            <TextField label="Expected Delivery" type="date" name="expectedDeliveryDate" value={formPo.expectedDeliveryDate} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12}>
            <TextField label="Notes" name="notes" value={formPo.notes} onChange={handleFormChange} fullWidth multiline rows={2} InputProps={{ startAdornment: (<InputAdornment position="start"><NoteAddIcon /></InputAdornment>),}}/>
            </Grid>
        </Grid>

        <Divider sx={{ my: 3 }}><Chip label="Items" /></Divider>

        <List>
            {formPo.items.map((item, index) => (
            <ListItem key={item.id} sx={{ p: 0, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={5}>
                    <Autocomplete
                      options={itemVariantOptions[index] || []}
                      loading={itemVariantLoading}
                      value={(itemVariantOptions[index] || []).find(v => v.id === item.itemVariantId) || null}
                      getOptionLabel={(option) => `${option.name || ''} (${option.sku || ''})`}
                      onInputChange={(_, value, reason) => {
                        if (reason === 'input' && typeof value === 'string') fetchVariantOptions(value, index);
                      }}
                      onChange={(_, value) => handleItemVariantChange(value, index)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Item Variant"
                          size="small"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {itemVariantLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                    />
                </Grid>
                <Grid item xs={5} sm={3}>
                    <TextField
                      label="Quantity"
                      name="quantity"
                      value={item.quantity}
                      onChange={e => handleItemChange(e, index)}
                      onBlur={e => {
                        // On blur, if blank or zero, set to 1 for better UX
                        if (e.target.value === '' || Number(e.target.value) < 1) {
                          handleItemChange({ target: { name: 'quantity', value: '1' } }, index);
                        }
                      }}
                      type="number"
                      fullWidth
                      size="small"
                      inputProps={{ min: 1 }}
                    />
                </Grid>
                <Grid item xs={5} sm={3}>
                    <TextField
                      label="Unit Cost"
                      name="unitCost"
                      value={item.unitCost}
                      onChange={e => handleItemChange(e, index)}
                      type="number"
                      fullWidth
                      size="small"
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    />
                </Grid>
                <Grid item xs={2} sm={1}>
                    {formPo.items.length > 1 && <IconButton onClick={() => handleRemoveItem(index)} color="error"><DeleteIcon /></IconButton>}
                </Grid>
                </Grid>
            </ListItem>
            ))}
        </List>
        <Button onClick={handleAddItem} startIcon={<AddIcon />} variant="outlined">Add Item</Button>
        {formErrors.items && <Typography color="error" sx={{ mt: 2 }}>{formErrors.items}</Typography>}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 4, gap: 2 }}>
            <Typography variant="h6">Total: ₹{formPo.totalAmount}</Typography>
            <Button onClick={onClose} variant="outlined" color="secondary">Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (mode === 'edit' ? 'Update PO' : 'Create PO')}
            </Button>
        </Box>
    </Box>
  );

  return (
    <StyledModal open={open} onClose={onClose}>
      <ModalContent>
        {mode === 'view' ? renderViewMode() : renderFormMode()}
      </ModalContent>
    </StyledModal>
  );
};

// Debounce utility function
function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

export default PurchaseOrderModal;