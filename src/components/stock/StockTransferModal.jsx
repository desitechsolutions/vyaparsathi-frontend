import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, CircularProgress, Alert, Autocomplete, Tabs, Tab
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  fetchStockTransfers, createStockTransfer, executeStockTransfer,
  cancelStockTransfer, fetchItemVariants
} from '../../services/api';

export default function StockTransferModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [transfers, setTransfers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New transfer form state
  const [toShopId, setToShopId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [transfersData, variantsRes] = await Promise.all([
        fetchStockTransfers(),
        fetchItemVariants({})
      ]);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      setVariants(Array.isArray(variantsRes.data) ? variantsRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stock transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const handleCreateTransfer = async () => {
    if (!toShopId || !selectedVariant || !quantity || Number(quantity) <= 0) {
      setError('Please fill in destination shop, item variant, and a valid quantity');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createStockTransfer({
        fromShopId: 1, // dynamically bound in TenantContext on backend
        toShopId: Number(toShopId),
        notes,
        items: [
          {
            itemVariantId: selectedVariant.id,
            quantity: Number(quantity),
            batchNumber
          }
        ]
      });
      setSuccess('Stock transfer request created successfully (Pending)');
      setToShopId('');
      setNotes('');
      setSelectedVariant(null);
      setQuantity('');
      setBatchNumber('');
      setActiveTab(0);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create stock transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecute = async (id) => {
    setSubmitting(true);
    setError(null);
    try {
      await executeStockTransfer(id);
      setSuccess('Stock transfer executed successfully!');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to execute transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    setSubmitting(true);
    setError(null);
    try {
      await cancelStockTransfer(id);
      setSuccess('Stock transfer cancelled');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel transfer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwapHorizIcon color="primary" /> Inter-Location Stock Transfers
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="All Transfers" />
          <Tab label="New Stock Transfer" icon={<AddIcon fontSize="small" />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : transfers.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>No stock transfers found.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Transfer #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>From Shop</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>To Shop</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell sx={{ fontWeight: 700 }}>{t.transferNumber}</TableCell>
                        <TableCell>{t.fromShopName || `Shop #${t.fromShopId}`}</TableCell>
                        <TableCell>{t.toShopName || `Shop #${t.toShopId}`}</TableCell>
                        <TableCell>
                          <Chip
                            label={t.status}
                            size="small"
                            color={t.status === 'COMPLETED' ? 'success' : t.status === 'PENDING' ? 'warning' : 'default'}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          {t.items?.map((item, idx) => (
                            <Typography key={idx} variant="caption" display="block">
                              {item.itemName || item.sku} x {item.quantity} {item.batchNumber ? `(Batch: ${item.batchNumber})` : ''}
                            </Typography>
                          ))}
                        </TableCell>
                        <TableCell align="right">
                          {t.status === 'PENDING' && (
                            <Box display="flex" gap={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                disabled={submitting}
                                onClick={() => handleExecute(t.id)}
                              >
                                Execute
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CancelIcon />}
                                disabled={submitting}
                                onClick={() => handleCancel(t.id)}
                              >
                                Cancel
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Destination Shop ID"
              type="number"
              value={toShopId}
              onChange={(e) => setToShopId(e.target.value)}
              placeholder="e.g. 2"
              fullWidth
              required
            />

            <Autocomplete
              options={variants}
              getOptionLabel={(v) => `${v.itemName} (SKU: ${v.sku}) - Price: ₹${v.pricePerUnit}`}
              value={selectedVariant}
              onChange={(_, val) => setSelectedVariant(val)}
              renderInput={(params) => <TextField {...params} label="Select Item Variant" required />}
            />

            <Box display="flex" gap={2}>
              <TextField
                label="Transfer Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Batch Number (Optional)"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                fullWidth
              />
            </Box>

            <TextField
              label="Transfer Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateTransfer}
              disabled={submitting}
              sx={{ mt: 1, py: 1.5, fontWeight: 700, borderRadius: 2 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Create Stock Transfer'}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
