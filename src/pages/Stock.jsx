import React, { useState, useEffect, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,
  CircularProgress, Box, Typography, Container, Alert, Autocomplete,
  InputAdornment, Paper, Chip, Stack, Snackbar, Grid, Card, CardContent,
  LinearProgress, Divider, Tooltip, IconButton, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, Inventory as InventoryIcon, TrendingDown, TrendingUp,
  WarningAmber, Search, AttachMoney, ShowChart, BarChart, 
  History as HistoryIcon, SettingsSuggest, FileDownload, InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { 
  fetchStock, addStock, fetchItemVariants, 
  adjustStock, fetchStockMovements, exportStockReport 
} from '../services/api';
import { useTranslation } from 'react-i18next'; // ← added

const initialFormState = { itemVariantId: '', quantity: '', batch: '', costPerUnit: '', reason: '' };

// Helper for consistent Indian Currency Formatting
const formatCurrency = (val) => 
  Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

const Stock = () => {
  const { t } = useTranslation(); // ← added

  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [itemVariants, setItemVariants] = useState([]);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [stockRes, variantsRes] = await Promise.all([fetchStock(), fetchItemVariants()]);
      if (Array.isArray(stockRes.data)) {
        setStock(stockRes.data.map((item) => ({ ...item, id: item.itemVariantId })));
      }
      setItemVariants(variantsRes.data);
    } catch (err) { 
      setError(t('stock.errorFetch')); // ← translated
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredRows = useMemo(() => {
    return stock.filter((row) =>
        row.itemName.toLowerCase().includes(searchText.toLowerCase()) ||
        (row.sku && row.sku.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [stock, searchText]);

  const stats = useMemo(() => {
    const totalItems = stock.length;
    const lowStock = stock.filter((s) => s.totalQuantity < 10).length;
    const totalValue = stock.reduce((acc, curr) => acc + (Number(curr.totalQuantity || 0) * Number(curr.costPerUnit || 0)), 0);
    const potentialRevenue = stock.reduce((acc, curr) => acc + (Number(curr.totalQuantity || 0) * Number(curr.pricePerUnit || 0)), 0);
    return { totalItems, lowStock, totalValue, potentialRevenue, projectedProfit: potentialRevenue - totalValue };
  }, [stock]);

  const selectedVariant = useMemo(() => itemVariants.find((v) => v.id === formData.itemVariantId), [formData.itemVariantId, itemVariants]);

  const handleSubmit = async () => {
    if (!formData.itemVariantId || !formData.quantity || !formData.costPerUnit) {
      setError(t('stock.errorRequiredFields')); // ← translated
      return;
    }
    setIsSubmitting(true);
    try {
      await addStock({ itemVariantId: formData.itemVariantId, quantity: Number(formData.quantity), costPerUnit: Number(formData.costPerUnit), batch: formData.batch || null });
      setSuccessMsg(t('stock.successAdd')); // ← translated
      setOpen(false); setFormData(initialFormState); loadData();
    } catch (err) { setError(t('stock.errorAdd')); }
    finally { setIsSubmitting(false); }
  };

  const handleAdjustSubmit = async () => {
    if (!formData.itemVariantId || !formData.quantity || !formData.reason) {
      setError(t('stock.errorRequiredFields')); // ← translated
      return;
    }
    setIsSubmitting(true);
    try {
      await adjustStock({ itemVariantId: formData.itemVariantId, adjustmentQuantity: Number(formData.quantity), reason: formData.reason });
      setSuccessMsg(t('stock.successAdjust')); // ← translated
      setAdjustOpen(false); setFormData(initialFormState); loadData();
    } catch (err) { setError(t('stock.errorAdjust')); }
    finally { setIsSubmitting(false); }
  };

  const handleExport = async (format) => {
    try {
      const response = await exportStockReport(format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('stock.exportFilename')}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link); link.click();
    } catch (err) { setError(t('stock.errorExport')); }
  };

  const viewHistory = async (variantId) => {
    try {
      const res = await fetchStockMovements(variantId);
      setSelectedHistory(res.data); setHistoryOpen(true);
    } catch (err) { setError(t('stock.errorHistory')); }
  };

  const columns = [
    {
      field: 'itemName',
      headerName: t('stock.columns.productDetails'),
      flex: 1.5, minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{t('stock.columns.skuLabel')} {params.row.sku}</Typography>
          <Stack direction="row" spacing={0.5} mt={0.5}>
            <Chip label={params.row.color} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
            <Chip label={params.row.size} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#e2e8f0' }} />
          </Stack>
        </Box>
      ),
    },
    {
      field: 'totalQuantity',
      headerName: t('stock.columns.inventoryStatus'),
      flex: 1, minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography variant="body2" fontWeight={800} color={params.value < 10 ? 'error.main' : 'success.main'} mb={0.5}>
            {params.value} {params.row.unit}
          </Typography>
          <LinearProgress variant="determinate" value={Math.min((params.value / 100) * 100, 100)} color={params.value < 10 ? 'error' : 'primary'} sx={{ height: 4, borderRadius: 2, bgcolor: '#f1f5f9' }} />
        </Box>
      ),
    },
    {
      field: 'costPerUnit',
      headerName: t('stock.columns.purchasePrice'),
      flex: 0.8, minWidth: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">₹{formatCurrency(params.value)}</Typography>
      ),
    },
    {
      field: 'pricePerUnit',
      headerName: t('stock.columns.sellingPrice'),
      flex: 0.8, minWidth: 120,
      renderCell: (params) => <Typography variant="body2" fontWeight={700}>₹{formatCurrency(params.value)}</Typography>,
    },
    {
      field: 'margin',
      headerName: t('stock.columns.margin'),
      flex: 0.8, minWidth: 100,
      renderCell: (params) => {
        const cost = Number(params.row.costPerUnit || 0);
        const price = Number(params.row.pricePerUnit || 0);
        if (cost === 0) return <Typography variant="caption" color="text.disabled">{t('stock.columns.nA')}</Typography>;
        const margin = ((price - cost) / price) * 100;
        return (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: margin > 0 ? 'success.main' : 'error.main' }}>
            {margin > 0 ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
            <Typography variant="body2" fontWeight={700}>{margin.toFixed(0)}%</Typography>
          </Stack>
        );
      },
    },
    {
      field: 'actions',
      headerName: t('stock.columns.actions'),
      flex: 0.6, minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title={t('stock.tooltips.viewHistory')}>
            <IconButton size="small" onClick={() => viewHistory(params.row.itemVariantId)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('stock.tooltips.adjustStock')}>
            <IconButton size="small" color="primary" onClick={() => { setFormData({ ...initialFormState, itemVariantId: params.row.itemVariantId }); setAdjustOpen(true); }}>
              <SettingsSuggest fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    }
  ];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 5 }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} mb={4} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a">
              {t('stock.title')}
            </Typography>
            <Typography color="text.secondary">
              {t('stock.subtitle')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={() => handleExport('excel')} sx={{ borderRadius: 2, fontWeight: 700, height: 48, bgcolor: 'white' }}>
              {t('stock.actions.export')}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: 2, px: 4, fontWeight: 700, height: 48, boxShadow: 3 }}>
              {t('stock.actions.addNewStock')}
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <StatCard 
              icon={<InventoryIcon color="primary" />} 
              label={t('stock.stats.activeVariants')} 
              value={stats.totalItems} 
              color="#3b82f6" 
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard 
              icon={<WarningAmber color="error" />} 
              label={t('stock.stats.lowStockWarning')} 
              value={stats.lowStock} 
              color="#ef4444" 
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard 
              icon={<AttachMoney color="success" />} 
              label={t('stock.stats.investmentValue')} 
              value={`₹${formatCurrency(stats.totalValue)}`} 
              color="#10b981" 
            />
          </Grid>
        </Grid>

        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Stack direction="row" sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }} spacing={2} justifyContent="space-between">
            <TextField 
              size="small" 
              placeholder={t('stock.searchPlaceholder')} 
              value={searchText} 
              onChange={(e) => setSearchText(e.target.value)} 
              InputProps={{ 
                startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> 
              }} 
              sx={{ width: 400, '& .MuiInputBase-root': { borderRadius: 2, bgcolor: '#f8fafc' } }} 
            />
            <Button startIcon={<ShowChart />} size="small" color="primary" variant="outlined" onClick={() => setAnalyticsOpen(true)} sx={{ borderRadius: 2, fontWeight: 700 }}>
              {t('stock.actions.analytics')}
            </Button>
          </Stack>
          <Box sx={{ height: 600, width: '100%', bgcolor: 'white' }}>
            <DataGrid 
              rows={filteredRows} 
              columns={columns} 
              loading={loading} 
              disableRowSelectionOnClick 
              rowHeight={75} 
              sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 'bold' } }} 
              localeText={{
                noRowsLabel: t('stock.noData'),
                columnHeaderSortIconLabel: t('stock.sort'),
              }}
            />
          </Box>
        </Paper>
      </Container>

      {/* Add Stock Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900, pt: 3 }}>{t('stock.dialog.addStockTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              options={itemVariants}
              getOptionLabel={(o) => `${o.itemName} - ${o.color} (${o.size})`}
              value={itemVariants.find(v => v.id === formData.itemVariantId) || null}
              onChange={(_, v) => setFormData({ ...formData, itemVariantId: v?.id || '' })}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{option.itemName} — {option.color} ({option.size})</Typography>
                    <Typography variant="caption" color="text.secondary">{t('stock.variant.skuLabel')} {option.sku} | {t('stock.variant.unitLabel')} {option.unit}</Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => <TextField {...params} label={t('stock.form.selectVariant')} placeholder={t('stock.form.searchVariant')} />}
            />
            {selectedVariant && (
              <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 3, border: '1px dashed #0ea5e9' }}>
                <Grid container alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="caption">{t('stock.form.retailPrice')}</Typography>
                    <Typography variant="h6" fontWeight={800}>₹{formatCurrency(selectedVariant.pricePerUnit)}</Typography>
                  </Grid>
                  {formData.costPerUnit && (
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption">{t('stock.form.estimatedMargin')}</Typography>
                      <Typography variant="h6" fontWeight={800} color="success.main">
                        {(((selectedVariant.pricePerUnit - Number(formData.costPerUnit)) / selectedVariant.pricePerUnit) * 100).toFixed(1)}%
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  fullWidth 
                  label={t('stock.form.purchaseCost')} 
                  type="number" 
                  value={formData.costPerUnit} 
                  onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })} 
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  fullWidth 
                  label={t('stock.form.quantity')} 
                  type="number" 
                  value={formData.quantity} 
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                />
              </Grid>
            </Grid>
            <TextField 
              fullWidth 
              label={t('stock.form.batchNumber')} 
              value={formData.batch} 
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })} 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {isSubmitting ? <CircularProgress size={24} /> : t('stock.actions.completeEntry')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900, pt: 3 }}>{t('stock.dialog.adjustStockTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {selectedVariant && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fffbeb', borderColor: '#fef3c7', borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <InfoIcon color="warning" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {t('stock.dialog.adjusting')}: {selectedVariant.itemName} ({selectedVariant.sku})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('stock.dialog.currentBalance')}: <strong>{stock.find(s => s.itemVariantId === selectedVariant.id)?.totalQuantity || 0} {selectedVariant.unit}</strong>
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>{t('stock.dialog.tip')}:</strong> {t('stock.dialog.tipContent')}
            </Alert>
            <TextField 
              select 
              fullWidth 
              label={t('stock.form.reason')} 
              value={formData.reason} 
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            >
              <MenuItem value="Damaged">{t('stock.reason.damaged')}</MenuItem>
              <MenuItem value="Correction">{t('stock.reason.correction')}</MenuItem>
              <MenuItem value="Return">{t('stock.reason.return')}</MenuItem>
              <MenuItem value="Sample">{t('stock.reason.sample')}</MenuItem>
            </TextField>
            <TextField 
              fullWidth 
              type="number" 
              label={t('stock.form.adjustmentQuantity')} 
              placeholder={t('stock.form.adjustmentPlaceholder')} 
              value={formData.quantity} 
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setAdjustOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="warning" onClick={handleAdjustSubmit} disabled={isSubmitting || !formData.quantity || !formData.reason}>
            {t('stock.actions.applyAdjustment')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900, pt: 3 }}>{t('stock.dialog.historyTitle')}</DialogTitle>
        <DialogContent>
          {selectedHistory.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('stock.dialog.noHistory')}</Typography>
            </Box>
          ) : (
            selectedHistory.map((m, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #f1f5f9' }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {m.movementType} — {m.reason || t('stock.reason.purchased')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(m.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight={800} color={m.quantity > 0 ? 'success.main' : 'error.main'}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </Typography>
                  <Typography variant="caption">{t('stock.columns.wac')}: ₹{formatCurrency(m.costPerUnit)}</Typography>
                </Box>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Popup */}
      <Dialog open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900, pt: 3 }}>
          <BarChart color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('stock.dialog.analyticsTitle')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ py: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {t('stock.stats.investmentValue')}
              </Typography>
              <Typography variant="h5" fontWeight={900}>₹{formatCurrency(stats.totalValue)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {t('stock.stats.potentialRevenue')}
              </Typography>
              <Typography variant="h5" fontWeight={900} color="primary.main">
                ₹{formatCurrency(stats.potentialRevenue)}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 3, border: '1px solid #dcfce7' }}>
              <Typography variant="caption" color="success.main" fontWeight={800}>
                {t('stock.stats.estimatedProfit')}
              </Typography>
              <Typography variant="h4" fontWeight={900} color="success.dark">
                ₹{formatCurrency(stats.projectedProfit)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAnalyticsOpen(false)} fullWidth variant="outlined">
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg('')}>
        <Alert severity="success" variant="filled">{successMsg}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
      <Box sx={{ bgcolor: `${color}15`, p: 2, borderRadius: 3, display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={900}>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

export default Stock;