import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { createSale } from '../services/api';

const Sales = () => {
  // State for the entire sale form
  const [formData, setFormData] = useState({
    customerId: '',
    items: [], // Array of items for the current sale
    totalAmount: 0 // Will be automatically calculated
  });

  // State for a single item being added to the sale
  const [item, setItem] = useState({
    itemId: '',
    qty: 1, // Default quantity to 1
    unitPrice: 0, // Default price to 0
    itemVariantId: '',
    itemName: ''
  });

  const [salesHistory, setSalesHistory] = useState([]); // A list of successfully created sales
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to calculate the total amount whenever the items change
  useEffect(() => {
    const newTotal = formData.items.reduce((sum, currentItem) => {
      // Ensure qty and unitPrice are numbers before multiplying
      const qty = parseFloat(currentItem.qty) || 0;
      const unitPrice = parseFloat(currentItem.unitPrice) || 0;
      return sum + (qty * unitPrice);
    }, 0);
    // Round to two decimal places
    setFormData((prevData) => ({
      ...prevData,
      totalAmount: newTotal.toFixed(2)
    }));
  }, [formData.items]);


  // Handle adding a new item to the items list
  const handleAddItem = () => {
    // Basic validation
    if (!item.itemName || !item.itemId || !item.qty || !item.unitPrice) {
      setError("Please fill out all item details.");
      return;
    }
    setError(""); // Clear error on successful add

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });
    // Reset the single item state for the next item
    setItem({
      itemId: '',
      qty: 1,
      unitPrice: 0,
      itemVariantId: '',
      itemName: ''
    });
  };

  // Handle removing an item from the list
  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData,
      items: updatedItems
    });
  };

  // Handle the final submission of the sale
  const handleSubmit = async () => {
    // Basic form validation before submission
    if (!formData.customerId || formData.items.length === 0) {
      setError('Please provide a customer ID and add at least one item.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Assuming `createSale` function from '../services/api'
      await createSale(formData);
      // Add the new sale to the local history list
      setSalesHistory([...salesHistory, formData]);
      // Reset the form after a successful submission
      setFormData({
        customerId: '',
        items: [],
        totalAmount: 0
      });
      // A simple visual confirmation can also be added here, e.g., a success alert
    } catch (err) {
      setError('Failed to create sale. Please check your network or try again.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4, color: 'primary.main' }}>
        Create New Sale
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card raised sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Details
              </Typography>
              <TextField
                label="Customer ID"
                fullWidth
                margin="normal"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                variant="outlined"
              />
              <TextField
                label="Total Amount"
                fullWidth
                margin="normal"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                variant="outlined"
                type="number"
                disabled // This field is now auto-calculated
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card raised sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add Items to Sale
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Item ID"
                    fullWidth
                    size="small"
                    value={item.itemId}
                    onChange={(e) => setItem({ ...item, itemId: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Item Name"
                    fullWidth
                    size="small"
                    value={item.itemName}
                    onChange={(e) => setItem({ ...item, itemName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Quantity"
                    fullWidth
                    size="small"
                    type="number"
                    value={item.qty}
                    onChange={(e) => setItem({ ...item, qty: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Unit Price"
                    fullWidth
                    size="small"
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => setItem({ ...item, unitPrice: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Item Variant ID (Optional)"
                    fullWidth
                    size="small"
                    value={item.itemVariantId}
                    onChange={(e) => setItem({ ...item, itemVariantId: e.target.value })}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button
                  variant="contained"
                  onClick={handleAddItem}
                  sx={{ textTransform: 'none' }}
                >
                  Add Item
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Display added items and submit button */}
      <Box sx={{ mt: 4 }}>
        <Card raised>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Items in Sale ({formData.items.length})
            </Typography>
            {formData.items.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No items added yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((saleItem, index) => (
                    <TableRow key={index}>
                      <TableCell>{saleItem.itemName}</TableCell>
                      <TableCell>{saleItem.qty}</TableCell>
                      <TableCell align="right">₹{saleItem.unitPrice}</TableCell>
                      <TableCell align="right">₹{(saleItem.qty * saleItem.unitPrice).toFixed(2)}</TableCell>
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
                </TableBody>
              </Table>
            )}
          </CardContent>
          <Divider />
          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            {error && <Alert severity="error" sx={{ mr: 2 }}>{error}</Alert>}
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || formData.items.length === 0}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ textTransform: 'none' }}
            >
              {loading ? 'Submitting...' : 'Submit Sale'}
            </Button>
          </CardActions>
        </Card>
      </Box>

      {/* Sales History List (kept for completeness, but could be a separate component) */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Sales History
        </Typography>
        <Card raised>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Customer ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }} align="right">Total Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">No sales recorded yet.</TableCell>
                </TableRow>
              ) : (
                salesHistory.map((sale, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{sale.customerId}</TableCell>
                    <TableCell align="right">₹{sale.totalAmount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>
    </Box>
  );
};

export default Sales;
