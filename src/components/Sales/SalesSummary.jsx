import React, { useState, useMemo } from 'react';
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
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const SalesSummary = ({
  formData,
  handleRemoveItem,
  handleProceedToReview,
  loading,
  error,
  setFormData,
  selectedCustomer,
  setSelectedCustomer,
  setSelectedVariant,
  setItem,
  setSearchParams,
  handleEditItem,
  proceedDisabledTooltip,
}) => {
  const [discount, setDiscount] = useState(formData.discount || 0);

  const handleClearForm = () => {
    setFormData({
      customerId: '',
      items: [],
      totalAmount: 0,
      isGstRequired: 'no',
      discount: 0,
      paymentMethods: [{ method: 'Cash', amount: 0 }],
      remaining: 0,
      paymentStatus: 'Pending',
    });
    setSelectedCustomer(null);
    setSelectedVariant(null);
    setItem({
      id: '',
      sku: '',
      qty: '',
      unitPrice: 0,
      itemName: '',
      description: '',
      color: '',
      size: '',
      brand: '',
      design: '',
      currentStock: 0,
    });
    setSearchParams({});
    setDiscount(0);
  };

  const subtotal = useMemo(() =>
    formData.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [formData.items]
  );

  const netTotal = useMemo(() => subtotal - discount, [subtotal, discount]);

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      discount: discount,
    }));
  }, [discount, setFormData]);

  const isButtonDisabled = loading || formData.items.length === 0 || !selectedCustomer;

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
                    <TableCell>
                      <Tooltip
                        title={
                          <>
                            <div>Description: {saleItem.description}</div>
                            <div>Item: {saleItem.itemName}</div>
                            <div>Size: {saleItem.size}</div>
                            <div>Color: {saleItem.color}</div>
                            <div>Brand: {saleItem.brand || '-'}</div>
                            <div>Design: {saleItem.design}</div>
                          </>
                        }
                        arrow
                        placement="bottom"
                      >
                        <span>
                          {saleItem.itemName}
                          {['size', 'color'].map(
                            (field) => saleItem[field] ? ` - ${saleItem[field]}` : ''
                          ).join('')}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{saleItem.qty}</TableCell>
                    <TableCell align="right">₹{saleItem.unitPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      ₹{(saleItem.qty * saleItem.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" size="small" onClick={() => handleEditItem(index)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
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
                  <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹{subtotal.toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>Discount</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, Math.min(parseFloat(e.target.value) || 0, subtotal)))}
                      InputProps={{
                        startAdornment: '₹',
                        inputProps: { min: 0, max: subtotal }
                      }}
                      size="small"
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Net Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹{netTotal.toFixed(2)}</TableCell>
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

          {isButtonDisabled ? (
            <Tooltip title={proceedDisabledTooltip || ''}>
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={true}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', md: '0.9rem' } }}
                >
                  {loading ? 'Processing...' : 'Proceed to Review'}
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleProceedToReview(discount)}
              disabled={false}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', md: '0.9rem' } }}
            >
              {loading ? 'Processing...' : 'Proceed to Review'}
            </Button>
          )}
        </CardActions>
      </Card>
    </Box>
  );
};

export default SalesSummary;