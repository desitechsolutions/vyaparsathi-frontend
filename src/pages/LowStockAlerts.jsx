import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Chip, Button, TextField, InputAdornment, Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchLowStockAlerts } from '../services/api';
import { useAlerts } from '../context/AlertContext'; 
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const LowStockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
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
        manuallySetAlerts(data);
        setError('');
      } catch (err) {
        setError('Failed to fetch low stock alerts. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    getAlerts();
  }, [manuallySetAlerts]);

  const filteredAndSortedAlerts = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => {
      if (a.alertLevel === 'CRITICAL' && b.alertLevel !== 'CRITICAL') return -1;
      if (a.alertLevel !== 'CRITICAL' && b.alertLevel === 'CRITICAL') return 1;
      return 0;
    });

    if (!filter) {
      return sorted;
    }

    return sorted.filter(alert =>
      alert.itemName.toLowerCase().includes(filter.toLowerCase()) ||
      alert.sku.toLowerCase().includes(filter.toLowerCase()) ||
      (alert.supplierName && alert.supplierName.toLowerCase().includes(filter.toLowerCase()))
    );
  }, [alerts, filter]);

  const getAlertChip = (level) => {
    if (level === 'CRITICAL') {
      return <Chip icon={<ErrorIcon />} label="Critical" color="error" size="small" />;
    }
    return <Chip icon={<WarningIcon />} label="Low" color="warning" size="small" />;
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 }, backgroundColor: "#f0f2f5" }}>
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }} gutterBottom>
          Low Stock Alerts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review items that are below their stock threshold and take action.
        </Typography>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search by Item Name, SKU, or Supplier..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <TableContainer>
            <Table aria-label="low stock alerts table" size="small">
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Item / SKU</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Supplier</TableCell>
                  <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>Current Stock</TableCell>
                  <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>On Order</TableCell>
                  <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>Threshold</TableCell>
                  <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>Last Price</TableCell>
                  <TableCell align="center" sx={{ color: 'common.white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="center" sx={{ color: 'common.white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">
                        {filter ? 'No matching items found.' : 'No low stock alerts. Everything looks good!'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedAlerts.map((alert) => (
                    <TableRow
                      key={alert.itemVariantId}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        backgroundColor: alert.alertLevel === 'CRITICAL' ? '#ffebee' : '#fffde7'
                      }}
                    >
                      <TableCell component="th" scope="row">
                        <Typography variant="body2" fontWeight="500">{alert.itemName}</Typography>
                        <Typography variant="caption" color="text.secondary">{alert.sku}</Typography>
                      </TableCell>
                      <TableCell>{alert.supplierName || <Typography variant="caption" color="text.secondary">N/A</Typography>}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: alert.alertLevel === 'CRITICAL' ? 'error.dark' : 'warning.dark' }}>
                        {alert.currentStock} {alert.unit}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
                        {alert.quantityOnOrder || 0}
                      </TableCell>
                      <TableCell align="right">{alert.threshold}</TableCell>
                      <TableCell align="right">
                        {alert.lastPurchasePrice ? `₹${Number(alert.lastPurchasePrice).toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell align="center">{getAlertChip(alert.alertLevel)}</TableCell>
                      <TableCell align="center">
                        {alert.quantityOnOrder > 0 ? (
                          <Tooltip title="An order for this item is already pending.">
                            <Chip icon={<InfoOutlinedIcon />} label="PO Pending" color="info" size="small" variant="outlined" />
                          </Tooltip>
                        ) : (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => navigate(`/purchase-orders/?variantId=${alert.itemVariantId}&supplierId=${alert.supplierId || ''}`)}
                            title="Create a new Purchase Order"
                          >
                            Create PO
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default LowStockAlerts;