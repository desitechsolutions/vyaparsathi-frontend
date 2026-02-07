import React, { useState, useEffect, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Box,
  Typography,
  Container,
  Alert,
  FormControl,
  Autocomplete,
  InputAdornment,
  Paper,
  Chip,
  Stack,
  Snackbar,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Inventory as InventoryIcon,
  TrendingDown,
  TrendingUp,
  WarningAmber,
  Search,
  AttachMoney,
  ShowChart,
  BarChart,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { fetchStock, addStock, fetchItemVariants } from '../services/api';

const initialFormState = { itemVariantId: '', quantity: '', batch: '', costPerUnit: '' };

const Stock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
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
      setError('System failed to sync inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    return stock.filter(
      (row) =>
        row.itemName.toLowerCase().includes(searchText.toLowerCase()) ||
        (row.sku && row.sku.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [stock, searchText]);

  const stats = useMemo(() => {
    const totalItems = stock.length;
    const lowStock = stock.filter((s) => s.totalQuantity < 10).length;
    const totalValue = stock.reduce(
      (acc, curr) => acc + (Number(curr.totalQuantity || 0) * Number(curr.costPerUnit || 0)),
      0
    );
    const potentialRevenue = stock.reduce(
      (acc, curr) => acc + (Number(curr.totalQuantity || 0) * Number(curr.pricePerUnit || 0)),
      0
    );
    const projectedProfit = potentialRevenue - totalValue;

    return { totalItems, lowStock, totalValue, potentialRevenue, projectedProfit };
  }, [stock]);

  const selectedVariant = useMemo(
    () => itemVariants.find((v) => v.id === formData.itemVariantId),
    [formData.itemVariantId, itemVariants]
  );

  const handleSubmit = async () => {
    const qty = parseFloat(formData.quantity);
    const cost = parseFloat(formData.costPerUnit);

    if (!formData.itemVariantId || !formData.quantity || !formData.costPerUnit) {
      setError('Please fill in all required fields including Purchase Cost.');
      return;
    }

    if (qty <= 0) {
      setError('Quantity must be a positive number greater than 0.');
      return;
    }

    if (cost < 0) {
      setError('Purchase cost cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addStock({
        itemVariantId: formData.itemVariantId,
        quantity: qty,
        costPerUnit: cost,
        batch: formData.batch || null,
      });
      setSuccessMsg(`Inventory updated successfully!`);
      setOpen(false);
      setFormData(initialFormState);
      loadData();
    } catch (err) {
      setError('Failed to update stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      field: 'itemName',
      headerName: 'Product Details',
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            SKU: {params.row.sku}
          </Typography>
          <Stack direction="row" spacing={0.5} mt={0.5}>
            <Chip
              label={params.row.color}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
            <Chip
              label={params.row.size}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#e2e8f0' }}
            />
          </Stack>
        </Box>
      ),
    },
    {
      field: 'totalQuantity',
      headerName: 'Inventory Status',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const isLow = params.value < 10;
        return (
          <Box sx={{ width: '100%' }}>
            <Typography
              variant="body2"
              fontWeight={800}
              color={isLow ? 'error.main' : 'success.main'}
              mb={0.5}
            >
              {params.value} {params.row.unit}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min((params.value / 100) * 100, 100)}
              color={isLow ? 'error' : 'primary'}
              sx={{ height: 4, borderRadius: 2, bgcolor: '#f1f5f9' }}
            />
          </Box>
        );
      },
    },
    {
      field: 'costPerUnit',
      headerName: 'Purchase Price',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          ₹{Number(params.value || 0).toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      field: 'pricePerUnit',
      headerName: 'Selling Price',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700}>
          ₹{Number(params.value || 0).toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      field: 'margin',
      headerName: 'Margin',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => {
        const cost = Number(params.row.costPerUnit || 0);
        const price = Number(params.row.pricePerUnit || 0);
        if (cost === 0) return <Typography variant="caption" color="text.disabled">N/A</Typography>;
        const margin = ((price - cost) / price) * 100;
        const isProfit = margin > 0;
        return (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: isProfit ? 'success.main' : 'error.main' }}>
            {isProfit ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
            <Typography variant="body2" fontWeight={700}>{margin.toFixed(0)}%</Typography>
          </Stack>
        );
      },
    },
  ];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 5 }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          mb={4}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a">
              Stock Management
            </Typography>
            <Typography color="text.secondary">Track investment value and profit margins</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700, height: 48, boxShadow: 3 }}
          >
            Add New Stock
          </Button>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<InventoryIcon color="primary" />}
              label="Active Variants"
              value={stats.totalItems}
              color="#3b82f6"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<WarningAmber color="error" />}
              label="Low Stock Warning"
              value={stats.lowStock}
              color="#ef4444"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<AttachMoney color="success" />}
              label="Investment Value"
              value={`₹${stats.totalValue.toLocaleString('en-IN')}`}
              color="#10b981"
            />
          </Grid>
        </Grid>

        {/* Table Paper */}
        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Stack
            direction="row"
            sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}
            spacing={2}
            justifyContent="space-between"
          >
            <TextField
              size="small"
              placeholder="Search by name or SKU..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 400,
                '& .MuiInputBase-root': { borderRadius: 2, bgcolor: '#f8fafc' },
              }}
            />
            <Button
              startIcon={<ShowChart />}
              size="small"
              color="primary"
              variant="outlined"
              onClick={() => setAnalyticsOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Analytics
            </Button>
          </Stack>

          <Box sx={{ height: 600, width: '100%', bgcolor: 'white' }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              rowHeight={75}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 'bold' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9' },
              }}
            />
          </Box>
        </Paper>
      </Container>

      {/* Analytics Popup */}
      <Dialog
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5, pt: 3 }}>
          <BarChart color="primary" /> Inventory Analytics
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ py: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                TOTAL INVESTMENT (COST)
              </Typography>
              <Typography variant="h5" fontWeight={900}>
                ₹{stats.totalValue.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                POTENTIAL REVENUE (SELLING)
              </Typography>
              <Typography variant="h5" fontWeight={900} color="primary.main">
                ₹{stats.potentialRevenue.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Divider />
            <Box
              sx={{
                p: 2,
                bgcolor: '#f0fdf4',
                borderRadius: 3,
                border: '1px solid #dcfce7',
              }}
            >
              <Typography variant="caption" color="success.main" fontWeight={800}>
                ESTIMATED GROSS PROFIT
              </Typography>
              <Typography variant="h4" fontWeight={900} color="success.dark">
                ₹{stats.projectedProfit.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={2}
              sx={{ p: 2, bgcolor: '#fff7ed', borderRadius: 3, border: '1px solid #ffedd5' }}
            >
              <WarningAmber color="warning" />
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#9a3412">
                  Stock Health
                </Typography>
                <Typography variant="body2" color="#c2410c">
                  {stats.lowStock} items are currently below the safety threshold.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setAnalyticsOpen(false)}
            fullWidth
            variant="outlined"
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Close Insights
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, pt: 3 }}>Record Stock Purchase</DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* SEARCHABLE SELECTION (AUTOCOMPLETE) */}
            <Autocomplete
              options={itemVariants}
              getOptionLabel={(option) =>
                `${option.itemName} - ${option.color} (${option.size})`
              }
              filterOptions={(options, { inputValue }) =>
                options.filter(
                  (o) =>
                    o.itemName.toLowerCase().includes(inputValue.toLowerCase()) ||
                    (o.sku && o.sku.toLowerCase().includes(inputValue.toLowerCase()))
                )
              }
              value={itemVariants.find((v) => v.id === formData.itemVariantId) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, itemVariantId: newValue ? newValue.id : '' });
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box sx={{ py: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {option.itemName} — {option.color} ({option.size})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU: {option.sku} | Unit: {option.unit}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Product Variant"
                  placeholder="Search by name or SKU..."
                  variant="outlined"
                  fullWidth
                />
              )}
            />

            {selectedVariant && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#f0f9ff',
                  borderRadius: 3,
                  border: '1px dashed #0ea5e9',
                }}
              >
                <Grid container alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      RETAIL PRICE
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      ₹{selectedVariant.pricePerUnit}
                    </Typography>
                  </Grid>
                  {formData.costPerUnit && (
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        EST. PROFIT MARGIN
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        color={
                          selectedVariant.pricePerUnit > Number(formData.costPerUnit)
                            ? 'success.main'
                            : 'error.main'
                        }
                      >
                        {(
                          ((selectedVariant.pricePerUnit - Number(formData.costPerUnit)) /
                            selectedVariant.pricePerUnit) *
                          100
                        ).toFixed(1)}
                        %
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            <Grid container spacing={2}>
              {/* Purchase Cost - Prevent negative */}
              <Grid item xs={6}>
                <Tooltip
                  title="Purchase price cannot be negative"
                  arrow
                  placement="top"
                >
                  <TextField
                    fullWidth
                    label="Purchase Cost (Per Unit)"
                    type="number"
                    value={formData.costPerUnit}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow only non-negative numbers
                      if (val === '' || Number(val) >= 0) {
                        setFormData({ ...formData, costPerUnit: val });
                      }
                    }}
                    inputProps={{ min: 0 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    error={formData.costPerUnit !== '' && Number(formData.costPerUnit) < 0}
                    helperText={
                      formData.costPerUnit !== '' && Number(formData.costPerUnit) < 0
                        ? 'Negative value not allowed'
                        : ''
                    }
                  />
                </Tooltip>
              </Grid>

              {/* Quantity - Prevent negative & zero */}
              <Grid item xs={6}>
                <Tooltip
                  title="Quantity must be greater than 0"
                  arrow
                  placement="top"
                >
                  <TextField
                    fullWidth
                    label="Quantity to Add"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow only positive numbers
                      if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                        setFormData({ ...formData, quantity: val });
                      }
                    }}
                    inputProps={{ min: 1, step: 1 }}
                    error={formData.quantity !== '' && Number(formData.quantity) <= 0}
                    helperText={
                      formData.quantity !== '' && Number(formData.quantity) <= 0
                        ? 'Must be greater than 0'
                        : ''
                    }
                  />
                </Tooltip>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Batch / Lot Number"
              placeholder="Optional"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Button
            onClick={() => setOpen(false)}
            sx={{ fontWeight: 700, color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Complete Entry'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
          {successMsg}
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 4,
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    }}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
      <Box sx={{ bgcolor: `${color}15`, p: 2, borderRadius: 3, display: 'flex' }}>
        {icon}
      </Box>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={700}
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={900}>
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export default Stock;