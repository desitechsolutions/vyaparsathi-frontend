import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

const ReviewPaymentPage = ({ formData, selectedCustomer, onConfirm, onSaveDraft, onCancel, setError, loading }) => {
  const [paymentMethods, setPaymentMethods] = useState([{ method: 'Cash', amount: 0 }]);
  const [discount, setDiscount] = useState(formData.discount || 0);
  const [sendInvoice, setSendInvoice] = useState(false);

  const handleAddPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { method: 'Cash', amount: 0 }]);
  };

  const handlePaymentChange = (index, field, value) => {
    const newPaymentMethods = [...paymentMethods];
    newPaymentMethods[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setPaymentMethods(newPaymentMethods);
  };

  const handleRemovePaymentMethod = (index) => {
    const newPaymentMethods = paymentMethods.filter((_, i) => i !== index);
    setPaymentMethods(newPaymentMethods.length ? newPaymentMethods : [{ method: 'Cash', amount: 0 }]);
  };

  const subtotal = parseFloat(formData.totalAmount) || 0;
  const discountedTotal = (subtotal - discount).toFixed(2);
  const totalPayment = paymentMethods.reduce((sum, pm) => sum + (parseFloat(pm.amount) || 0), 0);
  const remaining = (parseFloat(discountedTotal) - totalPayment).toFixed(2);

  const handleConfirm = () => {
    if (totalPayment > parseFloat(discountedTotal)) {
      setError('Total payment cannot exceed the discounted total.');
      return;
    }

    const payload = {
      sale: {
        customerId: formData.customerId,
        discount: discount,
        isGstRequired: formData.isGstRequired === 'yes',
        items: formData.items,
        totalAmount: parseFloat(discountedTotal),
      },
      paymentDetails: paymentMethods
        .filter(pm => pm.amount > 0)
        .map(pm => ({
          method: pm.method,
          amountPaid: parseFloat(pm.amount) || 0,
        })) || [], // Fallback to empty array if filtering removes all
    };

    console.log('Payload sent to onConfirm:', payload); // Debug log
    onConfirm(payload, discount, sendInvoice);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Review and Payment</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Customer Details</Typography>
        <Typography>{selectedCustomer?.label || 'No customer selected'}</Typography>
      </Paper>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formData.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.itemName}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>{item.unitPrice}</TableCell>
                <TableCell>{(item.qty * item.unitPrice).toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3}>Subtotal</TableCell>
              <TableCell>₹{subtotal.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>Discount</TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Math.min(parseFloat(e.target.value) || 0, subtotal)))}
                  InputProps={{ inputProps: { min: 0, max: subtotal } }}
                  size="small"
                  sx={{ width: 120 }}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>Discounted Total</TableCell>
              <TableCell>₹{discountedTotal}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>Total Paid</TableCell>
              <TableCell>₹{totalPayment.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>Remaining</TableCell>
              <TableCell>₹{remaining}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Payment Methods</Typography>
        {paymentMethods.map((pm, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <Select
              value={pm.method}
              onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Card">Card</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
            </Select>
            <TextField
              type="number"
              value={pm.amount}
              onChange={(e) => {
                const newAmount = parseFloat(e.target.value) || 0;
                const maxAmount = parseFloat(discountedTotal) - totalPayment + (parseFloat(pm.amount) || 0);
                handlePaymentChange(index, 'amount', Math.min(newAmount, maxAmount));
              }}
              InputProps={{ inputProps: { min: 0 } }}
              size="small"
              sx={{ width: 120 }}
            />
            {index > 0 && (
              <Button variant="outlined" onClick={() => handleRemovePaymentMethod(index)} size="small">
                Remove
              </Button>
            )}
          </Box>
        ))}
        <Button variant="outlined" onClick={handleAddPaymentMethod} sx={{ mt: 1 }}>
          Add Payment Method
        </Button>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={sendInvoice} onChange={(e) => setSendInvoice(e.target.checked)} />}
          label="Send Invoice via Email/SMS"
        />
      </Paper>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Confirm Sale'}
        </Button>
        <Button variant="outlined" onClick={onSaveDraft}>
          Save as Draft
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewPaymentPage;