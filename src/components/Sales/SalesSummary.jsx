import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell, TableHead,
  TableRow, Button, Alert, IconButton, Divider, CardActions, Box, TextField,
  CircularProgress, Tooltip, Stack, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { calcMrpDiscountPct } from '../../utils/salesUtils';

// ============ CONSTANTS ============
const COLUMN_CONFIG = {
  standard: ['itemDetails', 'qty', 'unitPrice', 'total', 'actions'],
  pharmacy: ['itemDetails', 'qty', 'unitPrice', 'expiry', 'total', 'actions'],
  jewellery: ['itemDetails', 'qty', 'unitPrice', 'makingCharges', 'total', 'actions'],
  withGst: ['itemDetails', 'qty', 'unitPrice', 'gst', 'total', 'actions'],
};

// ============ HELPER FUNCTIONS ============

/**
 * Parse Java LocalDate (array or string) to Date object
 */
const parseBatchDate = (d) => {
  if (!d) return null;
  if (Array.isArray(d)) {
    const [y, m, day] = d;
    return new Date(y, m - 1, day);
  }
  return new Date(d);
};

/**
 * Calculate days until expiry
 */
const calcDaysUntilExpiry = (expiryDate) => {
  const expDate = parseBatchDate(expiryDate);
  if (!expDate) return null;
  return Math.floor((expDate - new Date()) / 86400000);
};

/**
 * Get expiry status label and color
 */
const getExpiryStatus = (expiryDate) => {
  const daysLeft = calcDaysUntilExpiry(expiryDate);
  if (daysLeft === null) return null;

  return {
    daysLeft,
    label: daysLeft <= 0
      ? 'Expired'
      : daysLeft <= 30
      ? `${daysLeft}d`
      : daysLeft <= 90
      ? `${daysLeft}d`
      : parseBatchDate(expiryDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    color: daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : daysLeft <= 90 ? 'warning' : 'success',
  };
};

/**
 * Calculate making charges for jewellery items
 */
const calcMakingCharges = (item) => {
  const qty = Number(item.qty) || 0;
  const netWt = Number(item.netWeightGrams) || Number(item.weightGrams) || 0;
  const perGram = Number(item.makingChargesPerGram) || 0;
  const pct = Number(item.makingChargesPct) || 0;
  const unitPrice = Number(item.unitPrice) || 0;

  if (perGram > 0 && netWt > 0) {
    return perGram * netWt * qty;
  }
  if (pct > 0) {
    return (pct / 100) * unitPrice * qty;
  }
  return 0;
};

/**
 * Calculate GST based on industry type
 */
const calcLineGst = (item, isPharmacy) => {
  if (!item.gstRate) return 0;
  const lineTotal = Number(item.qty) * Number(item.unitPrice);
  const rate = Number(item.gstRate) || 0;

  if (isPharmacy) {
    // MRP-inclusive: GST = lineTotal × rate / (100 + rate)
    return lineTotal * rate / (100 + rate);
  }
  // Non-pharmacy: GST is added on top
  return lineTotal * rate / 100;
};

// ============ SUB-COMPONENTS ============

/**
 * Item Details Column
 */
const ItemDetailsCell = ({ item, isPharmacy, isJewellery }) => (
  <Tooltip
    title={
      <Box sx={{ p: 0.5, fontSize: '0.75rem' }}>
        SKU: {item.sku}
        {item.batchNumber && ` | Batch: ${item.batchNumber}`}
        {item.hallmarkNo && ` | HUID: ${item.hallmarkNo}`}
      </Box>
    }
    arrow
  >
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f766e' }}>
        {item.itemName}
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748b' }}>
        {item.color} / {item.size}
      </Typography>

      {isJewellery && item.weightGrams && (
        <Typography variant="caption" sx={{
          display: 'block',
          color: '#7c3aed',
          fontWeight: 700,
          mt: 0.25,
        }}>
          Wt: {item.weightGrams}g{item.metalPurity ? ` | ${item.metalPurity}` : ''}
        </Typography>
      )}

      {!isJewellery && item.mrp && (
        <Typography variant="caption" sx={{
          display: 'block',
          color: '#10b981',
          fontWeight: 700,
          mt: 0.25,
        }}>
          {calcMrpDiscountPct(item.mrp, item.unitPrice)}% off MRP ₹{Number(item.mrp).toFixed(2)}
        </Typography>
      )}
    </Box>
  </Tooltip>
);

/**
 * Expiry Cell (Pharmacy Only)
 */
const ExpiryCell = ({ expiryDate }) => {
  const status = getExpiryStatus(expiryDate);
  if (!status) return <Typography variant="caption" color="text.disabled">—</Typography>;

  return (
    <Chip
      label={status.label}
      color={status.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
    />
  );
};

/**
 * Making Charges Cell (Jewellery Only)
 */
const MakingChargesCell = ({ item, makingCharges }) => {
  if (makingCharges <= 0) {
    return <Typography variant="caption" color="text.disabled">—</Typography>;
  }

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 700,
          color: '#7c3aed',
          mb: 0.25,
        }}
      >
        ₹{makingCharges.toFixed(2)}
      </Typography>
      {item.makingChargesPerGram > 0 && item.netWeightGrams > 0 && (
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          ₹{item.makingChargesPerGram}/g × {item.netWeightGrams}g
        </Typography>
      )}
      {item.makingChargesPct > 0 && !item.makingChargesPerGram && (
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          {item.makingChargesPct}% of value
        </Typography>
      )}
    </Box>
  );
};

/**
 * Table Row Component
 */
const CartItemRow = ({
  item,
  index,
  isPharmacy,
  isJewellery,
  showGst,
  onEdit,
  onDelete,
}) => {
  const lineTotal = Number(item.qty) * Number(item.unitPrice);
  const lineGst = calcLineGst(item, isPharmacy);
  const lineMakingCharges = isJewellery ? calcMakingCharges(item) : 0;

  return (
    <TableRow hover sx={{
      '&:hover': { bgcolor: alpha('#0f766e', 0.04) },
    }}>
      <TableCell>
        <ItemDetailsCell item={item} isPharmacy={isPharmacy} isJewellery={isJewellery} />
      </TableCell>

      <TableCell align="center" sx={{ fontWeight: 600 }}>
        {item.qty}
      </TableCell>

      <TableCell align="right" sx={{ fontWeight: 600 }}>
        ₹{Number(item.unitPrice).toFixed(2)}
      </TableCell>

      {isJewellery && (
        <TableCell align="right" sx={{ color: '#7c3aed', fontSize: '0.75rem' }}>
          <MakingChargesCell item={item} makingCharges={lineMakingCharges} />
        </TableCell>
      )}

      {isPharmacy && (
        <TableCell align="center">
          <ExpiryCell expiryDate={item.expiryDate} />
        </TableCell>
      )}

      {showGst && !isPharmacy && (
        <TableCell align="right" sx={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
          {item.gstRate > 0 ? `₹${lineGst.toFixed(2)} (${item.gstRate}%)` : '—'}
        </TableCell>
      )}

      <TableCell align="right" sx={{ fontWeight: 700, color: '#0f766e' }}>
        ₹{lineTotal.toFixed(2)}
      </TableCell>

      <TableCell align="center">
        <Tooltip title="Edit">
          <IconButton color="primary" size="small" onClick={() => onEdit(index)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" size="small" onClick={() => onDelete(index)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

/**
 * Empty State
 */
const EmptyCartState = ({ embedded }) => (
  <Box sx={{
    p: 4,
    textAlign: 'center',
    bgcolor: alpha('#0f766e', 0.02),
    flex: embedded ? 1 : 'none',
  }}>
    <ShoppingCartIcon sx={{ fontSize: 48, color: alpha('#0f766e', 0.3), mb: 1 }} />
    <Typography variant="body2" color="text.secondary">
      Your cart is empty. Search and add items above.
    </Typography>
  </Box>
);

/**
 * Summary Box Component
 */
const SummaryBox = ({
  subtotal,
  makingCharges,
  discount,
  gst,
  netPayable,
  isPharmacy,
  isJewellery,
  showGst,
  onDiscountChange,
  embedded,
}) => (
  <Box sx={{
    p: embedded ? 1.5 : 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    bgcolor: alpha('#0f766e', 0.02),
    flexShrink: 0,
  }}>
    <Box sx={{ width: embedded ? '100%' : { xs: '100%', md: '360px' } }}>
      {/* Subtotal */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {isJewellery ? 'Subtotal (Metal + Stone):' : 'Subtotal:'}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          ₹{subtotal.toFixed(2)}
        </Typography>
      </Box>

      {/* Making Charges */}
      {isJewellery && makingCharges > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 700 }}>
            Making Charges:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#7c3aed' }}>
            +₹{makingCharges.toFixed(2)}
          </Typography>
        </Box>
      )}

      {/* Discount */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Discount:
        </Typography>
        <TextField
          type="number"
          variant="standard"
          value={discount}
          onChange={onDiscountChange}
          inputProps={{
            style: { textAlign: 'right', fontWeight: 700, fontSize: '0.875rem' },
            min: 0,
          }}
          sx={{ width: 80 }}
        />
      </Box>

      {/* GST (Non-Pharmacy) */}
      {showGst && !isPharmacy && gst > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Total GST:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>
            +₹{gst.toFixed(2)}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 1.5 }} />

      {/* Grand Total */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f766e' }}>
          Grand Total:
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f766e' }}>
          ₹{netPayable.toFixed(2)}
        </Typography>
      </Box>

      {/* GST Breakdown (Pharmacy) */}
      {isPharmacy && showGst && gst > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            (incl. Tax ₹{gst.toFixed(2)})
          </Typography>
        </Box>
      )}
    </Box>
  </Box>
);

/**
 * Clear Confirmation Dialog
 */
const ClearConfirmDialog = ({ open, itemCount, onConfirm, onCancel }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      color: '#f59e0b',
      fontWeight: 800,
    }}>
      <WarningAmberIcon color="warning" />
      Clear Order?
    </DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      <Typography variant="body2">
        This will remove all <strong>{itemCount} item(s)</strong> from the cart and reset the form.
        This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onCancel} color="inherit" sx={{ fontWeight: 700 }}>
        Cancel
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={onConfirm}
        sx={{ fontWeight: 700 }}
      >
        Clear All
      </Button>
    </DialogActions>
  </Dialog>
);

// ============ MAIN COMPONENT ============

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
  isPharmacy,
  isJewellery,
  embedded,
  hideActions,
}) => {
  const [discount, setDiscount] = useState(Number(formData.discount) || 0);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    setDiscount(Number(formData.discount) || 0);
  }, [formData.discount]);

  // ── MEMOIZED CALCULATIONS ──

  const subtotal = useMemo(() =>
    formData.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0),
    [formData.items]
  );

  const totalMakingCharges = useMemo(() => {
    if (!isJewellery) return 0;
    return formData.items.reduce((sum, item) => sum + calcMakingCharges(item), 0);
  }, [formData.items, isJewellery]);

  const totalGst = useMemo(() => {
    if (formData.isGstRequired !== 'yes') return 0;
    return formData.items.reduce((sum, item) =>
      sum + calcLineGst(item, isPharmacy),
      0
    );
  }, [formData.items, formData.isGstRequired, isPharmacy]);

  const netTotal = useMemo(
    () => Math.max(0, subtotal + totalMakingCharges - discount),
    [subtotal, totalMakingCharges, discount]
  );

  const netPayable = useMemo(
    () => isPharmacy ? Math.round(netTotal) : netTotal,
    [netTotal, isPharmacy]
  );

  // ── EFFECTS ──

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      discount: discount,
      totalAmount: netPayable.toFixed(2),
    }));
  }, [discount, netPayable, setFormData]);

  // ── CALLBACKS ──

  const handleDiscountChange = useCallback((e) => {
    setDiscount(Math.max(0, parseFloat(e.target.value) || 0));
  }, []);

  const doClearForm = useCallback(() => {
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
      id: '',
      sku: '',
      qty: '',
      unitPrice: 0,
      itemName: '',
      description: '',
      color: '',
      size: '',
      brand: '',
      design: '',
      currentStock: 0,
    });
    setSearchParams({});
    setDiscount(0);
    setClearConfirmOpen(false);
  }, [setFormData, handleCustomerSelect, setSelectedVariant, setItem, setSearchParams]);

  const handleClearForm = useCallback(() => {
    if (formData.items.length > 0) {
      setClearConfirmOpen(true);
    } else {
      doClearForm();
    }
  }, [formData.items.length, doClearForm]);

  // ── DERIVED STATE ──

  const isActionDisabled = loading || formData.items.length === 0 || !selectedCustomer;
  const showGst = formData.isGstRequired === 'yes';
  const isEmpty = formData.items.length === 0;

  // ============ RENDER ============

  return (
    <Box sx={embedded ? {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
    } : { mt: 2 }}>
      <Card variant="outlined" sx={{
        ...(embedded ? {
          borderRadius: 0,
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
        } : {
          borderRadius: 3,
          border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
        }),
      }}>
        <CardContent sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          '&:last-child': { pb: 0 },
        }}>
          {/* Header */}
          <Box sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderBottom: `1px solid ${alpha('#0f766e', 0.1)}`,
            flexShrink: 0,
            bgcolor: alpha('#0f766e', 0.02),
          }}>
            <ReceiptLongIcon sx={{ color: '#0f766e' }} fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f766e' }}>
              Order Items ({formData.items.length})
            </Typography>
          </Box>

          {/* Table or Empty State */}
          {isEmpty ? (
            <EmptyCartState embedded={embedded} />
          ) : (
            <Box sx={{
              overflowX: 'auto',
              overflowY: 'auto',
              flex: embedded ? 1 : 'none',
              minHeight: 0,
            }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: alpha('#0f766e', 0.05) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#0f766e' }}>Item Details</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#0f766e' }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#0f766e' }}>Rate</TableCell>
                    {isJewellery && (
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#7c3aed' }}>
                        Making
                      </TableCell>
                    )}
                    {isPharmacy && (
                      <TableCell align="center" sx={{ fontWeight: 800, color: '#0f766e' }}>
                        Expiry
                      </TableCell>
                    )}
                    {showGst && !isPharmacy && (
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#10b981' }}>
                        GST
                      </TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#0f766e' }}>
                      Total
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#0f766e' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <CartItemRow
                      key={`${item.id}-${index}`}
                      item={item}
                      index={index}
                      isPharmacy={isPharmacy}
                      isJewellery={isJewellery}
                      showGst={showGst}
                      onEdit={handleEditItem}
                      onDelete={handleRemoveItem}
                    />
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Summary */}
          <SummaryBox
            subtotal={subtotal}
            makingCharges={totalMakingCharges}
            discount={discount}
            gst={totalGst}
            netPayable={netPayable}
            isPharmacy={isPharmacy}
            isJewellery={isJewellery}
            showGst={showGst}
            onDiscountChange={handleDiscountChange}
            embedded={embedded}
          />
        </CardContent>

        {!hideActions && (
          <CardActions sx={{
            justifyContent: 'space-between',
            p: 2,
            bgcolor: '#fff',
            flexShrink: 0,
            borderTop: `1px solid ${alpha('#0f766e', 0.1)}`,
          }}>
            <Button
              variant="text"
              color="inherit"
              startIcon={<ClearAllIcon />}
              onClick={handleClearForm}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Clear All
            </Button>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<SaveAsIcon />}
                onClick={handleSaveDraft}
                disabled={isActionDisabled}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: '#0f766e',
                  color: '#0f766e',
                }}
              >
                Save Draft
              </Button>

              {error && (
                <Alert severity="error" sx={{
                  py: 0.5,
                  bgcolor: alpha('#dc2626', 0.1),
                }}>
                  {error}
                </Alert>
              )}
            </Stack>
          </CardActions>
        )}
      </Card>

      {/* Clear Confirmation Dialog */}
      <ClearConfirmDialog
        open={clearConfirmOpen}
        itemCount={formData.items.length}
        onConfirm={doClearForm}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </Box>
  );
};

export default SalesSummary;