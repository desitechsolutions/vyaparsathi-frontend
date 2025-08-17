import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Alert,
  IconButton,
  Divider,
  CardActions,
  Box,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';

const SalesSummary = ({
  formData,
  handleRemoveItem,
  handleProceedToReview,
  loading,
  error,
  setFormData,
  selectedCustomer,
  selectedVariant,
  setSelectedCustomer,
  setSelectedVariant,
  setItem,
  setSearchParams,
  item,
}) => {
  const [discount, setDiscount] = useState(0); // Local state for discount

  const handleClearForm = () => {
    setFormData({ customerId: '', items: [], totalAmount: 0, isGstRequired: 'no' });
    setSelectedCustomer(null);
    setSelectedVariant(null);
    setItem({
      id: '',
      sku: '',
      qty: 1,
      unitPrice: 0,
      itemName: '',
      description: '',
      color: '',
      size: '',
      design: '',
      currentStock: 0,
    });
    setSearchParams({
      name: '',
      sku: '',
      color: '',
      size: '',
      design: '',
      category: '',
    });
    setDiscount(0); // Reset discount
  };

  // Calculate subtotal based on items (original total without discount)
  const subtotal = formData.items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  ).toFixed(2);

  const netTotal = (parseFloat(subtotal) - discount).toFixed(2);

  return (
    <Box sx={{ mt: 4 }}>
      <Card raised sx={{ boxShadow: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 'medium', fontSize: { xs: '1.1rem', md: '1.25rem' } }}
          >
            Items in Sale ({formData.items.length})
          </Typography>
          {formData.items.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No items added yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Unit Price
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((saleItem, index) => (
                  <TableRow key={index}>
                    <TableCell>{saleItem.itemName}</TableCell>
                    <TableCell>{saleItem.qty}</TableCell>
                    <TableCell align="right">₹{saleItem.unitPrice}</TableCell>
                    <TableCell align="right">
                      ₹{(saleItem.qty * saleItem.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3}>Subtotal</TableCell>
                  <TableCell align="right">₹{subtotal}</TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>Discount</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      InputProps={{ inputProps: { min: 0, max: parseFloat(subtotal) } }}
                      size="small"
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>Total Discount Applied</TableCell>
                  <TableCell align="right">₹{discount.toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>Net Total</TableCell>
                  <TableCell align="right">₹{netTotal}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {error && <Alert severity="error" sx={{ mr: 2 }}>{error}</Alert>}
          <Button
            variant="outlined"
            onClick={handleClearForm}
            sx={{ mr: 2, textTransform: 'none', fontSize: { xs: '0.8rem', md: '0.9rem' } }}
          >
            Clear Form
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleProceedToReview(discount)} // Pass discount to review page
            disabled={loading || formData.items.length === 0 || !selectedCustomer}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', md: '0.9rem' } }}
          >
            {loading ? 'Processing...' : 'Proceed to Review'}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default SalesSummary;