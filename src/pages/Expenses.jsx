import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DataGrid, GridToolbarQuickFilter, GridToolbarContainer } from '@mui/x-data-grid';
import {
  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,
  Box, Typography, CircularProgress, Snackbar, Alert, Paper, Grid,
  Card, CardContent, IconButton, DialogContentText, Stack, Chip,
  MenuItem, InputAdornment, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  ReceiptLong, FilterList, AccountBalanceWallet, PieChart
} from '@mui/icons-material';
import { createExpense, fetchExpenses, updateExpense, deleteExpense } from '../services/api';

const EXPENSE_CATEGORIES = ['Rent', 'Salary', 'Electricity', 'Water', 'Inventory', 'Marketing', 'Maintenance', 'Miscellaneous'];

const Expenses = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ shopId: 1, type: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchExpensesData = async () => {
    setLoading(true);
    try {
      const response = await fetchExpenses();
      const data = response.data;
      // Handling paginated content from your backend
      if (data && Array.isArray(data.content)) {
        setExpenses(data.content.map(exp => ({ ...exp, id: exp.id || exp.expenseId })));
      }
    } catch (err) {
      setSnackbar({ open: true, message: t('expensesPage.errorFetch'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpensesData(); }, []);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const highest = expenses.length > 0 ? Math.max(...expenses.map(e => parseFloat(e.amount))) : 0;
    return { total, count: expenses.length, highest };
  }, [expenses]);

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setIsEditing(true);
      setSelectedId(expense.id);
      setFormData({ ...expense, date: expense.date.split('T')[0] });
    } else {
      setIsEditing(false);
      setFormData({ shopId: 1, type: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.amount || !formData.date) {
      setSnackbar({ open: true, message: t('expensesPage.errorRequired'), severity: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      if (isEditing) {
        await updateExpense(selectedId, formData);
        setSnackbar({ open: true, message: t('expensesPage.successUpdate'), severity: 'success' });
      } else {
        await createExpense(formData);
        setSnackbar({ open: true, message: t('expensesPage.successRecord'), severity: 'success' });
      }
      setModalOpen(false);
      fetchExpensesData();
    } catch (err) {
      setSnackbar({ open: true, message: t('expensesPage.errorSave'), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteExpense(selectedId);
      setSnackbar({ open: true, message: t('expensesPage.successDelete'), severity: 'success' });
      setDeleteOpen(false);
      fetchExpensesData();
    } catch (err) {
      setSnackbar({ open: true, message: t('expensesPage.errorDelete'), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { field: 'date', headerName: t('expensesPage.columns.date'), width: 130, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'type', headerName: t('expensesPage.columns.category'), width: 180, 
      renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" sx={{ fontWeight: 600 }} /> 
    },
    { field: 'amount', headerName: t('expensesPage.columns.amount'), width: 150, 
      renderCell: (params) => <Typography fontWeight={800} color="error.main">₹{parseFloat(params.value).toLocaleString()}</Typography> 
    },
    { field: 'notes', headerName: t('expensesPage.columns.notes'), flex: 1, minWidth: 200 },
    { field: 'actions', headerName: t('expensesPage.columns.actions'), width: 120, sortable: false,
      renderCell: (params) => (
        <Stack direction="row">
          <IconButton size="small" color="primary" onClick={() => handleOpenModal(params.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => { setSelectedId(params.row.id); setDeleteOpen(true); }}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a">{t('expensesPage.title')}</Typography>
          <Typography color="text.secondary">{t('expensesPage.subtitle')}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ borderRadius: 2, px: 3, py: 1.5, fontWeight: 700 }}>
          {t('expensesPage.recordExpense')}
        </Button>
      </Stack>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}><StatCard icon={<AccountBalanceWallet color="error" />} label={t('expensesPage.totalOutflow')} value={`₹${stats.total.toLocaleString()}`} color="#ef4444" /></Grid>
        <Grid item xs={12} md={4}><StatCard icon={<ReceiptLong color="primary" />} label={t('expensesPage.totalRecords')} value={stats.count} color="#3b82f6" /></Grid>
        <Grid item xs={12} md={4}><StatCard icon={<PieChart color="warning" />} label={t('expensesPage.highestSingle')} value={`₹${stats.highest.toLocaleString()}`} color="#f59e0b" /></Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box sx={{ height: 600, width: '100%', bgcolor: 'white' }}>
          <DataGrid
            rows={expenses}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            slots={{ toolbar: () => (
              <GridToolbarContainer sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
                <GridToolbarQuickFilter sx={{ width: 300 }} placeholder={t('expensesPage.searchPlaceholder')} />
              </GridToolbarContainer>
            )}}
            sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc' } }}
          />
        </Box>
      </Paper>

      {/* Record/Edit Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{isEditing ? t('expensesPage.editExpense') : t('expensesPage.newExpense')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField select label={t('expensesPage.category')} fullWidth value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
              {EXPENSE_CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </TextField>
            <TextField 
              label={t('expensesPage.amount')} type="number" fullWidth 
              value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
            <TextField label={t('expensesPage.date')} type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            <TextField label={t('expensesPage.notes')} multiline rows={3} fullWidth value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : t('expensesPage.saveRecord')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t('expensesPage.deleteTitle')}</DialogTitle>
        <DialogContent><DialogContentText>{t('expensesPage.deleteText')}</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={submitting}>{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ bgcolor: `${color}15`, p: 2, borderRadius: 3, display: 'flex' }}>{icon}</Box>
      <Box><Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography><Typography variant="h5" fontWeight={900}>{value}</Typography></Box>
    </CardContent>
  </Card>
);

export default Expenses;