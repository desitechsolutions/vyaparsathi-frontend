import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Avatar, Chip, Button, TextField, 
  InputAdornment, Stack, Checkbox, LinearProgress, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchLowStockAlerts } from '../services/api';
import { useAlerts } from '../context/AlertContext'; 
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const LowStockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // Preparation for Bulk Selection
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  
  const navigate = useNavigate();
  const { manuallySetAlerts } = useAlerts();

  useEffect(() => {
    const getAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await fetchLowStockAlerts();
        const data = response.data || [];
        setAlerts(data);
        if(manuallySetAlerts) manuallySetAlerts(data);
      } catch (err) {
        setError('Failed to fetch low stock alerts. Please check if the service is online.');
      } finally {
        setIsLoading(false);
      }
    };
    getAlerts();
  }, []); // Empty dependency to prevent fetch loops

  // Financial Summary Logic
  const stats = useMemo(() => {
    return alerts.reduce((acc, alert) => {
        const needed = Math.max(0, alert.threshold - alert.currentStock);
        const cost = needed * (alert.lastPurchasePrice || 0);
        return {
            totalCost: acc.totalCost + cost,
            criticalCount: acc.criticalCount + (alert.alertLevel === 'CRITICAL' ? 1 : 0)
        };
    }, { totalCost: 0, criticalCount: 0 });
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(a => a.itemName.toLowerCase().includes(filter.toLowerCase()) || a.sku.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => (a.alertLevel === 'CRITICAL' ? -1 : 1));
  }, [alerts, filter]);

  // Selection Logic
  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? filteredAlerts.map(a => a.itemVariantId) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (isLoading) return <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress size={60} thickness={5} /></Box>;

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 }, backgroundColor: "#f8fafc", minHeight: '100vh' }}>
      
      {/* HEADER CARDS */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, flex: 1, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#fee2e2', color: '#ef4444' }}><WarningIcon /></Avatar>
            <Box>
                <Typography variant="h5" fontWeight={800}>{stats.criticalCount} / {alerts.length}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>CRITICAL ALERTS</Typography>
            </Box>
        </Paper>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, flex: 1, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#dbeafe', color: '#3b82f6' }}><AccountBalanceWalletIcon /></Avatar>
            <Box>
                <Typography variant="h5" fontWeight={800}>₹{stats.totalCost.toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>EST. REPLENISHMENT COST</Typography>
            </Box>
        </Paper>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, bgcolor: 'white' }}>
            <TextField 
                size="small" 
                placeholder="Search by SKU or Name..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                sx={{ width: 300 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> }}
            />
            {selectedIds.length > 0 && (
                <Button 
                    variant="contained" 
                    startIcon={<ShoppingCartIcon />} 
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    onClick={() => navigate(`/purchase-orders/bulk?ids=${selectedIds.join(',')}`)}
                >
                    Create Bulk Order ({selectedIds.length})
                </Button>
            )}
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox 
                        indeterminate={selectedIds.length > 0 && selectedIds.length < filteredAlerts.length}
                        checked={selectedIds.length === filteredAlerts.length && filteredAlerts.length > 0}
                        onChange={handleSelectAll} 
                    />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>ITEM DETAILS</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b' }}>STOCK LEVEL</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b' }}>EST. UNIT COST</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b' }}>INVESTMENT</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b' }}>ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAlerts.map((alert) => {
                const needed = Math.max(0, alert.threshold - alert.currentStock);
                const investment = needed * (alert.lastPurchasePrice || 0);
                const stockPercentage = (alert.currentStock / alert.threshold) * 100;

                return (
                  <TableRow key={alert.itemVariantId} hover selected={selectedIds.includes(alert.itemVariantId)}>
                    <TableCell padding="checkbox">
                        <Checkbox 
                            checked={selectedIds.includes(alert.itemVariantId)} 
                            onChange={() => handleSelectOne(alert.itemVariantId)}
                        />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{alert.itemName}</Typography>
                      <Typography variant="caption" sx={{ bgcolor: '#f1f5f9', px: 0.5, borderRadius: 0.5, fontFamily: 'monospace' }}>{alert.sku}</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                        <Stack spacing={0.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" fontWeight={700}>{alert.currentStock} / {alert.threshold}</Typography>
                                <Typography variant="caption" color="text.secondary">{Math.round(stockPercentage)}%</Typography>
                            </Stack>
                            <LinearProgress 
                                variant="determinate" 
                                value={Math.min(stockPercentage, 100)} 
                                color={alert.alertLevel === 'CRITICAL' ? 'error' : 'warning'}
                                sx={{ height: 6, borderRadius: 3 }}
                            />
                        </Stack>
                    </TableCell>
                    <TableCell align="right">₹{alert.lastPurchasePrice?.toLocaleString() || 0}</TableCell>
                    <TableCell align="right">
                        <Typography variant="body2" fontWeight={800} color="primary.main">
                            ₹{investment.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">for {needed} units</Typography>
                    </TableCell>
                    <TableCell align="center">
                       <Chip 
                        label={alert.alertLevel} 
                        size="small" 
                        sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: 1 }}
                        color={alert.alertLevel === 'CRITICAL' ? 'error' : 'warning'} 
                       />
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="contained" 
                        disableElevation
                        size="small" 
                        sx={{ borderRadius: 1.5, textTransform: 'none' }}
                        onClick={() => navigate(`/purchase-orders/?variantId=${alert.itemVariantId}&qty=${needed}`)}
                      >
                        Restock
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredAlerts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                        <Typography color="text.secondary">No low stock alerts found.</Typography>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default LowStockAlerts;