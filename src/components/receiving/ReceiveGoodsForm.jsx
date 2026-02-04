import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, TextField, Divider, Chip, Stack,
  Grid, Snackbar, Alert, Card, CardContent, InputAdornment, 
  Stepper, Step, StepLabel, Modal
} from '@mui/material';

// Components
import Header from './Header';
import OverageConfirmationModal from './OverageConfirmationModal';

// Icons
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const statusChipColor = (status) => {
  switch (status) {
    case 'RECEIVED': return 'success';
    case 'DAMAGED': return 'error';
    case 'REJECTED': return 'warning';
    case 'PARTIALLY_RECEIVED': return 'info';
    default: return 'default';
  }
};

const ReceiveGoodsForm = ({ onSubmit, onCancel, getReceivings, getReceivingById, getPoItems }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [selectedReceivingId, setSelectedReceivingId] = useState('');
  const [receiving, setReceiving] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [receiveData, setReceiveData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Overage State
  const [showOverageModal, setShowOverageModal] = useState(false);
  const [totalOveragesCount, setTotalOveragesCount] = useState(0);

  // 1. Fetch Options on Load
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const all = await getReceivings();
        setReceivingOptions(all.filter(r => ['PENDING', 'PARTIALLY_RECEIVED'].includes(r.status)));
      } catch (err) {
        setError('Failed to load pending receivings.');
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [getReceivings]);

  // 2. Transition to Step 2 & Prepare Data
  const handleReceivingSelect = async (e) => {
    const id = e.target.value;
    setSelectedReceivingId(id);
    setLoading(true);
    try {
      const details = await getReceivingById(id);
      const poItems = await getPoItems(details.purchaseOrderId);
      
      const prepared = details.receivingItems.map(item => {
        const poItem = poItems.find(p => p.id === item.purchaseOrderItemId) || {};
        const prevTotal = (item.receivedQty || 0) + (item.damagedQty || 0) + (item.rejectedQty || 0);
        
        return {
          ...item,
          itemName: poItem.name || 'Unknown Item',
          sku: poItem.sku || 'N/A',
          unitCost: poItem.unitCost || 0,
          previouslyTotal: prevTotal,
          allowedQty: Math.max(0, item.expectedQty - prevTotal),
          // Current Session Fields
          sessionReceived: 0,
          sessionDamaged: 0,
          sessionRejected: 0,
          sessionNotes: ''
        };
      });

      setReceiving(details);
      setReceiveData(prepared);
      setActiveStep(1);
    } catch (err) {
      setError('Error syncing Purchase Order data.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Qty Change & Overage Detection
  const handleQtyChange = (itemId, field, value) => {
    const val = Math.max(0, parseInt(value, 10) || 0);
    const updated = receiveData.map(item => {
      if (item.id === itemId) {
        const newItem = { ...item, [field]: val };
        const sessionTotal = newItem.sessionReceived + newItem.sessionDamaged + newItem.sessionRejected;
        
        const errors = { ...validationErrors };
        if (sessionTotal > item.allowedQty) {
          errors[itemId] = `Overage: +${sessionTotal - item.allowedQty} units`;
        } else {
          delete errors[itemId];
        }
        setValidationErrors(errors);
        return newItem;
      }
      return item;
    });
    setReceiveData(updated);
  };

  // 4. Submission Logic
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (Object.keys(validationErrors).length > 0) {
      const totalOver = Object.values(validationErrors).reduce((acc, msg) => {
        const num = parseInt(msg.match(/\d+/)) || 0;
        return acc + num;
      }, 0);
      setTotalOveragesCount(totalOver);
      setShowOverageModal(true);
      return;
    }
    
    finalizeSubmission(null);
  };

  const finalizeSubmission = async (overageAudit) => {
    setLoading(true);
    try {
      const payload = {
        receivingId: receiving.id,
        purchaseOrderId: receiving.purchaseOrderId,
        shopId: receiving.shopId,
        notes: receiving.notes,
        receivingItems: receiveData.map(item => {
          const isOver = (item.sessionReceived + item.sessionDamaged + item.sessionRejected) > item.allowedQty;
          return {
            id: item.id,
            purchaseOrderItemId: item.purchaseOrderItemId,
            receivedQty: item.sessionReceived,
            damagedQty: item.sessionDamaged,
            rejectedQty: item.sessionRejected,
            notes: item.sessionNotes,
            isOveraged: isOver,
            overageReason: isOver ? overageAudit?.overageReason : null,
            overageNotes: isOver ? overageAudit?.overageNotes : null
          };
        })
      };

      await onSubmit(payload);
      setSuccessMsg('Inventory updated successfully!');
      setTimeout(onCancel, 1200);
    } catch (err) {
      setError('Failed to finalize transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Header 
        title={activeStep === 0 ? "Log New Receipt" : `Receiving PO #${receiving?.poNumber}`} 
        onBack={activeStep === 0 ? onCancel : () => setActiveStep(0)}
      />

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step><StepLabel>Identify PO</StepLabel></Step>
        <Step><StepLabel>Verify Contents</StepLabel></Step>
        <Step><StepLabel>Success</StepLabel></Step>
      </Stepper>

      {/* STEP 1: SELECTOR */}
      {activeStep === 0 && !loading && (
        <Paper variant="outlined" sx={{ p: 4, maxWidth: 600, mx: 'auto', borderRadius: 3, textAlign: 'center' }}>
          <ShoppingBagOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Select Purchase Order</Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Search Pending POs</InputLabel>
            <Select value={selectedReceivingId} label="Search Pending POs" onChange={handleReceivingSelect}>
              {receivingOptions.map(r => (
                <MenuItem key={r.id} value={r.id}>
                  PO #{r.poNumber} — {r.supplier?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}

      {/* STEP 2: WORKSHEET */}
      {activeStep === 1 && (
        <Grid container spacing={3}>
          {receiveData.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card variant="outlined" sx={{ 
                borderRadius: 3, 
                borderLeft: '6px solid', 
                borderColor: validationErrors[item.id] ? 'warning.main' : 'success.main',
                bgcolor: 'background.paper'
              }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{item.itemName}</Typography>
                      <Typography variant="caption" color="text.secondary">SKU: {item.sku} | PO Qty: {item.expectedQty}</Typography>
                    </Box>
                    <Chip label={item.status} color={statusChipColor(item.status)} size="small" />
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField label="Received" size="small" type="number" fullWidth
                        value={item.sessionReceived}
                        onChange={(e) => handleQtyChange(item.id, 'sessionReceived', e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><InventoryIcon fontSize="inherit" color="success"/></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField label="Damaged" size="small" type="number" fullWidth
                        value={item.sessionDamaged}
                        onChange={(e) => handleQtyChange(item.id, 'sessionDamaged', e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><WarningAmberIcon fontSize="inherit" color="warning"/></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField label="Rejected" size="small" type="number" fullWidth
                        value={item.sessionRejected}
                        onChange={(e) => handleQtyChange(item.id, 'sessionRejected', e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><CancelOutlinedIcon fontSize="inherit" color="error"/></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField placeholder="Line item notes..." size="small" fullWidth multiline rows={1}
                        value={item.sessionNotes}
                        onChange={(e) => {
                          const updated = receiveData.map(i => i.id === item.id ? { ...i, sessionNotes: e.target.value } : i);
                          setReceiveData(updated);
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Allowed: <span style={{ color: '#2e7d32' }}>{item.allowedQty}</span>
                    </Typography>
                    {validationErrors[item.id] && (
                      <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                        {validationErrors[item.id]}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2, mb: 5 }}>
              <Button onClick={() => setActiveStep(0)} variant="outlined">Back</Button>
              <Button onClick={handleSubmit} variant="contained" color="success" startIcon={<CheckCircleOutlineIcon />}>
                Finalize Receipt
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* MODALS & LOADERS */}
      <Modal open={showOverageModal} onClose={() => setShowOverageModal(false)}>
        <Box sx={{ outline: 'none' }}>
          <OverageConfirmationModal 
            totalOverages={totalOveragesCount}
            errors={validationErrors}
            onCancel={() => setShowOverageModal(false)}
            onConfirm={(audit) => {
              setShowOverageModal(false);
              finalizeSubmission(audit);
            }}
          />
        </Box>
      </Modal>

      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, fontWeight: 'bold' }}>Processing Inbound Goods...</Typography>
        </Box>
      )}

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!successMsg} autoHideDuration={3000}>
        <Alert severity="success" variant="filled">{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ReceiveGoodsForm;