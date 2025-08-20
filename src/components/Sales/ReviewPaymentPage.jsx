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
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';

const paymentMethodOptions = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
];

const ReviewPaymentPage = ({
  formData,
  selectedCustomer,
  onConfirm,
  onSaveDraft,
  onCancel,
  setError,
  loading,
}) => {
  const [paymentMethods, setPaymentMethods] = useState([{ method: 'Cash', amount: 0 }]);
  const [discount, setDiscount] = useState(formData.discount || 0);
  const [sendInvoice, setSendInvoice] = useState(false);

  // Assume previous dues are passed as selectedCustomer.creditBalance or similar
  const previousDues = selectedCustomer?.creditBalance || 0;

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

  // Discount percentage for display
  const discountPercent = subtotal > 0 ? ((discount / subtotal) * 100).toFixed(1) : 0;

  const handleConfirm = () => {
    if (totalPayment > parseFloat(discountedTotal)) {
      setError('Total payment cannot exceed the discounted total.');
      return;
    }
    if (discount > subtotal) {
      setError('Discount cannot exceed subtotal.');
      return;
    }
    if (formData.items.length === 0) {
      setError('No items in sale.');
      return;
    }
    if (!formData.customerId) {
      setError('No customer selected.');
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
        })) || [],
    };

    onConfirm(payload, discount, sendInvoice);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h5" gutterBottom>
        Review and Payment
      </Typography>

      {/* Summary Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Customer Details
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography>
            <strong>Name:</strong> {selectedCustomer?.name || 'N/A'}
          </Typography>
          <Typography>
            <strong>Phone:</strong> {selectedCustomer?.phone || 'N/A'}
          </Typography>
          <Typography>
            <strong>GST:</strong> {selectedCustomer?.gstNumber || 'N/A'}
          </Typography>
          <Typography>
            <strong>Outstanding Dues:</strong>{' '}
            <span style={{ color: previousDues > 0 ? '#d32f2f' : '#388e3c', fontWeight: 600 }}>
              ₹{Number(previousDues).toFixed(2)}
            </span>
          </Typography>
        </Box>
        {previousDues > 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            This customer has previous outstanding dues. Please remind them to clear dues.
          </Alert>
        )}
      </Paper>

      {/* Items Table */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>GST (%)</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formData.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Tooltip
                    title={
                      <>
                        {item.description && (
                          <div>
                            <strong>Description:</strong> {item.description}
                          </div>
                        )}
                        {item.color && (
                          <div>
                            <strong>Color:</strong> {item.color}
                          </div>
                        )}
                        {item.size && (
                          <div>
                            <strong>Size:</strong> {item.size}
                          </div>
                        )}
                        {item.design && (
                          <div>
                            <strong>Design:</strong> {item.design}
                          </div>
                        )}
                      </>
                    }
                    arrow
                  >
                    <span>{item.itemName}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>₹{Number(item.unitPrice).toFixed(2)}</TableCell>
                <TableCell>
                  {item.gstRate ? `${item.gstRate}%` : '-'}
                </TableCell>
                <TableCell>₹{(item.qty * item.unitPrice).toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4}>Subtotal</TableCell>
              <TableCell>₹{subtotal.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4}>
                Discount{' '}
                {discount > 0 && (
                  <span style={{ color: '#1976d2' }}>
                    ({discountPercent}%)
                  </span>
                )}
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(
                      Math.max(0, Math.min(parseFloat(e.target.value) || 0, subtotal))
                    )
                  }
                  InputProps={{ inputProps: { min: 0, max: subtotal } }}
                  size="small"
                  sx={{ width: 100 }}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4}>Discounted Total</TableCell>
              <TableCell>
                <strong>₹{discountedTotal}</strong>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4}>Total Paid</TableCell>
              <TableCell>₹{totalPayment.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4}>
                <span style={{ color: Number(remaining) > 0 ? '#d32f2f' : '#388e3c', fontWeight: 600 }}>
                  Remaining
                </span>
              </TableCell>
              <TableCell>
                <span style={{ color: Number(remaining) > 0 ? '#d32f2f' : '#388e3c', fontWeight: 600 }}>
                  ₹{remaining}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Methods */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Payment Methods
        </Typography>
        {paymentMethods.map((pm, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <Select
              value={pm.method}
              onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {paymentMethodOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            <TextField
              type="number"
              value={pm.amount}
              onChange={(e) => {
                const newAmount = parseFloat(e.target.value) || 0;
                const maxAmount =
                  parseFloat(discountedTotal) -
                  totalPayment +
                  (parseFloat(pm.amount) || 0);
                handlePaymentChange(index, 'amount', Math.min(newAmount, maxAmount));
              }}
              InputProps={{ inputProps: { min: 0 } }}
              size="small"
              sx={{ width: 120 }}
            />
            {index > 0 && (
              <Button
                variant="outlined"
                onClick={() => handleRemovePaymentMethod(index)}
                size="small"
              >
                Remove
              </Button>
            )}
          </Box>
        ))}
        <Button
          variant="outlined"
          onClick={handleAddPaymentMethod}
          sx={{ mt: 1 }}
          disabled={totalPayment >= parseFloat(discountedTotal)}
        >
          Add Payment Method
        </Button>
      </Paper>

      {/* Send Invoice Option */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={sendInvoice}
              onChange={(e) => setSendInvoice(e.target.checked)}
            />
          }
          label="Send Invoice via Email/SMS"
        />
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading || Number(remaining) < 0}
        >
          {loading ? 'Processing...' : 'Confirm Sale'}
        </Button>
        <Button variant="outlined" onClick={onSaveDraft}>
          Save as Draft
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewPaymentPage;