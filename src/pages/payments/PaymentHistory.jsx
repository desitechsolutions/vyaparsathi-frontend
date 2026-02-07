import React, { useState, useMemo } from 'react';
import {
  Box, Typography, CircularProgress, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, Autocomplete, TextField,
  Stack, TableSortLabel, InputAdornment, MenuItem, Select, FormControl, 
  InputLabel, alpha, Tooltip, IconButton, Chip, TablePagination, Skeleton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (amount) => {
  const num = Math.abs(Number(amount) || 0);
  const [integer, decimal = '00'] = num.toFixed(2).split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₹${formattedInteger}.${decimal}`;
};

const formatCurrencyPDF = (amount) => {
  const num = Math.abs(Number(amount) || 0);
  const [integer, decimal = '00'] = num.toFixed(2).split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `Rs. ${formattedInteger}.${decimal}`;
};

// Helper component for smooth loading states
const SkeletonRow = () => (
  <TableRow>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
    <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
    <TableCell><Skeleton variant="text" width="90%" /></TableCell>
    <TableCell><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} /></TableCell>
  </TableRow>
);

const PaymentHistory = ({ 
  loading, 
  paymentHistory, 
  totalElements = 0,
  page = 0,
  rowsPerPage = 20,
  onPageChange,
  onRowsPerPageChange,
  customers, 
  selectedCustomer, 
  onCustomerChange, 
  onRefresh 
}) => {
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('paymentDate');
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const downloadCSV = () => {
    const headers = ['Date', 'Invoice/Type', 'Amount', 'Method', 'Transaction ID', 'Status'];
    const rows = processedHistory.map(p => [
      new Date(p.paymentDate).toLocaleString('en-IN'),
      p.invoiceNumber || 'Account Advance',
      Number(p.amount).toFixed(2),
      p.paymentMethod,
      p.transactionId || p.reference || '-',
      p.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Payments_${selectedCustomer?.name || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PAYMENT RECEIPT LOG", pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 25, { align: 'center' });
    doc.line(14, 30, pageWidth - 14, 30);

    doc.setFontSize(11);
    doc.text(`Customer: ${selectedCustomer?.name || 'All Customers'}`, 14, 40);
    doc.text(`Current Page Total: ${formatCurrencyPDF(viewTotal)}`, 14, 46);

    const tableColumn = ["Date", "Invoice #", "Method", "Reference", "Amount", "Status"];
    const tableRows = processedHistory.map(p => [
      new Date(p.paymentDate).toLocaleDateString('en-IN'),
      p.invoiceNumber || 'Advance',
      p.paymentMethod,
      p.transactionId || p.reference || '-',
      formatCurrencyPDF(p.amount),
      p.status
    ]);

    autoTable(doc, {
      startY: 55,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40], halign: 'center' },
      styles: { fontSize: 9 },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } }
    });

    doc.save(`Payments_Page_${page + 1}.pdf`);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const processedHistory = useMemo(() => {
    let data = Array.isArray(paymentHistory) ? paymentHistory : [];
    let filtered = [...data];

    if (filterText) {
      const lowerText = filterText.toLowerCase();
      filtered = filtered.filter(p => 
        p.invoiceNumber?.toLowerCase().includes(lowerText) ||
        p.reference?.toLowerCase().includes(lowerText) ||
        p.transactionId?.toLowerCase().includes(lowerText)
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    return filtered.sort((a, b) => {
      let valA = a[orderBy];
      let valB = b[orderBy];
      if (orderBy === 'paymentDate') {
        valA = new Date(a.paymentDate).getTime();
        valB = new Date(b.paymentDate).getTime();
      }
      if (order === 'desc') return valB > valA ? 1 : -1;
      return valA > valB ? 1 : -1;
    });
  }, [paymentHistory, order, orderBy, filterText, statusFilter]);

  const viewTotal = useMemo(() => 
    processedHistory.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  , [processedHistory]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
      case 'SUCCESS': return { bg: alpha('#10b981', 0.1), text: '#047857' };
      case 'PARTIALLY_PAID': return { bg: alpha('#f59e0b', 0.1), text: '#b45309' };
      default: return { bg: alpha('#6b7280', 0.1), text: '#374151' };
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 0, borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="center">
          <Autocomplete
            options={customers}
            getOptionLabel={o => o.name}
            value={selectedCustomer}
            onChange={(_, v) => onCustomerChange(v)}
            sx={{ width: { xs: '100%', md: 250 }, bgcolor: 'white' }}
            renderInput={(params) => <TextField {...params} label="Filter by Customer" size="small" />}
          />

          <TextField
            size="small"
            placeholder="Search current page..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ width: { xs: '100%', md: 250 }, bgcolor: 'white' }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'white' }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="PARTIALLY_PAID">Partial</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={onRefresh} disabled={loading} size="small"><RefreshIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Download Current View">
              <IconButton onClick={downloadCSV} disabled={loading || processedHistory.length === 0} size="small">
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Current Page">
              <IconButton onClick={printPDF} disabled={loading || processedHistory.length === 0} size="small">
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fff' }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          PAGE {page + 1} | {loading ? '...' : totalElements} TOTAL RECORDS
        </Typography>
        <Typography variant="subtitle2" fontWeight={800} color="primary.main">
          {loading ? <Skeleton width={100} /> : `Page Total: ${formatCurrency(viewTotal)}`}
        </Typography>
      </Box>

      <TableContainer sx={{ minHeight: 400, maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800 }}>
                <TableSortLabel
                  active={orderBy === 'paymentDate'}
                  direction={orderBy === 'paymentDate' ? order : 'asc'}
                  onClick={() => handleRequestSort('paymentDate')}
                >Date</TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800 }}>Invoice / Type</TableCell>
              <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800 }} align="right">
                <TableSortLabel
                  active={orderBy === 'amount'}
                  direction={orderBy === 'amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('amount')}
                >Amount</TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800 }}>Method</TableCell>
              <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800 }}>Transaction Info</TableCell>
              <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Display Skeleton Rows instead of a single spinner to keep layout stable
              [...Array(rowsPerPage)].map((_, i) => <SkeletonRow key={i} />)
            ) : processedHistory.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>No transactions found.</TableCell></TableRow>
            ) : (
              processedHistory.map((p) => {
                const statusTheme = getStatusColor(p.status);
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell>
                      {p.invoiceNumber ? (
                         <Typography variant="body2" fontWeight={700}>#{p.invoiceNumber}</Typography>
                      ) : (
                        <Chip label="Advance" size="small" color="secondary" sx={{ fontWeight: 800, height: 18, fontSize: '0.6rem' }} />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: '#059669' }}>
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>{p.paymentMethod}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {p.transactionId || p.reference || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: statusTheme.bg, color: statusTheme.text, fontSize: '0.7rem', fontWeight: 800, display: 'inline-block' }}>
                        {p.status}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={totalElements}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => {
          onRowsPerPageChange(parseInt(e.target.value, 10));
        }}
        sx={{ borderTop: '1px solid #f1f5f9' }}
      />
    </Paper>
  );
};

export default PaymentHistory;