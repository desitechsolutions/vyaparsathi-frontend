import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  Typography, TextField, InputAdornment, IconButton, Chip, TablePagination,
  Collapse, Box, Button, Tooltip, Divider, CircularProgress, Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PrintIcon from '@mui/icons-material/Print';
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // Icon for Resume
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import { fetchSalesWithDue, fetchShop } from '../../services/api'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Updated Status Configuration
const statusConfig = {
  COMPLETED: { label: 'Completed', color: 'success' },
  DRAFT: { label: 'Draft', color: 'warning' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
};

const paymentStatusColors = {
  PAID: 'success',
  PARTIALLY_PAID: 'warning',
  DUE: 'error',
};

function formatAmount(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// Logic to determine Payment Status (only for Completed sales)
function getPaymentStatus(dueAmount) {
  const due = Number(dueAmount);
  if (due <= 0) return 'PAID';
  return 'DUE'; // Simplify for history view
}

const SalesHistory = () => {
  const [salesHistory, setSalesHistory] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);

  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:8080';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchSalesWithDue(), fetchShop()])
      .then(([salesRes, shopRes]) => {
        setSalesHistory(salesRes.data || []);
        setShop(shopRes.data || null);
      })
      .catch((err) => console.error("Load Error:", err))
      .finally(() => setLoading(false));
  };

  const getFullSignedUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handlePrintInvoice = async (sale) => {
    const saleId = sale.saleId || sale.id;
    if (signedUrls[saleId]) {
      window.open(getFullSignedUrl(signedUrls[saleId]), '_blank');
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/sales/${saleId}/signed-url`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSignedUrls(prev => ({ ...prev, [saleId]: res.data }));
      window.open(getFullSignedUrl(res.data), '_blank');
    } catch (err) {
      alert('Failed to load invoice.');
    }
  };

const handleResumeDraft = (sale) => {
  const id = sale.saleId || sale.id;
  // Ensure the path matches exactly what is defined in your App.js/Routes
  // If your sales page is at /sales, use that. 
  // We also add a state or ensure the query param is clean.
  navigate(`/sales?resumeId=${id}`, { replace: true });
  
  // Optional: If Sales is already open in the background, 
  // some developers prefer switching the tab manually via state, 
  // but the URL listener in Sales.jsx should handle this.
};

  const handlePay = (sale) => {
    navigate(`/customer-payments?saleId=${sale.saleId}`);
  };

  const filteredSales = useMemo(() => {
    return salesHistory
      .filter(sale =>
        (sale.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (sale.invoiceNo || '').toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesHistory, search]);

  const paginatedSales = useMemo(
    () => filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredSales, page, rowsPerPage]
  );

  return (
    <Box sx={{ p: 1 }}>
      {/* HEADER SECTION */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>Sales History</Typography>
                <Typography variant="body2" color="textSecondary">Manage finalized invoices and drafts</Typography>
            </Box>
        </Box>
        
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
            sx={{ bgcolor: 'white', borderRadius: 1, width: { md: 300 } }}
          />
          <Button variant="contained" startIcon={<DownloadIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Export
          </Button>
        </Stack>
      </Stack>

      {/* TABLE SECTION */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell width={50} />
                <TableCell sx={{ fontWeight: 700 }}>Invoice / Draft #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Amt</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Record Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : paginatedSales.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}>No records found</TableCell></TableRow>
              ) : paginatedSales.map((sale, idx) => {
                  const isExpanded = expandedRow === idx;
                  const isDraft = sale.status === 'DRAFT';
                  const currentStatus = statusConfig[sale.status] || statusConfig.COMPLETED;
                  const payStatus = getPaymentStatus(sale.dueAmount);

                  return (
                    <React.Fragment key={sale.saleId || idx}>
                      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                        <TableCell>
                          <IconButton size="small" onClick={() => setExpandedRow(isExpanded ? null : idx)}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{sale.invoiceNo}</TableCell>
                        <TableCell>{sale.customerName || 'Walk-in Customer'}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {new Date(sale.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatAmount(sale.totalAmount)}</TableCell>
                        <TableCell>
                          <Chip label={currentStatus.label} color={currentStatus.color} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>
                          {!isDraft && (
                            <Chip 
                                label={payStatus} 
                                size="small" 
                                color={paymentStatusColors[payStatus]} 
                                sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, bgcolor: '#f1f5f9', mx: 2, mb: 2, borderRadius: 2 }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 800 }}>Quick Actions</Typography>
                              <Divider sx={{ mb: 2 }} />
                              
                              <Stack direction="row" spacing={2}>
                                {isDraft ? (
                                    <Button
                                      variant="contained"
                                      color="warning"
                                      startIcon={<PlayArrowIcon />}
                                      onClick={() => handleResumeDraft(sale)}
                                      sx={{ fontWeight: 700 }}
                                    >
                                      Resume & Finalize
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="contained"
                                            startIcon={<PrintIcon />}
                                            onClick={() => handlePrintInvoice(sale)}
                                            sx={{ bgcolor: '#0f172a' }}
                                        >
                                            Print Invoice
                                        </Button>
                                        {Number(sale.dueAmount) > 0 && (
                                            <Button variant="contained" color="success" onClick={() => handlePay(sale)}>
                                                Receive Payment
                                            </Button>
                                        )}
                                    </>
                                )}
                              </Stack>

                              <Box sx={{ mt: 2 }}>
                                 <Typography variant="caption" color="textSecondary">
                                     Address: {[sale.addressLine1, sale.city].filter(Boolean).join(', ') || 'N/A'}
                                 </Typography>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              }
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredSales.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </Box>
  );
};

export default SalesHistory;