import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Chip, Button, IconButton, Divider,
  Tabs, Tab, Alert, Snackbar, CircularProgress, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  Inventory2Outlined as InventoryIcon,
  ShoppingBagOutlined as PoIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

import {
  getSupplierById,
  getPurchaseOrders,
  fetchReceiving,
  getSupplierPayments,
  listSupplierRateCards,
  saveSupplierRateCard,
  getSupplierStats,
  toggleSupplierActive,
} from '../../services/api';
import SupplierEditDialog from './SupplierEditDialog';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import RedoIcon from '@mui/icons-material/Redo';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const formatInr = (val) =>
  Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

const formatDate = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box sx={{
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    borderRight: divider ? '1px solid' : 'none',
    borderColor: 'divider',
    minWidth: 0,
  }}>
    <Box sx={{
      display: 'inline-flex', p: 1, borderRadius: 1,
      bgcolor: alpha(color, 0.1), color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}
        sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} color="text.primary"
        sx={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const SupplierDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [tab, setTab] = useState(0);
  const [supplier, setSupplier] = useState(null);
  const [beStats, setBeStats] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pos, setPos] = useState([]);
  const [grns, setGrns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  const [rateDialog, setRateDialog] = useState({ open: false, itemVariantId: '', unitCost: '', minOrderQty: '', leadTimeDays: '', validFrom: '', validTo: '', currencyCode: 'INR' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, allPos, allGrns, sPayments, rates, statsRes] = await Promise.all([
        getSupplierById(id),
        getPurchaseOrders().catch(() => []),
        fetchReceiving().catch(() => []),
        getSupplierPayments({ supplierId: id }).catch(() => ({ content: [] })),
        listSupplierRateCards(id).catch(() => []),
        getSupplierStats(id).catch(() => null),
      ]);
      setSupplier(s);
      setBeStats(statsRes || null);
      const supplierIdNum = String(id);
      setPos((Array.isArray(allPos) ? allPos : allPos?.content || [])
        .filter((po) => String(po.supplierId ?? po.supplier?.id) === supplierIdNum));
      setGrns((Array.isArray(allGrns) ? allGrns : allGrns?.content || [])
        .filter((r) => String(r.supplier?.id ?? r.supplierId) === supplierIdNum));
      const paymentsList = Array.isArray(sPayments) ? sPayments : sPayments?.content || [];
      setPayments(paymentsList);
      setRateCards(Array.isArray(rates) ? rates : []);
    } catch (e) {
      setError('Failed to load supplier.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleSaveRateCard = async () => {
    if (!rateDialog.itemVariantId || !rateDialog.unitCost) {
      setSnackbar({ open: true, message: 'Variant + unit cost required.', severity: 'warning' });
      return;
    }
    try {
      await saveSupplierRateCard({
        supplierId: Number(id),
        itemVariantId: Number(rateDialog.itemVariantId),
        unitCost: Number(rateDialog.unitCost),
        minOrderQty: rateDialog.minOrderQty ? Number(rateDialog.minOrderQty) : null,
        leadTimeDays: rateDialog.leadTimeDays ? Number(rateDialog.leadTimeDays) : null,
        validFrom: rateDialog.validFrom || new Date().toISOString().slice(0, 10),
        validTo: rateDialog.validTo || null,
        currencyCode: rateDialog.currencyCode || 'INR',
      });
      setRateDialog({ open: false, itemVariantId: '', unitCost: '', minOrderQty: '', leadTimeDays: '', validFrom: '', validTo: '', currencyCode: 'INR' });
      setSnackbar({ open: true, message: 'Rate card saved.', severity: 'success' });
      refresh();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Save failed', severity: 'error' });
    }
  };

  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => {
    let openPos = 0, poValue = 0, grnCount = grns.length, paid = 0;
    pos.forEach((po) => {
      if (['SUBMITTED', 'PARTIALLY_RECEIVED', 'DRAFT'].includes(po.status)) openPos += 1;
      poValue += Number(po.totalAmount || 0);
    });
    payments.forEach((p) => { paid += Number(p.amount || 0); });
    return { openPos, poValue, grnCount, paid };
  }, [pos, grns, payments]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!supplier) {
    return (
      <Container maxWidth="md" sx={{ pt: 4 }}>
        <Alert severity="error">Supplier not found.</Alert>
        <Button sx={{ mt: 2 }} startIcon={<BackIcon />} onClick={() => navigate('/suppliers')}>
          Back to suppliers
        </Button>
      </Container>
    );
  }

  const poColumns = [
    {
      field: 'poNumber', headerName: 'PO #', flex: 1, minWidth: 140,
      renderCell: (p) => (
        <Button size="small" variant="text"
          onClick={() => navigate(`/purchase-orders/${p.row.id}`)}
          sx={{ textTransform: 'none', fontWeight: 700, fontFamily: 'monospace' }}
        >
          {p.value}
        </Button>
      ),
    },
    { field: 'orderDate', headerName: 'Order date', flex: 0.7, minWidth: 120,
      renderCell: (p) => formatDate(p.value) },
    { field: 'status', headerName: 'Status', flex: 0.9, minWidth: 140,
      renderCell: (p) => <Chip label={p.value} size="small"
        sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.7rem' }} /> },
    { field: 'totalAmount', headerName: 'Value', flex: 0.7, minWidth: 110,
      align: 'right', headerAlign: 'right',
      renderCell: (p) => `₹${formatInr(p.value)}` },
  ];

  const grnColumns = [
    {
      field: 'grNumber', headerName: 'GRN #', flex: 1, minWidth: 160,
      renderCell: (p) => (
        <Button size="small" variant="text"
          onClick={() => navigate(`/receivings/${p.row.id}`)}
          sx={{ textTransform: 'none', fontWeight: 700, fontFamily: 'monospace' }}
        >
          {p.value || '—'}
        </Button>
      ),
    },
    { field: 'poNumber', headerName: 'PO #', flex: 0.9, minWidth: 130 },
    { field: 'receivedAt', headerName: 'Received', flex: 0.8, minWidth: 130,
      renderCell: (p) => formatDate(p.value) },
    { field: 'status', headerName: 'Status', flex: 0.9, minWidth: 140,
      renderCell: (p) => <Chip label={p.value} size="small"
        sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.7rem' }} /> },
  ];

  const paymentColumns = [
    { field: 'id', headerName: 'Payment #', flex: 0.6, minWidth: 110,
      renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>#{p.value}</Typography> },
    { field: 'paymentDate', headerName: 'Date', flex: 0.7, minWidth: 120,
      renderCell: (p) => formatDate(p.value) },
    { field: 'method', headerName: 'Method', flex: 0.6, minWidth: 110 },
    { field: 'amount', headerName: 'Amount', flex: 0.7, minWidth: 110,
      align: 'right', headerAlign: 'right',
      renderCell: (p) => `₹${formatInr(p.value)}` },
  ];

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

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Header */}
        <Paper elevation={0} sx={{
          p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton size="small" onClick={() => navigate('/suppliers')}>
                <BackIcon />
              </IconButton>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
                    {supplier.tradeName || supplier.name}
                  </Typography>
                  <Chip size="small" label={supplier.active === false ? 'Inactive' : 'Active'}
                    color={supplier.active === false ? 'default' : 'success'}
                    variant={supplier.active === false ? 'outlined' : 'filled'}
                    sx={{ fontWeight: 700 }} />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} flexWrap="wrap">
                  {supplier.email && (
                    <Typography variant="body2" color="text.secondary"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon fontSize="inherit" /> {supplier.email}
                    </Typography>
                  )}
                  {supplier.phone && (
                    <Typography variant="body2" color="text.secondary"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="inherit" /> {supplier.phone}
                    </Typography>
                  )}
                  {supplier.address && (
                    <Typography variant="body2" color="text.secondary"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon fontSize="inherit" /> {supplier.address}
                    </Typography>
                  )}
                </Stack>
                {supplier.gstin && (
                  <Typography variant="caption" color="text.secondary">GSTIN: {supplier.gstin}</Typography>
                )}
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button variant="outlined" startIcon={<EditIcon />}
                onClick={() => setEditOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                Edit
              </Button>
              <Button variant="outlined"
                color={supplier.active === false ? 'success' : 'warning'}
                startIcon={supplier.active === false ? <ToggleOnIcon /> : <ToggleOffIcon />}
                onClick={async () => {
                  try {
                    await toggleSupplierActive(id);
                    setSnackbar({ open: true, severity: 'info',
                      message: supplier.active === false ? 'Supplier reactivated.' : 'Supplier deactivated.' });
                    refresh();
                  } catch (e) {
                    setSnackbar({ open: true, severity: 'error',
                      message: e?.response?.data?.message || 'Toggle failed' });
                  }
                }}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                {supplier.active === false ? 'Reactivate' : 'Deactivate'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* KPI strip — BE stats when available, fallback to client-side computation */}
        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
          }}>
            <KpiCell icon={<PoIcon fontSize="small" />} label="OPEN POs"
              value={beStats?.openPurchaseOrders ?? stats.openPos}
              color={theme.palette.primary.main} divider />
            <KpiCell icon={<MoneyIcon fontSize="small" />} label="TOTAL PO VALUE"
              value={`INR ${formatInr(beStats?.totalPoValue ?? stats.poValue)}`}
              color={theme.palette.info.main} divider />
            <KpiCell icon={<InventoryIcon fontSize="small" />} label="GRNs RECEIVED"
              value={beStats?.totalGrns ?? stats.grnCount}
              color={theme.palette.success.main} divider />
            <KpiCell icon={<AssignmentReturnIcon fontSize="small" />} label="RETURNS"
              value={beStats?.totalPurchaseReturns ?? 0}
              color={theme.palette.warning.main} divider />
            <KpiCell icon={<RedoIcon fontSize="small" />} label="DEBIT NOTES"
              value={beStats?.totalDebitNotes ?? 0}
              color={theme.palette.secondary?.main || theme.palette.info.dark} divider />
            <KpiCell icon={<HourglassBottomIcon fontSize="small" />} label="OUTSTANDING PAYABLE"
              value={`INR ${formatInr(beStats?.outstandingPayable ?? 0)}`}
              color={theme.palette.error.main} />
          </Box>
        </Paper>

        {(supplier.creditDays != null || supplier.creditLimit != null || supplier.paymentTerms) && (
          <Paper elevation={0} sx={{ mb: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}
              sx={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Payment Terms
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1 }} flexWrap="wrap">
              {supplier.creditDays != null && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Credit days</Typography>
                  <Typography variant="body1" fontWeight={700}>{supplier.creditDays} days</Typography>
                </Box>
              )}
              {supplier.creditLimit != null && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Credit limit</Typography>
                  <Typography variant="body1" fontWeight={700}>INR {formatInr(supplier.creditLimit)}</Typography>
                </Box>
              )}
              {supplier.paymentTerms && (
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Terms</Typography>
                  <Typography variant="body2">{supplier.paymentTerms}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        )}

        {/* Tabs */}
        <Paper elevation={0} sx={{
          borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            variant="scrollable" scrollButtons="auto">
            <Tab label="Overview" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label={`PO history · ${pos.length}`} sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label={`GRN history · ${grns.length}`} sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label={`Payments · ${payments.length}`} sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label={`Rate card · ${rateCards.length}`} sx={{ textTransform: 'none', fontWeight: 700 }} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {tab === 0 && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">CONTACT</Typography>
                  <Typography variant="body2">{supplier.name}</Typography>
                  {supplier.contactPerson && (
                    <Typography variant="body2" color="text.secondary">
                      Contact: {supplier.contactPerson}
                    </Typography>
                  )}
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">SUMMARY</Typography>
                  <Typography variant="body2">
                    {pos.length} purchase order{pos.length === 1 ? '' : 's'} on record,
                    {' '}{grns.length} GRN{grns.length === 1 ? '' : 's'} received,
                    {' '}₹{formatInr(stats.paid)} paid to date.
                  </Typography>
                </Box>
                {supplier.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary">NOTES</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{supplier.notes}</Typography>
                    </Box>
                  </>
                )}
              </Stack>
            )}
            {tab === 1 && (
              <DataGrid
                autoHeight rows={pos} columns={poColumns}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick rowHeight={50}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'orderDate', sort: 'desc' }] },
                }}
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                    textTransform: 'uppercase',
                  },
                }}
                localeText={{ noRowsLabel: 'No purchase orders yet for this supplier.' }}
              />
            )}
            {tab === 2 && (
              <DataGrid
                autoHeight rows={grns} columns={grnColumns}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick rowHeight={50}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'receivedAt', sort: 'desc' }] },
                }}
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                    textTransform: 'uppercase',
                  },
                }}
                localeText={{ noRowsLabel: 'No GRNs yet for this supplier.' }}
              />
            )}
            {tab === 4 && (
              <>
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
                  <Button size="small" variant="contained"
                    onClick={() => setRateDialog({ ...rateDialog, open: true, validFrom: new Date().toISOString().slice(0, 10) })}
                    sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
                    Add rate
                  </Button>
                </Stack>
                <DataGrid
                  autoHeight rows={rateCards} getRowId={(r) => r.id}
                  columns={[
                    { field: 'itemVariantId', headerName: 'Variant', flex: 0.6, minWidth: 100 },
                    { field: 'unitCost', headerName: 'Unit cost', flex: 0.7, minWidth: 120,
                      renderCell: (p) => `${p.row.currencyCode || 'INR'} ${Number(p.value || 0)}` },
                    { field: 'minOrderQty', headerName: 'Min qty', flex: 0.5, minWidth: 100 },
                    { field: 'leadTimeDays', headerName: 'Lead (d)', flex: 0.5, minWidth: 100 },
                    { field: 'validFrom', headerName: 'Valid from', flex: 0.7, minWidth: 120,
                      renderCell: (p) => formatDate(p.value) },
                    { field: 'validTo', headerName: 'Valid to', flex: 0.7, minWidth: 120,
                      renderCell: (p) => formatDate(p.value) },
                  ]}
                  disableRowSelectionOnClick rowHeight={50}
                  pageSizeOptions={[10, 25]}
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-columnHeaders': {
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                      fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                      textTransform: 'uppercase',
                    },
                  }}
                  localeText={{ noRowsLabel: 'No rate card entries for this supplier.' }}
                />
              </>
            )}
            {tab === 3 && (
              <DataGrid
                autoHeight rows={payments} columns={paymentColumns}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick rowHeight={50}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'paymentDate', sort: 'desc' }] },
                }}
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                    textTransform: 'uppercase',
                  },
                }}
                localeText={{ noRowsLabel: 'No payments recorded for this supplier.' }}
              />
            )}
          </Box>
        </Paper>

        <Dialog open={rateDialog.open} onClose={() => setRateDialog({ ...rateDialog, open: false })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>New rate card entry</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField fullWidth type="number" label="Item variant ID"
                value={rateDialog.itemVariantId}
                onChange={(e) => setRateDialog((s) => ({ ...s, itemVariantId: e.target.value }))} />
              <Stack direction="row" spacing={2}>
                <TextField fullWidth type="number" label="Unit cost"
                  value={rateDialog.unitCost}
                  onChange={(e) => setRateDialog((s) => ({ ...s, unitCost: e.target.value }))} />
                <TextField select fullWidth label="Currency"
                  value={rateDialog.currencyCode}
                  onChange={(e) => setRateDialog((s) => ({ ...s, currencyCode: e.target.value }))}
                  SelectProps={{ native: true }}>
                  {['INR','USD','EUR','GBP','AED','SGD'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </TextField>
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField fullWidth type="number" label="Min order qty"
                  value={rateDialog.minOrderQty}
                  onChange={(e) => setRateDialog((s) => ({ ...s, minOrderQty: e.target.value }))} />
                <TextField fullWidth type="number" label="Lead time (days)"
                  value={rateDialog.leadTimeDays}
                  onChange={(e) => setRateDialog((s) => ({ ...s, leadTimeDays: e.target.value }))} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField fullWidth type="date" label="Valid from"
                  InputLabelProps={{ shrink: true }}
                  value={rateDialog.validFrom}
                  onChange={(e) => setRateDialog((s) => ({ ...s, validFrom: e.target.value }))} />
                <TextField fullWidth type="date" label="Valid to"
                  InputLabelProps={{ shrink: true }}
                  value={rateDialog.validTo}
                  onChange={(e) => setRateDialog((s) => ({ ...s, validTo: e.target.value }))} />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRateDialog({ ...rateDialog, open: false })} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleSaveRateCard} variant="contained"
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <SupplierEditDialog
          open={editOpen}
          supplier={supplier}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            setSnackbar({ open: true, severity: 'success', message: 'Supplier updated.' });
            refresh();
          }}
        />
      </Container>
    </Box>
  );
};

export default SupplierDetailPage;
