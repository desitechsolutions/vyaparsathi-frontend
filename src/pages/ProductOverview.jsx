import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import { fetchProducts } from '../services/api'; // new API call

// Reusable toolbar with a quick search box and a title
const CustomToolbar = () => {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        Products
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <GridToolbarQuickFilter placeholder="Search products..." />
      </Box>
    </GridToolbarContainer>
  );
};

const ProductOverview = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load products from API
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts();
      if (Array.isArray(res.data)) {
        // DataGrid needs a unique `id`
        setProducts(res.data.map(item => ({ ...item, id: item.itemVariantId })));
      } else {
        throw new Error('API response is not an array.');
      }
    } catch (err) {
      console.error('Product fetch error:', err);
      setError('Failed to load products. Please check your API service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const columns = [
    { field: 'itemName', headerName: 'Item(s)', flex: 2, minWidth: 200 },
    { field: 'description', headerName: 'Description', flex: 2 },
    { field: 'sku', headerName: 'SKU', width: 150 },
    { field: 'color', headerName: 'Color', width: 120 },
    { field: 'size', headerName: 'Size', width: 100 },
    { field: 'design', headerName: 'Design', width: 150 },
    { field: 'pricePerUnit', headerName: 'Price', width: 120 },
    { field: 'availableQuantity', headerName: 'Stock', width: 120 },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Product Overview
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: '75vh', width: '100%' }}>
          <DataGrid
            rows={products}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            slots={{ toolbar: CustomToolbar }}
          />
        </Box>
      )}
    </Container>
  );
};

export default ProductOverview;
