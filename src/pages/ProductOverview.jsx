import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import {
  Box, Typography, Container, CircularProgress, Alert,
  Paper, Chip, Stack, IconButton, Tooltip, Avatar
} from '@mui/material';
import { useSearchParams } from 'react-router-dom'; 
import { Refresh as RefreshIcon, Layers } from '@mui/icons-material';
import { fetchProducts } from '../services/api';
import { useTranslation } from 'react-i18next'; // ← added

const CustomToolbar = ({ rowCount, onRefresh }) => {
  const { t } = useTranslation(); // ← added

  return (
    <GridToolbarContainer sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h6" fontWeight={800} color="#1e293b">
          {t('productsOverview.title')} {/* ← translated */}
        </Typography>
        <Chip 
          label={t('productsOverview.totalVariants', { count: rowCount })} 
          size="small" 
          variant="outlined" 
          sx={{ fontWeight: 600, color: '#64748b', borderColor: '#e2e8f0' }} 
        />
      </Stack>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <GridToolbarQuickFilter 
          placeholder={t('productsOverview.searchPlaceholder')} 
          sx={{ 
            '& .MuiInputBase-root': { borderRadius: 2, px: 1, bgcolor: 'white' },
            pb: 0 
          }} 
        />
        <Tooltip title={t('productsOverview.refreshTooltip')}>
          <IconButton onClick={onRefresh} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </GridToolbarContainer>
  );
};

const ProductOverview = () => {
  const { t } = useTranslation(); // ← added
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const urlSearchValue = searchParams.get('search');

  useEffect(() => {
    if (urlSearchValue) {
      setSearchQuery(urlSearchValue); 
    }
  }, [urlSearchValue]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts();
      if (Array.isArray(res.data)) {
        setProducts(res.data.map(item => ({ ...item, id: item.itemVariantId })));
      }
    } catch (err) {
      setError(t('productsOverview.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const columns = [
    { 
      field: 'itemName', 
      headerName: t('productsOverview.columns.productBrand'), 
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
      headerName: t('productsOverview.columns.attributes'), 
      flex: 1.5, 
      minWidth: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          {params.row.color && <Chip label={params.row.color} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />}
          {params.row.size && <Chip label={params.row.size} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />}
          {params.row.design && <Chip label={params.row.design} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />}
        </Stack>
      )
    },
    { 
      field: 'pricePerUnit', 
      headerName: t('productsOverview.columns.retailPrice'), 
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={800} color="#0f172a">
          ₹{params.value.toLocaleString('en-IN')}
        </Typography>
      )
    },
    { 
      field: 'availableQuantity', 
      headerName: t('productsOverview.columns.availability'), 
      width: 180,
      renderCell: (params) => {
        const qty = params.value || 0;
        let status = { label: t('productsOverview.status.inStock'), color: 'success' };
        if (qty === 0) status = { label: t('productsOverview.status.outOfStock'), color: 'error' };
        else if (qty < 10) status = { label: t('productsOverview.status.lowStock'), color: 'warning' };

        return (
          <Stack direction="column" spacing={0.5}>
            <Typography variant="body2" fontWeight={700}>{qty} {t('productsOverview.units')}</Typography>
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
            <Typography variant="h4" fontWeight={900} color="#0f172a">
              {t('productsOverview.title')}
            </Typography>
            <Typography color="text.secondary">
              {t('productsOverview.subtitle')}
            </Typography>
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
                loadingOverlay: () => <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
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
              localeText={{
                noRowsLabel: t('productsOverview.noData'),
                columnHeaderSortIconLabel: t('productsOverview.sort'),
                // Add more translations if needed
              }}
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProductOverview;