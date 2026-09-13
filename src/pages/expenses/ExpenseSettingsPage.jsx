import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Typography,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useForm, Controller } from 'react-hook-form';
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '../../services/api';

const ExpenseSettingsPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { control: categoryControl, handleSubmit: handleCategorySubmit, reset: resetCategory, watch } = useForm({
    defaultValues: {
      name: '',
      budget: '',
      description: '',
    },
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getExpenseCategories();
      setCategories(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit_Handler = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: data.name,
        budget: parseFloat(data.budget) || 0,
        description: data.description,
      };

      if (editingCategory) {
        // Update
        await updateExpenseCategory(editingCategory.id, payload);
        setSnackbar({ open: true, message: 'Category updated successfully', severity: 'success' });
      } else {
        // Create
        await createExpenseCategory(payload);
        setSnackbar({ open: true, message: 'Category created successfully', severity: 'success' });
      }

      // Refresh list
      await fetchCategories();
      setShowCategoryDialog(false);
      resetCategory();
      setEditingCategory(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save category';
      setError(errorMsg);
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      console.error('Error saving category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteExpenseCategory(id);
      setSnackbar({ open: true, message: 'Category deleted successfully', severity: 'success' });
      await fetchCategories();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete category';
      setError(errorMsg);
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      console.error('Error deleting category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    resetCategory({
      name: category.name,
      budget: category.budget || '',
      description: category.description || '',
    });
    setShowCategoryDialog(true);
  };

  const handleOpenCreateDialog = () => {
    setEditingCategory(null);
    resetCategory({ name: '', budget: '', description: '' });
    setShowCategoryDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Expense Settings
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Configure expense categories, policies, and approval workflows
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Categories" />
            <Tab label="Policies" disabled />
            <Tab label="Approval Levels" disabled />
            <Tab label="General Settings" disabled />
          </Tabs>
        </Box>

        {/* Categories Tab */}
        {selectedTab === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Expense Categories
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                disabled={loading}
              >
                Add Category
              </Button>
            </Box>

            {loading && selectedTab === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : categories.length === 0 ? (
              <Alert severity="info">No expense categories found. Click "Add Category" to create one.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Category Name</TableCell>
                      <TableCell align="right">Budget</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell>{category.name}</TableCell>
                        <TableCell align="right">
                          {category.budget ? `₹${category.budget.toLocaleString('en-IN')}` : '—'}
                        </TableCell>
                        <TableCell>{category.description || '—'}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleEditCategory(category)}
                            disabled={loading}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={loading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        )}

        {/* Policies Tab - Coming Soon */}
        {selectedTab === 1 && (
          <CardContent>
            <Alert severity="info">Policies configuration coming soon</Alert>
          </CardContent>
        )}

        {/* Approval Levels Tab - Coming Soon */}
        {selectedTab === 2 && (
          <CardContent>
            <Alert severity="info">Approval levels configuration coming soon</Alert>
          </CardContent>
        )}

        {/* General Settings Tab - Coming Soon */}
        {selectedTab === 3 && (
          <CardContent>
            <Alert severity="info">General settings configuration coming soon</Alert>
          </CardContent>
        )}
      </Card>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onClose={() => setShowCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <form onSubmit={handleCategorySubmit(handleCategorySubmit_Handler)}>
            <Grid container spacing={2}>
              {/* Category Name */}
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={categoryControl}
                  rules={{
                    required: 'Category name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Category Name"
                      placeholder="e.g., Travel, Meals, Equipment"
                      error={!!error}
                      helperText={error?.message}
                      disabled={loading}
                    />
                  )}
                />
              </Grid>

              {/* Budget */}
              <Grid item xs={12}>
                <Controller
                  name="budget"
                  control={categoryControl}
                  rules={{
                    pattern: {
                      value: /^\d+(\.\d{1,2})?$/,
                      message: 'Please enter a valid amount',
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Budget Limit (Optional)"
                      placeholder="e.g., 50000"
                      type="number"
                      inputProps={{ step: '0.01', min: '0' }}
                      error={!!error}
                      helperText={error?.message}
                      disabled={loading}
                    />
                  )}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={categoryControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description (Optional)"
                      placeholder="e.g., All travel-related expenses"
                      multiline
                      rows={2}
                      disabled={loading}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowCategoryDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCategorySubmit(handleCategorySubmit_Handler)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default ExpenseSettingsPage;
