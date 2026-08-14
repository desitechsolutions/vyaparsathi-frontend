import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Chip, IconButton, TextField, Grid,
  MenuItem, Select, FormControl, Stack, CircularProgress, Divider, Alert,
  Snackbar, Container, Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Card, CardContent, InputAdornment, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import PercentIcon from '@mui/icons-material/Percent';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import dayjs from 'dayjs';

import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrderById,
  submitPurchaseOrder,
  getSuppliers,
  createSupplier,
  fetchItemVariants,
  fetchItemVariantById,
  createItem,
  fetchCategories,
  createCategory,
} from '../../services/api';
import { numberToWords } from '../../utils/numberToWords';
import { useShop } from '../../context/ShopContext';
import useAuth from '../../hooks/useAuth';

const STANDARD_GST_RATES = [0, 3, 5, 12, 18, 28];
const STATUS_COLORS = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'error',
  PENDING: 'info',
  IN_PROGRESS: 'warning',
};

const emptyLine = () => ({
  itemVariantId: null,
  itemName: '',
  sku: '',
  hsnCode: '',
  quantity: 1,
  unitCost: 0,
  discount: 0,
  // Empty means "no rate assigned yet". When the shop picks a variant with
  // its own gstRate we adopt that; when they explicitly pick 0/5/12/18/28
  // that becomes the effective rate. We do NOT silently default to 18% —
  // that misleads unregistered / composition-scheme shops.
  gstRate: '',
});

const inr = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Client-side preview mirroring the BE recomputeTotals rules. BE stays
// authoritative on save; this only powers the summary sidebar while the shop
// is editing. Intra-state (CGST + SGST 50/50) is used for the preview by
// default; BE re-routes into IGST on save when the supplier state differs
// from the shop's.
const computeTotals = (items, freight, intraState) => {
  let taxable = 0;
  let totalDiscount = 0;
  const slabs = new Map();
  const perLine = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const cost = Number(it.unitCost) || 0;
    const disc = Number(it.discount) || 0;
    const gst = Number(it.gstRate) || 0;
    const lineTaxable = Math.max(0, qty * cost - disc);
    const lineTax = gst > 0 ? +(lineTaxable * gst / 100).toFixed(2) : 0;
    taxable += lineTaxable;
    totalDiscount += disc;
    if (gst > 0 && lineTaxable > 0) {
      const prev = slabs.get(gst) || { rate: gst, taxable: 0, tax: 0 };
      prev.taxable += lineTaxable;
      prev.tax += lineTax;
      slabs.set(gst, prev);
    }
    return {
      taxable: +lineTaxable.toFixed(2),
      tax: lineTax,
      lineTotal: +(lineTaxable + lineTax).toFixed(2),
    };
  });
  const totalTax = perLine.reduce((a, l) => a + l.tax, 0);
  const freightNum = Number(freight) || 0;
  const grandRaw = taxable + totalTax + freightNum;
  const grand = Math.round(grandRaw);
  const roundOff = +(grand - grandRaw).toFixed(2);
  return {
    taxable: +taxable.toFixed(2),
    totalDiscount: +totalDiscount.toFixed(2),
    totalTax: +totalTax.toFixed(2),
    slabs: [...slabs.values()].sort((a, b) => a.rate - b.rate),
    freight: +freightNum.toFixed(2),
    grand,
    roundOff,
    intraState,
    perLine,
  };
};

// Roles allowed to inline-create a catalog item from the PO editor.
// Mirrors the BE @PreAuthorize on ItemController.createItem — anything
// stricter is a Phase 5 permission-refinement concern.
const CATALOG_CREATE_ROLES = new Set(['OWNER', 'ADMIN', 'ROLE_OWNER', 'ROLE_ADMIN']);

export default function PurchaseOrderEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const { shop } = useShop();
  const theme = useTheme();
  const { user } = useAuth();

  // RBAC: only OWNER/ADMIN can inline-create catalog items.
  const canCreateCatalogItem = !!user?.role && CATALOG_CREATE_ROLES.has(user.role);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [submittingPO, setSubmittingPO] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'info' });

  const [suppliers, setSuppliers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [existing, setExisting] = useState(null);

  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '', gstin: '' });
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  // Inline "Add New Item" quick-create — mirrors the supplier flow.
  // itemLineIndex tracks which PO line will receive the newly-created variant.
  // Fields mirror the BE contract: name + categoryId are required on ItemDto;
  // unit + pricePerUnit are @NotBlank/@NotNull on the variant. SKU is server-
  // generated via ItemService.assignHsnAndSkuCodes (we send a placeholder that
  // BE overwrites), so the shop never types it. purchasePrice is optional —
  // it's the buy-side cost that becomes the PO line's unit_cost default.
  const [itemDialog, setItemDialog] = useState({ open: false, lineIndex: null });
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: '',
    unit: 'pcs',
    pricePerUnit: '',      // selling / MRP — required by BE
    purchasePrice: '',     // optional; used to seed the PO line's unit cost
    gstRate: '18',
    hsn: '',
  });
  const [creatingItem, setCreatingItem] = useState(false);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    supplier: null,
    orderDate: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
    expectedDeliveryDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    notes: '',
    freightCharges: 0,
    items: [emptyLine()],
  });

  const setField = useCallback((patch) => setForm((f) => ({ ...f, ...patch })), []);
  const setLine = useCallback((i, patch) => {
    setForm((f) => {
      const items = [...f.items];
      items[i] = { ...items[i], ...patch };
      return { ...f, items };
    });
  }, []);

  // Detect intra vs inter state for the preview. Real jurisdiction resolution
  // happens on save (BE is authoritative); this preview flips the CGST+SGST
  // split into IGST as soon as the shop picks a supplier whose state clearly
  // differs. If we can't resolve either side, we assume intra-state (matches
  // BE default in GstJurisdictionService).
  const intraState = useMemo(() => {
    const shopCode = shop?.stateCode
      || (shop?.state ? String(shop.state).toUpperCase().slice(0, 2) : null)
      || (shop?.gstin ? shop.gstin.slice(0, 2) : null);
    const supCode = form.supplier?.stateCode
      || (form.supplier?.gstin ? form.supplier.gstin.slice(0, 2) : null);
    if (!shopCode || !supCode) return true;
    return String(shopCode).replace(/^0/, '') === String(supCode).replace(/^0/, '');
  }, [shop, form.supplier]);

  const totals = useMemo(
    () => computeTotals(form.items, form.freightCharges, intraState),
    [form.items, form.freightCharges, intraState],
  );

  // ── Load suppliers + variants ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const s = await getSuppliers();
        setSuppliers(Array.isArray(s) ? s : (s?.data || []));
      } catch { /* ignore */ }
      try {
        const v = await fetchItemVariants();
        setVariants(Array.isArray(v?.data) ? v.data : Array.isArray(v) ? v : []);
      } catch { /* ignore */ }
    })();
  }, []);

  // ── Load existing PO for edit ────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const po = await getPurchaseOrderById(id);
        if (!po || cancelled) return;
        setExisting(po);
        setForm({
          supplier: po.supplier || { id: po.supplierId, name: '(loading…)' },
          orderDate: po.orderDate || dayjs().format('YYYY-MM-DDTHH:mm:ss'),
          expectedDeliveryDate: po.expectedDeliveryDate
            ? po.expectedDeliveryDate.split('T')[0]
            : '',
          notes: po.notes || '',
          freightCharges: Number(po.freightCharges) || 0,
          items: (po.items || []).length > 0
            ? po.items.map((it) => ({
                id: it.id,
                itemVariantId: it.itemVariantId ?? null,
                itemName: it.name || '',
                sku: it.sku || '',
                hsnCode: it.hsnCode || '',
                quantity: Number(it.quantity) || 0,
                unitCost: Number(it.unitCost) || 0,
                discount: Number(it.discount) || 0,                 // Load with the persisted rate as-is; 0 stays 0, no silent 18%.
                gstRate: it.gstRate != null ? Number(it.gstRate) : 0,
              }))
            : [emptyLine()],
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load purchase order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  // ── URL pre-fill (LowStockAlerts hand-off) ────────────────────────
  // Preserves Phase 1's contract: ?variantId=&qty=&supplierId=.
  // Fires once, after variants + suppliers are loaded so the pre-fill can
  // resolve the actual objects the pickers expect.
  useEffect(() => {
    if (isEdit) return;
    const variantId = searchParams.get('variantId');
    const supplierId = searchParams.get('supplierId');
    const qty = searchParams.get('qty');
    if (!variantId && !supplierId) return;
    if (!suppliers.length && supplierId) return; // wait for supplier list

    (async () => {
      const patch = {};
      if (supplierId) {
        patch.supplier = suppliers.find((s) => String(s.id) === String(supplierId)) || null;
      }
      if (variantId) {
        try {
          const variant = await fetchItemVariantById(variantId);
          if (variant) {
            const line = {
              ...emptyLine(),
              itemVariantId: variant.id,
              itemName: variant.name || variant.itemName || '',
              sku: variant.sku || '',
              hsnCode: variant.hsn || '',
              quantity: qty ? Number(qty) : 1,
              unitCost: Number(variant.purchasePrice) || 0,
              // Variant's own rate — never a silent 18% fallback.
              gstRate: variant.gstRate != null ? Number(variant.gstRate) : 0,
            };
            patch.items = [line];
            // Add to variant options so the picker can find it.
            setVariants((prev) => (prev.some((v) => v.id === variant.id) ? prev : [variant, ...prev]));
          }
        } catch { /* ignore */ }
      }
      if (Object.keys(patch).length) setForm((f) => ({ ...f, ...patch }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliers.length]);

  const editable = !isEdit || (existing && existing.status === 'DRAFT');

  // ── Line-item helpers ─────────────────────────────────────────────
  const addLine = () => setForm((f) => ({ ...f, items: [...f.items, emptyLine()] }));
  const removeLine = (i) => setForm((f) => ({
    ...f,
    items: f.items.length > 1 ? f.items.filter((_, idx) => idx !== i) : f.items,
  }));

  const handlePickCatalogItem = (i, v) => {
    if (!v) {
      setLine(i, { itemVariantId: null, itemName: '', sku: '', hsnCode: '' });
      return;
    }
    // "Empty" means the shop hasn't explicitly chosen a rate yet — treat
    // as an override target. "0" means the shop DID pick zero-rated (composition
    // scheme, exempt goods) and we preserve it. That's why the check compares
    // to the empty string rather than falsy.
    const currentGstRate = form.items[i].gstRate;
    const hasUserGstRate = currentGstRate !== '' && currentGstRate != null;

    setLine(i, {
      itemVariantId: v.id,
      itemName: v.name || v.itemName || '',
      sku: v.sku || '',
      hsnCode: v.hsn || '',
      // Only auto-fill unit cost if empty — never overwrite what the shop typed.
      unitCost: form.items[i].unitCost && Number(form.items[i].unitCost) > 0
        ? form.items[i].unitCost
        : (Number(v.purchasePrice) || 0),
      // Pull the variant's gstRate when the shop hasn't set one; final fallback
      // is 0 (no GST), NOT 18 — defaulting to 18 silently misleads shops that
      // don't charge tax.
      gstRate: hasUserGstRate
        ? currentGstRate
        : (v.gstRate != null ? Number(v.gstRate) : 0),
    });
  };

  // Inline item quick-create. Sends a minimal itemDto (name + single variant
  // with sku / unit / purchasePrice / gstRate / hsn) as multipart form-data
  // — matches the /api/catalog contract. On success, the new variant is
  // appended to the picker's option list and bound to the target PO line.
  const openItemDialog = async (lineIndex) => {
    if (!canCreateCatalogItem) {
      setSnackbar({ open: true, msg: 'Only owners and admins can add new catalog items.', severity: 'warning' });
      return;
    }
    setItemDialog({ open: true, lineIndex });
    setItemForm({
      name: '',
      categoryId: '',
      unit: 'pcs',
      pricePerUnit: '',
      purchasePrice: '',
      gstRate: '18',
      hsn: '',
    });
    // Fetch categories only once per dialog open — they rarely change during a
    // single session and the dropdown needs them synchronously.
    if (categories.length === 0) {
      try {
        const res = await fetchCategories();
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setCategories(list);
      } catch { /* ignore — user can still create via free-text below */ }
    }
  };

  // Client-side placeholder SKU. BE's ItemService.assignHsnAndSkuCodes runs on
  // createItem and overrides this with a canonical shop-scoped identifier, so
  // the shop never types or sees this value on the created variant.
  const placeholderSku = () => `AUTO-${Date.now().toString(36).toUpperCase()}`;

  const handleCreateItem = async () => {
    const err = validateItemForm(itemForm);
    if (err) {
      setSnackbar({ open: true, msg: err, severity: 'error' });
      return;
    }
    setCreatingItem(true);
    try {
      // If categoryId is a string (user typed a new category name), create it
      // first so we have an id to attach to the item.
      let categoryId = itemForm.categoryId;
      if (typeof categoryId === 'string' && !/^\d+$/.test(categoryId)) {
        const newCat = await createCategory({ name: categoryId.trim() });
        const catData = newCat?.data || newCat;
        categoryId = catData?.id;
        if (catData) setCategories((prev) => [...prev, catData]);
      } else if (typeof categoryId === 'string') {
        categoryId = Number(categoryId);
      }

      const itemDto = {
        name: itemForm.name.trim(),
        categoryId,
        variants: [{
          sku: placeholderSku(),
          unit: itemForm.unit || 'pcs',
          pricePerUnit: Number(itemForm.pricePerUnit),
          gstRate: itemForm.gstRate === '' ? 0 : Number(itemForm.gstRate),
          hsn: itemForm.hsn || null,
        }],
      };
      const fd = new FormData();
      fd.append('itemDto', new Blob([JSON.stringify(itemDto)], { type: 'application/json' }));
      const res = await createItem(fd);
      const created = res?.data || res;
      const newVariant = (created?.variants && created.variants[0]) || null;
      if (!newVariant?.id) throw new Error('Catalog returned no variant');

      // Add to the picker's option list, seed the current line, and if the shop
      // supplied a purchasePrice pre-fill the PO line's unit cost (the catalog
      // itself only carries pricePerUnit / selling; purchase cost lives on the PO).
      setVariants((prev) => [newVariant, ...prev]);
      handlePickCatalogItem(itemDialog.lineIndex, newVariant);
      if (itemForm.purchasePrice !== '') {
        setLine(itemDialog.lineIndex, { unitCost: Number(itemForm.purchasePrice) });
      }

      setItemDialog({ open: false, lineIndex: null });
      setSnackbar({ open: true, msg: `Added "${created.name}" to catalog.`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, msg: err?.response?.data?.message || 'Failed to create item.', severity: 'error' });
    } finally {
      setCreatingItem(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────
  const buildPayload = () => {
    const nn = (v) => (v === '' || v == null ? null : Number(v));
    return {
      // Empty poNumber signals "auto-generate" to BE (V84 sequence).
      poNumber: existing?.poNumber || null,
      supplierId: form.supplier?.id || null,
      orderDate: form.orderDate,
      expectedDeliveryDate: form.expectedDeliveryDate || null,
      notes: form.notes || null,
      freightCharges: Number(form.freightCharges) || 0,
      // Server-authoritative on total: FE preview matches BE math but final
      // wins on save.
      totalAmount: totals.grand,
      items: form.items
        .filter((it) => it.itemVariantId)
        .map((it) => ({
          itemVariantId: Number(it.itemVariantId),
          quantity: Number(it.quantity) || 0,
          unitCost: Number(it.unitCost) || 0,
          discount: Number(it.discount) || 0,
          gstRate: nn(it.gstRate),
          hsnCode: it.hsnCode || null,
        })),
    };
  };

  const validate = () => {
    if (!form.supplier) return 'Pick a supplier before saving.';
    if (!form.orderDate) return 'Order date is required.';
    if (form.items.every((it) => !it.itemVariantId)) return 'Add at least one line item.';
    const bad = form.items.find(
      (it) => it.itemVariantId && (!it.quantity || Number(it.quantity) <= 0 || !it.unitCost || Number(it.unitCost) < 0),
    );
    if (bad) return 'Every line needs a positive quantity and unit cost.';
    return null;
  };

  const saveDraft = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true); setError('');
    try {
      const payload = buildPayload();
      let saved;
      if (isEdit) {
        saved = await updatePurchaseOrder(id, payload);
      } else {
        saved = await createPurchaseOrder(payload);
      }
      setSnackbar({ open: true, msg: 'Draft saved.', severity: 'success' });
      // On create, jump to edit route so subsequent saves target the row.
      if (!isEdit && saved?.id) navigate(`/purchase-orders/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const saveAndSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSubmittingPO(true); setError('');
    try {
      const payload = buildPayload();
      let saved;
      if (isEdit) {
        saved = await updatePurchaseOrder(id, payload);
      } else {
        saved = await createPurchaseOrder(payload);
      }
      if (saved?.id) {
        await submitPurchaseOrder(saved.id);
      }
      setSnackbar({ open: true, msg: 'Purchase order submitted.', severity: 'success' });
      navigate(saved?.id ? `/purchase-orders/${saved.id}` : '/purchase-orders');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit purchase order.');
    } finally {
      setSubmittingPO(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!supplierForm.name.trim()) return;
    setCreatingSupplier(true);
    try {
      const created = await createSupplier(supplierForm);
      setSuppliers((prev) => [...prev, created]);
      setField({ supplier: created });
      setSupplierDialogOpen(false);
      setSupplierForm({ name: '', phone: '', email: '', address: '', gstin: '' });
      setSnackbar({ open: true, msg: 'Supplier created.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, msg: 'Failed to create supplier.', severity: 'error' });
    } finally {
      setCreatingSupplier(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ pt: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const statusChip = existing?.status ? (
    <Chip
      label={existing.status.replace(/_/g, ' ')}
      color={STATUS_COLORS[existing.status] || 'default'}
      size="small"
      sx={{ fontWeight: 700, letterSpacing: 0.3, borderRadius: 1 }}
    />
  ) : null;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 12 }}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          >
            {snackbar.msg}
          </Alert>
        </Snackbar>

        {/* Sticky top action bar — Zoho pattern */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}
        >
          <IconButton onClick={() => navigate('/purchase-orders')} size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
                {isEdit ? existing?.poNumber || 'Purchase Order' : 'New Purchase Order'}
              </Typography>
              {statusChip}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {isEdit
                ? editable
                  ? 'Editing a draft. Submit locks the PO for receiving.'
                  : 'Committed PO — read-only. Cancel or receive from the detail actions.'
                : 'PO number is generated on save. Line-level GST auto-splits by supplier state.'}
            </Typography>
          </Box>
          {editable && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={saveDraft}
                disabled={saving || submittingPO}
                sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}
              >
                Save Draft
              </Button>
              <Button
                variant="contained"
                startIcon={submittingPO ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={saveAndSubmit}
                disabled={saving || submittingPO}
                sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}
              >
                Save &amp; Submit
              </Button>
            </Stack>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3}>
          {/* Left column — details + line items */}
          <Grid item xs={12} lg={8}>
            {/* Supplier + dates card */}
            <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <PersonOutlineIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={800}>Supplier &amp; Dates</Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Autocomplete
                        sx={{ flex: 1 }}
                        options={suppliers}
                        getOptionLabel={(o) => o?.name || ''}
                        isOptionEqualToValue={(a, b) => a?.id === b?.id}
                        value={form.supplier}
                        onChange={(_, v) => setField({ supplier: v })}
                        disabled={!editable}
                        renderInput={(params) => (
                          <TextField {...params} size="small" label="Supplier" required
                            placeholder="Search supplier…" />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} key={option.id}>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{option.name}</Typography>
                              {(option.gstin || option.phone) && (
                                <Typography variant="caption" color="text.secondary">
                                  {option.gstin && <>GSTIN {option.gstin} · </>}
                                  {option.phone}
                                </Typography>
                              )}
                            </Box>
                          </li>
                        )}
                      />
                      {editable && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PersonAddIcon fontSize="small" />}
                          onClick={() => setSupplierDialogOpen(true)}
                          sx={{ mt: 0.25, whiteSpace: 'nowrap', fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
                        >
                          New
                        </Button>
                      )}
                    </Stack>
                    {form.supplier && (
                      <Box sx={{
                        mt: 1.5, p: 1.5, borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        border: '1px solid', borderColor: 'divider',
                      }}>
                        <Typography variant="body2" fontWeight={700}>{form.supplier.name}</Typography>
                        {form.supplier.gstin && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
                            GSTIN: {form.supplier.gstin}
                          </Typography>
                        )}
                        {form.supplier.phone && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {form.supplier.phone}{form.supplier.email && ` · ${form.supplier.email}`}
                          </Typography>
                        )}
                        {form.supplier.address && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {form.supplier.address}
                          </Typography>
                        )}
                        <Typography variant="caption" color={intraState ? 'success.main' : 'warning.main'} sx={{ display: 'block', mt: 0.5, fontWeight: 700 }}>
                          {intraState ? 'Intra-state — CGST + SGST' : 'Inter-state — IGST'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Order Date" type="date" size="small" fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={form.orderDate?.split('T')[0] || ''}
                      onChange={(e) => setField({ orderDate: e.target.value })}
                      disabled={!editable}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><CalendarMonthIcon fontSize="small" color="action" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Expected Delivery" type="date" size="small" fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={form.expectedDeliveryDate}
                      onChange={(e) => setField({ expectedDeliveryDate: e.target.value })}
                      disabled={!editable}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><LocalShippingIcon fontSize="small" color="action" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Line items */}
            <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={800}>Line Items</Typography>
                    <Chip label={`${form.items.length} line${form.items.length === 1 ? '' : 's'}`} size="small" variant="outlined" />
                  </Stack>
                  {editable && (
                    <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addLine}
                      sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}>
                      Add Line
                    </Button>
                  )}
                </Stack>

                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 900 }}>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, width: 40, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 800, minWidth: 260, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 800, width: 160, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>HSN</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 90, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 120, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>Unit Cost</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 100, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>Discount</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 100, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>GST %</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 130, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>Line Total</TableCell>
                        <TableCell align="center" sx={{ width: 50 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {form.items.map((it, i) => {
                        const preview = totals.perLine[i] || { taxable: 0, tax: 0, lineTotal: 0 };
                        return (
                          <TableRow key={it.id || i} sx={{ verticalAlign: 'top' }}>
                            <TableCell sx={{ pt: 2 }}>
                              <Chip size="small" label={i + 1} sx={{ fontWeight: 800, borderRadius: 0.75 }} />
                            </TableCell>
                            <TableCell>
                              <Autocomplete
                                size="small"
                                options={variants}
                                getOptionLabel={(v) => v
                                  ? `${v.name || v.itemName || 'Item'}${v.sku ? ' [' + v.sku + ']' : ''}`
                                  : ''}
                                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                                value={variants.find((v) => v.id === it.itemVariantId) || null}
                                onChange={(_, v) => handlePickCatalogItem(i, v)}
                                disabled={!editable}
                                renderInput={(params) => (
                                  <TextField {...params} placeholder="Search catalog…" size="small" />
                                )}
                                noOptionsText={
                                  canCreateCatalogItem && editable ? (
                                    <Button
                                      size="small"
                                      startIcon={<AddIcon fontSize="small" />}
                                      onMouseDown={(e) => { e.preventDefault(); openItemDialog(i); }}
                                      sx={{ textTransform: 'none', fontWeight: 700 }}
                                    >
                                      Add new item to catalog
                                    </Button>
                                  ) : 'No items found'
                                }
                              />
                              {editable && canCreateCatalogItem && !it.itemVariantId && (
                                <Button
                                  size="small"
                                  startIcon={<AddIcon fontSize="small" />}
                                  onClick={() => openItemDialog(i)}
                                  sx={{
                                    mt: 0.25, p: 0, textTransform: 'none', fontWeight: 600,
                                    fontSize: '0.72rem', color: 'primary.main',
                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                                  }}
                                >
                                  Add new item
                                </Button>
                              )}
                              {it.sku && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontFamily: 'monospace' }}>
                                  {it.sku}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ minWidth: 140 }}>
                              <TextField
                                size="small" fullWidth
                                value={it.hsnCode || ''}
                                onChange={(e) => setLine(i, { hsnCode: e.target.value })}
                                inputProps={{ maxLength: 20 }}
                                disabled={!editable}
                                placeholder="HSN / SAC"
                                sx={{ minWidth: 130 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small" type="number"
                                value={it.quantity}
                                onChange={(e) => setLine(i, { quantity: e.target.value })}
                                inputProps={{ min: 0, step: 1, style: { textAlign: 'right' } }}
                                disabled={!editable}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small" type="number"
                                value={it.unitCost}
                                onChange={(e) => setLine(i, { unitCost: e.target.value })}
                                inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }}
                                disabled={!editable}
                                sx={{ width: 110 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small" type="number"
                                value={it.discount}
                                onChange={(e) => setLine(i, { discount: e.target.value })}
                                inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }}
                                disabled={!editable}
                                sx={{ width: 90 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <FormControl size="small" sx={{ width: 90 }}>
                                <Select
                                  value={STANDARD_GST_RATES.includes(Number(it.gstRate)) ? Number(it.gstRate) : 'custom'}
                                  onChange={(e) => {
                                    if (e.target.value === 'custom') return;
                                    setLine(i, { gstRate: Number(e.target.value) });
                                  }}
                                  disabled={!editable}
                                  endAdornment={<PercentIcon fontSize="small" sx={{ mr: 3, color: 'text.disabled' }} />}
                                >
                                  {STANDARD_GST_RATES.map((r) => (
                                    <MenuItem key={r} value={r}>{r}%</MenuItem>
                                  ))}
                                  <MenuItem value="custom">Custom…</MenuItem>
                                </Select>
                              </FormControl>
                              {!STANDARD_GST_RATES.includes(Number(it.gstRate)) && (
                                <TextField
                                  size="small" type="number"
                                  value={it.gstRate}
                                  onChange={(e) => setLine(i, { gstRate: e.target.value })}
                                  inputProps={{ min: 0, max: 100, step: 0.5, style: { textAlign: 'right' } }}
                                  sx={{ width: 90, mt: 0.5 }}
                                  disabled={!editable}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={800} sx={{ pt: 1 }}>
                                {inr(preview.lineTotal)}
                              </Typography>
                              {preview.tax > 0 && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  taxable {inr(preview.taxable)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {editable && form.items.length > 1 && (
                                <IconButton size="small" onClick={() => removeLine(i)} color="error">
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {editable && (
                  <Box sx={{ mt: 2 }}>
                    <Button size="small" startIcon={<AddIcon />} variant="text" onClick={addLine}
                      sx={{ textTransform: 'none', fontWeight: 700 }}>
                      Add another line
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Charges + notes */}
            <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                  Additional Charges &amp; Notes
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Freight / Shipping"
                      type="number"
                      size="small"
                      fullWidth
                      value={form.freightCharges}
                      onChange={(e) => setField({ freightCharges: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      inputProps={{ min: 0, step: '0.01' }}
                      disabled={!editable}
                      helperText="Added to the grand total."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notes"
                      value={form.notes}
                      onChange={(e) => setField({ notes: e.target.value })}
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      disabled={!editable}
                      helperText="Internal notes — not sent to the supplier by default."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Right column — sticky Zoho-style summary sidebar */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
              <Paper
                variant="outlined"
                sx={{ borderRadius: 2, borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}
              >
                <Box sx={{
                  px: 2.5, py: 1.5,
                  borderBottom: '1px solid', borderColor: 'divider',
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                }}>
                  <Typography variant="overline" fontWeight={800} sx={{ letterSpacing: 1, color: 'text.secondary' }}>
                    PO Summary
                  </Typography>
                </Box>

                <Stack sx={{ p: 2.5 }} spacing={1}>
                  <SummaryRow label="Subtotal (taxable)" value={inr(totals.taxable)} />

                  {totals.totalDiscount > 0 && (
                    <SummaryRow
                      label="Line discounts"
                      value={`- ${inr(totals.totalDiscount)}`}
                      valueColor="error.main"
                    />
                  )}

                  {totals.slabs.length > 0 && (
                    <>
                      <Divider sx={{ my: 0.5 }} textAlign="left">
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          {totals.intraState ? 'GST (CGST + SGST)' : 'GST (IGST)'}
                        </Typography>
                      </Divider>
                      {totals.slabs.map((r) => (
                        totals.intraState ? (
                          <React.Fragment key={r.rate}>
                            <SummaryRow
                              label={`CGST @ ${(r.rate / 2).toFixed(r.rate % 2 === 0 ? 0 : 1)}% on ${inr(r.taxable)}`}
                              value={inr(r.tax / 2)}
                              small
                            />
                            <SummaryRow
                              label={`SGST @ ${(r.rate / 2).toFixed(r.rate % 2 === 0 ? 0 : 1)}% on ${inr(r.taxable)}`}
                              value={inr(r.tax / 2)}
                              small
                            />
                          </React.Fragment>
                        ) : (
                          <SummaryRow
                            key={r.rate}
                            label={`IGST @ ${r.rate}% on ${inr(r.taxable)}`}
                            value={inr(r.tax)}
                            small
                          />
                        )
                      ))}
                    </>
                  )}

                  {Number(form.freightCharges) > 0 && (
                    <>
                      <Divider sx={{ my: 0.5 }} />
                      <SummaryRow label="Freight" value={`+ ${inr(form.freightCharges)}`} />
                    </>
                  )}

                  {totals.roundOff !== 0 && (
                    <SummaryRow
                      label="Round Off"
                      value={`${totals.roundOff > 0 ? '+' : ''}${inr(totals.roundOff)}`}
                      small
                    />
                  )}
                </Stack>

                <Box sx={{
                  px: 2.5, py: 2,
                  borderTop: '1px solid', borderColor: 'divider',
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                }}>
                  <Typography variant="subtitle1" fontWeight={900}>Grand Total</Typography>
                  <Typography variant="h5" fontWeight={900} color="primary.main">
                    {inr(totals.grand)}
                  </Typography>
                </Box>

                {totals.grand > 0 && (
                  <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" fontWeight={700}
                      sx={{ letterSpacing: 0.5, color: 'text.secondary', textTransform: 'uppercase' }}>
                      In Words
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, fontStyle: 'italic' }}>
                      {numberToWords(totals.grand)}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Inline supplier creation */}
      <Dialog
        open={supplierDialogOpen}
        onClose={() => setSupplierDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" />
          Create New Supplier
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth required label="Supplier Name" size="small"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm((p) => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" size="small"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" size="small"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm((p) => ({ ...p, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" size="small"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm((p) => ({ ...p, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="GSTIN" size="small"
                value={supplierForm.gstin}
                onChange={(e) => setSupplierForm((p) => ({ ...p, gstin: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
          <Button onClick={() => setSupplierDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSupplier}
            disabled={creatingSupplier || !supplierForm.name.trim()}
            startIcon={creatingSupplier ? <CircularProgress size={16} /> : <PersonAddIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            {creatingSupplier ? 'Creating…' : 'Create Supplier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inline "Add New Item" quick-create — minimal fields, saves to catalog. */}
      <Dialog
        open={itemDialog.open}
        onClose={() => setItemDialog({ open: false, lineIndex: null })}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          Add New Item to Catalog
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adds a catalog item with a single variant. SKU is auto-generated by the server — you
            don't need to enter one. Photos and extra variants can be added later from the Items page.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Row 1 — Name spans wide, Category picks from existing or accepts a new name */}
            <Grid item xs={12} sm={7}>
              <TextField
                fullWidth required label="Item Name" size="small"
                value={itemForm.name}
                onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <Autocomplete
                freeSolo
                size="small"
                options={categories}
                getOptionLabel={(o) => (typeof o === 'string' ? o : (o?.name || ''))}
                isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
                value={
                  itemForm.categoryId
                    ? (categories.find((c) => c.id === Number(itemForm.categoryId)) || itemForm.categoryId)
                    : null
                }
                onChange={(_, v) => {
                  if (!v) setItemForm((p) => ({ ...p, categoryId: '' }));
                  else if (typeof v === 'string') setItemForm((p) => ({ ...p, categoryId: v.trim() })); // new name
                  else setItemForm((p) => ({ ...p, categoryId: v.id })); // existing
                }}
                onInputChange={(_, v, reason) => {
                  if (reason === 'input') setItemForm((p) => ({ ...p, categoryId: v }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Category" required
                    helperText="Pick or type a new one" />
                )}
              />
            </Grid>

            {/* Row 2 — Unit + Selling price (required) + Purchase price (optional seeds PO line cost) */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth required label="Unit (UOM)" size="small"
                value={itemForm.unit}
                onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))}
                placeholder="pcs, kg, box…"
                helperText="e.g. pcs, kg, litre, box"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth required label="Selling Price" type="number" size="small"
                value={itemForm.pricePerUnit}
                onChange={(e) => setItemForm((p) => ({ ...p, pricePerUnit: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                inputProps={{ min: 0.01, step: '0.01' }}
                helperText="Per-unit price on the catalog"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth label="Purchase Price (optional)" type="number" size="small"
                value={itemForm.purchasePrice}
                onChange={(e) => setItemForm((p) => ({ ...p, purchasePrice: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                inputProps={{ min: 0, step: '0.01' }}
                helperText="Pre-fills this PO line's cost"
              />
            </Grid>

            {/* Row 3 — Tax + HSN */}
            <Grid item xs={12} sm={4}>
              <TextField
                select fullWidth label="GST %" size="small"
                value={itemForm.gstRate}
                onChange={(e) => setItemForm((p) => ({ ...p, gstRate: e.target.value }))}
              >
                {STANDARD_GST_RATES.map((r) => (
                  <MenuItem key={r} value={String(r)}>{r}%</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth label="HSN / SAC (optional)" size="small"
                value={itemForm.hsn}
                onChange={(e) => setItemForm((p) => ({ ...p, hsn: e.target.value }))}
                inputProps={{ maxLength: 20 }}
                helperText="Server generates one if you skip"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
          <Button onClick={() => setItemDialog({ open: false, lineIndex: null })} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateItem}
            disabled={creatingItem || !!validateItemForm(itemForm)}
            startIcon={creatingItem ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            {creatingItem ? 'Adding…' : 'Add & Use in PO'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Mirrors the BE validation on ItemDto + first variant. Returns an
// error message string or null when the form is valid. Kept module-level
// so it can be unit-tested if the quick-create dialog grows more fields.
const validateItemForm = (f) => {
  if (!f.name || !f.name.trim()) return 'Item name is required.';
  if (!f.categoryId) return 'Category is required.';
  if (!f.unit || !f.unit.trim()) return 'Unit is required (e.g. pcs, kg, box).';
  const price = Number(f.pricePerUnit);
  if (!f.pricePerUnit || Number.isNaN(price) || price <= 0) {
    return 'Selling price (per unit) must be greater than zero.';
  }
  if (f.purchasePrice !== '' && Number(f.purchasePrice) < 0) {
    return 'Purchase price cannot be negative.';
  }
  return null;
};

const SummaryRow = ({ label, value, valueColor, small }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
    <Typography variant={small ? 'caption' : 'body2'} color={small ? 'text.secondary' : 'text.primary'}>
      {label}
    </Typography>
    <Typography
      variant={small ? 'caption' : 'body2'}
      fontWeight={small ? 500 : 700}
      color={valueColor || 'text.primary'}
    >
      {value}
    </Typography>
  </Box>
);