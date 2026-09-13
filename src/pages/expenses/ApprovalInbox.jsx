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
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CallMadeIcon from '@mui/icons-material/CallMade';
import MessageIcon from '@mui/icons-material/Message';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useExpenseApprovals } from '../../hooks/useExpenseApprovals';
import ApprovalTimeline from '../../components/expenses/ApprovalTimeline';

const ApprovalInbox = () => {
  const {
    approvals,
    pendingCount,
    timeline,
    loading,
    error,
    fetchPendingApprovals,
    fetchPendingCount,
    approve,
    reject,
    escalate,
    fetchTimeline,
  } = useExpenseApprovals();

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'escalate'
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, escalated

  useEffect(() => {
    fetchPendingApprovals();
    fetchPendingCount();
  }, []);

  const handleViewDetails = async (expense) => {
    setSelectedExpense(expense);
    await fetchTimeline(expense.id);
    setShowDetails(true);
    setActionType(null);
    setComment('');
    setRejectionReason('');
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await approve(selectedExpense.id, comment);
      setShowDetails(false);
      setActionType(null);
      setComment('');
      await fetchPendingApprovals();
      await fetchPendingCount();
    } catch (err) {
      alert('Error approving expense: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await reject(selectedExpense.id, rejectionReason);
      setShowDetails(false);
      setActionType(null);
      setRejectionReason('');
      await fetchPendingApprovals();
      await fetchPendingCount();
    } catch (err) {
      alert('Error rejecting expense: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    try {
      setActionLoading(true);
      await escalate(selectedExpense.id, comment);
      setShowDetails(false);
      setActionType(null);
      setComment('');
      await fetchPendingApprovals();
    } catch (err) {
      alert('Error escalating expense: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING_APPROVAL: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      ESCALATED: 'info',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon sx={{ color: 'green' }} />;
      case 'REJECTED':
        return <CancelIcon sx={{ color: 'red' }} />;
      case 'ESCALATED':
        return <CallMadeIcon sx={{ color: 'blue' }} />;
      default:
        return <MessageIcon sx={{ color: 'orange' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredApprovals = approvals?.filter((approval) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return approval.status === 'PENDING_APPROVAL';
    if (filterStatus === 'escalated') return approval.status === 'ESCALATED';
    return true;
  }) || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Approval Inbox
          </Typography>
          <Chip
            label={`${pendingCount || 0} Pending`}
            color={pendingCount > 0 ? 'error' : 'default'}
            variant="outlined"
          />
        </Box>
        <Typography variant="body2" color="textSecondary">
          Review and approve pending expense claims
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filter Chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Chip
          label="All"
          onClick={() => setFilterStatus('all')}
          variant={filterStatus === 'all' ? 'filled' : 'outlined'}
          color={filterStatus === 'all' ? 'primary' : 'default'}
        />
        <Chip
          label="Pending"
          onClick={() => setFilterStatus('pending')}
          variant={filterStatus === 'pending' ? 'filled' : 'outlined'}
          color={filterStatus === 'pending' ? 'primary' : 'default'}
        />
        <Chip
          label="Escalated"
          onClick={() => setFilterStatus('escalated')}
          variant={filterStatus === 'escalated' ? 'filled' : 'outlined'}
          color={filterStatus === 'escalated' ? 'primary' : 'default'}
        />
      </Box>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <Alert severity="info">No approvals pending</Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredApprovals.map((approval) => (
            <Grid item xs={12} key={approval.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3 },
                  borderLeft: `4px solid ${getStatusColor(approval.status) === 'warning' ? '#ff9800' : '#4caf50'}`,
                }}
                onClick={() => handleViewDetails(approval)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getStatusIcon(approval.status)}
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Expense #{approval.expenseId}
                        </Typography>
                        <Chip label={approval.status} size="small" color={getStatusColor(approval.status)} />
                      </Box>

                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary">
                            Amount
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            ₹{approval.amount?.toLocaleString('en-IN') || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary">
                            Category
                          </Typography>
                          <Typography variant="body2">{approval.categoryName || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary">
                            Submitted By
                          </Typography>
                          <Typography variant="body2">{approval.employeeName || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary">
                            Submitted On
                          </Typography>
                          <Typography variant="body2">
                            {new Date(approval.submittedDate).toLocaleDateString('en-IN')}
                          </Typography>
                        </Grid>
                      </Grid>

                      {approval.description && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            Description
                          </Typography>
                          <Typography variant="body2">{approval.description}</Typography>
                        </Box>
                      )}
                    </Box>
                    <ExpandMoreIcon sx={{ ml: 2 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Modal */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Expense Approval</Typography>
            {selectedExpense && <Chip label={selectedExpense.status} size="small" />}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {selectedExpense && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Expense Details */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Expense Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ₹{selectedExpense.amount?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Category
                      </Typography>
                      <Typography variant="body2">{selectedExpense.categoryName}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Approval Timeline */}
              {timeline && timeline.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Approval Timeline
                  </Typography>
                  <ApprovalTimeline timeline={timeline} />
                </Box>
              )}

              {/* Action Section */}
              {!actionType && selectedExpense.status === 'PENDING_APPROVAL' && (
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setActionType('approve')}
                    startIcon={<CheckCircleIcon />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setActionType('reject')}
                    startIcon={<CancelIcon />}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={() => setActionType('escalate')}
                    startIcon={<CallMadeIcon />}
                  >
                    Escalate
                  </Button>
                </Box>
              )}

              {/* Approve Form */}
              {actionType === 'approve' && (
                <TextField
                  fullWidth
                  label="Approval Comment (Optional)"
                  placeholder="Add a comment"
                  multiline
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              )}

              {/* Reject Form */}
              {actionType === 'reject' && (
                <TextField
                  fullWidth
                  label="Rejection Reason"
                  placeholder="Why are you rejecting this expense?"
                  multiline
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  error={!rejectionReason && actionType === 'reject'}
                  helperText={!rejectionReason && actionType === 'reject' ? 'Reason is required' : ''}
                />
              )}

              {/* Escalate Form */}
              {actionType === 'escalate' && (
                <TextField
                  fullWidth
                  label="Escalation Comment"
                  placeholder="Why are you escalating this?"
                  multiline
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDetails(false)} disabled={actionLoading}>
            Close
          </Button>
          {actionType && (
            <>
              <Button onClick={() => setActionType(null)} disabled={actionLoading}>
                Cancel Action
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (actionType === 'approve') handleApprove();
                  else if (actionType === 'reject') handleReject();
                  else if (actionType === 'escalate') handleEscalate();
                }}
                disabled={
                  actionLoading || (actionType === 'reject' && !rejectionReason) || (actionType === 'escalate' && !comment)
                }
              >
                {actionLoading ? <CircularProgress size={20} /> : 'Confirm'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalInbox;
