import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  Typography, TextField, InputAdornment, IconButton, Chip, TablePagination,
  Collapse, Box, Button, Tooltip, Divider, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PrintIcon from '@mui/icons-material/Print';
import { fetchSalesWithDue, fetchShop } from '../../services/api'; // Remove generateInvoice
import { useNavigate } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

const statusColors = {
  PAID: 'success',
  PARTIALLY_PAID: 'warning',
  DUE: 'error',
};

function formatAmount(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function getStatus(dueAmount) {
  if (Number(dueAmount) === 0) return 'PAID';
  if (Number(dueAmount) > 0) return 'DUE';
  return 'PARTIALLY_PAID';
}

const SalesHistory = () => {
  const [salesHistory, setSalesHistory] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState({}); // Cache signed URLs by saleId

  // Search/filter state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);

  const navigate = useNavigate();

  const handlePrintInvoice = async (sale) => {
  const saleId = sale.saleId || sale.id;

  // Return cached URL if available
  if (signedUrls[saleId]) {
    const fullUrl = getFullSignedUrl(signedUrls[saleId]);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const response = await axios.get(`http://localhost:8080/api/sales/${saleId}/signed-url`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    const signedUrl = response.data;
    setSignedUrls(prev => ({ ...prev, [saleId]: signedUrl }));

    // Convert to absolute before opening
    const fullUrl = getFullSignedUrl(signedUrl);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.error('Failed to fetch signed invoice URL:', err);
    alert('Failed to load invoice. Please try again.');
  }
};

// Helper function (add this at the top of the file, same as in InvoiceModal)
const API_BASE_URL = 'http://localhost:8080';

const getFullSignedUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSalesWithDue(), fetchShop()])
      .then(([salesRes, shopRes]) => {
        setSalesHistory(salesRes.data || []);
        setShop(shopRes.data || null);
      })
      .catch(() => {
        setSalesHistory([]);
        setShop(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered and sorted sales
  const filteredSales = useMemo(() => {
    return salesHistory
      .filter(sale =>
        (sale.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (sale.invoiceNo || '').toLowerCase().includes(search.toLowerCase()) ||
        (sale.city || '').toLowerCase().includes(search.toLowerCase()) ||
        (sale.state || '').toLowerCase().includes(search.toLowerCase()) ||
        (sale.postalCode || '').toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesHistory, search]);

  // Pagination
  const paginatedSales = useMemo(
    () => filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredSales, page, rowsPerPage]
  );

  // Export as CSV
  const handleExportCSV = () => {
    // ... your existing export logic remains unchanged ...
  };

  const handlePay = (sale) => {
    navigate(`/customer-payments?saleId=${sale.saleId}`);
  };

  return (
    <Box>
      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', md: 'row' },
        alignItems: { md: 'center' }, justifyContent: 'space-between', mb: 2, gap: 2
      }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '1.3rem', md: '1.5rem' } }}
        >
          Sales History
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by customer, invoice, city, state..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />
          <Tooltip title="Export as CSV">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Export CSV
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell sx={{ fontWeight: 'bold' }}>Invoice No</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Paid</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : paginatedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No sales found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale, idx) => {
                  const isExpanded = expandedRow === idx;
                  return (
                    <React.Fragment key={sale.saleId || idx}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedRow(isExpanded ? null : idx)}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{sale.invoiceNo || sale.saleId || idx + 1}</TableCell>
                        <TableCell>{sale.customerName || sale.customerId}</TableCell>
                        <TableCell>
                          {sale.date ? new Date(sale.date).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : ''}
                        </TableCell>
                        <TableCell>{formatAmount(sale.totalAmount)}</TableCell>
                        <TableCell>{formatAmount(sale.paidAmount)}</TableCell>
                        <TableCell>{formatAmount(sale.dueAmount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatus(sale.dueAmount)}
                            color={statusColors[getStatus(sale.dueAmount)] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {[sale.addressLine1, sale.city, sale.state, sale.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ bgcolor: '#f9f9fb', p: 2, borderBottom: '1px solid #eee' }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, color: '#1976d2' }}>
                                Sale Details
                              </Typography>
                              <Divider sx={{ mb: 2 }} />

                              <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 2
                              }}>
                                {/* ... your existing detail fields ... */}
                              </Box>

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  startIcon={<PrintIcon />}
                                  onClick={() => handlePrintInvoice(sale)}
                                >
                                  Print Invoice
                                </Button>

                                {getStatus(sale.dueAmount) === 'DUE' && (
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => handlePay(sale)}
                                  >
                                    Pay
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredSales.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Box>
  );
};

export default SalesHistory;