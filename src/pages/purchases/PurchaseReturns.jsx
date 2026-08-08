import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, IconButton, Tooltip, TextField,
  MenuItem, Grid, Stack, Alert, Snackbar, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import { fetchPurchaseReturns, approvePurchaseReturn, cancelPurchaseReturn, getSuppliers } from '../../services/api';
import PurchaseReturnFormDialog from './PurchaseReturnFormDialog';
import PurchaseReturnDetailsDialog from './PurchaseReturnDetailsDialog';

const PurchaseReturns = () => {
  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    actionType: null,
    targetId: null
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [returnsData, suppliersData] = await Promise.all([
        fetchPurchaseReturns(selectedSupplierId || null),
        getSuppliers()
      ]);
      setReturns(returnsData?.content || (Array.isArray(returnsData) ? returnsData : []));
      setSuppliers(suppliersData || []);
    } catch (err) {
      showSnackbar('Failed to fetch purchase returns', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSupplierId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSnackbar = (msg, severity = 'success') => {
    setSnackbar({ open: true, msg, severity });
  };

  const promptApprove = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Approve Purchase Return',
      message: 'Are you sure you want to approve this Purchase Return? Stock will be deducted and a Debit Note issued.',
      actionType: 'APPROVE',
      targetId: id
    });
  };

  const promptCancel = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Cancel Purchase Return Draft',
      message: 'Are you sure you want to cancel this Purchase Return draft?',
      actionType: 'CANCEL',
      targetId: id
    });
  };

  const handleConfirmAction = async () => {
    const { actionType, targetId } = confirmDialog;
    setConfirmDialog(prev => ({ ...prev, open: false }));
    if (!targetId) return;

    try {
      if (actionType === 'APPROVE') {
        await approvePurchaseReturn(targetId);
        showSnackbar('Purchase Return approved successfully! Stock deducted & Debit Note created.');
      } else if (actionType === 'CANCEL') {
        await cancelPurchaseReturn(targetId);
        showSnackbar('Purchase Return cancelled.');
      }
      loadData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Operation failed', 'error');
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
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Purchase Returns & Debit Notes
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            Manage returned inventory to vendors, track batch stock deductions, and issue supplier debit notes.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ fontWeight: 800, borderRadius: 2, px: 3, py: 1 }}
        >
          Create Purchase Return
        </Button>
      </Box>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: 'background.paper', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Filter by Supplier"
              fullWidth
              size="small"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              <MenuItem value="">All Suppliers</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={8} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Returns Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, bgcolor: 'background.paper', borderColor: 'divider' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>RETURN #</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>SUPPLIER</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>DATE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>TOTAL AMOUNT (₹)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>NOTES</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No purchase returns found. Click "Create Purchase Return" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: 'action.hover !important' } }}>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {row.returnNo}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{row.supplierName || '-'}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{new Date(row.returnDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      ₹{row.totalAmount?.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">{getStatusChip(row.status)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', maxWidth: 200 }}>
                      {row.notes || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Return Details & Items">
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => {
                              setSelectedReturnId(row.id);
                              setDetailsDialogOpen(true);
                            }}
                            sx={{ bgcolor: 'action.hover' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Goods Return Note">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => window.open(`/purchase-returns/${row.id}/print`, '_blank')}
                            sx={{ bgcolor: 'action.hover' }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {row.status === 'DRAFT' && (
                          <>
                            <Tooltip title="Approve & Issue Debit Note">
                              <IconButton color="success" size="small" onClick={() => promptApprove(row.id)} sx={{ bgcolor: 'action.hover' }}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel Return">
                              <IconButton color="error" size="small" onClick={() => promptCancel(row.id)} sx={{ bgcolor: 'action.hover' }}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Form */}
      <PurchaseReturnFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          showSnackbar('Purchase Return created successfully as DRAFT.');
          loadData();
        }}
      />

      {/* Inspection & Details Dialog */}
      <PurchaseReturnDetailsDialog
        open={detailsDialogOpen}
        returnId={selectedReturnId}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedReturnId(null);
        }}
        onSuccess={(msg) => {
          showSnackbar(msg);
          loadData();
        }}
      />

      {/* Modern Confirmation Dialog (Replaces native window.confirm) */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 450, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800, color: confirmDialog.actionType === 'APPROVE' ? 'success.main' : 'error.main' }}>
          {confirmDialog.actionType === 'APPROVE' ? <CheckCircleIcon color="success" /> : <WarningIcon color="error" />}
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.primary">
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            variant="outlined"
            color="inherit"
            sx={{ fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.actionType === 'APPROVE' ? 'success' : 'error'}
            sx={{ fontWeight: 800, px: 3, borderRadius: 2 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseReturns;
