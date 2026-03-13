import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import {
  Box, Typography, Paper, Button, Grid, CircularProgress, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, Card, CardContent,
  Avatar, Chip, Stack, Divider, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, LinearProgress, Checkbox, Alert, IconButton, Tooltip as MuiTooltip
} from '@mui/material';

// Icons
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// API Services
import {
  fetchItemDemand, fetchCustomerTrends,
  fetchFuturePurchaseOrders, fetchTopItems, fetchChurnPrediction,
  fetchSeasonalTrends, exportProcurementPlan
} from '../services/api';

const CHART_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    demand: [], trends: [], topItems: [], churn: [], purchase: [], seasonal: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderModal, setOrderModal] = useState({ open: false, item: null });
  const [orderQty, setOrderQty] = useState('');

  useEffect(() => {
    loadAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const results = await Promise.allSettled([
        fetchItemDemand(),
        fetchCustomerTrends(),
        fetchTopItems(),
        fetchChurnPrediction(),
        fetchFuturePurchaseOrders(),
        fetchSeasonalTrends()
      ]);

      const [demandRes, trendsRes, topRes, churnRes, purchaseRes, seasonalRes] = results;

      const safeData = (res) => (res.status === 'fulfilled' ? (res.value?.data || []) : []);

      // --- DATA TRANSFORMATION FOR SEASONAL TRENDS ---
      const rawSeasonal = safeData(seasonalRes);
      const transformedSeasonal = rawSeasonal.map((item, index, array) => {
        const currentSales = parseInt(item.trendDescription?.replace(/[^\d]/g, '') || '0', 10) || 0;
        let growth = 0;
        if (index > 0) {
          const prevSales = parseInt(array[index - 1].trendDescription?.replace(/[^\d]/g, '') || '0', 10) || 0;
          if (prevSales > 0) {
            growth = ((currentSales - prevSales) / prevSales) * 100;
          } else if (currentSales > 0) {
            growth = 100;
          }
        }
        return {
          month: item.season?.split('(')[1]?.replace(')', '') || item.season || '',
          totalSales: currentSales,
          growth: growth.toFixed(1),
          rawSeason: item.season || ''
        };
      });

      setData({
        demand: safeData(demandRes),
        trends: safeData(trendsRes),
        topItems: safeData(topRes),
        churn: safeData(churnRes),
        purchase: safeData(purchaseRes),
        seasonal: transformedSeasonal
      });

      // Show partial error if some calls failed
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0 && failed === results.length) {
        setLoadError('Failed to load analytics data. Please check your connection and try again.');
      } else if (failed > 0) {
        setLoadError(`${failed} data source(s) failed to load. Some charts may be incomplete.`);
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
      setLoadError('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Financial Metrics
  const totalRevenueAtRisk = data.churn.reduce((sum, item) => sum + (item.revenueAtRisk || 0), 0);
  const totalInvestmentNeeded = data.purchase.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

  const handleSelectAll = (e) => {
    setSelectedItems(e.target.checked ? data.purchase.map(p => p.itemId) : []);
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleExport = async () => {
    try {
      const res = await exportProcurementPlan(exportFormat);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Procurement_Plan_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      link.click();
    } catch (err) {
      alert('Export failed.');
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 48, height: 48, opacity: 0.9 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              {title}
            </Typography>
          </Box>
        </Stack>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontSize: '0.75rem' }}>{subtitle}</Typography>}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
        
        {/* HEADER */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
                <AnalyticsIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-1px' }}>Vyapar Intelligence</Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">Financial roadmap & behavioral analytics.</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <MuiTooltip title="Refresh Data">
              <IconButton onClick={loadAllData} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
            <Paper elevation={0} sx={{ p: 1, display: 'flex', gap: 1, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              <FormControl size="small" variant="standard" sx={{ minWidth: 120, px: 2 }}>
                <Select value={exportFormat} onChange={e => setExportFormat(e.target.value)} disableUnderline sx={{ fontWeight: 600 }}>
                  <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                  <MenuItem value="pdf">PDF Report</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<DownloadIcon />} sx={{ borderRadius: 2 }} onClick={handleExport}>Export Plan</Button>
            </Paper>
          </Stack>
        </Stack>

        {loadError && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setLoadError(null)}>
            {loadError}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 20 }}><CircularProgress thickness={5} size={60} /></Box>
        ) : (
          <Grid container spacing={3}>
            
            {/* KPI ROW */}
            <Grid item xs={12} sm={6} md={3}><StatCard title="Revenue At Risk" value={`₹${totalRevenueAtRisk.toLocaleString()}`} icon={<TrendingDownIcon />} color="error" subtitle="Potential Churn Leakage" /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard title="VIP Churn" value={data.churn.filter(c => c.churnProbability > 0.7).length} icon={<GroupIcon />} color="warning" subtitle="High-Risk VIP Customers" /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard title="Procurement" value={`₹${totalInvestmentNeeded.toLocaleString()}`} icon={<WarningAmberIcon />} color="primary" subtitle="Investment Required" /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard title="Inventory Health" value="82%" icon={<SpeedIcon />} color="success" subtitle="Stock Optimization Level" /></Grid>

            {/* MAIN CHARTS */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mb: 3, boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Demand Prediction (Next 30 Days)</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.demand}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="itemName" hide />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="predictedDemandNextMonth" name="Predicted Units" stroke="#3B82F6" strokeWidth={3} fill="#3B82F6" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              {/* TRANSFORMED SEASONAL CHART */}
              <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarMonthIcon color="primary" />
                      <Typography variant="h6" fontWeight={700}>Monthly Sales & Growth</Typography>
                    </Stack>
                    <Chip label="Real-time Trends" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Stack>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.seasonal}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600}} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                           cursor={{fill: '#f8fafc'}}
                           content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                               return (
                                 <Paper sx={{ p: 2, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                   <Typography variant="caption" display="block" color="text.secondary" fontWeight={700}>{payload[0].payload.rawSeason}</Typography>
                                   <Typography variant="h6" color="primary.main">Units: {payload[0].value}</Typography>
                                   <Typography variant="caption" color={payload[0].payload.growth >= 0 ? "success.main" : "error.main"} fontWeight={800}>
                                     {payload[0].payload.growth >= 0 ? "↑" : "↓"} {Math.abs(payload[0].payload.growth)}% vs Last Month
                                   </Typography>
                                 </Paper>
                               );
                             }
                             return null;
                           }}
                        />
                        <Bar dataKey="totalSales" radius={[4, 4, 0, 0]} barSize={40}>
                          {data.seasonal.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.totalSales > 0 ? '#6366F1' : '#e2e8f0'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* SIDEBAR */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mb: 3, boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Financial Leakage</Typography>
                  <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary">Lost Opportunity (Churn Risk)</Typography>
                      <Typography variant="h5" fontWeight={800} color="error.main">₹{totalRevenueAtRisk.toLocaleString()}</Typography>
                      <LinearProgress variant="determinate" value={65} color="error" sx={{ height: 8, borderRadius: 5, mt: 1 }} />
                  </Box>
                  <Box>
                      <Typography variant="body2" color="text.secondary">Restocking Capital Needed</Typography>
                      <Typography variant="h5" fontWeight={800} color="primary.main">₹{totalInvestmentNeeded.toLocaleString()}</Typography>
                      <LinearProgress variant="determinate" value={40} color="primary" sx={{ height: 8, borderRadius: 5, mt: 1 }} />
                  </Box>
                </CardContent>
              </Card>

              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, px: 1 }}>Top Buying Behaviors</Typography>
              <Stack spacing={2}>
                {data.trends.slice(0, 3).map((trend, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', transition: '0.3s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: CHART_COLORS[i % 6], width: 36, height: 36, fontWeight: 800 }}>{trend.customerName[0]}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800}>{trend.customerName}</Typography>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>{trend.buyingPattern}</Typography>
                      </Box>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                      {trend.frequentlyBoughtItems.map((item, idx) => (
                        <Chip key={idx} label={item} size="small" sx={{ fontSize: '0.65rem', fontWeight: 600, bgcolor: '#f1f5f9' }} />
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid>

            {/* PROCUREMENT TABLE */}
            <Grid item xs={12}>
                <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fcfcfc' }}>
                        <Typography variant="h6" fontWeight={700}>Procurement Roadmap</Typography>
                        {selectedItems.length > 0 && (
                          <Button
                            variant="contained" color="primary"
                            startIcon={<ShoppingCartIcon />}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                            onClick={() => navigate('/purchase-orders')}
                          >
                            Create Bulk PO ({selectedItems.length} Items)
                          </Button>
                        )}
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell padding="checkbox"><Checkbox onChange={handleSelectAll} checked={selectedItems.length === data.purchase.length && data.purchase.length > 0} /></TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>ITEM</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>SUGGESTED QTY</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>EST. COST</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>ACTION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.purchase.map((order) => (
                                    <TableRow key={order.itemId} hover selected={selectedItems.includes(order.itemId)}>
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={selectedItems.includes(order.itemId)} onChange={() => handleSelectItem(order.itemId)} />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{order.itemName}</TableCell>
                                        <TableCell align="right"><Chip label={order.suggestedQuantity} size="small" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>₹{order.estimatedCost?.toLocaleString()}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                              size="small" variant="contained"
                                              onClick={() => {
                                                setOrderQty(String(order.suggestedQuantity || 1));
                                                setOrderModal({ open: true, item: order });
                                              }}
                                              sx={{ borderRadius: 1.5, textTransform: 'none' }}
                                            >
                                              Order
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* PO MODAL */}
      <Dialog open={orderModal.open} onClose={() => setOrderModal({ open: false, item: null })} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Purchase Order</DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2">Confirming order for: <b>{orderModal.item?.itemName}</b></Typography>
                <TextField
                  fullWidth label="Order Quantity" type="number"
                  value={orderQty}
                  onChange={e => setOrderQty(e.target.value)}
                  variant="outlined"
                  inputProps={{ min: 1 }}
                />
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Estimated Investment: <b>₹{orderModal.item?.estimatedCost?.toLocaleString()}</b>
                </Alert>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOrderModal({ open: false, item: null })} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<OpenInNewIcon />}
              sx={{ borderRadius: 2 }}
              onClick={() => {
                setOrderModal({ open: false, item: null });
                navigate('/purchase-orders');
              }}
            >
              Go to Purchase Orders
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnalyticsDashboard;