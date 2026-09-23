import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../../hooks/useExpenses';
import { useExpenseFilters } from '../../hooks/useExpenseFilters';
import { getExpenseCategoriesEnterprise } from '../../services/api';
import ExpenseFilters from '../../components/expenses/ExpenseFilters';
import ApprovalTimeline from '../../components/expenses/ApprovalTimeline';

const ExpensesList = () => {
  const navigate = useNavigate();
  const { expenses, loading, error, deleteExpense, pagination, fetchExpenses } = useExpenses();
  const { filters, updateFilter, clearFilters, setPage } = useExpenseFilters();
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  // EXP-9 fix: fetch real categories from the API instead of a static 4-item list
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getExpenseCategoriesEnterprise()
      .then((res) => setCategories(res.data || res || []))
      .catch(() => {}); // non-fatal — category column shows N/A on failure
  }, []);

  useEffect(() => {
    fetchExpenses(filters);
  }, [filters, fetchExpenses]);

  const handleDeleteClick = (expense) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(expense.id);
    }
  };

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setShowDetails(true);
  };

  const getStatusChipColor = (status) => {
    const colors = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      PENDING_APPROVAL: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      REIMBURSED: 'success',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      // EXP-10 fix: guard against null amount (crashes .toLocaleString on null)
      renderCell: (params) =>
        params.value != null
          ? `₹${Number(params.value).toLocaleString('en-IN')}`
          : '—',
    },
    {
      field: 'categoryId',
      headerName: 'Category',
      width: 130,
      renderCell: (params) => {
        const cat = categories.find((c) => c.id === params.value);
        return cat ? cat.name : 'N/A';
      },
    },
    {
      field: 'expenseDate',
      headerName: 'Date',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('en-IN'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusChipColor(params.value)} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => handleViewDetails(params.row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => navigate(`/expenses/edit/${params.row.id}`)}
            disabled={params.row.status !== 'DRAFT'}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            disabled={params.row.status !== 'DRAFT'}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading expenses: {error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          My Expenses
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/expenses/create')}>
          New Expense
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <ExpenseFilters
            filters={filters}
            onUpdateFilter={updateFilter}
            onClearFilters={clearFilters}
            categories={categories}
          />
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={expenses || []}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            pagination
            paginationModel={{
              pageSize: pagination?.size || 25,
              page: pagination?.page || 0,
            }}
            onPaginationModelChange={(newModel) => setPage(newModel.page)}
            loading={loading}
            disableSelectionOnClick
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e0' },
            }}
          />
        </Box>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Expense Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedExpense && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Description
                </Typography>
                <Typography variant="body2">{selectedExpense.description}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Amount
                </Typography>
                <Typography variant="body2">₹{selectedExpense.amount.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Date
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedExpense.expenseDate).toLocaleDateString('en-IN')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Status
                </Typography>
                <Chip label={selectedExpense.status} size="small" sx={{ mt: 0.5 }} />
              </Box>
              {selectedExpense.approvalTimeline && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                    Approval Timeline
                  </Typography>
                  <ApprovalTimeline timeline={selectedExpense.approvalTimeline} />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              navigate(`/expenses/edit/${selectedExpense.id}`);
              setShowDetails(false);
            }}
            disabled={selectedExpense?.status !== 'DRAFT'}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpensesList;
