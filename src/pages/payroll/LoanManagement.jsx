import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Tabs, Tab, Stack, Skeleton, Alert, Snackbar
} from '@mui/material';
import { Add as AddIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { createStaffLoan, getLoanSchedule, approveLoan, rejectLoan, getEmployeeLoans } from '../../services/api';

const LOAN_TYPES = ['SALARY_ADVANCE', 'EMERGENCY_LOAN', 'EQUIPMENT_LOAN', 'PERSONAL_LOAN'];
const LOAN_STATUSES = ['ACTIVE', 'CLOSED', 'DEFAULTED', 'WRITTEN_OFF'];

function TabPanel(props) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function LoanManagement() {
  const [tab, setTab] = useState(0);
  const [loans, setLoans] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [loanSchedule, setLoanSchedule] = useState([]);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [approvalDialog, setApprovalDialog] = useState({ open: false, loanId: null, action: null, reason: '' });

  React.useEffect(() => {
    loadActiveLoans();
    loadPendingLoans();
  }, []);

  const loadActiveLoans = async () => {
    try {
      setLoading(true);
      const data = await getEmployeeLoans(undefined, 0, 50);
      const active = (data?.content || data || []).filter(l => l.status === 'ACTIVE');
      setLoans(active);
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to load active loans',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Loan form state
  const [loanForm, setLoanForm] = useState({
    employeeId: '',
    loanType: 'SALARY_ADVANCE',
    principalAmount: '',
    interestRateAnnual: '0',
    tenureMonths: '1',
    disbursementDate: new Date().toISOString().split('T')[0],
    recoveryStartMonth: 'January',
  });

  const handleOpenLoanDialog = () => {
    setLoanForm({
      employeeId: '',
      loanType: 'SALARY_ADVANCE',
      principalAmount: '',
      interestRateAnnual: '0',
      tenureMonths: '1',
      disbursementDate: new Date().toISOString().split('T')[0],
      recoveryStartMonth: 'January',
    });
    setOpenLoanDialog(true);
  };

  const handleCreateLoan = async () => {
    if (!loanForm.employeeId || !loanForm.principalAmount) {
      setToast({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      const payload = {
        loanType: loanForm.loanType,
        principalAmount: parseFloat(loanForm.principalAmount),
        interestRateAnnual: parseFloat(loanForm.interestRateAnnual) || 0,
        tenureMonths: parseInt(loanForm.tenureMonths),
        monthlyEMI: 0, // Will be calculated by backend
        disbursementDate: loanForm.disbursementDate,
        recoveryStartMonth: loanForm.recoveryStartMonth,
      };

      const createdLoan = await createStaffLoan(loanForm.employeeId, payload);
      setToast({ open: true, message: 'Loan created successfully', severity: 'success' });
      setOpenLoanDialog(false);
      // TODO: Reload loans list
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to create loan',
        severity: 'error'
      });
    }
  };

  const handleViewSchedule = async (loanId) => {
    try {
      setScheduleLoading(true);
      const schedule = await getLoanSchedule(loanId);
      setLoanSchedule(schedule);
      setSelectedLoan(loanId);
      setTab(2);
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to load loan schedule',
        severity: 'error'
      });
    } finally {
      setScheduleLoading(false);
    }
  };

  const loadPendingLoans = async () => {
    try {
      setLoading(true);
      const data = await getEmployeeLoans(undefined, 0, 50);
      const pending = (data?.content || data || []).filter(l => l.status === 'PENDING');
      setPendingLoans(pending);
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to load pending loans',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLoan = async (loanId) => {
    try {
      await approveLoan(loanId);
      setToast({ open: true, message: 'Loan approved successfully', severity: 'success' });
      setApprovalDialog({ open: false, loanId: null, action: null, reason: '' });
      loadPendingLoans();
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to approve loan',
        severity: 'error'
      });
    }
  };

  const handleRejectLoan = async (loanId, reason) => {
    if (!reason) {
      setToast({ open: true, message: 'Please provide a reason', severity: 'error' });
      return;
    }
    try {
      await rejectLoan(loanId, reason);
      setToast({ open: true, message: 'Loan rejected successfully', severity: 'success' });
      setApprovalDialog({ open: false, loanId: null, action: null, reason: '' });
      loadPendingLoans();
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to reject loan',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'success',
      CLOSED: 'default',
      DEFAULTED: 'error',
      WRITTEN_OFF: 'warning',
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <h2>Loan Management</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenLoanDialog}
        >
          Create Loan
        </Button>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Active Loans" />
          <Tab label="Pending Approvals" />
          <Tab label="Repayment Schedule" />
          <Tab label="Loan History" />
        </Tabs>
      </Box>

      {/* Tab 1: Active Loans */}
      <TabPanel value={tab} index={0}>
        {loading ? (
          <Box>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} height={100} sx={{ mb: 2 }} />
            ))}
          </Box>
        ) : loans.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Loan #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Principal</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Monthly EMI</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map(loan => (
                  <TableRow key={loan.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{loan.loanNumber}</TableCell>
                    <TableCell>{loan.employeeName}</TableCell>
                    <TableCell>
                      <Chip size="small" label={loan.loanType} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">₹{loan.principalAmount.toLocaleString()}</TableCell>
                    <TableCell align="right">₹{loan.monthlyEMI.toLocaleString()}</TableCell>
                    <TableCell align="right">₹{loan.remainingBalance.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={loan.status}
                        color={getStatusColor(loan.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleViewSchedule(loan.id)}
                      >
                        View Schedule
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No active loans</Alert>
        )}
      </TabPanel>

      {/* Tab 2: Pending Loan Approvals (NEW) */}
      <TabPanel value={tab} index={1}>
        {loading ? (
          <Box>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} height={100} sx={{ mb: 2 }} />
            ))}
          </Box>
        ) : pendingLoans.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Tenure</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Request Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingLoans.map(loan => (
                  <TableRow key={loan.id} hover>
                    <TableCell>{loan.employeeName}</TableCell>
                    <TableCell>
                      <Chip size="small" label={loan.loanType} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">₹{loan.principalAmount.toLocaleString()}</TableCell>
                    <TableCell align="right">{loan.durationMonths} months</TableCell>
                    <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => setApprovalDialog({ open: true, loanId: loan.id, action: 'APPROVE', reason: '' })}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => setApprovalDialog({ open: true, loanId: loan.id, action: 'REJECT', reason: '' })}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No pending loan approvals</Alert>
        )}
      </TabPanel>

      {/* Tab 3: Repayment Schedule */}
      <TabPanel value={tab} index={2}>
        {scheduleLoading ? (
          <Box>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} height={50} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : loanSchedule.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Installment</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Principal</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Interest</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total EMI</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loanSchedule.map((rep, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{rep.installmentNumber}</TableCell>
                    <TableCell>{new Date(rep.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">₹{rep.principalAmount.toLocaleString()}</TableCell>
                    <TableCell align="right">₹{rep.interestAmount.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{rep.totalEMI.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={rep.paymentStatus}
                        color={rep.paymentStatus === 'PAID' ? 'success' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">Select a loan to view its repayment schedule</Alert>
        )}
      </TabPanel>

      {/* Tab 4: Loan History */}
      <TabPanel value={tab} index={3}>
        <Alert severity="info">Loan history view coming in Phase 2</Alert>
      </TabPanel>

      {/* Create Loan Dialog */}
      <Dialog open={openLoanDialog} onClose={() => setOpenLoanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Staff Loan</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  type="number"
                  value={loanForm.employeeId}
                  onChange={(e) => setLoanForm({ ...loanForm, employeeId: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Loan Type"
                  value={loanForm.loanType}
                  onChange={(e) => setLoanForm({ ...loanForm, loanType: e.target.value })}
                >
                  {LOAN_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Principal Amount (₹)"
                  type="number"
                  value={loanForm.principalAmount}
                  onChange={(e) => setLoanForm({ ...loanForm, principalAmount: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Annual Interest Rate (%)"
                  type="number"
                  value={loanForm.interestRateAnnual}
                  onChange={(e) => setLoanForm({ ...loanForm, interestRateAnnual: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tenure (Months)"
                  type="number"
                  value={loanForm.tenureMonths}
                  onChange={(e) => setLoanForm({ ...loanForm, tenureMonths: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Disbursement Date"
                  type="date"
                  value={loanForm.disbursementDate}
                  onChange={(e) => setLoanForm({ ...loanForm, disbursementDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Recovery Start Month"
                  value={loanForm.recoveryStartMonth}
                  onChange={(e) => setLoanForm({ ...loanForm, recoveryStartMonth: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoanDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateLoan}>Create Loan</Button>
        </DialogActions>
      </Dialog>

      {/* Loan Approval Dialog */}
      <Dialog open={approvalDialog.open} onClose={() => setApprovalDialog({ open: false, loanId: null, action: null, reason: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalDialog.action === 'APPROVE' ? 'Approve Loan Request' : 'Reject Loan Request'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {approvalDialog.action === 'REJECT' && (
            <TextField
              label="Rejection Reason"
              multiline
              rows={3}
              value={approvalDialog.reason}
              onChange={(e) => setApprovalDialog({ ...approvalDialog, reason: e.target.value })}
              placeholder="Provide reason for rejection"
              fullWidth
            />
          )}
          {approvalDialog.action === 'APPROVE' && (
            <Box>Are you sure you want to approve this loan request?</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog({ open: false, loanId: null, action: null, reason: '' })}>Cancel</Button>
          <Button
            variant="contained"
            color={approvalDialog.action === 'APPROVE' ? 'success' : 'error'}
            onClick={() => {
              if (approvalDialog.action === 'APPROVE') {
                handleApproveLoan(approvalDialog.loanId);
              } else {
                handleRejectLoan(approvalDialog.loanId, approvalDialog.reason);
              }
            }}
          >
            {approvalDialog.action === 'APPROVE' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}