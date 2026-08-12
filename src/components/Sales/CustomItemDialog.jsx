import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, MenuItem, Typography, Box,
} from '@mui/material';

/**
 * Dialog for adding a free-text / service line item to a sale.
 *
 * Free-text items are not linked to a catalog ItemVariant. Backend accepts them
 * via SaleItemDto with itemVariantId=null and customItemName populated. See the
 * V57__add_free_text_line_items_to_sale_item.sql migration.
 */
const GST_RATES = [0, 5, 12, 18, 28];

const CustomItemDialog = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    hsnSac: '',
    unit: '',
    qty: '1',
    unitPrice: '',
    gstRate: 0,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ name: '', description: '', hsnSac: '', unit: '', qty: '1', unitPrice: '', gstRate: 0 });
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    const qty = Number(form.qty);
    if (!qty || qty <= 0) e.qty = 'Quantity must be > 0';
    const price = Number(form.unitPrice);
    if (isNaN(price) || price < 0) e.unitPrice = 'Enter a valid price';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      customItemName: form.name.trim(),
      customDescription: form.description.trim() || null,
      customHsnSac: form.hsnSac.trim() || null,
      customUnit: form.unit.trim() || null,
      qty: Number(form.qty),
      unitPrice: Number(form.unitPrice),
      gstRate: Number(form.gstRate) || 0,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Custom / Service Line Item</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use this for one-off charges (installation, freight, packaging, service work) that are not in your product catalog.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              label="Item / Service Name"
              value={form.name}
              onChange={handleChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description (optional)"
              value={form.description}
              onChange={handleChange('description')}
              multiline
              minRows={2}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="HSN / SAC Code (optional)"
              value={form.hsnSac}
              onChange={handleChange('hsnSac')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Unit (e.g. hr, day, pcs)"
              value={form.unit}
              onChange={handleChange('unit')}
              fullWidth
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Quantity"
              type="number"
              value={form.qty}
              onChange={handleChange('qty')}
              error={!!errors.qty}
              helperText={errors.qty}
              inputProps={{ min: 0, step: '0.01' }}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Unit Price"
              type="number"
              value={form.unitPrice}
              onChange={handleChange('unitPrice')}
              error={!!errors.unitPrice}
              helperText={errors.unitPrice}
              inputProps={{ min: 0, step: '0.01' }}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="GST %"
              value={form.gstRate}
              onChange={handleChange('gstRate')}
              fullWidth
            >
              {GST_RATES.map((r) => (
                <MenuItem key={r} value={r}>{r}%</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Line Total: <strong>&#8377;{(Number(form.qty || 0) * Number(form.unitPrice || 0)).toFixed(2)}</strong>
            {form.gstRate > 0 && ` + ${form.gstRate}% GST`}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Add Item</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomItemDialog;
