import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, IconButton, Switch,
  TextField, InputAdornment, Stack, Tooltip, Avatar, Button,
  CircularProgress, Alert, Checkbox
} from '@mui/material';
import { 
  Search, 
  Storefront, 
  FilterList, 
  MoreVert, 
  Email, 
  LocationOn,
  PowerSettingsNew
} from '@mui/icons-material';
import { fetchGlobalShopSummary, toggleShopStatus } from '../../services/api';

export const GlobalShopManagement = () => {
  // State for Data
  const [shops, setShops] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filter State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Bulk Selection State
  const [selectedShops, setSelectedShops] = useState([]);

  // Debounce search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const loadShops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Updated API call to include the search term
      const data = await fetchGlobalShopSummary(page, rowsPerPage, 'createdAt,desc', debouncedSearch);
      
      if (data && data.content) {
        setShops(data.content);
        setTotalElements(data.totalElements);
      } else {
        setShops([]);
        setTotalElements(0);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to fetch shop ecosystem data. Check API connectivity.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const handleToggleStatus = async (shopId, currentStatus) => {
    try {
      await toggleShopStatus(shopId, !currentStatus);
      setShops(prev => prev.map(shop => 
        shop.shopId === shopId ? { ...shop, active: !currentStatus } : shop
      ));
    } catch (err) {
      console.error("Status update failed");
      loadShops();
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedShops(shops.map(s => s.shopId));
      return;
    }
    setSelectedShops([]);
  };

  const handleSelectOne = (id) => {
    setSelectedShops(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getTierColor = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'GOLD': return '#fbbf24';
      case 'SILVER': return '#94a3b8';
      default: return '#4ade80';
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#0f172a', minHeight: '100vh', color: 'white' }}>
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Storefront sx={{ fontSize: 40, color: '#38bdf8' }} />
            Shop Ecosystem
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Manage {totalElements} onboarded businesses and their subscriptions
          </Typography>
        </Box>

        {selectedShops.length > 0 && (
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<PowerSettingsNew />}
            sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
          >
            Bulk Deactivate ({selectedShops.length})
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Filters Area */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1e293b', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', backgroundImage: 'none' }}>
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            placeholder="Search by Shop Name, Code or Owner..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><Search sx={{ color: 'gray' }} /></InputAdornment>),
              sx: { color: 'white', bgcolor: '#0f172a', borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }
            }}
          />
          <Tooltip title="Advanced Filters">
            <Button startIcon={<FilterList />} sx={{ color: 'white', minWidth: 120 }}>Filters</Button>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', backgroundImage: 'none' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
            <TableRow>
              <TableCell padding="checkbox" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Checkbox 
                  indeterminate={selectedShops.length > 0 && selectedShops.length < shops.length}
                  checked={shops.length > 0 && selectedShops.length === shops.length}
                  onChange={handleSelectAll}
                  sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#38bdf8' } }}
                />
              </TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>SHOP DETAILS</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>OWNER</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>SUBSCRIPTION</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>STATUS</TableCell>
              <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10, border: 0 }}><CircularProgress sx={{ color: '#38bdf8' }} /></TableCell></TableRow>
            ) : shops.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10, border: 0, color: 'rgba(255,255,255,0.4)' }}>No shops found in the ecosystem.</TableCell></TableRow>
            ) : (
              shops.map((shop) => (
                <TableRow key={shop.shopId} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell padding="checkbox" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Checkbox 
                      checked={selectedShops.includes(shop.shopId)}
                      onChange={() => handleSelectOne(shop.shopId)}
                      sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#38bdf8' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#38bdf8', borderRadius: 2, fontWeight: 800 }}>{shop.shopName ? shop.shopName.charAt(0) : 'S'}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="white">{shop.shopName}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn sx={{ fontSize: 12 }} /> {shop.state} • ID: {shop.shopCode}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="body2" fontWeight={600} color="white">{shop.ownerName || 'Unknown'}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email sx={{ fontSize: 12 }} /> {shop.ownerEmail || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Chip 
                      label={shop.currentTier || 'FREE'} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${getTierColor(shop.currentTier)}20`, 
                        color: getTierColor(shop.currentTier), 
                        fontWeight: 800, 
                        border: `1px solid ${getTierColor(shop.currentTier)}40`,
                        fontSize: '0.65rem'
                      }} 
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'rgba(255,255,255,0.4)' }}>
                      Expires: {shop.expiryDate ? new Date(shop.expiryDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Switch 
                        checked={shop.active !== false}
                        onChange={() => handleToggleStatus(shop.shopId, shop.active)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#4ade80' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4ade80' }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: shop.active !== false ? '#4ade80' : '#ef4444', fontWeight: 700 }}>
                        {shop.active !== false ? 'ACTIVE' : 'DISABLED'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <IconButton sx={{ color: 'rgba(255,255,255,0.3)' }} size="small">
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ 
            color: 'rgba(255,255,255,0.7)', 
            borderTop: '1px solid rgba(255,255,255,0.05)',
            '.MuiTablePagination-selectIcon': { color: 'white' }
          }}
        />
      </TableContainer>
    </Box>
  );
};

export default GlobalShopManagement;