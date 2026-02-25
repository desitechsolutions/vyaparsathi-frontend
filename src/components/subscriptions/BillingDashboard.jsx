'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Paper, Grid, Chip, Button, 
  Divider, Stack, LinearProgress, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Alert, AlertTitle, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Tooltip, Skeleton, Avatar
} from '@mui/material';
import { 
  History, CreditCard, EventRepeat, CancelOutlined, 
  CheckCircle, PendingActions, WarningAmber, GetApp,
  ArrowForwardIos, InfoOutlined, AccountBalanceWallet,
  AutoAwesome, VerifiedUser, Security
} from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSubscription } from '../../context/SubscriptionContext';
import { fetchMyPaymentHistory, cancelSubscription } from '../../services/api';

const BillingDashboard = () => {
  const { subscription, getStatus, getDaysRemaining, getCurrentCycle, loading: subLoading, refreshStatus } = useSubscription();
  const navigate = useNavigate();
  
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [fetchingPayments, setFetchingPayments] = useState(true);

  const status = getStatus();
  const daysRemaining = getDaysRemaining();
  const cycle = getCurrentCycle();

    useEffect(() => {
    const loadPayments = async () => {
        try {
        const data = await fetchMyPaymentHistory();
        setPayments(data);
        } catch (err) {
        console.error("Failed to fetch payments", err);
        } finally {
        setFetchingPayments(false);
        }
    };
    loadPayments();
    }, []);

    const handleCancelConfirm = async () => {
        try {
            await cancelSubscription();
            setCancelModalOpen(false);
            await refreshStatus(); 
        } catch (err) {
            console.error("Cancellation error:", err);
            alert("Failed to cancel subscription. Please contact support.");
        }
    };

  const getStatusColor = (s) => {
  const colors = {
    'ACTIVE': 'success',
    'TRIAL': 'info',
    'PENDING': 'warning', 
    'WAITING': 'warning',
    'EXPIRED': 'error',
    'APPROVED': 'success',
    'REJECTED': 'error'  
  };
    return colors[s] || 'default';
    };

    const calculateProgress = () => {
    if (status === 'TRIAL') return Math.max(0, (daysRemaining / 14) * 100);
    const cycleType = subscription?.billingCycle || cycle; 
    const totalDays = cycleType === 'YEARLY' ? 365 : 30;
    return Math.max(0, (daysRemaining / totalDays) * 100);
    };

  if (subLoading) return (
    <Container sx={{ py: 6 }}>
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} /></Grid>
            <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} /></Grid>
        </Grid>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* HEADER SECTION */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ color: '#1E293B', letterSpacing: '-0.02em' }}>
            Billing & Subscription
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your plan, billing history, and payment methods.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <Button 
                variant="contained" 
                startIcon={<AutoAwesome />} 
                onClick={() => navigate('/pricing')}
                sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', px: 3, bgcolor: '#2563EB', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
            >
                Upgrade Plan
            </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* LEFT COLUMN: Main Plan Card */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* 1. PLAN STATUS CARD */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid #E2E8F0', bgcolor: '#FFF', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2 }}>
                 <Chip 
                    icon={<CheckCircleIcon />}
                    label={status} 
                    color={getStatusColor(status)} 
                    sx={{ fontWeight: 900, borderRadius: '8px', px: 1 }} 
                    variant="outlined"
                 />
              </Box>

              <Typography variant="overline" color="primary" fontWeight={800} sx={{ letterSpacing: 1.2 }}>Current Plan</Typography>
              <Typography variant="h5" fontWeight={900} sx={{ mb: 3 }}>{subscription?.tier || 'FREE'} Tier</Typography>

              <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" mb={1.5}>
                  <Typography variant="body2" fontWeight={700} color="#475569">Usage Progress</Typography>
                  <Typography variant="body2" fontWeight={800} color="primary">{daysRemaining} days remaining</Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgress()} 
                  sx={{ height: 10, borderRadius: 5, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { borderRadius: 5 } }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: '#F0F7FF', color: '#2563EB' }}><EventRepeat /></Avatar>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>BILLING CYCLE</Typography>
                       <Typography variant="body2" fontWeight={800}>
                        {subscription?.billingCycle || 'MONTHLY'}
                        </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: '#F0F7FF', color: '#2563EB' }}><AccountBalanceWallet /></Avatar>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>RENEWAL AMOUNT</Typography>
                        <Typography variant="body2" fontWeight={800}>₹{subscription?.amount || 0}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

              <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                <Button 
                    variant="outlined"
                    onClick={() => navigate('/pricing')}
                    sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', px: 3 }}
                >
                    Change Plan
                </Button>
                {status !== 'FREE' && (
                    <Button 
                        color="error"
                        size="small"
                        startIcon={<CancelOutlined />}
                        onClick={() => setCancelModalOpen(true)}
                        sx={{ fontWeight: 700, textTransform: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}
                    >
                        Cancel Subscription
                    </Button>
                )}
              </Stack>
            </Paper>

            {/* 2. PAYMENT METHOD CARD */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security fontSize="small" color="primary" /> Default Payment Method
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ p: 1, bgcolor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex' }}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" width="40" />
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={800}>Manual UPI Transfer</Typography>
                            <Typography variant="caption" color="text.secondary">Verification via 12-digit UTR</Typography>
                        </Box>
                    </Stack>
                    <Chip label="PRIMARY" size="small" sx={{ fontWeight: 900, fontSize: '0.6rem', bgcolor: '#E2E8F0' }} />
                </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: Summary & Support */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* STATUS ALERT */}
            {status === 'EXPIRED' && (
              <Alert severity="error" variant="filled" sx={{ borderRadius: '16px' }}>
                <AlertTitle sx={{ fontWeight: 800 }}>Subscription Expired</AlertTitle>
                Premium features are locked. Please renew to continue.
              </Alert>
            )}

            {status === 'TRIAL' && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', bgcolor: '#1E293B', color: '#FFF' }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#FCD34D', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesome fontSize="small" /> Trial Period
                </Typography>
                <Typography variant="body2" sx={{ my: 1.5, opacity: 0.9 }}>
                    You have <strong>{daysRemaining} days</strong> left in your trial. Upgrade now to avoid data access issues.
                </Typography>
                <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => navigate('/pricing')}
                    sx={{ bgcolor: '#FFF', color: '#1E293B', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#F1F5F9' } }}
                >
                    Upgrade to Pro
                </Button>
              </Paper>
            )}

            <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoOutlined fontSize="small" color="primary" /> Billing Information
              </Typography>
              <Stack spacing={2}>
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>LAST VERIFIED UTR</Typography>
                    <Typography variant="body2" fontWeight={700}>{payments[0]?.utrNumber || 'N/A'}</Typography>
                </Box>
                <Divider />
                {status === 'PENDING' && (
                <Alert severity="warning" variant="outlined" sx={{ borderRadius: '16px', mb: 2, bgcolor: '#FFFBEB' }}>
                    <AlertTitle sx={{ fontWeight: 800 }}>Payment Verification Pending</AlertTitle>
                    Our team is verifying your UTR <strong>{subscription?.lastUtr}</strong>. This usually takes 2-4 hours.
                </Alert>
                )}
                <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.5 }}>
                    Need help with a payment? Contact our support team with your UTR number for manual resolution.
                </Typography>
                <Button fullWidth variant="outlined" sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}>
                    Contact Support
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* BOTTOM: History Table */}
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2, px: 1, color: '#1E293B' }}>Transaction History</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#64748B' }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#64748B' }}>PLAN</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#64748B' }}>UTR NUMBER</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#64748B' }}>AMOUNT</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#64748B' }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#64748B' }}>INVOICE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fetchingPayments ? (
                    [...Array(3)].map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={6}><Skeleton animation="wave" height={40} /></TableCell></TableRow>
                    ))
                ) : payments.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                            <History sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                            <Typography color="text.secondary" fontWeight={600}>No transaction records found.</Typography>
                        </TableCell>
                    </TableRow>
                ) : payments.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700 }}>
                        {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                        <Chip label={row.planRequested} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: '4px' }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#475569' }}>{row.utrNumber}</TableCell>
                    <TableCell sx={{ fontWeight: 900, color: '#1E293B' }}>₹{row.amount}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.status} 
                        size="small" 
                        color={getStatusColor(row.status)}
                        sx={{ fontWeight: 900, fontSize: '0.65rem' }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Download PDF">
                        <span>
                            <IconButton 
                                size="small" 
                                color="primary" 
                                disabled={row.status !== 'APPROVED'} 
                                /**onClick={() => handleDownloadInvoice(row.id)}**/
                                >
                                <GetApp />
                            </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* CANCELLATION MODAL */}
      <Dialog 
        open={cancelModalOpen} 
        onClose={() => setCancelModalOpen(false)}
        PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: '400px' } }}
      >
        <Box sx={{ textAlign: 'center', pt: 3 }}>
            <CancelOutlined color="error" sx={{ fontSize: 60, opacity: 0.2 }} />
        </Box>
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.4rem', textAlign: 'center' }}>Cancel Subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', textAlign: 'center', fontWeight: 500 }}>
            You will lose access to premium features like advanced reports and bulk exports once your current period ends in <strong>{daysRemaining} days</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 1 }}>
          <Button 
            fullWidth
            variant="contained"
            onClick={() => setCancelModalOpen(false)} 
            sx={{ fontWeight: 800, borderRadius: '12px', py: 1.5, bgcolor: '#1E293B' }}
          >
            Keep Premium
          </Button>
         <Button 
            fullWidth
            color="error" 
            onClick={handleCancelConfirm}
            sx={{ fontWeight: 700, textTransform: 'none' }}
            >
            Confirm Cancellation
        </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BillingDashboard;