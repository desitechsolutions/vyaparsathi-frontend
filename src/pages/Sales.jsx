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
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Document, Page } from 'react-pdf';
import Select from 'react-select';
import { createSale, fetchCustomers, createCustomer, fetchItemVariants } from '../services/api';

// TabPanel definition
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Sales = () => {
  const [formData, setFormData] = useState({
    customerId: '',
    items: [],
    totalAmount: 0,
    isGstRequired: 'no', // Changed to string for radio button control ('yes' or 'no')
  });
  const [item, setItem] = useState({
    itemVariantId: '',
    sku: '',
    qty: 1,
    unitPrice: 0,
    itemName: '',
    description: '',
    color: '',
    size: '',
    design: '',
    availableQuantity: 0,
  });
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [invoicePdf, setInvoicePdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    gstNumber: '',
    panNumber: '',
    notes: '',
    creditBalance: 0,
  });
  const [searchParams, setSearchParams] = useState({
    name: '',
    sku: '',
    color: '',
    size: '',
    design: '',
  });
  const [uniqueNames, setUniqueNames] = useState([]);
  const [uniqueSkus, setUniqueSkus] = useState([]);
  const [uniqueColors, setUniqueColors] = useState([]);
  const [uniqueSizes, setUniqueSizes] = useState([]);
  const [uniqueDesigns, setUniqueDesigns] = useState([]);

  useEffect(() => {
    fetchCustomers().then((res) =>
      setCustomers(
        res.data.map((cust) => ({
          value: cust.id,
          label: `${cust.name} (Address: ${cust.addressLine1 || 'N/A'}, Phone: ${cust.phone || 'N/A'}, GST: ${cust.gstNumber || 'N/A'})`,
          addressLine1: cust.addressLine1,
          phone: cust.phone,
          gstNumber: cust.gstNumber,
        }))
      )
    );
  }, []);

  useEffect(() => {
    fetchItemVariants(searchParams, 'http://localhost:8080/api/item-variants') // Corrected endpoint
      .then((res) => {
        console.log('Variants API Response:', res.data);
        if (res.data && Array.isArray(res.data)) {
          setVariants(
            res.data.map((v) => ({
              value: v.itemVariantId,
              label: `${v.itemName} (${v.color}, ${v.size}, ${v.design}) - SKU: ${v.sku}`,
              itemVariantId: v.itemVariantId,
              sku: v.sku,
              unitPrice: v.pricePerUnit,
              availableQuantity: v.availableQuantity || 0,
              itemName: v.itemName,
              description: v.description || '',
              color: v.color || '',
              size: v.size || '',
              design: v.design || '',
            }))
          );

          // Derive unique values for dropdowns
          const names = [...new Set(res.data.map(v => v.itemName).filter(Boolean))];
          const skus = [...new Set(res.data.map(v => v.sku).filter(Boolean))];
          const colors = [...new Set(res.data.map(v => v.color).filter(Boolean))];
          const sizes = [...new Set(res.data.map(v => v.size).filter(Boolean))];
          const designs = [...new Set(res.data.map(v => v.design).filter(Boolean))];

          setUniqueNames(names.map(n => ({ value: n, label: n })));
          setUniqueSkus(skus.map(s => ({ value: s, label: s })));
          setUniqueColors(colors.map(c => ({ value: c, label: c })));
          setUniqueSizes(sizes.map(s => ({ value: s, label: s })));
          setUniqueDesigns(designs.map(d => ({ value: d, label: d })));
        } else {
          console.error('Invalid API response format:', res.data);
          setVariants([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching variants:', err);
        setVariants([]);
      });
  }, [searchParams]);

  useEffect(() => {
    const newTotal = formData.items.reduce(
      (sum, currentItem) => sum + currentItem.qty * currentItem.unitPrice,
      0
    );
    setFormData((prevData) => ({
      ...prevData,
      totalAmount: newTotal.toFixed(2),
    }));
  }, [formData.items]);

  const handleAddItem = () => {
    if (!item.itemVariantId || !item.qty || !item.unitPrice || item.qty > item.availableQuantity) {
      setError('Please select an item, specify quantity, and ensure stock is available.');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, item],
    });
    setItem({
      itemVariantId: '',
      sku: '',
      qty: 1,
      unitPrice: 0,
      itemName: '',
      description: '',
      color: '',
      size: '',
      design: '',
      availableQuantity: 0,
    });
    setSelectedVariant(null); // Clear selected variant
    setError('');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const handleVariantSelect = (selectedOption) => {
    if (selectedOption) {
      setSelectedVariant(selectedOption);
      setItem({
        itemVariantId: selectedOption.itemVariantId,
        sku: selectedOption.sku,
        qty: 1,
        unitPrice: selectedOption.unitPrice,
        itemName: selectedOption.itemName,
        description: selectedOption.description,
        color: selectedOption.color,
        size: selectedOption.size,
        design: selectedOption.design,
        availableQuantity: selectedOption.availableQuantity,
      });
    } else {
      setSelectedVariant(null);
      setItem({
        itemVariantId: '',
        sku: '',
        qty: 1,
        unitPrice: 0,
        itemName: '',
        description: '',
        color: '',
        size: '',
        design: '',
        availableQuantity: 0,
      });
    }
  };

  const handleCustomerSelect = (selectedOption) => {
    if (selectedOption) {
      setSelectedCustomer(selectedOption);
      setFormData((prevData) => ({
        ...prevData,
        customerId: selectedOption.value,
      }));
      setNewCustomerData((prev) => ({
        ...prev,
        addressLine1: selectedOption.addressLine1 || '',
        phone: selectedOption.phone || '',
        gstNumber: selectedOption.gstNumber || '',
      }));
    } else {
      setSelectedCustomer(null);
      setFormData((prevData) => ({
        ...prevData,
        customerId: '',
      }));
      setNewCustomerData((prev) => ({
        ...prev,
        addressLine1: '',
        phone: '',
        gstNumber: '',
      }));
    }
  };

  const handleSearchParamChange = (field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewCustomer = async () => {
    const res = await createCustomer(newCustomerData);
    setCustomers([
      ...customers,
      {
        value: res.data.id,
        label: `${res.data.name} (Address: ${res.data.addressLine1 || 'N/A'}, Phone: ${res.data.phone || 'N/A'}, GST: ${res.data.gstNumber || 'N/A'})`,
        addressLine1: res.data.addressLine1,
        phone: res.data.phone,
        gstNumber: res.data.gstNumber,
      },
    ]);
    setSelectedCustomer({
      value: res.data.id,
      label: `${res.data.name} (Address: ${res.data.addressLine1 || 'N/A'}, Phone: ${res.data.phone || 'N/A'}, GST: ${res.data.gstNumber || 'N/A'})`,
      addressLine1: res.data.addressLine1,
      phone: res.data.phone,
      gstNumber: res.data.gstNumber,
    });
    setFormData((prevData) => ({ ...prevData, customerId: res.data.id }));
    setOpenCustomerModal(false);
    setNewCustomerData({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      gstNumber: '',
      panNumber: '',
      notes: '',
      creditBalance: 0,
    });
  };

  const handleSubmit = async () => {
    if (!formData.customerId || formData.items.length === 0) {
      setError('Please provide a customer and add at least one item.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const saleData = {
        customerId: formData.customerId,
        items: formData.items,
        paymentMethod: 'Cash',
        isGstRequired: formData.isGstRequired === 'yes',
      };
      const response = await createSale(saleData);
      setSalesHistory([...salesHistory, formData]);
      setFormData({
        customerId: '',
        items: [],
        totalAmount: 0,
        isGstRequired: 'no',
      });
      setInvoicePdf(response.data);
      setOpenInvoiceModal(true);
    } catch (err) {
      setError('Failed to create sale.');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f5f8', minHeight: '100vh' }}>
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
        <Tab label="Create Sale" />
        <Tab label="Sales History" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{ fontWeight: 'bold', mb: 4, color: '#1976d2', fontSize: { xs: '1.5rem', md: '2rem' } }}
        >
          Create New Sale
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card raised sx={{ p: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 'medium', fontSize: { xs: '1.1rem', md: '1.25rem' } }}
                >
                  Customer Details
                </Typography>
                <Select
                  options={customers}
                  onChange={handleCustomerSelect}
                  placeholder="Select Customer"
                  isSearchable
                  isClearable
                  value={selectedCustomer}
                  styles={{
                    container: (provided) => ({ ...provided, marginBottom: '1rem' }),
                    menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => setOpenCustomerModal(true)}
                  sx={{ mb: 2, fontSize: { xs: '0.8rem', md: '0.9rem' } }}
                >
                  Add New Customer
                </Button>
                <RadioGroup
                  row
                  value={formData.isGstRequired}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isGstRequired: e.target.value }))}
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel value="no" control={<Radio />} label="No GST" />
                  <FormControlLabel value="yes" control={<Radio />} label="Require GST Invoice" />
                </RadioGroup>
                <TextField
                  label="Total Amount"
                  fullWidth
                  variant="outlined"
                  value={formData.totalAmount}
                  disabled
                  sx={{ mb: 2, fontSize: { xs: '0.8rem', md: '0.9rem' } }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card raised sx={{ p: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 'medium', fontSize: { xs: '1.1rem', md: '1.25rem' } }}
                >
                  Add Items to Sale
                </Typography>
                <Card sx={{ p: 2, mb: 2, bgcolor: '#fff' }}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                  >
                    Search Filters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Select
                        options={[{ value: '', label: 'Choose Option' }, ...uniqueNames]}
                        value={uniqueNames.find(option => option.value === searchParams.name) || { value: '', label: 'Choose Option' }}
                        onChange={(option) => handleSearchParamChange('name', option.value)}
                        isSearchable
                        placeholder="Choose Option"
                        styles={{
                          container: (provided) => ({ ...provided, marginBottom: '1rem' }),
                          menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Select
                        options={[{ value: '', label: 'Choose Option' }, ...uniqueSkus]}
                        value={uniqueSkus.find(option => option.value === searchParams.sku) || { value: '', label: 'Choose Option' }}
                        onChange={(option) => handleSearchParamChange('sku', option.value)}
                        isSearchable
                        placeholder="Choose Option"
                        styles={{
                          container: (provided) => ({ ...provided, marginBottom: '1rem' }),
                          menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Select
                        options={[{ value: '', label: 'Choose Option' }, ...uniqueColors]}
                        value={uniqueColors.find(option => option.value === searchParams.color) || { value: '', label: 'Choose Option' }}
                        onChange={(option) => handleSearchParamChange('color', option.value)}
                        isSearchable
                        placeholder="Choose Option"
                        styles={{
                          container: (provided) => ({ ...provided, marginBottom: '1rem' }),
                          menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Select
                        options={[{ value: '', label: 'Choose Option' }, ...uniqueSizes]}
                        value={uniqueSizes.find(option => option.value === searchParams.size) || { value: '', label: 'Choose Option' }}
                        onChange={(option) => handleSearchParamChange('size', option.value)}
                        isSearchable
                        placeholder="Choose Option"
                        styles={{
                          container: (provided) => ({ ...provided, marginBottom: '1rem' }),
                          menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Select
                        options={[{ value: '', label: 'Choose Option' }, ...uniqueDesigns]}
                        value={uniqueDesigns.find(option => option.value === searchParams.design) || { value: '', label: 'Choose Option' }}
                        onChange={(option) => handleSearchParamChange('design', option.value)}
                        isSearchable
                        placeholder="Choose Option"
                        styles={{
                          container: (provided) => ({ ...provided, marginBottom: '1rem' }),
                          menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>
                <Select
                  options={variants}
                  onChange={handleVariantSelect}
                  placeholder="Select Variant"
                  isClearable
                  value={selectedVariant}
                  styles={{
                    container: (provided) => ({ ...provided, margin: '1rem 0', fontSize: { xs: '0.75rem', md: '0.85rem' } }),
                    menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="SKU"
                      fullWidth
                      variant="outlined"
                      value={item.sku}
                      disabled
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Item Name"
                      fullWidth
                      variant="outlined"
                      value={item.itemName}
                      disabled
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Description"
                      fullWidth
                      variant="outlined"
                      value={item.description}
                      disabled
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Color"
                      fullWidth
                      variant="outlined"
                      value={item.color}
                      disabled
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Size"
                      fullWidth
                      variant="outlined"
                      value={item.size}
                      disabled
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Design"
                      fullWidth
                      variant="outlined"
                      value={item.design}
                      disabled
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Unit Price"
                      fullWidth
                      variant="outlined"
                      value={item.unitPrice}
                      disabled
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Available Quantity"
                      fullWidth
                      variant="outlined"
                      value={item.availableQuantity}
                      disabled
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Quantity"
                      fullWidth
                      variant="outlined"
                      type="number"
                      value={item.qty}
                      onChange={(e) => setItem({ ...item, qty: e.target.value })}
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddItem}
                    sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', md: '0.9rem' } }}
                  >
                    Add Item
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <Divider />
            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
              {error && <Alert severity="error" sx={{ mr: 2 }}>{error}</Alert>}
              <Button
                variant="outlined"
                onClick={() => setFormData({ customerId: '', items: [], totalAmount: 0, isGstRequired: 'no' })}
                sx={{ mr: 2, textTransform: 'none', fontSize: { xs: '0.8rem', md: '0.9rem' } }}
              >
                Clear Form
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading || formData.items.length === 0}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', md: '0.9rem' } }}
              >
                {loading ? 'Submitting...' : 'Submit Sale'}
              </Button>
            </CardActions>
          </Card>
        </Box>

        {/* New Customer Modal */}
        <Dialog open={openCustomerModal} onClose={() => setOpenCustomerModal(false)}>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogContent>
            <TextField
              label="Name"
              fullWidth
              margin="dense"
              value={newCustomerData.name}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Phone"
              fullWidth
              margin="dense"
              value={newCustomerData.phone}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Address Line 1"
              fullWidth
              margin="dense"
              value={newCustomerData.addressLine1}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine1: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Address Line 2"
              fullWidth
              margin="dense"
              value={newCustomerData.addressLine2}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine2: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="City"
              fullWidth
              margin="dense"
              value={newCustomerData.city}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, city: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="State"
              fullWidth
              margin="dense"
              value={newCustomerData.state}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, state: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Postal Code"
              fullWidth
              margin="dense"
              value={newCustomerData.postalCode}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, postalCode: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Country"
              fullWidth
              margin="dense"
              value={newCustomerData.country}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, country: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="GST Number"
              fullWidth
              margin="dense"
              value={newCustomerData.gstNumber}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, gstNumber: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="PAN Number"
              fullWidth
              margin="dense"
              value={newCustomerData.panNumber}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, panNumber: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Notes"
              fullWidth
              margin="dense"
              value={newCustomerData.notes}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Credit Balance"
              fullWidth
              margin="dense"
              value={newCustomerData.creditBalance}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, creditBalance: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCustomerModal(false)} sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
              Cancel
            </Button>
            <Button onClick={handleNewCustomer} color="primary" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invoice Preview Modal */}
        <Dialog open={openInvoiceModal} onClose={() => setOpenInvoiceModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>Invoice Preview</DialogTitle>
          <DialogContent>
            <Document
              file={`data:application/pdf;base64,${btoa(String.fromCharCode(...new Uint8Array(invoicePdf)))}`}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <Page pageNumber={pageNumber} />
            </Document>
            <Typography>Page {pageNumber} of {numPages}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPageNumber(Math.max(1, pageNumber - 1))} sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
              Previous
            </Button>
            <Button onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))} sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
              Next
            </Button>
            <Button onClick={() => setOpenInvoiceModal(false)} sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
              Close
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open(`data:application/pdf;base64,${btoa(String.fromCharCode(...new Uint8Array(invoicePdf)))}`)}
              sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography
          variant="h5"
          gutterBottom
          align="center"
          sx={{ fontWeight: 'bold', mb: 4, color: '#1976d2', fontSize: { xs: '1.3rem', md: '1.5rem' } }}
        >
          Sales History
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salesHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No sales recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              salesHistory.map((sale, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{sale.customerId}</TableCell>
                  <TableCell>₹{sale.totalAmount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabPanel>
    </Box>
  );
};

export default Sales;