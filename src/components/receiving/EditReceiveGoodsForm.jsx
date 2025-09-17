import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TextField, Modal } from '@mui/material';
import Header from './Header';
import OverageConfirmationModal from './OverageConfirmationModal';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';


const EditReceiveGoodsForm = ({ receiving, onSubmit, onCancel, getPoItems }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editData, setEditData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [showOverageModal, setShowOverageModal] = useState(false);
  const [totalOverages, setTotalOverages] = useState(0);

  useEffect(() => {
    const fetchCombinedData = async () => {
      setLoading(true);
      setError('');
      try {
        const poItems = await getPoItems(receiving.purchaseOrderId);
        const receivingItems = receiving.receivingItems || [];

        const combinedItems = poItems.map(poItem => {
          const matchingReceivedItem = receivingItems.find(recItem => recItem.purchaseOrderItemId === poItem.id);
          return {
            id: matchingReceivedItem?.id || null,
            purchaseOrderItemId: poItem.id,
            itemName: poItem.name,
            orderedQty: poItem.quantity,
            expectedQty: poItem.quantity,
            receivedQty: matchingReceivedItem?.receivedQty || 0,
            damagedQty: matchingReceivedItem?.damagedQty || 0,
            damageReason: matchingReceivedItem?.damageReason || '',
            notes: matchingReceivedItem?.notes || '',
            putAwayStatus: matchingReceivedItem?.putAwayStatus || null,
            rejectedQty: matchingReceivedItem?.rejectedQty || 0,
            rejectReason: matchingReceivedItem?.rejectReason || '',
            putawayQty: matchingReceivedItem?.putawayQty || 0,
            previouslyReceived: matchingReceivedItem?.receivedQty || 0,
            previouslyRejected: matchingReceivedItem?.rejectedQty || 0,
            previouslyDamaged: matchingReceivedItem?.damagedQty || 0,
            newReceivedQty: 0,
            newRejectedQty: 0,
            newDamagedQty: 0,
            newRejectionReason: '',
          };
        });
        setEditData(combinedItems);
      } catch (err) {
        setError('Failed to load item details for this PO.');
      } finally {
        setLoading(false);
      }
    };
    fetchCombinedData();
  }, [receiving]);

  const validateInput = (index) => {
    const item = editData[index];
    const totalNew = (item.newReceivedQty || 0) + (item.newRejectedQty || 0) + (item.newDamagedQty || 0);
    const totalPreviously = (item.previouslyReceived || 0) + (item.previouslyRejected || 0) + (item.previouslyDamaged || 0);
    const totalCombined = totalNew + totalPreviously;
    const ordered = item.orderedQty;

    const newErrors = { ...validationErrors };
    if (totalCombined > ordered) {
      newErrors[index] = `Total combined quantity (${totalCombined}) exceeds ordered quantity (${ordered}).`;
    } else if (totalNew < 0) {
      newErrors[index] = 'Quantities cannot be negative.';
    } else {
      delete newErrors[index];
    }
    setValidationErrors(newErrors);
  };

  const handleQtyChange = (index, field, value) => {
    const sanitizedValue = Math.max(0, parseInt(value, 10) || 0);
    const newEditData = [...editData];
    newEditData[index][field] = sanitizedValue;
    setEditData(newEditData);
    validateInput(index);
  };

  const handleTextChange = (index, field, value) => {
    const newEditData = [...editData];
    newEditData[index][field] = value;
    setEditData(newEditData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const overagesFound = Object.keys(validationErrors).length > 0;
    if (overagesFound) {
      const overageCount = Object.values(validationErrors).reduce((sum, err, index) => {
        const match = err.match(/exceeds ordered quantity \((\d+)\)\./);
        if (match) {
          const ordered = parseInt(match[1], 10);
          const totalCombined = (editData[index].newReceivedQty || 0) + (editData[index].newRejectedQty || 0) + (editData[index].newDamagedQty || 0) + (editData[index].previouslyReceived || 0) + (editData[index].previouslyRejected || 0) + (editData[index].previouslyDamaged || 0);
          return sum + (totalCombined - ordered);
        }
        return sum;
      }, 0);
      setTotalOverages(overageCount);
      setShowOverageModal(true);
      return;
    }

    const itemsToUpdate = editData.map(item => ({
      id: item.id || null,
      purchaseOrderItemId: item.purchaseOrderItemId,
      expectedQty: item.orderedQty,
      receivedQty: item.newReceivedQty || 0,
      damagedQty: item.newDamagedQty || 0,
      damageReason: item.damageReason || '',
      notes: item.newRejectionReason || '',
      putAwayStatus: item.putAwayStatus || null,
      rejectedQty: item.newRejectedQty || 0,
      rejectReason: item.rejectReason || '',
      putawayQty: item.putawayQty || 0,
      isOveraged: false,
      isShortage: (((item.newReceivedQty || 0) + (item.newRejectedQty || 0) + (item.newDamagedQty || 0) + (item.previouslyReceived || 0) + (item.previouslyRejected || 0) + (item.previouslyDamaged || 0)) < item.orderedQty),
    }));
    onSubmit(receiving.id, itemsToUpdate);
  };

  const handleConfirmOverage = (overageData) => {
    setShowOverageModal(false);
    const itemsToUpdate = editData.map(item => {
      const totalCombined = (item.newReceivedQty || 0) + (item.newRejectedQty || 0) + (item.newDamagedQty || 0) + (item.previouslyReceived || 0) + (item.previouslyRejected || 0) + (item.previouslyDamaged || 0);
      return {
        itemName: item.itemName,
        variants: item.variants,
        orderedQty: item.orderedQty,
        receivedQty: (item.newReceivedQty || 0),
        rejectedQty: (item.newRejectedQty || 0),
        damagedQty: (item.newDamagedQty || 0),
        rejectionReason: item.newRejectionReason,
        isOveraged: totalCombined > item.orderedQty,
        isShortage: totalCombined < item.orderedQty,
      };
    });
    onSubmit(receiving.id, itemsToUpdate);
  };

  const totalReceivedThisSession = editData.reduce((sum, item) => sum + (item.newReceivedQty || 0), 0);
  const totalRejectedThisSession = editData.reduce((sum, item) => sum + (item.newRejectedQty || 0), 0);
  const totalDamagedThisSession = editData.reduce((sum, item) => sum + (item.newDamagedQty || 0), 0);

  return (
    <Box>
      <Header title={`Edit Receiving for PO #${receiving.poNumber}`} onBack={onCancel} />
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, color: 'grey.500' }}>
          <CircularProgress color="inherit" size={40} sx={{ mb: 2 }} />
          <Typography>Loading PO details...</Typography>
        </Box>
      )}
      {error && <Typography color="error" sx={{ bgcolor: 'error.light', p: 1, borderRadius: 1 }}>{error}</Typography>}
      {!loading && editData.length > 0 && (
        <Box component="form" onSubmit={handleSubmit}>
          <Paper sx={{ display: 'flex', justifyContent: 'space-between', p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'success.main' }}>
              Received This Session: {totalReceivedThisSession}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'error.main' }}>
              Rejected This Session: {totalRejectedThisSession}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'warning.main' }}>
              Damaged This Session: {totalDamagedThisSession}
            </Typography>
          </Paper>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ordered Qty</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Previously Rec'd</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rec'd Now</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rejected Now</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Damaged Now</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editData.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 'medium' }}>{item.itemName}</Typography>
                      {item.variants && Object.entries(item.variants).map(([key, value]) => (
                        <Typography key={key} variant="body2" color="text.secondary">
                          {key}: {value}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell align="center" sx={{ color: 'primary.main', fontWeight: 'medium' }}>{item.orderedQty}</TableCell>
                    <TableCell align="center" sx={{ color: 'success.main', fontWeight: 'medium' }}>{item.previouslyReceived}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={item.newReceivedQty}
                        onChange={(e) => handleQtyChange(index, 'newReceivedQty', e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={item.newRejectedQty}
                        onChange={(e) => handleQtyChange(index, 'newRejectedQty', e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={item.newDamagedQty}
                        onChange={(e) => handleQtyChange(index, 'newDamagedQty', e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                        {validationErrors[index] ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                                <CancelOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Invalid</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                                <CheckCircleOutlineOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>OK</Typography>
                            </Box>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={onCancel} variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="success">
              Update Receiving
            </Button>
          </Box>
        </Box>
      )}

      <Modal open={showOverageModal} onClose={() => setShowOverageModal(false)}>
        <OverageConfirmationModal
          onConfirm={handleConfirmOverage}
          onCancel={() => setShowOverageModal(false)}
          errors={validationErrors}
          totalOverages={totalOverages}
        />
      </Modal>
    </Box>
  );
};
export default EditReceiveGoodsForm;
