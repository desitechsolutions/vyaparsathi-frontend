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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { fetchSalesWithDue, fetchShop } from '../../services/api'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

function getPaymentStatus(dueAmount) {
  return Number(dueAmount) <= 0 ? 'PAID' : 'DUE';
}

const SalesHistory = () => {
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState({});
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    fetchSalesWithDue()
      .then((res) => setSalesHistory(res.data || []))
      .catch((err) => console.error("Load Error:", err))
      .finally(() => setLoading(false));
  };

  // =======================
  // EXPORT LOGIC
  // =======================
  const handleExportCSV = () => {
    if (filteredSales.length === 0) return;

    const headers = ["Invoice No,Customer,Date,Total Amount,Status,Due Amount\n"];
    const rows = filteredSales.map(sale => [
      sale.invoiceNo,
      `"${sale.customerName || 'Walk-in'}"`,
      new Date(sale.date).toLocaleDateString('en-IN'),
      sale.totalAmount,
      sale.status,
      sale.dueAmount || 0
    ].join(","));

    const blob = new Blob([headers.concat(rows).join("\n")], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Report_${startDate || 'All'}_to_${endDate || 'Today'}.csv`;
    link.click();
  };

  const handlePrintInvoice = async (sale) => {
    const saleId = sale.saleId || sale.id;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/sales/${saleId}/signed-url`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      window.open(`${API_BASE_URL}${res.data}`, '_blank');
    } catch (err) { alert('Failed to load invoice.'); }
  };

  const handleResumeDraft = (sale) => {
    navigate(`/sales?resumeId=${sale.saleId || sale.id}`, { replace: true });
  };

  // =======================
  // FILTER LOGIC
  // =======================
  const filteredSales = useMemo(() => {
    return salesHistory
      .filter(sale => {
        const matchesSearch = (sale.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
                             (sale.invoiceNo || '').toLowerCase().includes(search.toLowerCase());
        
        const saleDate = new Date(sale.date).setHours(0,0,0,0);
        const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
        const end = endDate ? new Date(endDate).setHours(23,59,59,999) : null;

        const matchesDate = (!start || saleDate >= start) && (!end || saleDate <= end);
        
        return matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesHistory, search, startDate, endDate]);

  const paginatedSales = useMemo(
    () => filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredSales, page, rowsPerPage]
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* HEADER & FILTERS */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Sales History</Typography>
                    <Typography variant="body2" color="textSecondary">Manage invoices and export reports</Typography>
                </Box>
            </Box>
            <Tooltip title="Download CSV for current filters">
                <Button 
                    variant="contained" 
                    startIcon={<DownloadIcon />} 
                    onClick={handleExportCSV}
                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, fontWeight: 700 }}
                >
                    Export CSV
                </Button>
            </Tooltip>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', bgcolor: '#f8fafc' }}>
            <TextField
                size="small"
                placeholder="Search name/invoice..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> }}
                sx={{ bgcolor: 'white', minWidth: 250 }}
            />
            <Divider orientation="vertical" flexItem />
            <Stack direction="row" spacing={1} alignItems="center">
                <DateRangeIcon fontSize="small" color="action" />
                <TextField type="date" size="small" label="From" InputLabelProps={{ shrink: true }} value={startDate} onChange={e => setStartDate(e.target.value)} sx={{ bgcolor: 'white' }} />
                <TextField type="date" size="small" label="To" InputLabelProps={{ shrink: true }} value={endDate} onChange={e => setEndDate(e.target.value)} sx={{ bgcolor: 'white' }} />
                {(startDate || endDate) && (
                    <Button size="small" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear</Button>
                )}
            </Stack>
        </Paper>
      </Stack>

      {/* TABLE */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell width={50} />
                <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : paginatedSales.map((sale, idx) => {
                  const isExpanded = expandedRow === idx;
                  const payStatus = getPaymentStatus(sale.dueAmount);
                  return (
                    <React.Fragment key={sale.saleId || idx}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton size="small" onClick={() => setExpandedRow(isExpanded ? null : idx)}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{sale.invoiceNo}</TableCell>
                        <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                        <TableCell>{new Date(sale.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatAmount(sale.totalAmount)}</TableCell>
                        <TableCell>
                          <Chip label={sale.status} color={statusConfig[sale.status]?.color || 'default'} size="small" />
                        </TableCell>
                        <TableCell>
                          {sale.status !== 'DRAFT' && <Chip label={payStatus} size="small" color={paymentStatusColors[payStatus]} />}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc' }}>
                              <Stack direction="row" spacing={2}>
                                {sale.status === 'DRAFT' ? (
                                    <Button variant="contained" color="warning" startIcon={<PlayArrowIcon />} onClick={() => handleResumeDraft(sale)}>Resume</Button>
                                ) : (
                                    <>
                                        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrintInvoice(sale)} sx={{ bgcolor: '#0f172a' }}>Print</Button>
                                        {Number(sale.dueAmount) > 0 && <Button variant="contained" color="success" onClick={() => navigate(`/customer-payments?saleId=${sale.saleId}`)}>Receive Pay</Button>}
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
        <TablePagination component="div" count={filteredSales.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))} />
      </Paper>
    </Box>
  );
};

export default SalesHistory;