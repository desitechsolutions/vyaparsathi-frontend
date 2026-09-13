import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Chip,
  Divider,
  Box,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Offline Sale Receipt Modal
 * Shows temporary offline sale number and details
 */
export function OfflineReceiptModal({ open, onClose, saleData, offlineResponse }) {
  if (!offlineResponse) return null;

  const handlePrint = () => {
    window.print();
  };

  const itemsTotal = (saleData?.items || []).reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0),
    0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', background: '#f5f5f5' }}>
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          <CheckCircleIcon color="success" />
          <Typography variant="h6">Sale Queued for Sync</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: 3 }}>
        <Stack spacing={2}>
          {/* Offline Sale Number */}
          <Box sx={{ textAlign: 'center', background: '#fff3cd', padding: 2, borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Temporary Offline Sale Number
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: '#856404',
                wordBreak: 'break-all',
              }}
            >
              {offlineResponse.offlineSaleNo}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', marginTop: 1 }}>
              Print this number on your receipt. It will be replaced with an invoice number once synced.
            </Typography>
          </Box>

          <Divider />

          {/* Customer */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              Customer
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {saleData?.customerName || 'Walk-in Customer'}
            </Typography>
          </Box>

          {/* Items */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary" sx={{ marginBottom: 1 }}>
              Items
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#f5f5f5' }}>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(saleData?.items || []).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.itemName || 'N/A'}</TableCell>
                      <TableCell align="right">{item.qty}</TableCell>
                      <TableCell align="right">₹{parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        ₹{(parseFloat(item.qty) * parseFloat(item.unitPrice)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Divider />

          {/* Totals */}
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ marginBottom: 1 }}>
              <Typography variant="body2">Items Total:</Typography>
              <Typography variant="body2">₹{itemsTotal.toFixed(2)}</Typography>
            </Stack>
            {saleData?.discount > 0 && (
              <Stack direction="row" justifyContent="space-between" sx={{ marginBottom: 1 }}>
                <Typography variant="body2">Discount:</Typography>
                <Typography variant="body2" sx={{ color: 'green' }}>
                  -₹{parseFloat(saleData.discount).toFixed(2)}
                </Typography>
              </Stack>
            )}
            <Divider sx={{ marginY: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Total Amount:
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 'bold', color: '#1976d2' }}
              >
                ₹{parseFloat(saleData?.totalAmount || 0).toFixed(2)}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          {/* Status */}
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              label="Queued for sync"
              color="info"
              variant="outlined"
              sx={{ marginRight: 1 }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', marginTop: 1 }}>
              This sale will sync when the app comes back online. A real invoice will be generated then.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ padding: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ '@media print': { display: 'none' } }}
        >
          Print Receipt
        </Button>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default OfflineReceiptModal;
