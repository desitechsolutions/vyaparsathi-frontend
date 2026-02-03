import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Paper, Button, CircularProgress, Snackbar, Alert, Chip,
  Grid, Stack, Divider, Avatar, Tabs, Tab, TextField, IconButton
} from '@mui/material';
import {
  ArrowBack, WhatsApp, LocationOn, Phone,
  PictureAsPdf, Refresh, ReceiptLong, AccountBalanceWallet, Payments
} from '@mui/icons-material';
import { fetchCustomerDues, fetchCustomerLedger } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Clean, reliable Indian currency formatting (no unicode/superscript issues)
const formatCurrency = (amount) => {
  const num = Math.abs(Number(amount) || 0);
  const [integer, decimal = '00'] = num.toFixed(2).split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₹${formattedInteger}.${decimal}`;
};

// PDF Safe Formatting to avoid Unicode/Superscript glitches like ¹
const formatCurrencyPDF = (amount) => {
  const num = Math.abs(Number(amount) || 0);
  const [integer, decimal = '00'] = num.toFixed(2).split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `Rs. ${formattedInteger}.${decimal}`;
};

// Balance with Dr / Cr suffix
const formatBalance = (amount) => {
  const num = Number(amount) || 0;
  const formatted = formatCurrency(num);
  if (num < 0) return `${formatted} Cr`;
  if (num > 0) return `${formatted} Dr`;
  return `₹0.00`;
};

// PDF Safe Balance
const formatBalancePDF = (amount) => {
  const num = Number(amount) || 0;
  const formatted = formatCurrencyPDF(num);
  if (num < 0) return `${formatted} Cr`;
  if (num > 0) return `${formatted} Dr`;
  return `Rs. 0.00`;
};

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const companyName = "DesiTech Solutions"; // Set your company name here

  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [dues, setDues] = useState([]);           
  const [ledger, setLedger] = useState([]);       
  const [filteredLedger, setFilteredLedger] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); 
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const duesRes = await fetchCustomerDues(id);
      setDues(duesRes?.data?.content || duesRes?.data || []);
      const ledgerRes = await fetchCustomerLedger(id);
      const fullLedger = ledgerRes?.data || [];
      setLedger(fullLedger);
      const filtered = fullLedger.filter(entry => {
        const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
        return entryDate >= startDate && entryDate <= endDate;
      });
      setFilteredLedger(filtered);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load data.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, startDate, endDate]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (tabValue === 2) {
      const filtered = ledger.filter(entry => {
        const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
        return entryDate >= startDate && entryDate <= endDate;
      });
      setFilteredLedger(filtered);
    }
  }, [startDate, endDate, ledger, tabValue]);

  const customer = useMemo(() => dues[0] || ledger[0] || {}, [dues, ledger]);
  const totalSales = useMemo(() => ledger.filter(e => e.type === 'CREDIT').reduce((s, e) => s + (Number(e.amount) || 0), 0), [ledger]);
  const totalPaid = useMemo(() => ledger.filter(e => e.type === 'DEBIT').reduce((s, e) => s + (Number(e.amount) || 0), 0), [ledger]);
  const netBalance = useMemo(() => totalSales - totalPaid, [totalSales, totalPaid]);

  const ledgerRows = useMemo(() => {
    let balance = 0;
    const sorted = [...filteredLedger].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return sorted.map(e => {
      e.type === 'CREDIT' ? balance += (Number(e.amount) || 0) : balance -= (Number(e.amount) || 0);
      return { ...e, runningBalance: balance };
    }).reverse();
  }, [filteredLedger]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header - Professional Look
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`${customer.shopName || 'DesiTech Solutions'}`, pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("ACCOUNT STATEMENT", pageWidth / 2, 25, { align: 'center' });
    doc.line(14, 30, pageWidth - 14, 30);

    // Customer & Date Info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details:", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`${customer.customerName || 'Unknown'}`, 14, 46);
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 14, 52);

    doc.setFont("helvetica", "bold");
    doc.text("Statement Period:", 135, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`${startDate} to ${endDate}`, 135, 46);

    // Table
    autoTable(doc, {
      startY: 60,
      head: [["Date", "Description", "Debit (+)", "Credit (-)", "Balance"]],
      body: ledgerRows.map(row => [
        new Date(row.createdAt).toLocaleDateString('en-IN'),
        row.description || '-',
        row.type === 'CREDIT' ? Number(row.amount).toFixed(2) : '0.00',
        row.type === 'DEBIT' ? Number(row.amount).toFixed(2) : '0.00',
        formatBalancePDF(row.runningBalance)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40], halign: 'center' },
      styles: { fontSize: 9 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } }
    });

    // Summary at bottom
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Sales: ${formatCurrencyPDF(totalSales)}`, 14, finalY + 8);
    doc.text(`Total Received: ${formatCurrencyPDF(totalPaid)}`, 14, finalY + 16);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(netBalance > 0 ? 180 : 0, netBalance > 0 ? 0 : 100, 0);
    doc.text(`Net Balance: ${formatBalancePDF(netBalance)}`, 14, finalY + 24);

    // Footer on every page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`This is a computer-generated statement for ${customer.shopName || companyName}.`, pageWidth / 2, 285, { align: 'center' });
    }

    doc.save(`Statement_${customer.customerName}.pdf`);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress thickness={2} /></Box>;

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => navigate('/customers')} sx={{ bgcolor: 'white', boxShadow: 1 }}><ArrowBack /></IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700}>{customer.customerName}</Typography>
            <Typography variant="body2" color="text.secondary">Customer Profile & Ledger Summary</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" sx={{ bgcolor: 'white' }} startIcon={<PictureAsPdf />} onClick={generatePDF}>PDF Statement</Button>
          <Button variant="contained" color="success" startIcon={<WhatsApp />} 
            onClick={() => window.open(`https://wa.me/91${customer.phone}?text=Your net balance is ${formatBalance(netBalance)}`, '_blank')}>WhatsApp</Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e0e4e7' }}>
                <Avatar sx={{ bgcolor: netBalance > 0 ? '#d32f2f15' : '#2e7d3215', color: netBalance > 0 ? '#d32f2f' : '#2e7d32' }}><AccountBalanceWallet /></Avatar>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">NET BALANCE</Typography>
                  <Typography variant="h5" fontWeight={800} color={netBalance > 0 ? 'error.main' : 'success.main'}>{formatBalance(netBalance)}</Typography>
                  <Chip size="small" label={netBalance > 0 ? "TOTAL DUE" : "ADVANCE PAYMENT"} color={netBalance > 0 ? "error" : "success"} sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e0e4e7' }}>
                <Avatar sx={{ bgcolor: '#1976d215', color: '#1976d2' }}><ReceiptLong /></Avatar>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">TOTAL SALES</Typography>
                  <Typography variant="h5" fontWeight={800}>{formatCurrency(totalSales)}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e0e4e7' }}>
                <Avatar sx={{ bgcolor: '#2e7d3215', color: '#2e7d32' }}><Payments /></Avatar>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">TOTAL RECEIVED</Typography>
                  <Typography variant="h5" fontWeight={800}>{formatCurrency(totalPaid)}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e4e7' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Customer Details</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1}><Phone fontSize="small" color="disabled"/><Typography variant="body2">{customer.phone || 'N/A'}</Typography></Stack>
              <Stack direction="row" spacing={1}><LocationOn fontSize="small" color="disabled"/><Typography variant="body2">{customer.city || 'N/A'}</Typography></Stack>
              <Divider />
              <Typography variant="caption" color="text.secondary">GST Number</Typography>
              <Typography variant="body2" fontWeight={600}>{customer.gstin || 'Unregistered'}</Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e4e7', overflow: 'hidden' }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
              <Tab label="Pending Invoices" />
              <Tab label="Sales History" />
              <Tab label="Statement (Ledger)" />
            </Tabs>

            {tabValue === 2 && (
              <Stack direction="row" spacing={2} sx={{ p: 2, bgcolor: '#fafafa', borderBottom: '1px solid #e0e4e7', flexWrap: 'wrap' }}>
                <TextField type="date" size="small" label="From" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
                <TextField type="date" size="small" label="To" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
                <Button size="small" startIcon={<Refresh />} variant="contained" onClick={loadData}>Refresh Statement</Button>
              </Stack>
            )}

            <Box sx={{ minHeight: 400, p: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                  <TableRow>
                    {tabValue === 2 ? (
                      <>
                        <TableCell>Date</TableCell>
                        <TableCell>Particulars</TableCell>
                        <TableCell align="right">Debit (+)</TableCell>
                        <TableCell align="right">Credit (-)</TableCell>
                        <TableCell align="right">Balance</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>Invoice</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">{tabValue === 0 ? 'Balance Due' : 'Status'}</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tabValue === 0 && dues.filter(d => d.dueAmount > 0).map((due, i) => (
                    <TableRow key={i} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{due.invoiceNo}</Typography><Typography variant="caption" color="text.secondary">{new Date(due.date).toLocaleDateString()}</Typography></TableCell>
                      <TableCell align="right">{formatCurrency(due.totalAmount)}</TableCell>
                      <TableCell align="right"><Chip size="small" label={formatCurrency(due.dueAmount)} color="error" variant="outlined" /></TableCell>
                      <TableCell align="center"><Button size="small" variant="contained" disableElevation onClick={() => navigate(`/customer-payments?saleId=${due.saleId}`)}>Pay</Button></TableCell>
                    </TableRow>
                  ))}
                  {tabValue === 1 && dues.map((due, i) => (
                    <TableRow key={i} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{due.invoiceNo}</Typography><Typography variant="caption" color="text.secondary">{new Date(due.date).toLocaleDateString()}</Typography></TableCell>
                      <TableCell align="right">{formatCurrency(due.totalAmount)}</TableCell>
                      <TableCell align="right"><Chip size="small" label={due.dueAmount <= 0 ? 'Settled' : 'Partial'} color={due.dueAmount <= 0 ? 'success' : 'warning'} /></TableCell>
                      <TableCell align="center"><Button size="small" onClick={() => navigate(`/sales?tab=history&search=${due.invoiceNo}`)}>View</Button></TableCell>
                    </TableRow>
                  ))}
                  {tabValue === 2 && ledgerRows.map((row, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{row.description || '-'}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>{row.type === 'CREDIT' ? formatCurrency(row.amount) : '-'}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>{row.type === 'DEBIT' ? formatCurrency(row.amount) : '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: row.runningBalance < 0 ? 'success.main' : 'text.primary' }}>{formatBalance(row.runningBalance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerDetails;