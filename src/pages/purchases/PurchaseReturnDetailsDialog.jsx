import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Stack, Grid, CircularProgress, Divider, Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PrintIcon from '@mui/icons-material/Print';
import { fetchPurchaseReturnById, approvePurchaseReturn, cancelPurchaseReturn } from '../../services/api';

const PurchaseReturnDetailsDialog = ({ open, returnId, onClose, onSuccess }) => {
  const [returnDetails, setReturnDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && returnId) {
      loadReturnDetails();
    }
  }, [open, returnId]);

  const loadReturnDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPurchaseReturnById(returnId);
      setReturnDetails(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch return details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    try {
      await approvePurchaseReturn(returnId);
      onSuccess('Purchase Return approved successfully! Stock deducted & Debit Note issued.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve return');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setError('');
    try {
      await cancelPurchaseReturn(returnId);
      onSuccess('Purchase Return cancelled.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel return');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'APPROVED': return <Chip label="APPROVED" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case 'CANCELLED': return <Chip label="CANCELLED" color="error" size="small" sx={{ fontWeight: 700 }} />;
      default: return <Chip label="DRAFT" color="warning" size="small" sx={{ fontWeight: 700 }} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={800} color="text.primary">
            Purchase Return Details — {returnDetails?.returnNo || 'Loading...'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Inspect returned item variants, batch details, and debit note amount before approval.
          </Typography>
        </Box>
        {returnDetails && getStatusChip(returnDetails.status)}
      </DialogTitle>
      <Divider sx={{ borderColor: 'divider' }} />

      <DialogContent sx={{ py: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : returnDetails ? (
          <Box>
            {/* Header Metadata Summary */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'action.hover', borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">SUPPLIER</Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary">{returnDetails.supplierName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">RETURN DATE</Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary">{new Date(returnDetails.returnDate).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">TOTAL AMOUNT</Typography>
                  <Typography variant="body1" fontWeight={800} color="primary.main">₹{returnDetails.totalAmount?.toFixed(2)}</Typography>
                </Grid>
                {returnDetails.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">REASON / NOTES</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>"{returnDetails.notes}"</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1 }}>
              Returned Line Items ({returnDetails.items?.length || 0})
            </Typography>

            {/* Line Items Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>ITEM / VARIANT</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>BATCH #</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary' }}>QTY</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>UNIT COST (₹)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>TOTAL COST (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>REASON</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnDetails.items?.map((item, index) => (
                    <TableRow key={index} hover sx={{ '&:hover': { bgcolor: 'action.hover !important' } }}>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{item.itemVariantName || item.itemName || 'Item Variant #' + item.itemVariantId}</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{item.sku || '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'info.main' }}>{item.batchNumber || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: 'text.primary' }}>{item.quantity}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.primary' }}>₹{item.unitCost?.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'text.primary' }}>₹{item.totalCost?.toFixed(2)}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{item.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {returnId && (
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.open(`/purchase-returns/${returnId}/print`, '_blank')}
          >
            Print Goods Return Note
          </Button>
        )}

        {returnDetails?.status === 'DRAFT' && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={actionLoading}
            >
              Cancel Draft
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleApprove}
              disabled={actionLoading}
              sx={{ fontWeight: 800 }}
            >
              {actionLoading ? 'Approving...' : 'Approve & Issue Debit Note'}
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseReturnDetailsDialog;
