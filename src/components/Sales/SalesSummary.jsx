import React, { useState, useMemo, useEffect } from 'react';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell, TableHead,
  TableRow, Button, Alert, IconButton, Divider, CardActions, Box, TextField,
  CircularProgress, Tooltip, Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SaveAsIcon from '@mui/icons-material/SaveAs'; // Added icon

const SalesSummary = ({
  formData,
  handleRemoveItem,
  setShowReviewPage,
  loading,
  error,
  setFormData,
  selectedCustomer,
  handleCustomerSelect,
  setSelectedVariant,
  setItem,
  setSearchParams,
  handleEditItem,
  handleSaveDraft, // New Prop added
  proceedDisabledTooltip,
}) => {
  const [discount, setDiscount] = useState(Number(formData.discount) || 0);

  useEffect(() => {
    setDiscount(Number(formData.discount) || 0);
  }, [formData.discount]);

  const handleClearForm = () => {
    setFormData({
      id: null,
      customerId: '',
      items: [],
      totalAmount: 0,
      isGstRequired: 'no',
      discount: 0,
      paymentMethods: [{ method: 'Cash', amount: 0 }],
      deliveryRequired: false,
    });
    handleCustomerSelect(null);
    setSelectedVariant(null);
    setItem({
      id: '', sku: '', qty: '', unitPrice: 0, itemName: '',
      description: '', color: '', size: '', brand: '', design: '', currentStock: 0,
    });
    setSearchParams({}); 
    setDiscount(0);
  };

  const subtotal = useMemo(() =>
    formData.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0),
    [formData.items]
  );

  const netTotal = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      discount: discount,
      totalAmount: netTotal.toFixed(2)
    }));
  }, [discount, netTotal, setFormData]);

  const isActionDisabled = loading || formData.items.length === 0 || !selectedCustomer;

  return (
    <Box sx={{ mt: 2 }}>
      <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #e0e4e8' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Order Items ({formData.items.length})
            </Typography>
          </Box>
          
          {formData.items.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc' }}>
              <Typography variant="body2" color="text.secondary">
                Your cart is empty. Search and add items above.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item Details</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((saleItem, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Tooltip title={<Box sx={{ p: 0.5 }}>SKU: {saleItem.sku}</Box>} arrow>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{saleItem.itemName}</Typography>
                            <Typography variant="caption" color="text.secondary">{saleItem.color} / {saleItem.size}</Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">{saleItem.qty}</TableCell>
                      <TableCell align="right">₹{Number(saleItem.unitPrice).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{(saleItem.qty * saleItem.unitPrice).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" size="small" onClick={() => handleEditItem(index)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton color="error" size="small" onClick={() => handleRemoveItem(index)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', bgcolor: '#f8fafc' }}>
            <Box sx={{ width: { xs: '100%', md: '300px' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Discount:</Typography>
                <TextField
                  type="number" variant="standard" value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  inputProps={{ style: { textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' } }}
                  sx={{ width: 80 }}
                />
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Grand Total:</Typography>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 800 }}>₹{netTotal.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', p: 2, bgcolor: '#fff' }}>
          <Button variant="text" color="inherit" startIcon={<ClearAllIcon />} onClick={handleClearForm} sx={{ fontWeight: 600 }}>
            Clear All
          </Button>

          <Stack direction="row" spacing={2} alignItems="center">
            {/* NEW SAVE DRAFT BUTTON */}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SaveAsIcon />}
              onClick={handleSaveDraft}
              disabled={isActionDisabled}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Save Draft
            </Button>

            {error && <Alert severity="error" size="small" sx={{ py: 0 }}>{error}</Alert>}
          </Stack>
        </CardActions>
      </Card>
    </Box>
  );
};

export default SalesSummary;