import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  Typography, TextField, InputAdornment, IconButton, Chip, TablePagination,
  Collapse, Box, Button, Tooltip, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DownloadIcon from '@mui/icons-material/Download';
import InvoiceModal from './InvoiceModal';
import dayjs from 'dayjs';
import PrintIcon from '@mui/icons-material/Print';
import { fetchSalesWithDue, fetchShop, generateInvoice } from '../../services/api';
import { useNavigate } from 'react-router-dom';

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
  // For printing invoices
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPdf, setPrintPdf] = useState(null);
  const [printPageNumber, setPrintPageNumber] = useState(1);
  const [printNumPages, setPrintNumPages] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);

  const [salesHistory, setSalesHistory] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search/filter state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);

  const navigate = useNavigate();

  const handlePrintInvoice = async (sale) => {
    setPrintLoading(true);
    try {
      const res = await generateInvoice({
        invoiceNo: sale.invoiceNo,
        saleId: sale.saleId
      });
      setPrintPdf(res.data);
      setPrintModalOpen(true);
      setPrintPageNumber(1);
      setPrintNumPages(null);
    } catch (e) {
      alert('Failed to fetch invoice PDF');
    } finally {
      setPrintLoading(false);
    }
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

  // Export as CSV (shop details included as header, not in UI)
  const handleExportCSV = () => {
    const headers = [
      'Invoice No', 'Customer', 'Date', 'Total Amount', 'Paid', 'Due', 'Status', 'Address'
    ];
    const rows = filteredSales.map(sale => [
      sale.invoiceNo || '',
      sale.customerName || sale.customerId || '',
      sale.date ? dayjs(sale.date).format('DD MMM YYYY, hh:mm A') : '',
      formatAmount(sale.totalAmount),
      formatAmount(sale.paidAmount),
      formatAmount(sale.dueAmount),
      getStatus(sale.dueAmount),
      [sale.addressLine1, sale.city, sale.state, sale.postalCode].filter(Boolean).join(', ')
    ]);
    let shopHeader = '';
    if (shop) {
      shopHeader = [
        `Shop Name: ${shop.name || ''}`,
        `Owner: ${shop.ownerName || ''}`,
        `Address: ${shop.address || ''}, ${shop.state || ''}`,
        `GSTIN: ${shop.gstin || ''}`,
        `Report Generated: ${dayjs().format('DD MMM YYYY, hh:mm A')}`
      ].join('\n');
    }
    const csvContent =
      (shopHeader ? shopHeader + '\n\n' : '') +
      [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-history-${dayjs().format('YYYYMMDD-HHmmss')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePay = (sale) => {
    navigate(`/customer-payments?saleId=${sale.saleId}`);
  };

  return (
    <Box>
      {/* Shop details are NOT shown on UI, only in export */}
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
                    Loading...
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
                          {sale.date ? dayjs(sale.date).format('DD MMM YYYY, hh:mm A') : ''}
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
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Invoice No:</Typography>
                                  <Typography variant="body2">{sale.invoiceNo}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Customer:</Typography>
                                  <Typography variant="body2">{sale.customerName}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Date:</Typography>
                                  <Typography variant="body2">
                                    {sale.date ? dayjs(sale.date).format('DD MMM YYYY, hh:mm A') : ''}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Total Amount:</Typography>
                                  <Typography variant="body2">{formatAmount(sale.totalAmount)}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Paid Amount:</Typography>
                                  <Typography variant="body2">{formatAmount(sale.paidAmount)}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Due Amount:</Typography>
                                  <Typography variant="body2">{formatAmount(sale.dueAmount)}</Typography>
                                </Box>
                                <Box sx={{ gridColumn: { sm: 'span 2' } }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Address:</Typography>
                                  <Typography variant="body2">
                                    {[sale.addressLine1, sale.city, sale.state, sale.postalCode]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  startIcon={<PrintIcon />}
                                  onClick={() => handlePrintInvoice(sale)}
                                  disabled={printLoading}
                                >
                                  {printLoading ? "Loading..." : "Print Invoice"}
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
      <InvoiceModal
        open={printModalOpen}
        setOpen={setPrintModalOpen}
        invoicePdf={printPdf}
        pageNumber={printPageNumber}
        setPageNumber={setPrintPageNumber}
        numPages={printNumPages}
        onDocumentLoadSuccess={({ numPages }) => setPrintNumPages(numPages)}
      />
    </Box>
  );
};

export default SalesHistory;
