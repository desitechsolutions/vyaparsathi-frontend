import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, MenuItem, IconButton, Typography, Box, Alert, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { getSuppliers, fetchReceiving, fetchItems, createPurchaseReturn } from '../../services/api';

const PurchaseReturnFormDialog = ({ open, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [receivings, setReceivings] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  const [supplierId, setSupplierId] = useState('');
  const [receivingId, setReceivingId] = useState('');
  const [notes, setNotes] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  const loadFormData = async () => {
    try {
      const [suppRes, recRes, itemRes] = await Promise.all([
        getSuppliers(),
        fetchReceiving(),
        fetchItems()
      ]);
      setSuppliers(suppRes || []);
      const recs = Array.isArray(recRes?.content) ? recRes.content : (Array.isArray(recRes) ? recRes : []);
      setReceivings(recs);
      const items = Array.isArray(itemRes?.data) ? itemRes.data : (Array.isArray(itemRes) ? itemRes : []);
      setItemsList(items);
    } catch (err) {
      console.error("Error loading return form data", err);
    }
  };

  const handleAddItem = () => {
    setReturnItems([
      ...returnItems,
      { itemVariantId: '', batchNumber: '', quantity: 1, unitCost: 0, reason: '' }
    ]);
  };

  const handleRemoveItem = (index) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...returnItems];
    updated[index][field] = value;

    // Auto populate unit cost if variant selected
    if (field === 'itemVariantId') {
      const selected = selectableVariants.find(v => v.id === value);
      if (selected) {
        updated[index].unitCost = selected.unitCost || 0;
        updated[index].batchNumber = selected.batchNumber || '';
      }
    }
    setReturnItems(updated);
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (returnItems.length === 0) {
      setError('Please add at least one item to return');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const selectedRec = receivings.find(r => r.id === Number(receivingId));
      const validItems = returnItems
        .filter(item => item.itemVariantId && Number(item.quantity) > 0)
        .map(item => ({
          itemVariantId: Number(item.itemVariantId),
          batchNumber: item.batchNumber && String(item.batchNumber).trim() !== '' ? String(item.batchNumber).trim() : null,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost || 0),
          reason: item.reason || 'Defective/Return'
        }));

      if (validItems.length === 0) {
        setError('Please select valid item variants and quantities to return.');
        setSubmitting(false);
        return;
      }

      const payload = {
        supplierId: Number(supplierId),
        purchaseOrderId: selectedRec?.purchaseOrderId || null,
        receivingId: receivingId ? Number(receivingId) : null,
        notes: notes || null,
        items: validItems
      };

      await createPurchaseReturn(payload);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create Purchase Return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSupplierId('');
    setReceivingId('');
    setNotes('');
    setReturnItems([]);
    setError('');
    onClose();
  };

  const handleReceivingChange = (e) => {
    const selectedRecId = e.target.value;
    setReceivingId(selectedRecId);
    if (selectedRecId) {
      const selectedRec = receivings.find(r => r.id === Number(selectedRecId));
      if (selectedRec && selectedRec.receivingItems) {
        // ONLY include items that were actually received (receivedQty > 0)
        const validItems = selectedRec.receivingItems.filter(ri => (ri.receivedQty || 0) > 0);
        setReturnItems(validItems.map(ri => ({
          itemVariantId: ri.itemVariantId,
          batchNumber: ri.batchNumber || '',
          quantity: ri.receivedQty || 1,
          unitCost: ri.unitCost || 0,
          reason: 'Defective/Return'
        })));
      }
    }
  };

  const selectedReceiving = receivings.find(r => r.id === Number(receivingId));
  
  // If a receiving is selected, only offer items that were actually received (>0 qty)
  const selectableVariants = selectedReceiving && selectedReceiving.receivingItems
    ? selectedReceiving.receivingItems
        .filter(ri => (ri.receivedQty || 0) > 0)
        .map(ri => ({
          id: ri.itemVariantId,
          displayName: `${ri.name || 'Item'} (${ri.sku || 'N/A'}) - Batch: ${ri.batchNumber || 'N/A'} [Received: ${ri.receivedQty}]`,
          unitCost: ri.unitCost || 0,
          batchNumber: ri.batchNumber || ''
        }))
    : itemsList.flatMap(item =>
        (item.variants || []).map(v => ({
          id: v.id,
          displayName: `${item.name} (${v.sku})`,
          unitCost: v.pricePerUnit || 0,
          batchNumber: v.batchNumber || ''
        }))
      );

  const filteredReceivings = receivings.filter(r => 
    !supplierId || r.supplier?.id === Number(supplierId)
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>Create Purchase Return / Debit Note</DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'divider' }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Supplier"
              fullWidth
              size="small"
              required
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                setReceivingId('');
                setReturnItems([]);
              }}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.phone})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Link to Goods Receipt (Optional)"
              fullWidth
              size="small"
              value={receivingId}
              onChange={handleReceivingChange}
            >
              <MenuItem value="">-- None --</MenuItem>
              {filteredReceivings.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  GR #{r.id} ({r.grNumber || 'PO: ' + (r.poNumber || 'N/A')}) - {new Date(r.receivedAt).toLocaleDateString()}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Return Notes / Justification"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary">Returned Items</Typography>
          <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddItem} sx={{ fontWeight: 700, borderRadius: 2 }}>
            Add Item
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>ITEM VARIANT</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>BATCH #</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 100 }}>QTY</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 120 }}>UNIT COST (₹)</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>REASON</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', width: 60 }}>ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returnItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Click "Add Item" to add items to return.
                  </TableCell>
                </TableRow>
              ) : (
                returnItems.map((item, index) => (
                  <TableRow key={index} hover sx={{ '&:hover': { bgcolor: 'action.hover !important' } }}>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={item.itemVariantId}
                        onChange={(e) => handleItemChange(index, 'itemVariantId', e.target.value)}
                        sx={{ minWidth: 220 }}
                        SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }}
                      >
                        {selectableVariants.map((v) => (
                          <MenuItem key={v.id} value={v.id} sx={{ py: 1, fontSize: '0.875rem' }}>
                            {v.displayName}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={item.batchNumber}
                        onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                        sx={{ minWidth: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        sx={{ minWidth: 90 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                        sx={{ minWidth: 110 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={item.reason}
                        onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                        sx={{ minWidth: 140 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => handleRemoveItem(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting} sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}>
          {submitting ? 'Submitting...' : 'Create Draft Return'}
        </Button>
      </DialogActions>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError('')} sx={{ borderRadius: 2, fontWeight: 700 }}>
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default PurchaseReturnFormDialog;
