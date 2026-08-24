import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Button, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Alert, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Snackbar, Typography, Divider, IconButton, Tooltip, alpha,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  CloudDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  People as PeopleIcon,
  AccountBalance as GlIcon,
  Assignment as RunsIcon,
  RequestQuote as StructureIcon,
  EventBusy as LeaveIcon,
  Paid as LoanIcon,
  Policy as StatutoryIcon,
  AccountBalance as BankingIcon,
  ArrowForwardIos as ArrowIcon,
  TrendingUp as TrendIcon,
  PaidOutlined as DisburseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import * as api from '../../services/api';

const fmtRs = (val) => `₹${(Number(val) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const STATUS_COLORS = {
  DISBURSED: 'success',
  APPROVED: 'info',
  PENDING_APPROVAL: 'warning',
  PROCESSING: 'secondary',
  DRAFT: 'default',
  VOID: 'error',
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = 'primary', icon, highlight = false }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1.5px solid`,
        borderColor: highlight
          ? theme.palette[color]?.main || theme.palette.primary.main
          : theme.palette.divider,
        background: highlight
          ? alpha(theme.palette[color]?.main || theme.palette.primary.main, isDark ? 0.12 : 0.05)
          : 'background.paper',
        height: '100%',
        transition: 'box-shadow 200ms',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} color={highlight ? `${color}.main` : 'text.primary'} sx={{ mt: 0.5, lineHeight: 1.2 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {sub}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.7, mt: 0.5 }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Module Navigation Card ──────────────────────────────────────────────────
function ModuleCard({ title, description, path, icon, color = 'primary' }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Card
      elevation={0}
      onClick={() => navigate(path)}
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        cursor: 'pointer',
        transition: 'all 180ms ease',
        '&:hover': {
          borderColor: theme.palette[color]?.main || theme.palette.primary.main,
          background: alpha(theme.palette[color]?.main || theme.palette.primary.main, isDark ? 0.10 : 0.04),
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ color: `${color}.main`, display: 'flex', alignItems: 'center' }}>{icon}</Box>
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" fontWeight={700} noWrap>{title}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{description}</Typography>
          </Box>
          <ArrowIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function PayrollAdminDashboard() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [approvalDialog, setApprovalDialog] = useState({ open: false, run: null });

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const fetchPayrollRuns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.fetchPayrollRuns(0, 20);
      setRuns(response.content || response || []);
    } catch {
      showToast('Failed to load payroll runs', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayrollRuns(); }, [fetchPayrollRuns]);

  const confirmApproval = async () => {
    try {
      setLoading(true);
      await api.approvePayrollRun(approvalDialog.run.id);
      showToast('Payroll run approved successfully');
      setApprovalDialog({ open: false, run: null });
      fetchPayrollRuns();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async (run) => {
    try {
      setLoading(true);
      await api.disbursePayrollRun(run.id);
      showToast('Payroll disbursed successfully');
      fetchPayrollRuns();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to disburse', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePostToGL = async (runId) => {
    try {
      setLoading(true);
      await api.postPayrollToGL(runId);
      showToast('Payroll posted to General Ledger');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to post to GL', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Derived KPIs
  const pendingApproval = runs.filter(r => r.status === 'PENDING_APPROVAL');
  const thisMonthRun = runs[0] || null;
  const disbursedRuns = runs.filter(r => r.status === 'DISBURSED');
  const totalDisbursedYTD = disbursedRuns.reduce((sum, r) => sum + (Number(r.totalNetPayable) || 0), 0);
  const totalEmployees = thisMonthRun?.totalEmployees || 0;

  if (loading && runs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* ─── Header ─── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Payroll Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Manage payroll runs, employees, compliance and disbursals
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPayrollRuns} disabled={loading} size="small">
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/payroll/runs')} size="small">
            New Payroll Run
          </Button>
        </Stack>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
      </Snackbar>

      {/* ─── Pending Approval Alert ─── */}
      {pendingApproval.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button size="small" color="warning" variant="outlined" onClick={() => setApprovalDialog({ open: true, run: pendingApproval[0] })}>
              Review
            </Button>
          }
        >
          <strong>{pendingApproval.length} payroll run{pendingApproval.length > 1 ? 's' : ''} pending approval</strong>
          {pendingApproval[0] && ` — ${pendingApproval[0].payrollMonth} ${pendingApproval[0].payrollYear}`}
        </Alert>
      )}

      {/* ─── KPI Row ─── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Pending Approval"
            value={pendingApproval.length}
            sub={pendingApproval[0] ? `${pendingApproval[0].payrollMonth} ${pendingApproval[0].payrollYear}` : 'All clear'}
            color="warning"
            icon={<WarningIcon sx={{ fontSize: 32 }} />}
            highlight={pendingApproval.length > 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Latest Payroll"
            value={thisMonthRun ? fmtRs(thisMonthRun.totalNetPayable) : '—'}
            sub={thisMonthRun ? `${thisMonthRun.totalEmployees || 0} employees · ${thisMonthRun.payrollMonth} ${thisMonthRun.payrollYear}` : 'No runs yet'}
            color="primary"
            icon={<TrendIcon sx={{ fontSize: 32 }} />}
            highlight={!!thisMonthRun}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="YTD Disbursed"
            value={fmtRs(totalDisbursedYTD)}
            sub={`${disbursedRuns.length} completed run${disbursedRuns.length !== 1 ? 's' : ''}`}
            color="success"
            icon={<DisburseIcon sx={{ fontSize: 32 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Total Payroll Runs"
            value={runs.length}
            sub="This organization"
            color="info"
            icon={<RunsIcon sx={{ fontSize: 32 }} />}
          />
        </Grid>
      </Grid>

      {/* ─── Module Navigation Cards ─── */}
      <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.7rem' }}>
        Payroll Modules
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <ModuleCard title="Employees" description="Directory, on-boarding, status" path="/payroll/employees" icon={<PeopleIcon />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ModuleCard title="Salary Structures" description="Components, CTC breakdowns" path="/payroll/structures" icon={<StructureIcon />} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ModuleCard title="Leave Approvals" description="Pending leave requests" path="/payroll/leave-approvals" icon={<LeaveIcon />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ModuleCard title="Loan Management" description="Staff loans & repayment schedule" path="/payroll/loans" icon={<LoanIcon />} color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ModuleCard title="Statutory & Compliance" description="PF, ESIC, PT, TDS returns" path="/payroll/statutory" icon={<StatutoryIcon />} color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ModuleCard title="Banking Setup" description="Bank accounts, NEFT/NACH export" path="/payroll/banking" icon={<BankingIcon />} color="success" />
        </Grid>
      </Grid>

      {/* ─── Payroll Runs Table ─── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>All Payroll Runs</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => thisMonthRun && api.exportECRFile(thisMonthRun.id)}
          disabled={!thisMonthRun}
        >
          Export ECR (EPFO)
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Run Number</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Period</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }} align="center">Employees</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }} align="right">Gross</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }} align="right">Net Payable</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  <Stack spacing={1} alignItems="center">
                    <RunsIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                    <Typography variant="body2">No payroll runs yet. Create your first run above.</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
            {runs.map(run => (
              <TableRow key={run.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'text.secondary' }}>{run.runNumber}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{run.payrollMonth} {run.payrollYear}</TableCell>
                <TableCell align="center">{run.totalEmployees || 0}</TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary' }}>{fmtRs(run.totalGrossEarnings)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtRs(run.totalNetPayable)}</TableCell>
                <TableCell>
                  <Chip
                    label={run.status?.replace(/_/g, ' ')}
                    color={STATUS_COLORS[run.status] || 'default'}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    {run.status === 'PENDING_APPROVAL' && (
                      <Button size="small" variant="contained" color="warning" startIcon={<ApproveIcon sx={{ fontSize: 14 }} />}
                        onClick={() => setApprovalDialog({ open: true, run })} sx={{ fontSize: '0.72rem', py: 0.25 }}>
                        Approve
                      </Button>
                    )}
                    {run.status === 'APPROVED' && (
                      <Button size="small" variant="contained" color="success"
                        onClick={() => handleDisburse(run)} sx={{ fontSize: '0.72rem', py: 0.25 }}>
                        Disburse
                      </Button>
                    )}
                    {run.status === 'DISBURSED' && (
                      <Tooltip title="Post to General Ledger">
                        <IconButton size="small" color="primary" onClick={() => handlePostToGL(run.id)}>
                          <GlIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Button size="small" variant="outlined" sx={{ fontSize: '0.72rem', py: 0.25 }}
                      onClick={() => navigate('/payroll/runs')}>
                      View
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Approval Confirmation Dialog ─── */}
      <Dialog open={approvalDialog.open} onClose={() => setApprovalDialog({ open: false, run: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Approve Payroll Run</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          {approvalDialog.run && (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Once approved, payroll moves to disbursal stage and cannot be rolled back.
              </Alert>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1.5}>
                  {[
                    ['Run Number', approvalDialog.run.runNumber],
                    ['Period', `${approvalDialog.run.payrollMonth} ${approvalDialog.run.payrollYear}`],
                    ['Employees', approvalDialog.run.totalEmployees],
                    ['Total Gross', fmtRs(approvalDialog.run.totalGrossEarnings)],
                    ['Total Net', fmtRs(approvalDialog.run.totalNetPayable)],
                    ['Employer Contribution', fmtRs(approvalDialog.run.totalEmployerContributions)],
                  ].map(([label, value]) => (
                    <Stack key={label} direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{value}</Typography>
                    </Stack>
                  ))}
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={700}>Total Company Cost</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {fmtRs((Number(approvalDialog.run.totalNetPayable) || 0) + (Number(approvalDialog.run.totalEmployerContributions) || 0))}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApprovalDialog({ open: false, run: null })} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={confirmApproval} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <ApproveIcon />}>
            {loading ? 'Approving…' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
