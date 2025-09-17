import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Chip,
  Stack,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import Header from './Header';

const statusChipColor = (status) => {
  switch (status) {
    case 'RECEIVED':
      return 'success';
    case 'DAMAGED':
      return 'error';
    case 'REJECTED':
      return 'warning';
    case 'PARTIALLY_RECEIVED':
      return 'info';
    case 'PENDING':
      return 'default';
    default:
      return 'default';
  }
};

const ReceiveGoodsForm = ({
  onSubmit,
  onCancel,
  getReceivings,
  getReceivingById,
  getPoItems,
}) => {
  const [step, setStep] = useState(1);
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [selectedReceivingId, setSelectedReceivingId] = useState('');
  const [receiving, setReceiving] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [receiveData, setReceiveData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (step !== 1) return;
    const fetchOptions = async () => {
      setLoading(true);
      setLoadingMsg('Fetching receivings...');
      setError('');
      try {
        const allReceivings = await getReceivings();
        const filtered = allReceivings.filter((r) =>
          ['PENDING', 'PARTIALLY_RECEIVED'].includes(r.status)
        );
        setReceivingOptions(filtered);
      } catch (err) {
        setError('Failed to load receivings.');
      } finally {
        setLoading(false);
        setLoadingMsg('');
      }
    };
    fetchOptions();
  }, [step, getReceivings]);

  const handleReceivingSelect = async (e) => {
    const id = e.target.value;
    setSelectedReceivingId(id);
    setLoading(true);
    setLoadingMsg('Loading PO details...');
    setError('');
    try {
      const details = await getReceivingById(id);
      setReceiving(details);

      // Fetch PO items for this PO
      const poItems = await getPoItems(details.purchaseOrderId);
      const poItemMap = {};
      poItems.forEach((poItem) => {
        poItemMap[poItem.id] = poItem;
      });

      // Prepare item data for cards
      setReceiveData(
        details.receivingItems.map((item) => {
          const poItem = poItemMap[item.purchaseOrderItemId] || {};
          const previouslyReceived = item.previouslyReceived ?? item.receivedQty ?? 0;
          const previouslyRejected = item.previouslyRejected ?? item.rejectedQty ?? 0;
          const previouslyDamaged = item.previouslyDamaged ?? item.damagedQty ?? 0;
          const allowedQty =
            item.expectedQty -
            (previouslyReceived + previouslyRejected + previouslyDamaged);
          return {
            ...item,
            itemName: poItem.name || '',
            sku: poItem.sku || '',
            pricePerUnit: poItem.unitCost || '',
            previouslyReceived,
            previouslyRejected,
            previouslyDamaged,
            allowedQty,
            receivedQty: 0,
            rejectedQty: 0,
            damagedQty: 0,
          };
        })
      );
      setStep(2);
    } catch (err) {
      setError('Failed to load receiving details.');
      setReceiving(null);
      setReceiveData([]);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleQtyChange = (itemId, field, value) => {
    const sanitizedValue = Math.max(0, parseInt(value, 10) || 0);
    const newReceiveData = receiveData.map((item) =>
      item.id === itemId ? { ...item, [field]: sanitizedValue } : item
    );

    // Validate
    const changedItem = newReceiveData.find((item) => item.id === itemId);
    const total =
      (changedItem.receivedQty || 0) +
      (changedItem.rejectedQty || 0) +
      (changedItem.damagedQty || 0);
    const allowed = changedItem.allowedQty;
    const newErrors = { ...validationErrors };
    if (total > allowed) {
      newErrors[itemId] = `Total entered (${total}) exceeds allowed (${allowed}).`;
    } else {
      delete newErrors[itemId];
    }
    setValidationErrors(newErrors);
    setReceiveData(newReceiveData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix validation errors before submitting.');
      return;
    }
    setLoading(true);
    setLoadingMsg('Saving...');
    setError('');
    try {
      const payload = {
        receivingId: receiving.id,
        purchaseOrderId: receiving.purchaseOrderId,
        shopId: receiving.shopId,
        receivingItems: receiveData.map((item) => ({
          id: item.id,
          purchaseOrderItemId: item.purchaseOrderItemId,
          expectedQty: item.expectedQty,
          receivedQty: item.receivedQty,
          damagedQty: item.damagedQty,
          damageReason: item.damageReason,
          notes: item.notes,
          putAwayStatus: item.putAwayStatus,
          rejectedQty: item.rejectedQty,
          rejectReason: item.rejectReason,
          putawayQty: item.putawayQty,
          status: item.status,
        })),
        notes: receiving.notes || '',
      };
      await onSubmit(payload);
      setSuccessMsg('Receiving saved successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onCancel();
      }, 1200);
    } catch (err) {
      setError('Failed to save receiving.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSelectedReceivingId('');
    setReceiving(null);
    setReceiveData([]);
    setError('');
    setValidationErrors({});
  };

  return (
    <Box>
      <Header
        title={
          step === 1
            ? 'Receive Goods - Step 1'
            : `Receive Goods for PO #${receiving?.poNumber || ''}`
        }
        onBack={step === 1 ? onCancel : handleBackToStep1}
      />

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 5,
            color: 'grey.500',
          }}
        >
          <CircularProgress color="inherit" size={40} sx={{ mb: 2 }} />
          <Typography>{loadingMsg || 'Loading...'}</Typography>
        </Box>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={2000}
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      </Snackbar>

      {/* Step 1: Select Receiving */}
      {!loading && step === 1 && (
        <>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="receiving-select-label">Select Receiving</InputLabel>
            <Select
              labelId="receiving-select-label"
              value={selectedReceivingId}
              label="Select Receiving"
              onChange={handleReceivingSelect}
              disabled={loading}
            >
              {receivingOptions.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  PO #{r.poNumber} - {r.supplier?.name} ({r.status})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onCancel} variant="outlined">
              Cancel
            </Button>
          </Box>
        </>
      )}

      {/* Step 2: Item Cards */}
      {!loading && step === 2 && (
        <>
          {receiving && (
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Supplier: {receiving.supplier?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {receiving.supplier?.address}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Contact: {receiving.supplier?.contactPerson} |{' '}
                {receiving.supplier?.phone}
              </Typography>
            </Paper>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {receiveData.map((item) => (
                <Grid item xs={12} md={6} key={item.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderLeft: '5px solid #388e3c',
                      bgcolor: 'grey.50',
                      mb: 2,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box flex={1}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {item.itemName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          SKU: {item.sku || '-'}
                          {item.expectedQty
                            ? ` | Ordered: ${item.expectedQty}`
                            : ''}
                          {typeof item.previouslyReceived === 'number'
                            ? ` | Previously Received: ${item.previouslyReceived}`
                            : ''}
                        </Typography>
                      </Box>
                      <Box>
                        <Chip
                          label={item.status}
                          color={statusChipColor(item.status)}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: 14,
                            textTransform: 'capitalize',
                            letterSpacing: 0.5,
                          }}
                        />
                      </Box>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Grid item xs={4}>
                        <TextField
                          label="Received Qty"
                          type="number"
                          size="small"
                          value={item.receivedQty}
                          onChange={(e) =>
                            handleQtyChange(item.id, 'receivedQty', e.target.value)
                          }
                          inputProps={{
                            min: 0,
                            max: item.allowedQty,
                          }}
                          error={!!validationErrors[item.id]}
                          helperText={validationErrors[item.id] && ' '}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Damaged Qty"
                          type="number"
                          size="small"
                          value={item.damagedQty}
                          onChange={(e) =>
                            handleQtyChange(item.id, 'damagedQty', e.target.value)
                          }
                          inputProps={{
                            min: 0,
                            max: item.allowedQty,
                          }}
                          error={!!validationErrors[item.id]}
                          helperText={validationErrors[item.id] && ' '}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Rejected Qty"
                          type="number"
                          size="small"
                          value={item.rejectedQty}
                          onChange={(e) =>
                            handleQtyChange(item.id, 'rejectedQty', e.target.value)
                          }
                          inputProps={{
                            min: 0,
                            max: item.allowedQty,
                          }}
                          error={!!validationErrors[item.id]}
                          helperText={validationErrors[item.id] && validationErrors[item.id]}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <span style={{ color: '#388e3c', fontWeight: 500 }}>
                        Received: {item.receivedQty}
                      </span>
                      {' | '}
                      <span style={{ color: '#d32f2f', fontWeight: 500 }}>
                        Damaged: {item.damagedQty}
                      </span>
                      {' | '}
                      <span style={{ color: '#f57c00', fontWeight: 500 }}>
                        Rejected: {item.rejectedQty}
                      </span>
                      {' | '}
                      <span style={{ color: '#1976d2', fontWeight: 500 }}>
                        Remaining: {item.allowedQty -
                          ((item.receivedQty || 0) +
                            (item.damagedQty || 0) +
                            (item.rejectedQty || 0))}
                      </span>
                    </Typography>
                    <TextField
                      label="Notes"
                      size="small"
                      value={item.notes || ''}
                      onChange={(e) => {
                        const newReceiveData = receiveData.map((itm) =>
                          itm.id === item.id
                            ? { ...itm, notes: e.target.value }
                            : itm
                        );
                        setReceiveData(newReceiveData);
                      }}
                      fullWidth
                      multiline
                      minRows={2}
                      sx={{ mb: 1 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={onCancel} variant="outlined">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="success"
                disabled={Object.keys(validationErrors).length > 0}
              >
                Finalize Receiving
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ReceiveGoodsForm;