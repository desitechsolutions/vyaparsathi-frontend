import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box, Container, Typography, Paper, Button, Stack, TextField, Autocomplete,
  Stepper, Step, StepLabel, Alert, CircularProgress, Divider, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, IconButton, Chip, Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Save as SaveIcon,
  CheckCircleOutline as ConfirmIcon,
  Inventory2Outlined as InventoryIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';

import { useShop } from '../../context/ShopContext';
import StatutoryFieldset from '../../components/StatutoryFieldset';
import {
  pendingPurchaseOrders,
  getPurchaseOrderById,
  initiateReceivingFromPO,
  updateReceiving,
  confirmReceiving,
} from '../../services/api';

const STEPS = ['Header', 'Line entry', 'Review & submit'];

const formatInr = (val) =>
  Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

const zeroLine = (poItem) => ({
  purchaseOrderItemId: poItem.id,
  itemVariantId: poItem.itemVariant?.id,
  name: poItem.itemVariant?.item?.name || poItem.itemVariant?.name || 'Item',
  sku: poItem.itemVariant?.sku || '',
  unitCost: Number(poItem.unitCost || 0),
  expectedQty: Number(poItem.quantity || 0),
  previouslyReceived: Number(poItem.receivedQuantity || 0),
  receivedQty: 0,
  damagedQty: 0,
  rejectedQty: 0,
  damageReason: '',
  rejectReason: '',
  batchNumber: '',
  manufacturingDate: '',
  expiryDate: '',
  serialNumber: '',
  warrantyStartDate: '',
  partReference: '',
  overageReason: '',
  isOveraged: false,
  notes: '',
});

const GrnCreatePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPoId = searchParams.get('poId');

  const { isElectronics, isAutomobile, industryType } = useShop();

  const [step, setStep] = useState(0);
  const [pendingPOs, setPendingPOs] = useState([]);
  const [selectedPo, setSelectedPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [header, setHeader] = useState({
    supplierInvoiceNo: '',
    supplierInvoiceDate: '',
    vehicleNo: '',
    deliveryChallanNo: '',
    notes: '',
    expectedDeliveryDate: '',
    dockBay: '',
    checklist: { vehicleSealed: false, tempCheck: false, invoiceMatches: false, packingIntact: false },
    freightActual: '',
    landedCostEnabled: false,
    // V99 statutory GST — all optional, BE derives sensible defaults.
    placeOfSupply: '',
    supplyType: '',
    reverseCharge: false,
    billToAddress: '',
    shipToAddress: '',
  });

  const [lines, setLines] = useState([]);

  // Load open POs on mount. If ?poId is in the URL, preselect it once we have the list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await pendingPurchaseOrders();
        if (cancelled) return;
        const filtered = (list || []).filter(
          (po) => po.status === 'SUBMITTED' || po.status === 'PARTIALLY_RECEIVED'
        );
        setPendingPOs(filtered);
        if (preselectedPoId) {
          const match = filtered.find((p) => String(p.id) === String(preselectedPoId));
          if (match) await selectPo(match);
        }
      } catch (e) {
        setError('Failed to load open purchase orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPo = async (po) => {
    if (!po) {
      setSelectedPo(null);
      setLines([]);
      return;
    }
    setLoading(true);
    try {
      const full = await getPurchaseOrderById(po.id);
      setSelectedPo(full);
      setLines((full.items || []).map(zeroLine));
    } catch (e) {
      setError('Failed to load PO details.');
    } finally {
      setLoading(false);
    }
  };

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((line, i) => {
      if (i !== idx) return line;
      const merged = { ...line, ...patch };
      const total = Number(merged.receivedQty || 0) + Number(merged.damagedQty || 0) + Number(merged.rejectedQty || 0);
      const remainingPo = Math.max(0, Number(merged.expectedQty || 0) - Number(merged.previouslyReceived || 0));
      merged.isOveraged = total > remainingPo && remainingPo >= 0;
      return merged;
    }));
  };

  const totals = useMemo(() => {
    let received = 0, damaged = 0, rejected = 0, value = 0, overages = 0;
    lines.forEach((l) => {
      const r = Number(l.receivedQty || 0);
      const d = Number(l.damagedQty || 0);
      const rj = Number(l.rejectedQty || 0);
      received += r; damaged += d; rejected += rj;
      value += (r + d + rj) * Number(l.unitCost || 0);
      if (l.isOveraged) overages += 1;
    });
    return { received, damaged, rejected, accepted: received, value, overages };
  }, [lines]);

  const canProceedFromHeader = !!selectedPo;
  const canProceedFromLines = totals.received + totals.damaged + totals.rejected > 0;

  const submit = async ({ confirm }) => {
    if (!selectedPo) return;
    // Enforce overage justification the same way the BE does.
    const missing = lines.find((l) => l.isOveraged && !l.overageReason?.trim());
    if (missing) {
      setError(`Overage reason required for line "${missing.name}" — the receipt exceeds the ordered qty.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Create the DRAFT/PENDING receiving record first.
      const createDto = {
        purchaseOrderId: selectedPo.id,
        shopId: selectedPo.shopId ?? selectedPo.shop?.id,
        notes: header.notes || null,
      };
      const created = await initiateReceivingFromPO(createDto);
      if (!created?.id) throw new Error('Backend returned no receiving id.');

      // Now populate the line-level data via the update endpoint.
      const receivingItems = lines
        .filter((l) => (Number(l.receivedQty || 0) + Number(l.damagedQty || 0) + Number(l.rejectedQty || 0)) > 0)
        .map((l) => ({
          purchaseOrderItemId: l.purchaseOrderItemId,
          receivedQty: Number(l.receivedQty || 0),
          damagedQty: Number(l.damagedQty || 0),
          rejectedQty: Number(l.rejectedQty || 0),
          damageReason: l.damageReason || null,
          rejectReason: l.rejectReason || null,
          batchNumber: l.batchNumber || null,
          manufacturingDate: l.manufacturingDate || null,
          expiryDate: l.expiryDate || null,
          serialNumber: l.serialNumber || null,
          warrantyStartDate: l.warrantyStartDate || null,
          partReference: l.partReference || null,
          overageReason: l.overageReason || null,
          isOveraged: !!l.isOveraged,
          overageNotes: l.notes || null,
        }));

      const updatePayload = {
        id: created.id,
        purchaseOrderId: selectedPo.id,
        shopId: selectedPo.shopId ?? selectedPo.shop?.id,
        supplierInvoiceNo: header.supplierInvoiceNo || null,
        supplierInvoiceDate: header.supplierInvoiceDate || null,
        vehicleNo: header.vehicleNo || null,
        deliveryChallanNo: header.deliveryChallanNo || null,
        expectedDeliveryDate: header.expectedDeliveryDate || null,
        dockBay: header.dockBay || null,
        checklistJson: JSON.stringify(header.checklist || {}),
        freightActual: header.freightActual ? Number(header.freightActual) : null,
        landedCostEnabled: !!header.landedCostEnabled,
        notes: header.notes || null,
        // Statutory pass-through — nullable, BE derives from supplier/shop.
        placeOfSupply:    header.placeOfSupply    || null,
        supplyType:       header.supplyType       || null,
        reverseCharge:    !!header.reverseCharge,
        billToAddress:    header.billToAddress    || null,
        shipToAddress:    header.shipToAddress    || null,
        receivingItems,
      };
      const updated = await updateReceiving(created.id, updatePayload);

      if (confirm) {
        try {
          await confirmReceiving(updated.id, header.notes || null);
        } catch (confirmErr) {
          // Non-blocking — the GRN was created and can be confirmed from the detail page.
          console.warn('Confirm step failed, GRN saved as PENDING', confirmErr);
        }
      }

      setSnackbar({ open: true, message: `GRN ${updated.grNumber || ''} created.`, severity: 'success' });
      navigate(`/receivings/${updated.id}`);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save GRN.');
    } finally {
      setSaving(false);
    }
  };

  const showBatchExpiry = !isElectronics; // FMCG, food, cosmetics, general — batch/expiry are common.
  const showSerial = !!isElectronics;
  const showPartRef = !!isAutomobile;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/receivings')} size="small">
            <BackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>New Goods Receipt Note</Typography>
        </Stack>

        <Paper elevation={0} sx={{
          p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Paper elevation={0} sx={{
          p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          {loading && !selectedPo ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : step === 0 ? (
            <Stack spacing={3}>
              <Autocomplete
                options={pendingPOs}
                value={selectedPo}
                onChange={(_, v) => selectPo(v)}
                getOptionLabel={(o) => o
                  ? `${o.poNumber || o.id} — ${o.supplier?.name || 'Supplier'} · ₹${formatInr(o.totalAmount)}`
                  : ''}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                renderInput={(params) => (
                  <TextField {...params} label="Purchase Order *" placeholder="Search open PO by number or supplier"
                    helperText="Only SUBMITTED / PARTIALLY_RECEIVED POs are listed." />
                )}
              />

              {selectedPo && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">SUPPLIER</Typography>
                      <Typography variant="body1" fontWeight={700}>{selectedPo.supplier?.name || '—'}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedPo.supplier?.address || ''}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">PO VALUE</Typography>
                      <Typography variant="body1" fontWeight={700}>₹{formatInr(selectedPo.totalAmount)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPo.items?.length || 0} line{(selectedPo.items?.length || 0) === 1 ? '' : 's'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              )}

              <Divider />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Supplier invoice #" fullWidth
                  value={header.supplierInvoiceNo}
                  onChange={(e) => setHeader((s) => ({ ...s, supplierInvoiceNo: e.target.value }))} />
                <TextField label="Supplier invoice date" type="date" fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={header.supplierInvoiceDate}
                  onChange={(e) => setHeader((s) => ({ ...s, supplierInvoiceDate: e.target.value }))} />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Vehicle #" fullWidth
                  value={header.vehicleNo}
                  onChange={(e) => setHeader((s) => ({ ...s, vehicleNo: e.target.value }))} />
                <TextField label="Delivery challan #" fullWidth
                  value={header.deliveryChallanNo}
                  onChange={(e) => setHeader((s) => ({ ...s, deliveryChallanNo: e.target.value }))} />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Expected delivery date" type="date" fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={header.expectedDeliveryDate}
                  onChange={(e) => setHeader((s) => ({ ...s, expectedDeliveryDate: e.target.value }))} />
                <TextField label="Dock / bay" fullWidth
                  placeholder="e.g. DOCK-3"
                  value={header.dockBay}
                  onChange={(e) => setHeader((s) => ({ ...s, dockBay: e.target.value }))} />
              </Stack>
              <TextField label="Notes" fullWidth multiline minRows={2}
                value={header.notes}
                onChange={(e) => setHeader((s) => ({ ...s, notes: e.target.value }))} />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Actual freight paid (₹)" type="number" fullWidth
                  value={header.freightActual}
                  onChange={(e) => setHeader((s) => ({ ...s, freightActual: e.target.value }))}
                  helperText="Optional — may differ from PO freight estimate."
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 320 }}>
                  <input type="checkbox"
                    checked={!!header.landedCostEnabled}
                    onChange={(e) => setHeader((s) => ({ ...s, landedCostEnabled: e.target.checked }))} />
                  <Typography variant="body2" fontWeight={600}>
                    Allocate freight to line unit cost (landed cost)
                  </Typography>
                </label>
              </Stack>

              <Divider>
                <Typography variant="caption" color="text.secondary" fontWeight={700}
                  sx={{ letterSpacing: 0.6 }}>STATUTORY / GST</Typography>
              </Divider>
              <StatutoryFieldset
                title=""
                value={{
                  placeOfSupply: header.placeOfSupply,
                  supplyType: header.supplyType,
                  reverseCharge: header.reverseCharge,
                  billToAddress: header.billToAddress,
                  shipToAddress: header.shipToAddress,
                }}
                onChange={(next) => setHeader((s) => ({ ...s, ...next }))}
                showConsignee={false}
              />

              <Divider>
                <Typography variant="caption" color="text.secondary" fontWeight={700}
                  sx={{ letterSpacing: 0.6 }}>PRE-RECEIPT CHECKLIST</Typography>
              </Divider>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
                {[
                  ['vehicleSealed', 'Vehicle seals intact'],
                  ['tempCheck', 'Temperature/condition OK'],
                  ['invoiceMatches', 'Invoice matches challan'],
                  ['packingIntact', 'Packing undamaged'],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox"
                      checked={!!header.checklist[key]}
                      onChange={(e) => setHeader((s) => ({
                        ...s, checklist: { ...s.checklist, [key]: e.target.checked },
                      }))} />
                    <span>{label}</span>
                  </label>
                ))}
              </Stack>
            </Stack>
          ) : step === 1 ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Enter received, damaged, and rejected quantities per line. Overages
                (beyond the remaining PO quantity) require a justification.
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Scan or type SKU / barcode to increment received qty…"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  const scanned = e.target.value.trim();
                  if (!scanned) return;
                  const idx = lines.findIndex((l) => (l.sku || '').toUpperCase() === scanned.toUpperCase());
                  if (idx >= 0) {
                    updateLine(idx, { receivedQty: Number(lines[idx].receivedQty || 0) + 1 });
                    e.target.value = '';
                  } else {
                    setError(`No line found for SKU "${scanned}".`);
                  }
                }}
                sx={{ maxWidth: 480 }}
              />
              <input
                type="file"
                accept=".csv,text/csv"
                id="grn-bulk-import"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSnackbar({ open: true, message: `Bulk import queued for ${file.name} — save this draft first, then re-import from the edit page.`, severity: 'info' });
                  e.target.value = '';
                }}
              />
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Ordered</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Prev. Rec'd</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Received</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Damaged</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Rejected</TableCell>
                      {(showBatchExpiry) && <TableCell sx={{ fontWeight: 700 }}>Batch / Expiry</TableCell>}
                      {(showSerial) && <TableCell sx={{ fontWeight: 700 }}>Serial / Warranty</TableCell>}
                      {(showPartRef) && <TableCell sx={{ fontWeight: 700 }}>Part Ref</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line, idx) => (
                      <React.Fragment key={line.purchaseOrderItemId}>
                        <TableRow hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{line.name}</Typography>
                            {line.sku && (
                              <Typography variant="caption" color="text.secondary">{line.sku}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{line.expectedQty}</TableCell>
                          <TableCell align="right">{line.previouslyReceived}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number" size="small"
                              inputProps={{ min: 0, style: { textAlign: 'right', width: 72 } }}
                              value={line.receivedQty}
                              onChange={(e) => updateLine(idx, { receivedQty: Number(e.target.value || 0) })}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number" size="small"
                              inputProps={{ min: 0, style: { textAlign: 'right', width: 72 } }}
                              value={line.damagedQty}
                              onChange={(e) => updateLine(idx, { damagedQty: Number(e.target.value || 0) })}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number" size="small"
                              inputProps={{ min: 0, style: { textAlign: 'right', width: 72 } }}
                              value={line.rejectedQty}
                              onChange={(e) => updateLine(idx, { rejectedQty: Number(e.target.value || 0) })}
                            />
                          </TableCell>
                          {showBatchExpiry && (
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <TextField size="small" placeholder="Batch #" value={line.batchNumber}
                                  onChange={(e) => updateLine(idx, { batchNumber: e.target.value })}
                                  sx={{ width: 120 }} />
                                <TextField size="small" type="date"
                                  InputLabelProps={{ shrink: true }}
                                  value={line.expiryDate}
                                  onChange={(e) => updateLine(idx, { expiryDate: e.target.value })}
                                  sx={{ width: 150 }} />
                              </Stack>
                            </TableCell>
                          )}
                          {showSerial && (
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <TextField size="small" placeholder="Serial #" value={line.serialNumber}
                                  onChange={(e) => updateLine(idx, { serialNumber: e.target.value })}
                                  sx={{ width: 140 }} />
                                <TextField size="small" type="date"
                                  InputLabelProps={{ shrink: true }}
                                  value={line.warrantyStartDate}
                                  onChange={(e) => updateLine(idx, { warrantyStartDate: e.target.value })}
                                  sx={{ width: 150 }} />
                              </Stack>
                            </TableCell>
                          )}
                          {showPartRef && (
                            <TableCell>
                              <TextField size="small" placeholder="Part ref" value={line.partReference}
                                onChange={(e) => updateLine(idx, { partReference: e.target.value })}
                                sx={{ width: 160 }} />
                            </TableCell>
                          )}
                        </TableRow>
                        {(line.damagedQty > 0 || line.rejectedQty > 0 || line.isOveraged) && (
                          <TableRow>
                            <TableCell colSpan={99} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.06), py: 1 }}>
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                {line.damagedQty > 0 && (
                                  <TextField size="small" fullWidth label="Damage reason"
                                    value={line.damageReason}
                                    onChange={(e) => updateLine(idx, { damageReason: e.target.value })}
                                  />
                                )}
                                {line.rejectedQty > 0 && (
                                  <TextField size="small" fullWidth label="Rejection reason"
                                    value={line.rejectReason}
                                    onChange={(e) => updateLine(idx, { rejectReason: e.target.value })}
                                  />
                                )}
                                {line.isOveraged && (
                                  <TextField size="small" fullWidth
                                    color="warning"
                                    label="Overage reason (required)"
                                    value={line.overageReason}
                                    onChange={(e) => updateLine(idx, { overageReason: e.target.value })}
                                  />
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                    {lines.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={99} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Select a purchase order in step 1 to load its lines.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">SUPPLIER</Typography>
                  <Typography variant="body1" fontWeight={700}>{selectedPo?.supplier?.name || '—'}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">PO NUMBER</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedPo?.poNumber}</Typography>
                  {header.supplierInvoiceNo && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary">SUPPLIER INV</Typography>
                      <Typography variant="body2">{header.supplierInvoiceNo}</Typography>
                    </>
                  )}
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">SUMMARY</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Chip label={`Received: ${totals.received}`} color="success" />
                    <Chip label={`Damaged: ${totals.damaged}`} color="warning" />
                    <Chip label={`Rejected: ${totals.rejected}`} color="error" />
                  </Stack>
                  <Typography variant="h6" sx={{ mt: 2 }} fontWeight={800}>
                    ₹{formatInr(totals.value)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">GRN value</Typography>
                </Paper>
              </Stack>

              {totals.overages > 0 && (
                <Alert severity="warning" icon={<WarningIcon />}>
                  {totals.overages} line{totals.overages === 1 ? '' : 's'} exceed the ordered quantity.
                  Each requires a justification reason.
                </Alert>
              )}

              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Received</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Damaged</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Rejected</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.purchaseOrderItemId}>
                        <TableCell>{line.name}</TableCell>
                        <TableCell align="right">{line.receivedQty}</TableCell>
                        <TableCell align="right">{line.damagedQty}</TableCell>
                        <TableCell align="right">{line.rejectedQty}</TableCell>
                        <TableCell align="right">
                          ₹{formatInr((line.receivedQty + line.damagedQty + line.rejectedQty) * line.unitCost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          <Divider sx={{ my: 3 }} />
          <Stack direction="row" justifyContent="space-between">
            <Button
              variant="text"
              onClick={() => step === 0 ? navigate('/receivings') : setStep((s) => s - 1)}
              startIcon={<BackIcon />}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Stack direction="row" spacing={1}>
              {step < STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  endIcon={<NextIcon />}
                  onClick={() => setStep((s) => s + 1)}
                  disabled={step === 0 ? !canProceedFromHeader : !canProceedFromLines}
                  sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                >
                  Next
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={() => submit({ confirm: false })}
                    disabled={saving}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Save as draft
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<ConfirmIcon />}
                    onClick={() => submit({ confirm: true })}
                    disabled={saving}
                    sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                  >
                    {saving ? 'Saving…' : 'Confirm receipt'}
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default GrnCreatePage;
