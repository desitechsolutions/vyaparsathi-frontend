import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Paper, Button, CircularProgress, TableContainer, 
  Table, TableHead, TableRow, TableCell, TableBody, TextField, 
  Modal, Divider, Stack, Chip, Alert, Tooltip, IconButton
} from '@mui/material';
import Header from './Header';
import OverageConfirmationModal from './OverageConfirmationModal';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HistoryIcon from '@mui/icons-material/History';

const EditReceiveGoodsForm = ({ receiving, onSubmit, onCancel, getPoItems }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editData, setEditData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [showOverageModal, setShowOverageModal] = useState(false);
  const [totalOverages, setTotalOverages] = useState(0);

  // 1. Initialize Combined Data (PO vs Receiving Record)
  useEffect(() => {
    const fetchCombinedData = async () => {
      setLoading(true);
      setError('');
      try {
        const poItems = await getPoItems(receiving.purchaseOrderId);
        const receivingItems = receiving.receivingItems || [];

        const combinedItems = poItems.map(poItem => {
          const match = receivingItems.find(recItem => recItem.purchaseOrderItemId === poItem.id);
          return {
            id: match?.id || null,
            purchaseOrderItemId: poItem.id,
            itemName: poItem.name,
            sku: poItem.sku || 'N/A',
            orderedQty: poItem.quantity,
            // Historical totals from the database
            previouslyReceived: match?.receivedQty || 0,
            previouslyRejected: match?.rejectedQty || 0,
            previouslyDamaged: match?.damagedQty || 0,
            previouslyPutaway: match?.putawayQty || 0,
            // Current Session inputs
            newReceivedQty: 0,
            newRejectedQty: 0,
            newDamagedQty: 0,
            newPutawayQty: 0,
            note: ''
          };
        });
        setEditData(combinedItems);
      } catch (err) {
        setError('Critical: Could not sync PO items. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchCombinedData();
  }, [receiving, getPoItems]);

  // 2. Real-time Session Calculations
  const stats = useMemo(() => {
    return editData.reduce((acc, item) => ({
      rec: acc.rec + (item.newReceivedQty || 0),
      rej: acc.rej + (item.newRejectedQty || 0),
      dam: acc.dam + (item.newDamagedQty || 0),
    }), { rec: 0, rej: 0, dam: 0 });
  }, [editData]);

  // 3. Logic: Input Handling & Validation
  const handleQtyChange = (index, field, value) => {
    const val = Math.max(0, parseInt(value, 10) || 0);
    const updated = [...editData];
    updated[index][field] = val;

    const item = updated[index];
    const totalCurrent = item.newReceivedQty + item.newRejectedQty + item.newDamagedQty;
    const totalHistorical = item.previouslyReceived + item.previouslyRejected + item.previouslyDamaged;
    
    const errors = { ...validationErrors };
    if ((totalCurrent + totalHistorical) > item.orderedQty) {
      errors[index] = `Total (${totalCurrent + totalHistorical}) exceeds PO limit of ${item.orderedQty}`;
    } else {
      delete errors[index];
    }

    setValidationErrors(errors);
    setEditData(updated);
  };

  // 4. Final Submission Logic
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const hasOverages = Object.keys(validationErrors).length > 0;
    
    if (hasOverages) {
      const overageSum = Object.keys(validationErrors).reduce((sum, idx) => {
        const item = editData[idx];
        const total = (item.newReceivedQty + item.newRejectedQty + item.newDamagedQty + 
                       item.previouslyReceived + item.previouslyRejected + item.previouslyDamaged);
        return sum + (total - item.orderedQty);
      }, 0);
      setTotalOverages(overageSum);
      setShowOverageModal(true);
      return;
    }

    finalizeSubmission(null);
  };

  const finalizeSubmission = (overageAudit) => {
    const payload = editData.map(item => {
      const totalCombined = (item.newReceivedQty + item.newRejectedQty + item.newDamagedQty + 
                            item.previouslyReceived + item.previouslyRejected + item.previouslyDamaged);
      const isOver = totalCombined > item.orderedQty;

      return {
        id: item.id,
        purchaseOrderItemId: item.purchaseOrderItemId,
        receivedQty: item.newReceivedQty,
        damagedQty: item.newDamagedQty,
        rejectedQty: item.newRejectedQty,
        putawayQty: item.newPutawayQty,
        isOveraged: isOver,
        overageReason: isOver ? overageAudit?.overageReason : null,
        overageNotes: isOver ? overageAudit?.overageNotes : null,
        isShortage: totalCombined < item.orderedQty
      };
    });

    onSubmit(receiving.id, payload);
  };

  if (loading) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <CircularProgress />
      <Typography sx={{ mt: 2, color: 'text.secondary' }}>Preparing inventory worksheet...</Typography>
    </Box>
  );

  return (
    <Box>
      <Header title={`Edit Receiving: PO #${receiving.poNumber}`} onBack={onCancel} />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Dashboard Summary Section */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'RECEIVING NOW', val: stats.rec, color: 'success.main' },
          { label: 'REJECTING NOW', val: stats.rej, color: 'error.main' },
          { label: 'DAMAGED NOW', val: stats.dam, color: 'warning.main' }
        ].map((s, i) => (
          <Paper key={i} sx={{ p: 2, flex: 1, textAlign: 'center', borderRadius: 3, border: '1px solid #e0e0e0' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>{s.label}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.val}</Typography>
          </Paper>
        ))}
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Product Item</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>PO Qty</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Historical</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: 'success.main' }}>Received</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: 'purple.main' }}>Putaway</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: 'error.main' }}>Rejected</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: 'warning.main' }}>Damaged</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {editData.map((item, index) => {
              const currentTotal = (
                item.newReceivedQty + 
                item.newRejectedQty + 
                item.newDamagedQty + 
                item.previouslyReceived + 
                item.previouslyRejected + 
                item.previouslyDamaged
              );
              const isOver = currentTotal > item.orderedQty;
              const isMatch = currentTotal === item.orderedQty;

              return (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{item.itemName}</Typography>
                    <Typography variant="caption" color="text.secondary">SKU: {item.sku}</Typography>
                  </TableCell>

                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'rgba(0,0,0,0.01)' }}>
                    {item.orderedQty}
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip 
                      title={
                        `Prev Received: ${item.previouslyReceived}\n` +
                        `Prev Rejected: ${item.previouslyRejected}\n` +
                        `Prev Damaged: ${item.previouslyDamaged}\n` +
                        `Prev Putaway: ${item.previouslyPutaway}`
                      }
                    >
                      <IconButton size="small">
                        <HistoryIcon fontSize="inherit" color="action" />
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          {item.previouslyReceived}
                        </Typography>
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="center">
                    <TextField 
                      type="number" 
                      size="small" 
                      variant="standard"
                      value={item.newReceivedQty} 
                      sx={{ width: 50 }}
                      onChange={(e) => handleQtyChange(index, 'newReceivedQty', e.target.value)}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <TextField 
                      type="number" 
                      size="small" 
                      variant="standard"
                      value={item.newPutawayQty || 0} 
                      sx={{ width: 60 }}
                      onChange={(e) => handleQtyChange(index, 'newPutawayQty', e.target.value)}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <TextField 
                      type="number" 
                      size="small" 
                      variant="standard"
                      value={item.newRejectedQty} 
                      sx={{ width: 50 }}
                      onChange={(e) => handleQtyChange(index, 'newRejectedQty', e.target.value)}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <TextField 
                      type="number" 
                      size="small" 
                      variant="standard"
                      value={item.newDamagedQty} 
                      sx={{ width: 50 }}
                      onChange={(e) => handleQtyChange(index, 'newDamagedQty', e.target.value)}
                    />
                  </TableCell>

                  <TableCell align="center">
                    {validationErrors[index] ? (
                      <Tooltip title={validationErrors[index]}>
                        <CancelOutlinedIcon color="error" />
                      </Tooltip>
                    ) : (
                      <Chip 
                        label={isOver ? 'Overage' : isMatch ? 'Match' : 'Partial'} 
                        color={isMatch ? 'success' : isOver ? 'warning' : 'default'}
                        size="small"
                        variant={isMatch ? 'filled' : 'outlined'}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 5 }}>
        <Button onClick={onCancel} variant="outlined" color="inherit">
          Discard Changes
        </Button>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleSubmit}
          sx={{ px: 4, fontWeight: 'bold', borderRadius: 2 }}
        >
          Update Inventory
        </Button>
      </Box>

      {/* 5. Enhanced Overage Justification Modal */}
      <Modal open={showOverageModal} onClose={() => setShowOverageModal(false)}>
        <Box sx={{ outline: 'none' }}>
          <OverageConfirmationModal
            onConfirm={(auditData) => finalizeSubmission(auditData)}
            onCancel={() => setShowOverageModal(false)}
            errors={validationErrors}
            totalOverages={totalOverages}
          />
        </Box>
      </Modal>
    </Box>
  );
};

export default EditReceiveGoodsForm;