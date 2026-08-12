import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell, TableHead,
  TableRow, Button, Alert, IconButton, Divider, CardActions, Box, TextField,
  CircularProgress, Tooltip, Stack, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, alpha, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
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
 * Net-of-discount line base (qty × unit price − line discount, clamped to 0).
 * This is the exact figure the backend uses for `taxableValue` on the sale item,
 * so the FE cart and the server's stored totals stay in sync.
 */
const lineNetBase = (item) => {
  const gross = Number(item.qty || 0) * Number(item.unitPrice || 0);
  const disc  = Number(item.discount || 0);
  return Math.max(0, gross - disc);
};

/**
 * Calculate line-level GST — always exclusive (added on top of the net line total,
 * so a per-line discount reduces the tax it attracts, matching backend behavior).
 */
const calcLineGst = (item) => {
  if (!item.gstRate) return 0;
  const rate = Number(item.gstRate) || 0;
  return lineNetBase(item) * rate / 100;
};

// ============ SUB-COMPONENTS ============

/**
 * Item Details Column
 */
const ItemDetailsCell = ({ item, isJewellery }) => {
  // Real-time stock chip — data is already loaded on `item.currentStock` when the
  // line was picked in ItemSection. Custom / service lines have no inventory,
  // so the chip is suppressed for them.
  const showStock = !item.isCustom && item.currentStock != null;
  const stockNum = Number(item.currentStock);
  const soldNum = Number(item.qty || 0);
  const remaining = Number.isFinite(stockNum) ? Math.max(0, stockNum - soldNum) : null;
  const stockColor = remaining == null ? 'default'
      : remaining <= 0 ? 'error'
      : remaining <= 5 ? 'warning'
      : 'success';

  return (
  <Tooltip
    title={
      <Box sx={{ p: 0.5, fontSize: '0.75rem' }}>
        {item.isCustom
          ? (item.customDescription || 'Custom / Service line')
          : `SKU: ${item.sku || '-'}`}
        {item.batchNumber && ` | Batch: ${item.batchNumber}`}
        {item.hallmarkNo && ` | HUID: ${item.hallmarkNo}`}
      </Box>
    }
    arrow
  >
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {item.itemName}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {item.isCustom
          ? (item.customHsnSac ? `Custom · SAC/HSN ${item.customHsnSac}` : 'Custom / Service')
          : `${item.color || ''} / ${item.size || ''}`}
      </Typography>
      {!item.isCustom && item.hsn && (
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.68rem' }}>
          HSN {item.hsn}
        </Typography>
      )}
      {showStock && (
        <Chip
          size="small"
          color={stockColor}
          variant="outlined"
          label={remaining <= 0 ? 'Out of stock' : `Stock: ${remaining}`}
          sx={{ ml: 0.5, mt: 0.25, height: 18, fontSize: '0.65rem', fontWeight: 700 }}
        />
      )}

      {isJewellery && item.weightGrams && (
        <Typography variant="caption" sx={{
          display: 'block',
          color: 'var(--color-secondary)',
          fontWeight: 700,
          mt: 0.25,
        }}>
          Wt: {item.weightGrams}g{item.metalPurity ? ` | ${item.metalPurity}` : ''}
        </Typography>
      )}

      {!isJewellery && item.mrp && (
        <Typography variant="caption" sx={{
          display: 'block',
          color: 'var(--color-success)',
          fontWeight: 700,
          mt: 0.25,
        }}>
          {calcMrpDiscountPct(item.mrp, item.unitPrice)}% off MRP ₹{Number(item.mrp).toFixed(2)}
        </Typography>
      )}
    </Box>
  </Tooltip>
  );
};

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
          color: 'var(--color-secondary)',
          mb: 0.25,
        }}
      >
        ₹{makingCharges.toFixed(2)}
      </Typography>
      {item.makingChargesPerGram > 0 && item.netWeightGrams > 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          ₹{item.makingChargesPerGram}/g × {item.netWeightGrams}g
        </Typography>
      )}
      {item.makingChargesPct > 0 && !item.makingChargesPerGram && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
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
  isJewellery,
  showGst,
  onEdit,
  onDelete,
}) => {
  // Line total is net of line-level discount (matches backend taxableValue).
  // `gross` and `lineDiscount` power the strike-through visualization when a
  // per-line discount is present.
  const gross = Number(item.qty || 0) * Number(item.unitPrice || 0);
  const lineDiscount = Number(item.discount || 0);
  const lineTotal = lineNetBase(item);
  const lineGst = calcLineGst(item);
  const lineMakingCharges = isJewellery ? calcMakingCharges(item) : 0;

  return (
    <TableRow hover sx={{
      '&:hover': { bgcolor: alpha('#0f766e', 0.04) },
    }}>
      <TableCell>
        <ItemDetailsCell item={item} isJewellery={isJewellery} />
      </TableCell>

      <TableCell align="center" sx={{ fontWeight: 600 }}>
        {item.qty}
      </TableCell>

      <TableCell align="right" sx={{ fontWeight: 600 }}>
        ₹{Number(item.unitPrice).toFixed(2)}
      </TableCell>

      {isJewellery && (
        <TableCell align="right" sx={{ color: 'var(--color-secondary)', fontSize: '0.75rem' }}>
          <MakingChargesCell item={item} makingCharges={lineMakingCharges} />
        </TableCell>
      )}

      {showGst && (
        <TableCell align="right" sx={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 600 }}>
          {item.gstRate > 0 ? `₹${lineGst.toFixed(2)} (${item.gstRate}%)` : '—'}
        </TableCell>
      )}

      <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--color-teal)' }}>
        ₹{lineTotal.toFixed(2)}
        {lineDiscount > 0 && (
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, textDecoration: 'line-through' }}>
            ₹{gross.toFixed(2)}
          </Typography>
        )}
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
    flex: embedded ? 1 : 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  }}>
    <ShoppingCartIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
    <Typography variant="body2" color="text.secondary">
      No items yet.
    </Typography>
    <Typography variant="caption" color="text.disabled">
      Search or scan a barcode to add.
    </Typography>
  </Box>
);

/**
 * Summary Box Component
 */
const SummaryRow = ({ label, value, muted = true, bold = false, valueColor }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
    <Typography variant="body2" sx={{
      color: muted ? 'text.secondary' : 'text.primary',
      fontSize: '0.82rem',
    }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{
      fontWeight: bold ? 700 : 500,
      color: valueColor || 'text.primary',
      fontSize: bold ? '0.95rem' : '0.82rem',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {value}
    </Typography>
  </Box>
);

const SummaryBox = ({
  subtotal,
  makingCharges,
  discount,
  gst,
  netPayable,
  isJewellery,
  showGst,
  onDiscountChange,
  discountMode = 'AMT',
  onDiscountModeChange,
  pctInput = 0,
  embedded,
}) => (
  <Box sx={{
    px: embedded ? 1.5 : 2,
    py: 1,
    flexShrink: 0,
    borderTop: '1px solid',
    borderTopColor: 'divider',
  }}>
    <Box sx={{ width: '100%', ml: 'auto', maxWidth: embedded ? '100%' : 360 }}>
      <SummaryRow
        label={isJewellery ? 'Subtotal (metal + stone)' : 'Subtotal'}
        value={`₹${subtotal.toFixed(2)}`}
      />

      {isJewellery && makingCharges > 0 && (
        <SummaryRow
          label="Making charges"
          value={`+ ₹${makingCharges.toFixed(2)}`}
        />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, gap: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
          Discount
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ToggleButtonGroup
            size="small"
            value={discountMode}
            exclusive
            onChange={onDiscountModeChange}
            aria-label="Discount mode"
            sx={{
              '& .MuiToggleButton-root': {
                minWidth: 28, height: 24, px: 0.75, py: 0,
                fontSize: '0.72rem', fontWeight: 700, lineHeight: 1,
              },
            }}
          >
            <ToggleButton value="AMT" aria-label="Rupees">₹</ToggleButton>
            <ToggleButton value="PCT" aria-label="Percent">%</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            type="number"
            variant="standard"
            value={discountMode === 'PCT' ? pctInput : discount}
            onChange={onDiscountChange}
            inputProps={{
              style: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem' },
              min: 0,
              max: discountMode === 'PCT' ? 100 : undefined,
            }}
            sx={{ width: 70 }}
          />
        </Box>
      </Box>
      {discountMode === 'PCT' && discount > 0 && (
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', color: 'text.secondary', mt: -0.5 }}>
          {pctInput}% = ₹{Number(discount).toFixed(2)}
        </Typography>
      )}

      {showGst && gst > 0 && (
        <SummaryRow
          label="GST"
          value={`+ ₹${gst.toFixed(2)}`}
        />
      )}

      <Divider sx={{ my: 0.75 }} />

      <SummaryRow
        label={<Typography component="span" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9rem' }}>Total</Typography>}
        value={`₹${netPayable.toFixed(2)}`}
        muted={false}
        bold
      />
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
      color: 'var(--color-warning)',
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
  isJewellery,
  embedded,
  hideActions,
}) => {
  const [discount, setDiscount] = useState(Number(formData.discount) || 0);
  // Bill-level discount mode: flat rupees ('AMT') or percentage-of-subtotal ('PCT').
  // Payload / backend / receipt still see a resolved ₹ amount — the mode is a
  // pure UX affordance so users can enter "10% off" without doing the math.
  const [discountMode, setDiscountMode] = useState('AMT');
  const [pctInput, setPctInput] = useState(0);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    setDiscount(Number(formData.discount) || 0);
  }, [formData.discount]);

  // ── MEMOIZED CALCULATIONS ──

  // Subtotal is net of line-level discounts — matches taxableValue on the backend
  // per SaleService.createSale (qty × unitPrice − line discount).
  const subtotal = useMemo(() =>
    formData.items.reduce((sum, item) => sum + lineNetBase(item), 0),
    [formData.items]
  );

  const totalMakingCharges = useMemo(() => {
    if (!isJewellery) return 0;
    return formData.items.reduce((sum, item) => sum + calcMakingCharges(item), 0);
  }, [formData.items, isJewellery]);

  const totalGst = useMemo(() => {
    if (formData.isGstRequired !== 'yes') return 0;
    return formData.items.reduce((sum, item) => sum + calcLineGst(item), 0);
  }, [formData.items, formData.isGstRequired]);

  // Net total includes exclusive GST so this matches the ReviewPaymentPage total.
  const netTotal = useMemo(
    () => Math.max(0, subtotal + totalMakingCharges + totalGst - discount),
    [subtotal, totalMakingCharges, totalGst, discount]
  );

  const netPayable = netTotal;

  // ── EFFECTS ──

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subtotal: (subtotal + totalMakingCharges).toFixed(2),
      discount: discount,
      invoiceDiscount: discount,
      totalAmount: netPayable.toFixed(2),
    }));
  }, [subtotal, totalMakingCharges, discount, netPayable, setFormData]);

  // When in PCT mode, keep the resolved ₹ discount in sync with the % input
  // and the current subtotal — cart edits reflow the discount automatically.
  // Base is (subtotal + making charges + GST) to match how billLevelDiscount
  // is subtracted from the grand total on ReviewPaymentPage.
  useEffect(() => {
    if (discountMode !== 'PCT') return;
    const base = subtotal + totalMakingCharges + totalGst;
    const pct = Math.max(0, Math.min(100, Number(pctInput) || 0));
    const resolved = Number(((base * pct) / 100).toFixed(2));
    setDiscount(resolved);
  }, [discountMode, pctInput, subtotal, totalMakingCharges, totalGst]);

  // ── CALLBACKS ──

  const handleDiscountChange = useCallback((e) => {
    const val = Math.max(0, parseFloat(e.target.value) || 0);
    if (discountMode === 'PCT') {
      // Clamp % to [0, 100] — no over-100% discounts.
      setPctInput(Math.min(100, val));
    } else {
      setDiscount(val);
    }
  }, [discountMode]);

  const handleDiscountModeChange = useCallback((_e, next) => {
    if (!next || next === discountMode) return;
    setDiscountMode(next);
    if (next === 'AMT') {
      // Leaving PCT: the resolved ₹ discount stays as-is; user can now edit it flat.
      setPctInput(0);
    } else {
      // Entering PCT from AMT: keep pct 0 (don't guess a percentage from a ₹ amount).
      setDiscount(0);
    }
  }, [discountMode]);

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
    // These callbacks are only wired when SalesSummary runs inside the standalone
    // Sales page. In the embedded/preview mode they are undefined — guard each
    // call so Clear doesn't crash on undefined().
    handleCustomerSelect?.(null);
    setSelectedVariant?.(null);
    setItem?.({
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
    setSearchParams?.({});
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
            px: 1.5,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}>
            <Typography variant="caption" sx={{
              fontWeight: 600,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: 'text.secondary',
            }}>
              Cart {formData.items.length > 0 && `· ${formData.items.length} item${formData.items.length === 1 ? '' : 's'}`}
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
              <Table size="small" sx={{
                '& .MuiTableCell-root': { borderBottomColor: 'divider' },
              }}>
                <TableHead>
                  <TableRow sx={{
                    '& .MuiTableCell-root': {
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                      color: 'text.secondary',
                      borderBottom: '1px solid',
                      borderBottomColor: 'divider',
                      bgcolor: 'transparent',
                      py: 1,
                    },
                  }}>
                    <TableCell>Item</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    {isJewellery && <TableCell align="right">Making</TableCell>}
                    {showGst && <TableCell align="right">GST</TableCell>}
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center" width={72} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <CartItemRow
                      key={`${item.id}-${index}`}
                      item={item}
                      index={index}
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
            isJewellery={isJewellery}
            showGst={showGst}
            onDiscountChange={handleDiscountChange}
            discountMode={discountMode}
            onDiscountModeChange={handleDiscountModeChange}
            pctInput={pctInput}
            embedded={embedded}
          />
        </CardContent>

        {!hideActions && (
          <CardActions sx={{
            justifyContent: 'space-between',
            p: 2,
            bgcolor: 'background.paper',
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
                  borderColor: 'var(--color-teal)',
                  color: 'var(--color-teal)',
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