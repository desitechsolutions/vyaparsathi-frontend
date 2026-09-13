import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Typography,
  Grid,
  FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useExpenses } from '../../hooks/useExpenses';
import ReceiptUploader from '../../components/expenses/ReceiptUploader';

const ExpenseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createExpense, updateExpense, loading, error } = useExpenses();
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      description: '',
      amount: '',
      categoryId: '',
      paymentMethod: 'CASH',
      expenseDate: new Date().toISOString().split('T')[0],
      notes: '',
      receiptPath: '',
    },
  });

  const [categories] = useState([
    { id: 1, name: 'Travel' },
    { id: 2, name: 'Meals' },
    { id: 3, name: 'Office Supplies' },
    { id: 4, name: 'Equipment' },
  ]);

  const [paymentMethods] = useState(['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE']);
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const watchAmount = watch('amount');

  useEffect(() => {
    if (id) {
      // Fetch existing expense and populate form
      // This would be implemented when API is ready
    }
  }, [id]);

  const handleReceiptUpload = async (file) => {
    setReceiptFile(file);
    // In production, upload to S3 or backend here
  };

  const onSubmit = async (data) => {
    try {
      setSubmitError(null);
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        categoryId: parseInt(data.categoryId),
      };

      if (id) {
        await updateExpense(id, payload);
      } else {
        await createExpense(payload);
      }

      navigate('/expenses/list');
    } catch (err) {
      setSubmitError(err.message || 'Failed to save expense');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {id ? 'Edit Expense' : 'Create New Expense'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {id ? 'Update your expense details' : 'Submit a new expense for approval'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

      {/* Form */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Description */}
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  rules={{
                    required: 'Description is required',
                    minLength: { value: 5, message: 'Description must be at least 5 characters' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      placeholder="e.g., Client meeting lunch"
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="amount"
                  control={control}
                  rules={{
                    required: 'Amount is required',
                    pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Invalid amount' },
                    min: { value: 0, message: 'Amount must be positive' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Amount (₹)"
                      type="number"
                      inputProps={{ step: '0.01', min: '0' }}
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                    />
                  )}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="categoryId"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.categoryId}>
                      <InputLabel>Category</InputLabel>
                      <Select {...field} label="Category">
                        <MenuItem value="">Select Category</MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.categoryId && <FormHelperText>{errors.categoryId.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Expense Date */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="expenseDate"
                  control={control}
                  rules={{ required: 'Date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Expense Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.expenseDate}
                      helperText={errors.expenseDate?.message}
                    />
                  )}
                />
              </Grid>

              {/* Payment Method */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select {...field} label="Payment Method">
                        {paymentMethods.map((method) => (
                          <MenuItem key={method} value={method}>
                            {method.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Receipt Upload */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Receipt (Optional)
                </Typography>
                <ReceiptUploader onUpload={handleReceiptUpload} />
                {receiptFile && (
                  <Typography variant="caption" sx={{ color: 'green', display: 'block', mt: 1 }}>
                    ✓ {receiptFile.name} ready to upload
                  </Typography>
                )}
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Additional Notes"
                      placeholder="Add any additional information"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>

              {/* Policy Info */}
              {watchAmount && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Amount: ₹{parseFloat(watchAmount).toLocaleString('en-IN')} {parseFloat(watchAmount) > 5000 ? '(Requires approval)' : '(Auto-approved)'}
                  </Alert>
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/expenses/list')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : id ? 'Update' : 'Create'} Expense
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ExpenseForm;
