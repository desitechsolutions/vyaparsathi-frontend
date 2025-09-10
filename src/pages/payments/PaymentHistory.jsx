import React from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Tooltip,
  Stack,
} from '@mui/material';

const PaymentHistory = ({
  loading,
  paymentHistory,
  customers,
  customerSales,
  selectedCustomer,
  selectedSale,
  onCustomerChange,
  onSaleChange,
  onRefresh,
  formatAmount,
  setTab,
  setSelectedSale,
  emptyLabel = "No payment history found for this customer/sale.",
}) => (
  <Paper sx={{ maxWidth: 950, mx: 'auto', mt: 2, p: 2 }}>
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
      {/* Customer selection */}
      {customers && (
        <Tooltip title="Select Customer">
          <Box>
            <select
              value={selectedCustomer ? selectedCustomer.id : ""}
              onChange={e => onCustomerChange(customers.find(c => String(c.id) === e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                minWidth: 160,
                fontSize: 16,
                marginRight: 8,
              }}
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Box>
        </Tooltip>
      )}
      {/* Sale selection */}
      {customerSales && (
        <Tooltip title="Select Sale">
          <Box>
            <select
              value={selectedSale}
              onChange={e => onSaleChange(e.target.value)}
              disabled={!selectedCustomer}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                minWidth: 180,
                fontSize: 16,
                marginRight: 8,
              }}
            >
              <option value="">All Sales</option>
              {customerSales.map((sale) => (
                <option key={sale.saleId} value={sale.saleId}>
                  {sale.invoiceNo} (Due: {formatAmount(sale.dueAmount)})
                </option>
              ))}
            </select>
          </Box>
        </Tooltip>
      )}
      <Button
        variant="outlined"
        size="small"
        sx={{ ml: 'auto', minWidth: 100 }}
        onClick={onRefresh}
      >
        Refresh
      </Button>
    </Box>
    <Divider sx={{ mb: 2 }} />
    {loading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}>
        <CircularProgress />
      </Box>
    ) : paymentHistory.length === 0 ? (
      <Typography>{emptyLabel}</Typography>
    ) : (
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Invoice No</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Pay</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentHistory.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : ''}</TableCell>
                <TableCell>{p.invoiceNo || ""}</TableCell>
                <TableCell>{formatAmount(p.amount)}</TableCell>
                <TableCell>
                  <Chip label={p.paymentMethod} size="small" color="info" />
                </TableCell>
                <TableCell>{p.transactionId}</TableCell>
                <TableCell>{p.reference}</TableCell>
                <TableCell>{p.notes}</TableCell>
                <TableCell>
                  <Chip
                    label={p.status}
                    size="small"
                    color={p.status === 'SUCCESS' ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  {p.dueAmount > 0 ? (
                    <Tooltip title="Pay due for this sale">
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {
                          if (setTab) setTab(0);
                          if (setSelectedSale) setSelectedSale(p.sourceId);
                        }}
                      >
                        Pay
                      </Button>
                    </Tooltip>
                  ) : (
                    <Tooltip title="No due for this sale">
                      <span>
                        <Button variant="outlined" size="small" disabled>
                          Paid
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Paper>
);

export default PaymentHistory;