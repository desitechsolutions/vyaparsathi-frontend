import React, { useState, useEffect, useMemo } from 'react';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import {
  Box, Typography, Container, CircularProgress, Alert,
  Paper, Chip, Stack, IconButton, Tooltip, Avatar
} from '@mui/material';
import { Refresh as RefreshIcon, Category as CategoryIcon, Layers } from '@mui/icons-material';
import { fetchProducts } from '../services/api';

const CustomToolbar = ({ rowCount, onRefresh }) => {
  return (
    <GridToolbarContainer sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h6" fontWeight={800} color="#1e293b">
          Product Catalog
        </Typography>
        <Chip 
          label={`${rowCount} total variants`} 
          size="small" 
          variant="outlined" 
          sx={{ fontWeight: 600, color: '#64748b', borderColor: '#e2e8f0' }} 
        />
      </Stack>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <GridToolbarQuickFilter 
          placeholder="Search catalog..." 
          sx={{ 
            '& .MuiInputBase-root': { borderRadius: 2, px: 1, bgcolor: 'white' },
            pb: 0 
          }} 
        />
        <Tooltip title="Refresh Data">
          <IconButton onClick={onRefresh} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </GridToolbarContainer>
  );
};

const ProductOverview = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts();
      if (Array.isArray(res.data)) {
        setProducts(res.data.map(item => ({ ...item, id: item.itemVariantId })));
      }
    } catch (err) {
      setError('Failed to load catalog. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const columns = [
    { 
      field: 'itemName', 
      headerName: 'Product & Brand', 
      flex: 2, 
      minWidth: 250,
      renderCell: (params) => (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
          <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6', fontWeight: 700, fontSize: '0.8rem' }}>
            {params.value.substring(0, 2).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.sku}
            </Typography>
          </Box>
        </Stack>
      )
    },
    { 
      field: 'variantInfo', 
      headerName: 'Attributes', 
      flex: 1.5, 
      minWidth: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Chip label={params.row.color} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />
          <Chip label={params.row.size} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />
          <Chip label={params.row.design} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />
        </Stack>
      )
    },
    { 
      field: 'pricePerUnit', 
      headerName: 'Retail Price', 
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={800} color="#0f172a">
          ₹{params.value.toLocaleString('en-IN')}
        </Typography>
      )
    },
    { 
      field: 'availableQuantity', 
      headerName: 'Availability', 
      width: 180,
      renderCell: (params) => {
        const qty = params.value || 0;
        let status = { label: 'In Stock', color: 'success' };
        if (qty === 0) status = { label: 'Out of Stock', color: 'error' };
        else if (qty < 10) status = { label: 'Low Stock', color: 'warning' };

        return (
          <Stack direction="column" spacing={0.5}>
             <Typography variant="body2" fontWeight={700}>{qty} Units</Typography>
             <Chip 
              label={status.label} 
              color={status.color} 
              size="small" 
              variant="filled"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}
            />
          </Stack>
        );
      }
    }
  ];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
           <Box sx={{ bgcolor: '#0f172a', p: 1, borderRadius: 2 }}>
              <Layers sx={{ color: 'white' }} />
           </Box>
           <Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a">Catalog Overview</Typography>
            <Typography color="text.secondary">Comprehensive list of all product variants and public pricing</Typography>
           </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 4, 
            border: '1px solid #e2e8f0', 
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        >
          <Box sx={{ height: '70vh', width: '100%', bgcolor: 'white' }}>
            <DataGrid
              rows={products}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              rowHeight={70}
              slots={{ 
                toolbar: CustomToolbar,
                loadingOverlay: LinearProgress 
              }}
              slotProps={{
                toolbar: { rowCount: products.length, onRefresh: loadProducts }
              }}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9' },
                '& .MuiDataGrid-footerContainer': { borderTop: '2px solid #e2e8f0' }
              }}
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

// Simple Linear Progress for loading
const LinearProgress = () => (
  <Box sx={{ width: '100%', position: 'absolute', top: 0 }}>
    <CircularProgress size={20} sx={{ m: 2 }} />
  </Box>
);

export default ProductOverview;