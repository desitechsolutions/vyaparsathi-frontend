import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal, Box, Typography, Grid, TextField, Button, IconButton, List, ListItem, CircularProgress, Autocomplete, InputAdornment, Divider, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { styled } from '@mui/system';
import { Add as AddIcon, Delete as DeleteIcon, NoteAdd as NoteAddIcon, Send as SendIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { fetchItemVariants, fetchItemVariantById, createSupplier } from '../../services/api';

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
  supplier: null,
  orderDate: '',
  expectedDeliveryDate: '',
  items: [{ tempId: Date.now(), itemVariantId: '', quantity: '1', unitCost: '' }],
  notes: '',
  totalAmount: '0.00',
};

const PurchaseOrderModal = ({ open, onClose, mode, selectedPo, onSubmit, allSuppliers: allSuppliersProp, showSnackbar, onSubmitPO }) => {
  const [formPo, setFormPo] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [itemVariantOptions, setItemVariantOptions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);

  // Inline Supplier Creation
  const [allSuppliers, setAllSuppliers] = useState(allSuppliersProp || []);
  const [createSupplierDialog, setCreateSupplierDialog] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '', gstin: '' });
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);

  const lastSearchRef = useRef({});
  const wasOpen = useRef(false);

  // Sync allSuppliers when prop changes (parent refreshes after new supplier added)
  useEffect(() => {
    setAllSuppliers(allSuppliersProp || []);
  }, [allSuppliersProp]);

  const handleCreateSupplier = async () => {
    if (!supplierForm.name.trim()) return;
    setIsCreatingSupplier(true);
    try {
      const newSupplier = await createSupplier(supplierForm);
      setAllSuppliers(prev => [...prev, newSupplier]);
      setFormPo(prev => ({ ...prev, supplier: newSupplier }));
      setCreateSupplierDialog(false);
      setSupplierForm({ name: '', phone: '', email: '', address: '', gstin: '' });
      showSnackbar('Supplier created successfully!', 'success');
    } catch (err) {
      showSnackbar('Failed to create supplier. Please try again.', 'error');
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  const isDraft = formPo.status === 'DRAFT' || mode === 'create';
  const isReadOnly = mode === 'view' || (!isDraft && mode === 'edit');

useEffect(() => {
    if (mode === 'create' && selectedPo?.initialVariantId && allSuppliers.length > 0) {
      const { initialVariantId, initialSupplierId } = selectedPo;

      // 1. Pre-select the supplier if an ID is provided
      const supplierObject = allSuppliers.find(s => s.id === Number(initialSupplierId)) || null;

      // 2. Fetch the specific item variant by its ID
      fetchItemVariantById(initialVariantId)
        .then(variant => {
          if (variant) {
            // Update the item options so the Autocomplete can find and display it
            setItemVariantOptions(prev => ({ ...prev, 0: [variant] }));

            // Set the form state
            setFormPo(prev => ({
              ...prev,
              supplier: supplierObject,
              items: [{
                tempId: Date.now(),
                itemVariantId: variant.id,
                quantity: '1',
                unitCost: variant.purchasePrice || '' // Pre-fill price if available
              }],
            }));
          }
        })
        .catch(() => showSnackbar('Failed to fetch item details.', 'error'));
    }
    // We only want this to run when the initial IDs are set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPo?.initialVariantId, allSuppliers]);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setFormErrors({});
      fetchItemVariants({ search: '' })
        .then((res) => setItemVariantOptions({ 0: res.data || res }))
        .catch(() => showSnackbar('Failed to fetch initial item variants.', 'error'));

      if (mode === 'create' && !selectedPo?.initialVariantId) {
        setFormPo(initialFormState);
      } else if (selectedPo && allSuppliers.length > 0) {
        const supplierObject = allSuppliers.find(s => s.id === selectedPo.supplierId) || null;
        setFormPo({
          ...selectedPo,
          supplier: supplierObject,
          orderDate: selectedPo.orderDate?.split('T')[0] || '',
          expectedDeliveryDate: selectedPo.expectedDeliveryDate?.split('T')[0] || '',
          totalAmount: Number(selectedPo.totalAmount || 0).toFixed(2),
          notes: selectedPo.notes || '',
          items: (selectedPo.items || []).map(item => ({
            ...item,
            tempId: item.id || Date.now() + Math.random(),
            itemVariantId: item.itemVariantId || ''
          }))
        });
      }
    }
    wasOpen.current = open;
    // eslint-disable-next-line
  }, [open, mode, selectedPo, allSuppliers]); // intentionally omit showSnackbar

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

  const fetchVariantOptions = useCallback(
    debounce((inputValue, index) => {
      if (lastSearchRef.current[index] === inputValue) return;
      lastSearchRef.current[index] = inputValue;

      fetchItemVariants({ search: inputValue })
        .then((res) => {
          setItemVariantOptions((prev) => ({ ...prev, [index]: res.data || res }));
        })
        .catch(() => showSnackbar('Failed to fetch item variants.', 'error'));
    }, 400),
    [showSnackbar]
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormPo(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (_, value) => {
    setFormPo(prev => ({ ...prev, supplier: value }));
  };

  const handleItemChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...formPo.items];
    newItems[index] = { ...newItems[index], [name]: value };
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
      items: [...prev.items, { tempId: Date.now(), itemVariantId: '', quantity: '1', unitCost: '' }],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormPo(prev => ({ ...prev, items: formPo.items.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formPo.poNumber.trim()) errors.poNumber = 'PO Number is required.';
    if (!formPo.supplier) errors.supplier = 'Supplier is required.';
    if (!formPo.orderDate) errors.orderDate = 'Order Date is required.';
    if (formPo.items.some(item => !item.itemVariantId || !item.quantity || Number(item.quantity) <= 0 || !item.unitCost || Number(item.unitCost) < 0)) {
      errors.items = 'All item fields (Variant, Quantity, Unit Cost) must be valid.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = {
      ...formPo,
      supplierId: formPo.supplier ? formPo.supplier.id : null,
      totalAmount: Number(formPo.totalAmount),
      items: formPo.items.map(({ tempId, ...item }) => ({
        ...item,
        itemVariantId: Number(item.itemVariantId),
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      })),
    };
    delete payload.supplier;

    const result = await onSubmit(mode, payload, selectedPo?.id);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else if (result.error?.toLowerCase().includes('po number')) {
      setFormErrors(prev => ({ ...prev, poNumber: 'This PO number is already used.' }));
    }
  };

  // Submit PO to backend
  const handleSubmitPO = async () => {
    setIsSubmittingPO(true);
    try {
      await onSubmitPO(selectedPo?.id);
      showSnackbar('Purchase order submitted successfully.', 'success');
      setSubmitDialog(false);
      onClose();
    } catch (err) {
      showSnackbar('Failed to submit purchase order.', 'error');
    } finally {
      setIsSubmittingPO(false);
    }
  };

  const renderViewMode = () => {
    if (!selectedPo) return <Typography>No Purchase Order selected.</Typography>;
    const supplier = allSuppliers.find(s => s.id === selectedPo.supplierId);
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={2}>Purchase Order Details</Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}> <Typography><strong>PO Number:</strong> {selectedPo.poNumber}</Typography> </Grid>
            <Grid item xs={12} sm={6}> <Typography><strong>Supplier:</strong> {supplier?.name || 'N/A'}</Typography> </Grid>
            <Grid item xs={12} sm={6}> <Typography><strong>Order Date:</strong> {new Date(selectedPo.orderDate).toLocaleDateString()}</Typography> </Grid>
            <Grid item xs={12} sm={6}> <Typography><strong>Expected Delivery:</strong> {selectedPo.expectedDeliveryDate ? new Date(selectedPo.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</Typography> </Grid>
            <Grid item xs={12} sm={6}> <Typography><strong>Status:</strong> {selectedPo.status}</Typography> </Grid>
            <Grid item xs={12}> <Typography><strong>Notes:</strong> {selectedPo.notes || '—'}</Typography> </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" mt={2} mb={1}>Items</Typography>
        <List sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 1 }}>
          {(selectedPo.items || []).map((item, index) => (
            <ListItem key={index} divider>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Typography><strong>SKU:</strong> {item.sku || 'N/A'}</Typography>
                <Typography><strong>Qty:</strong> {item.quantity}</Typography>
                <Typography><strong>Cost:</strong> ₹{Number(item.unitCost).toFixed(2)}</Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderFormMode = () => (
     <Box component="form" noValidate onSubmit={handleSubmit}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
            {mode === 'edit' ? 'Edit Purchase Order' : 'Create New Purchase Order'}
        </Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="PO Number" name="poNumber" value={formPo.poNumber} onChange={handleFormChange} fullWidth error={!!formErrors.poNumber} helperText={formErrors.poNumber} disabled={mode === 'edit' || isReadOnly} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={allSuppliers}
                  value={formPo.supplier || null}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    if (!option.name) return '';
                    const city = option.address ? option.address.split(',')[1]?.trim() : '';
                    const details = [city, option.phone].filter(Boolean).join(', ');
                    return `${option.name}${details ? ` (${details})` : ''}`;
                  }}
                  onChange={isReadOnly ? undefined : handleSupplierChange}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier"
                      error={!!formErrors.supplier}
                      helperText={
                        formErrors.supplier
                          ? formErrors.supplier
                          : allSuppliers.length === 0
                          ? 'No suppliers yet — use the "New" button to create one'
                          : ''
                      }
                      required
                    />
                  )}
                  disabled={isReadOnly}
                  noOptionsText={
                    <Button
                      size="small"
                      startIcon={<PersonAddIcon />}
                      onClick={() => setCreateSupplierDialog(true)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Create New Supplier
                    </Button>
                  }
                />
                {!isReadOnly && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setCreateSupplierDialog(true)}
                    sx={{ mt: 0.5, whiteSpace: 'nowrap', minWidth: 'auto', fontWeight: 700, borderRadius: 2 }}
                    title="Create New Supplier"
                  >
                    New
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Order Date" type="date" name="orderDate" value={formPo.orderDate} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} error={!!formErrors.orderDate} helperText={formErrors.orderDate} required disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Expected Delivery" type="date" name="expectedDeliveryDate" value={formPo.expectedDeliveryDate} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} disabled={isReadOnly} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" name="notes" value={formPo.notes} onChange={handleFormChange} fullWidth multiline rows={2} InputProps={{ startAdornment: (<InputAdornment position="start"><NoteAddIcon /></InputAdornment>),}} disabled={isReadOnly}/>
            </Grid>
        </Grid>

        <Divider sx={{ my: 3 }}><Chip label="Items" /></Divider>

        <List>
            {formPo.items.map((item, index) => (
            <ListItem key={item.tempId} sx={{ p: 0, mb: 2 }}>
                <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={5}>
                    <Autocomplete
                      options={itemVariantOptions[index] || itemVariantOptions[0] || []}
                      value={(itemVariantOptions[index] || itemVariantOptions[0] || []).find(v => v.id === item.itemVariantId) || null}
                      getOptionLabel={(option) => `${option.name || ''} (${option.sku || ''})`}
                      onInputChange={(_, value, reason) => {
                        if (!isReadOnly && reason === 'input' && typeof value === 'string') fetchVariantOptions(value, index);
                      }}
                      onChange={isReadOnly ? undefined : (_, value) => handleItemVariantChange(value, index)}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Item Variant" size="small" required disabled={isReadOnly} />
                      )}
                      disabled={isReadOnly}
                    />
                </Grid>
                <Grid item xs={5} sm={3}>
                    <TextField label="Quantity" name="quantity" value={item.quantity} onChange={e => handleItemChange(e, index)} type="number" fullWidth size="small" required inputProps={{ min: 1 }} disabled={isReadOnly} />
                </Grid>
                <Grid item xs={5} sm={3}>
                    <TextField label="Unit Cost" name="unitCost" value={item.unitCost} onChange={e => handleItemChange(e, index)} type="number" fullWidth size="small" required InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} inputProps={{ min: 0 }} disabled={isReadOnly} />
                </Grid>
                <Grid item xs={2} sm={1}>
                    {formPo.items.length > 1 && !isReadOnly && <IconButton onClick={() => handleRemoveItem(index)} color="error"><DeleteIcon /></IconButton>}
                </Grid>
                </Grid>
            </ListItem>
            ))}
        </List>
        {!isReadOnly && <Button onClick={handleAddItem} startIcon={<AddIcon />} variant="outlined">Add Item</Button>}
        {formErrors.items && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{formErrors.items}</Typography>}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 4, gap: 2 }}>
            <Typography variant="h6">Total: ₹{formPo.totalAmount}</Typography>
            <Button onClick={onClose} variant="outlined" color="secondary">Cancel</Button>
            {!isReadOnly && (
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (mode === 'edit' ? 'Update PO' : 'Create PO')}
              </Button>
            )}
        </Box>
        {/* Show Submit PO button only if editing a DRAFT */}
        {(mode === 'edit' && formPo.status === 'DRAFT') && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={() => setSubmitDialog(true)}
              disabled={isSubmittingPO}
            >
              {isSubmittingPO ? <CircularProgress size={24} color="inherit" /> : 'Submit PO'}
            </Button>
          </Box>
        )}

        {/* Submit PO confirmation dialog */}
        <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)}>
          <DialogTitle>Submit Purchase Order</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to submit this purchase order? <br />
              <strong>Once submitted, it cannot be edited.</strong>
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubmitDialog(false)} color="secondary">Cancel</Button>
            <Button
              onClick={handleSubmitPO}
              variant="contained"
              color="primary"
              disabled={isSubmittingPO}
            >
              {isSubmittingPO ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );

  return (
    <>
      <StyledModal open={open} onClose={onClose}>
        <ModalContent>
          {mode === 'view' ? renderViewMode() : renderFormMode()}
        </ModalContent>
      </StyledModal>

      {/* Inline Create Supplier Dialog — rendered outside StyledModal so Modal has a single child */}
      <Dialog
        open={createSupplierDialog}
        onClose={() => setCreateSupplierDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" />
          Create New Supplier
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth required
                label="Supplier Name"
                value={supplierForm.name}
                onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={supplierForm.phone}
                onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={supplierForm.email}
                onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={supplierForm.address}
                onChange={e => setSupplierForm(p => ({ ...p, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GSTIN"
                value={supplierForm.gstin}
                onChange={e => setSupplierForm(p => ({ ...p, gstin: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateSupplierDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSupplier}
            disabled={isCreatingSupplier || !supplierForm.name.trim()}
            startIcon={isCreatingSupplier ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}
          >
            {isCreatingSupplier ? 'Creating...' : 'Create Supplier'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

export default PurchaseOrderModal;