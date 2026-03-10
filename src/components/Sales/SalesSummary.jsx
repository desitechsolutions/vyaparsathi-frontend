import React, { useState, useMemo, useEffect } from 'react';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell, TableHead,
  TableRow, Button, Alert, IconButton, Divider, CardActions, Box, TextField,
  CircularProgress, Tooltip, Stack, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { calcMrpDiscountPct } from '../../utils/salesUtils';

const SalesSummary = ({
  formData,
  handleRemoveItem,
  setShowReviewPage,
  loading,
  error,
  setFormData,
  selectedCustomer,
  handleCustomerSelect,
  setSelectedVariant,
  setItem,
  setSearchParams,
  handleEditItem,
  handleSaveDraft,
  proceedDisabledTooltip,
  isPharmacy,
  isJewellery,
}) => {
  const [discount, setDiscount] = useState(Number(formData.discount) || 0);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    setDiscount(Number(formData.discount) || 0);
  }, [formData.discount]);

  // Issue 3 & 7: Parse Java LocalDate (array or string) for expiry display
  const parseBatchDate = (d) => {
    if (!d) return null;
    if (Array.isArray(d)) {
      const [y, m, day] = d;
      return new Date(y, m - 1, day);
    }
    return new Date(d);
  };

  // Issue 3: Expiry traffic light color
  const getExpiryChip = (expiryDate) => {
    if (!expiryDate) return null;
    const expiry = parseBatchDate(expiryDate);
    if (!expiry || isNaN(expiry)) return null;
    const daysLeft = Math.floor((expiry - new Date()) / 86400000);
    const label = daysLeft <= 0
      ? 'Expired'
      : daysLeft <= 30
      ? `${daysLeft}d`
      : daysLeft <= 90
      ? `${daysLeft}d`
      : expiry.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const color = daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : daysLeft <= 90 ? 'warning' : 'success';
    return <Chip label={label} color={color} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />;
  };

  const handleClearForm = () => {
    // Issue 7: Show confirmation if there are items in the cart
    if (formData.items.length > 0) {
      setClearConfirmOpen(true);
      return;
    }
    doClearForm();
  };

  const doClearForm = () => {
    setFormData({
      id: null,
      customerId: '',
      items: [],
      totalAmount: 0,
      isGstRequired: 'no',
      discount: 0,
      paymentMethods: [{ method: 'Cash', amount: 0 }],
      deliveryRequired: false,
    });
    handleCustomerSelect(null);
    setSelectedVariant(null);
    setItem({
      id: '', sku: '', qty: '', unitPrice: 0, itemName: '',
      description: '', color: '', size: '', brand: '', design: '', currentStock: 0,
    });
    setSearchParams({}); 
    setDiscount(0);
  };

  // Jewellery: compute making charges for a cart line item
  // Uses variant-level makingChargesPerGram (flat) or makingChargesPct (%) of unitPrice
  const calcMakingCharges = (saleItem) => {
    const qty = Number(saleItem.qty) || 0;
    const netWt = Number(saleItem.netWeightGrams) || Number(saleItem.weightGrams) || 0;
    const perGram = Number(saleItem.makingChargesPerGram) || 0;
    const pct = Number(saleItem.makingChargesPct) || 0;
    const unitPrice = Number(saleItem.unitPrice) || 0;

    // Flat per-gram takes priority if set; otherwise use percentage of line total
    if (perGram > 0 && netWt > 0) {
      return perGram * netWt * qty;
    }
    if (pct > 0) {
      return (pct / 100) * unitPrice * qty;
    }
    return 0;
  };

  // Total making charges across all jewellery items in cart
  const totalMakingCharges = useMemo(() => {
    if (!isJewellery) return 0;
    return formData.items.reduce((sum, item) => sum + calcMakingCharges(item), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items, isJewellery]);

  const subtotal = useMemo(() =>
    formData.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0),
    [formData.items]
  );

  // Issue 5: For pharmacy, GST is MRP-inclusive — display as breakdown, not addition.
  // For non-pharmacy (B2B), GST is additive on the selling price.
  const totalGst = useMemo(() => {
    if (formData.isGstRequired !== 'yes') return 0;
    return formData.items.reduce((sum, item) => {
      const rate = Number(item.gstRate) || 0;
      const lineTotal = Number(item.qty) * Number(item.unitPrice);
      if (isPharmacy) {
        // MRP-inclusive: GST = lineTotal × rate / (100 + rate)
        return sum + (lineTotal * rate / (100 + rate));
      }
      // Non-pharmacy: GST is added on top
      return sum + (lineTotal * rate / 100);
    }, 0);
  }, [formData.items, formData.isGstRequired, isPharmacy]);

  const netTotal = useMemo(
    () => Math.max(0, subtotal + totalMakingCharges - discount),
    [subtotal, totalMakingCharges, discount]
  );
  // Issue 5: Round to nearest rupee for pharmacy
  const netPayable = useMemo(() => isPharmacy ? Math.round(netTotal) : netTotal, [netTotal, isPharmacy]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      discount: discount,
      totalAmount: netPayable.toFixed(2)
    }));
  }, [discount, netPayable, setFormData]);

  const isActionDisabled = loading || formData.items.length === 0 || !selectedCustomer;

  return (
    <Box sx={{ mt: 2 }}>
      <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #e0e4e8' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Order Items ({formData.items.length})
            </Typography>
          </Box>
          
          {formData.items.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc' }}>
              <Typography variant="body2" color="text.secondary">
                Your cart is empty. Search and add items above.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item Details</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                      {isJewellery && (
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#7c3aed' }}>Making Charges</TableCell>
                      )}
                      {isPharmacy && (
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Expiry</TableCell>
                      )}
                      {formData.isGstRequired === 'yes' && !isPharmacy && (
                        <TableCell align="right" sx={{ fontWeight: 700 }}>GST</TableCell>
                      )}
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                <TableBody>
                  {formData.items.map((saleItem, index) => {
                    const lineTotal = Number(saleItem.qty) * Number(saleItem.unitPrice);
                    const gstAmt = !isPharmacy && formData.isGstRequired === 'yes'
                      ? lineTotal * (Number(saleItem.gstRate) || 0) / 100
                      : 0;
                    const mrpDiscount = calcMrpDiscountPct(saleItem.mrp, saleItem.unitPrice);
                    const lineMakingCharges = isJewellery ? calcMakingCharges(saleItem) : 0;
                    return (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Tooltip title={<Box sx={{ p: 0.5 }}>SKU: {saleItem.sku}{saleItem.batchNumber ? ` | Batch: ${saleItem.batchNumber}` : ''}{saleItem.hallmarkNo ? ` | HUID: ${saleItem.hallmarkNo}` : ''}</Box>} arrow>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{saleItem.itemName}</Typography>
                              <Typography variant="caption" color="text.secondary">{saleItem.color} / {saleItem.size}</Typography>
                              {isJewellery && saleItem.weightGrams && (
                                <Typography variant="caption" sx={{ display: 'block', color: '#7c3aed', fontWeight: 700 }}>
                                  Wt: {saleItem.weightGrams}g{saleItem.metalPurity ? ` | ${saleItem.metalPurity}` : ''}
                                </Typography>
                              )}
                              {mrpDiscount && !isJewellery && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'success.dark', fontWeight: 700 }}>
                                  {mrpDiscount}% off MRP ₹{Number(saleItem.mrp).toFixed(2)}
                                </Typography>
                              )}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">{saleItem.qty}</TableCell>
                        <TableCell align="right">₹{Number(saleItem.unitPrice).toFixed(2)}</TableCell>
                        {/* Jewellery: Making charges column */}
                        {isJewellery && (
                          <TableCell align="right" sx={{ color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600 }}>
                            {lineMakingCharges > 0 ? (
                              <Box>
                                <Typography variant="caption" fontWeight={700} color="secondary.dark">
                                  ₹{lineMakingCharges.toFixed(2)}
                                </Typography>
                                {saleItem.makingChargesPerGram > 0 && saleItem.netWeightGrams > 0 && (
                                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                    ₹{saleItem.makingChargesPerGram}/g × {saleItem.netWeightGrams}g
                                  </Typography>
                                )}
                                {saleItem.makingChargesPct > 0 && !saleItem.makingChargesPerGram && (
                                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                    {saleItem.makingChargesPct}% of value
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                        )}
                        {/* Issue 3: Expiry traffic light column (pharmacy only) */}
                        {isPharmacy && (
                          <TableCell align="center">
                            {getExpiryChip(saleItem.expiryDate) || <Typography variant="caption" color="text.disabled">—</Typography>}
                          </TableCell>
                        )}
                        {formData.isGstRequired === 'yes' && !isPharmacy && (
                          <TableCell align="right" sx={{ color: '#2e7d32', fontSize: '0.75rem' }}>
                            {Number(saleItem.gstRate) > 0 ? `₹${gstAmt.toFixed(2)} (${saleItem.gstRate}%)` : '—'}
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{lineTotal.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <IconButton color="primary" size="small" onClick={() => handleEditItem(index)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton color="error" size="small" onClick={() => handleRemoveItem(index)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}

          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', bgcolor: '#f8fafc' }}>
            <Box sx={{ width: { xs: '100%', md: '340px' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {isJewellery ? 'Subtotal (Metal + Stone):' : 'Subtotal:'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</Typography>
              </Box>
              {/* Jewellery: Making charges subtotal line */}
              {isJewellery && totalMakingCharges > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="secondary.dark" fontWeight={600}>Making Charges:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#7c3aed' }}>
                    +₹{totalMakingCharges.toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Discount:</Typography>
                <TextField
                  type="number" variant="standard" value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  inputProps={{ style: { textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' } }}
                  sx={{ width: 80 }}
                />
              </Box>
              {/* Issue 5: Non-pharmacy GST adds on top of subtotal */}
              {!isPharmacy && formData.isGstRequired === 'yes' && totalGst > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Total GST:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                    +₹{totalGst.toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Grand Total:</Typography>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 800 }}>
                  ₹{netPayable.toFixed(2)}
                </Typography>
              </Box>
              {/* Issue 5: Pharmacy GST shown as breakdown below Grand Total (inclusive) */}
              {isPharmacy && formData.isGstRequired === 'yes' && totalGst > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    (incl. Tax ₹{totalGst.toFixed(2)})
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', p: 2, bgcolor: '#fff' }}>
          <Button variant="text" color="inherit" startIcon={<ClearAllIcon />} onClick={handleClearForm} sx={{ fontWeight: 600 }}>
            Clear All
          </Button>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SaveAsIcon />}
              onClick={handleSaveDraft}
              disabled={isActionDisabled}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Save Draft
            </Button>

            {error && <Alert severity="error" size="small" sx={{ py: 0 }}>{error}</Alert>}
          </Stack>
        </CardActions>
      </Card>

      {/* Issue 7: Clear All Confirmation Dialog */}
      <Dialog open={clearConfirmOpen} onClose={() => setClearConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.dark' }}>
          <WarningAmberIcon color="warning" /> Clear Order?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will remove all <strong>{formData.items.length} item(s)</strong> from the cart and reset the form. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setClearConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => { setClearConfirmOpen(false); doClearForm(); }}
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesSummary;