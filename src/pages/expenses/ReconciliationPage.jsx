import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useExpenseAnalytics } from '../../hooks/useExpenseAnalytics';
import { useExpenses } from '../../hooks/useExpenses';

const ReconciliationPage = () => {
  const { reconciliationSummary, loading, error, fetchReconciliationSummary } = useExpenseAnalytics();
  const { expenses } = useExpenses();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });
  const [selectedTab, setSelectedTab] = useState(0); // 0: Summary, 1: Unmatched, 2: Reimbursed
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [reimbursementDetails, setReimbursementDetails] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
  });

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchReconciliationSummary(dateRange.start, dateRange.end);
    }
  }, [dateRange]);

  const handleMarkReimbursed = (expense) => {
    setSelectedExpense(expense);
    setReimbursementDetails({
      amount: expense.amount || '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
    });
    setShowMarkDialog(true);
  };

  const handleConfirmReimbursement = async () => {
    // API call to mark as reimbursed
    console.log('Marking as reimbursed:', selectedExpense, reimbursementDetails);
    setShowMarkDialog(false);
  };

  const unmatchedColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => `₹${params.value.toLocaleString('en-IN')}`,
    },
    { field: 'category', headerName: 'Category', width: 130 },
    {
      field: 'expenseDate',
      headerName: 'Date',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('en-IN'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={params.value === 'APPROVED' ? 'success' : 'warning'} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button size="small" variant="contained" onClick={() => handleMarkReimbursed(params.row)}>
          Mark Reimbursed
        </Button>
      ),
    },
  ];

  const reimbursedColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => `₹${params.value.toLocaleString('en-IN')}`,
    },
    {
      field: 'reimbursedDate',
      headerName: 'Reimbursed On',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString('en-IN'),
    },
    {
      field: 'reimbursementReference',
      headerName: 'Reference',
      width: 150,
    },
    {
      field: 'bankName',
      headerName: 'Bank/Account',
      width: 150,
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
    return <Alert severity="error">Error loading reconciliation: {error}</Alert>;
  }

  const unmatchedExpenses = expenses?.filter((e) => e.status === 'APPROVED' && !e.reimbursedDate) || [];
  const reimbursedExpenses = expenses?.filter((e) => e.reimbursedDate) || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Reconciliation
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Reconcile expenses with bank transactions
        </Typography>
      </Box>

      {/* Date Range Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {reconciliationSummary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon sx={{ color: 'orange' }} />
                  <Typography variant="caption" color="textSecondary">
                    Unmatched Expenses
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  ₹{reconciliationSummary.unmatchedAmount || 0}
                </Typography>
                <Typography variant="caption">
                  {reconciliationSummary.unmatchedCount || 0} expenses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon sx={{ color: 'green' }} />
                  <Typography variant="caption" color="textSecondary">
                    Reimbursed
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  ₹{reconciliationSummary.reimbursedAmount || 0}
                </Typography>
                <Typography variant="caption">
                  {reconciliationSummary.reimbursedCount || 0} expenses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="textSecondary">
                  Total Approved
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  ₹{reconciliationSummary.totalApproved || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="textSecondary">
                  Reconciliation Rate
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {reconciliationSummary.reconciliationRate || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Summary" />
            <Tab label={`Unmatched (${unmatchedExpenses.length})`} />
            <Tab label={`Reimbursed (${reimbursedExpenses.length})`} />
          </Tabs>
        </Box>

        {/* Summary Tab */}
        {selectedTab === 0 && (
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  {unmatchedExpenses.length > 0
                    ? `${unmatchedExpenses.length} expenses are approved but not yet reimbursed. Click on an expense to mark it as reimbursed.`
                    : 'All approved expenses have been reconciled!'}
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Reconciliation Steps
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
                    <Typography variant="body2">Review approved expenses waiting for reimbursement</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
                    <Typography variant="body2">Match with bank transactions</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
                    <Typography variant="body2">Mark as reimbursed with bank details</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
                    <Typography variant="body2">View reconciliation report</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Unmatched Tab */}
        {selectedTab === 1 && (
          <Box sx={{ height: 400, p: 2 }}>
            {unmatchedExpenses.length > 0 ? (
              <DataGrid
                rows={unmatchedExpenses}
                columns={unmatchedColumns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
              />
            ) : (
              <Alert severity="success">All expenses have been reimbursed!</Alert>
            )}
          </Box>
        )}

        {/* Reimbursed Tab */}
        {selectedTab === 2 && (
          <Box sx={{ height: 400, p: 2 }}>
            {reimbursedExpenses.length > 0 ? (
              <DataGrid
                rows={reimbursedExpenses}
                columns={reimbursedColumns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
              />
            ) : (
              <Alert severity="info">No reimbursed expenses yet</Alert>
            )}
          </Box>
        )}
      </Card>

      {/* Mark as Reimbursed Dialog */}
      <Dialog open={showMarkDialog} onClose={() => setShowMarkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark as Reimbursed</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Amount
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ₹{reimbursementDetails.amount}
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Reimbursement Date"
              type="date"
              value={reimbursementDetails.date}
              onChange={(e) => setReimbursementDetails({ ...reimbursementDetails, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Bank Reference / Transaction ID"
              placeholder="e.g., TXN123456"
              value={reimbursementDetails.reference}
              onChange={(e) => setReimbursementDetails({ ...reimbursementDetails, reference: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMarkDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmReimbursement}>
            Mark as Reimbursed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReconciliationPage;
