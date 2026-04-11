import React, { useState, useMemo } from 'react';
import {
  Box, Typography, CircularProgress, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, Autocomplete, TextField,
  Stack, TableSortLabel, InputAdornment, MenuItem, Select, FormControl, 
  InputLabel, alpha, Tooltip, IconButton, Chip, TablePagination, Skeleton,
  Card
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import DownloadIcon from '@mui/icons-material/Download';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Modern color palette
const theme = {
  primary: '#0f766e',
  primaryLight: '#14b8a6',
  secondary: '#7c3aed',
  danger: '#dc2626',
  warning: '#f59e0b',
  success: '#10b981',
  background: '#f8fafc',
  cardBg: '#ffffff',
  borderColor: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
};

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
    <TableCell><Skeleton variant="text" width="85%" /></TableCell>
    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
    <TableCell align="right"><Skeleton variant="text" width="60%" /></TableCell>
    <TableCell><Skeleton variant="text" width="75%" /></TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 1.5 }} /></TableCell>
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
  onRefresh,
  formatAmount = formatCurrency,
  theme: themeProps
}) => {
  const customTheme = themeProps || theme;
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('paymentDate');
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: '#fff',
      transition: 'all 0.3s ease',
      '& fieldset': { borderColor: '#cbd5e1', transition: 'border-color 0.3s ease' },
      '&:hover fieldset': { borderColor: '#94a3b8' },
      '&.Mui-focused fieldset': { borderColor: customTheme.primary },
    },
  };

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

    const csvContent = [headers, ...rows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Payments_${selectedCustomer?.name || 'All'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 118, 110);
    doc.text("PAYMENT HISTORY", pageWidth / 2, 18, { align: 'center' });
    
    // Subheader
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 26, { align: 'center' });
    
    // Divider line
    doc.setDrawColor(15, 118, 110);
    doc.setLineWidth(0.5);
    doc.line(14, 32, pageWidth - 14, 32);

    // Customer info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Customer: ${selectedCustomer?.name || 'All Customers'}`, 14, 42);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Page Total: ${formatCurrencyPDF(viewTotal)}`, 14, 49);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 49, { align: 'right' });

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
      theme: 'grid',
      headStyles: { 
        fillColor: [15, 118, 110], 
        halign: 'center',
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 }
    });

    doc.save(`Payment_History_${selectedCustomer?.name || 'All'}_${new Date().toISOString().split('T')[0]}.pdf`);
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
      case 'SUCCESS': 
        return { bg: alpha(customTheme.success, 0.12), text: customTheme.success, icon: '✓' };
      case 'PARTIALLY_PAID': 
        return { bg: alpha(customTheme.warning, 0.12), text: customTheme.warning, icon: '◐' };
      default: 
        return { bg: alpha('#6b7280', 0.1), text: '#374151', icon: '○' };
    }
  };

  const getMethodColor = (method) => {
    const methodColors = {
      CASH: { bg: alpha('#059669', 0.1), text: '#059669' },
      CARD: { bg: alpha('#7c3aed', 0.1), text: '#7c3aed' },
      UPI: { bg: alpha(customTheme.primary, 0.1), text: customTheme.primary },
      NET_BANKING: { bg: alpha(customTheme.primary, 0.1), text: customTheme.primary },
      CHEQUE: { bg: alpha('#7c3aed', 0.1), text: '#7c3aed' },
    };
    return methodColors[method] || { bg: alpha('#64748b', 0.1), text: '#64748b' };
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 0, 
        borderRadius: 3, 
        border: `1.5px solid ${alpha(customTheme.primary, 0.15)}`,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease'
      }}
    >
      {/* ── Header Bar with Filters ──────────────────────────────── */}
      <Box sx={{ 
        p: 3, 
        borderBottom: `1.5px solid ${alpha(customTheme.primary, 0.15)}`, 
        background: `linear-gradient(135deg, ${alpha(customTheme.primary, 0.04)} 0%, ${alpha(customTheme.primaryLight, 0.04)} 100%)`
      }}>
        <Stack spacing={2.5}>
          {/* Title */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ 
              p: 1.2, 
              borderRadius: 1.5, 
              bgcolor: alpha(customTheme.primary, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HistoryIcon sx={{ fontSize: 22, color: customTheme.primary, fontWeight: 800 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} color={customTheme.textPrimary} sx={{ fontSize: '1.1rem' }}>
              Payment History & Ledger
            </Typography>
          </Stack>

          {/* Filters Row */}
          <Stack 
            direction={{ xs: 'column', sm: 'column', lg: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', lg: 'center' }}
          >
            <Autocomplete
              options={customers}
              getOptionLabel={o => o.name}
              value={selectedCustomer}
              onChange={(_, v) => onCustomerChange(v)}
              sx={{ width: { xs: '100%', lg: 280 } }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Filter by Customer" 
                  size="small"
                  sx={inputSx}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: customTheme.textSecondary, opacity: 0.6 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <TextField
              size="small"
              placeholder="Search transaction..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              sx={{ width: { xs: '100%', lg: 280 }, ...inputSx }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: customTheme.textSecondary, opacity: 0.6 }} /></InputAdornment>,
              }}
            />

            <FormControl size="small" sx={{ minWidth: 160, ...inputSx }}>
              <InputLabel>Status</InputLabel>
              <Select 
                value={statusFilter} 
                label="Status" 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="SUCCESS">✓ Success</MenuItem>
                <MenuItem value="PAID">✓ Paid</MenuItem>
                <MenuItem value="PARTIALLY_PAID">◐ Partial</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />
            
            {/* Action Buttons */}
            <Stack direction="row" spacing={0.75}>
              <Tooltip title="Refresh Data" arrow>
                <IconButton 
                  onClick={onRefresh} 
                  disabled={loading} 
                  size="small"
                  sx={{
                    color: customTheme.primary,
                    bgcolor: alpha(customTheme.primary, 0.08),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha(customTheme.primary, 0.15),
                      transform: 'rotate(180deg)'
                    }
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export CSV" arrow>
                <IconButton 
                  onClick={downloadCSV} 
                  disabled={loading || processedHistory.length === 0} 
                  size="small"
                  sx={{
                    color: customTheme.success,
                    bgcolor: alpha(customTheme.success, 0.08),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha(customTheme.success, 0.15),
                    },
                    '&:disabled': { opacity: 0.5 }
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print PDF" arrow>
                <IconButton 
                  onClick={printPDF} 
                  disabled={loading || processedHistory.length === 0} 
                  size="small"
                  sx={{
                    color: customTheme.secondary,
                    bgcolor: alpha(customTheme.secondary, 0.08),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha(customTheme.secondary, 0.15),
                    },
                    '&:disabled': { opacity: 0.5 }
                  }}
                >
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* ── Summary Row ──────────────────────────────────────────── */}
      <Box sx={{ 
        px: 3, 
        py: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: alpha(customTheme.primary, 0.02),
        borderBottom: `1px solid ${alpha(customTheme.primary, 0.1)}`
      }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ flex: 1 }}>
          <Typography 
            variant="caption" 
            fontWeight={800} 
            color={customTheme.textSecondary}
            sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.75rem' }}
          >
            PAGE {page + 1} • {loading ? '...' : totalElements.toLocaleString('en-IN')} TOTAL RECORDS
          </Typography>
        </Stack>
        <Card 
          elevation={0}
          sx={{
            px: 2.5,
            py: 1,
            borderRadius: 2,
            bgcolor: alpha(customTheme.success, 0.08),
            border: `1.5px solid ${alpha(customTheme.success, 0.25)}`
          }}
        >
          <Typography 
            variant="subtitle2" 
            fontWeight={900} 
            color={customTheme.success}
            sx={{ fontSize: '0.95rem' }}
          >
            {loading ? <Skeleton width={120} /> : `Page Total: ${formatAmount(viewTotal)}`}
          </Typography>
        </Card>
      </Box>

      {/* ── Table Container ──────────────────────────────────────── */}
      <TableContainer sx={{ minHeight: 400, maxHeight: 650, bgcolor: '#ffffff' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(customTheme.primary, 0.04) }}>
              <TableCell 
                sx={{ 
                  bgcolor: alpha(customTheme.primary, 0.06),
                  fontWeight: 800,
                  color: customTheme.textPrimary,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: `2px solid ${alpha(customTheme.primary, 0.2)}`
                }}
              >
                <TableSortLabel
                  active={orderBy === 'paymentDate'}
                  direction={orderBy === 'paymentDate' ? order : 'asc'}
                  onClick={() => handleRequestSort('paymentDate')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: `${customTheme.primary} !important`,
                    }
                  }}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{ 
                  bgcolor: alpha(customTheme.primary, 0.06),
                  fontWeight: 800,
                  color: customTheme.textPrimary,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: `2px solid ${alpha(customTheme.primary, 0.2)}`
                }}
              >
                Invoice / Type
              </TableCell>
              <TableCell 
                align="right"
                sx={{ 
                  bgcolor: alpha(customTheme.primary, 0.06),
                  fontWeight: 800,
                  color: customTheme.textPrimary,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: `2px solid ${alpha(customTheme.primary, 0.2)}`
                }}
              >
                <TableSortLabel
                  active={orderBy === 'amount'}
                  direction={orderBy === 'amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('amount')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: `${customTheme.primary} !important`,
                    }
                  }}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{ 
                  bgcolor: alpha(customTheme.primary, 0.06),
                  fontWeight: 800,
                  color: customTheme.textPrimary,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: `2px solid ${alpha(customTheme.primary, 0.2)}`
                }}
              >
                Method
              </TableCell>
              <TableCell 
                sx={{ 
                  bgcolor: alpha(customTheme.primary, 0.06),
                  fontWeight: 800,
                  color: customTheme.textPrimary,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: `2px solid ${alpha(customTheme.primary, 0.2)}`
                }}
              >
                Reference
              </TableCell>
              <TableCell 
                sx={{ 
                  bgcolor: alpha(customTheme.primary, 0.06),
                  fontWeight: 800,
                  color: customTheme.textPrimary,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: `2px solid ${alpha(customTheme.primary, 0.2)}`
                }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(rowsPerPage)].map((_, i) => <SkeletonRow key={i} />)
            ) : processedHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Stack alignItems="center" spacing={1}>
                    <HistoryIcon sx={{ fontSize: 48, color: alpha(customTheme.primary, 0.2) }} />
                    <Typography variant="body2" color={customTheme.textSecondary} fontWeight={600}>
                      No transactions found
                    </Typography>
                    <Typography variant="caption" color={customTheme.textSecondary}>
                      Try adjusting your filters or select a different customer
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              processedHistory.map((p, idx) => {
                const statusTheme = getStatusColor(p.status);
                const methodTheme = getMethodColor(p.paymentMethod);
                return (
                  <TableRow 
                    key={p.id} 
                    hover
                    sx={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(customTheme.primary, 0.04),
                      },
                      borderBottom: `1px solid ${alpha(customTheme.primary, 0.08)}`
                    }}
                  >
                    <TableCell sx={{ color: customTheme.textPrimary, fontWeight: 600 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </Typography>
                      <Typography variant="caption" color={customTheme.textSecondary}>
                        {new Date(p.paymentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: customTheme.textPrimary }}>
                      {p.invoiceNumber ? (
                         <Chip 
                           label={`#${p.invoiceNumber}`}
                           size="small" 
                           sx={{ 
                             fontWeight: 800, 
                             height: 24,
                             fontSize: '0.75rem',
                             bgcolor: alpha(customTheme.primary, 0.1),
                             color: customTheme.primary,
                             border: `1px solid ${alpha(customTheme.primary, 0.2)}`
                           }} 
                         />
                      ) : (
                        <Chip 
                          label="💳 Advance" 
                          size="small" 
                          sx={{ 
                            fontWeight: 800, 
                            height: 24, 
                            fontSize: '0.75rem',
                            bgcolor: alpha(customTheme.secondary, 0.1),
                            color: customTheme.secondary,
                            border: `1px solid ${alpha(customTheme.secondary, 0.2)}`
                          }} 
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: customTheme.success, fontSize: '0.95rem' }}>
                      {formatAmount(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.paymentMethod}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          height: 24,
                          fontSize: '0.7rem',
                          bgcolor: methodTheme.bg,
                          color: methodTheme.text,
                          border: `1px solid ${alpha(methodTheme.text, 0.2)}`
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: customTheme.textSecondary,
                          fontSize: '0.8rem',
                          wordBreak: 'break-all'
                        }}
                      >
                        {p.transactionId || p.reference || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${statusTheme.icon} ${p.status}`}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          height: 26,
                          fontSize: '0.7rem',
                          bgcolor: statusTheme.bg,
                          color: statusTheme.text,
                          border: `1px solid ${alpha(statusTheme.text, 0.25)}`
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ──────────────────────────────────────────── */}
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
        sx={{
          borderTop: `1.5px solid ${alpha(customTheme.primary, 0.15)}`,
          bgcolor: alpha(customTheme.primary, 0.02),
          '& .MuiTablePagination-toolbar': {
            py: 1.5,
            px: 2
          },
          '& .MuiIconButton-root': {
            color: customTheme.primary,
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: alpha(customTheme.primary, 0.1)
            }
          },
          '& .MuiSelect-root': {
            color: customTheme.textPrimary,
            fontWeight: 700
          }
        }}
      />
    </Paper>
  );
};

export default PaymentHistory;