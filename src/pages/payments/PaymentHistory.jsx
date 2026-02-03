import React, { useState, useMemo } from 'react';
import {
  Box, Typography, CircularProgress, Paper, Divider, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, Autocomplete, TextField,
  Button, Stack, TableSortLabel, InputAdornment, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

const PaymentHistory = ({ loading, paymentHistory, customers, selectedCustomer, onCustomerChange, onRefresh, formatAmount }) => {
  const [order, setOrder] = useState('desc'); // Default latest first
  const [orderBy, setOrderBy] = useState('paymentDate');
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Handle Sorting Logic
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter and Sort Data
  const processedHistory = useMemo(() => {
    let filtered = [...paymentHistory];

    // 1. Filter by Search Text (Invoice No or Reference)
    if (filterText) {
      filtered = filtered.filter(p => 
        p.invoiceNumber?.toLowerCase().includes(filterText.toLowerCase()) ||
        p.reference?.toLowerCase().includes(filterText.toLowerCase()) ||
        p.transactionId?.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // 2. Filter by Status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // 3. Sort
    return filtered.sort((a, b) => {
      let valA = a[orderBy];
      let valB = b[orderBy];

      // Date comparison logic
      if (orderBy === 'paymentDate') {
        valA = new Date(a.paymentDate);
        valB = new Date(b.paymentDate);
      }

      if (order === 'desc') {
        return valB > valA ? 1 : -1;
      } else {
        return valA > valB ? 1 : -1;
      }
    });
  }, [paymentHistory, order, orderBy, filterText, statusFilter]);

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {/* Filters Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Autocomplete
          options={customers}
          getOptionLabel={o => o.name}
          value={selectedCustomer}
          onChange={(_, v) => onCustomerChange(v)}
          sx={{ width: { xs: '100%', md: 250 } }}
          renderInput={(params) => <TextField {...params} label="Customer" size="small" />}
        />

        <TextField
          size="small"
          placeholder="Search Invoice/Ref..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          sx={{ width: { xs: '100%', md: 250 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Status</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
            <MenuItem value="PARTIALLY_PAID">Partial</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />
        
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={onRefresh} 
          variant="outlined"
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'paymentDate'}
                  direction={orderBy === 'paymentDate' ? order : 'asc'}
                  onClick={() => handleRequestSort('paymentDate')}
                  sx={{ fontWeight: 700 }}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'amount'}
                  direction={orderBy === 'amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('amount')}
                  sx={{ fontWeight: 700 }}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
            ) : processedHistory.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}>No matching records found.</TableCell></TableRow>
            ) : (
              processedHistory.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell>
                    {p.invoiceNumber ? (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>#{p.invoiceNumber}</Typography>
                    ) : (
                      <Chip label="Advance" size="small" color="secondary" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatAmount(p.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip label={p.paymentMethod} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {p.transactionId || p.reference || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={p.status} 
                      size="small"
                      color={p.status === 'PAID' || p.status === 'SUCCESS' ? 'success' : 'warning'} 
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default PaymentHistory;