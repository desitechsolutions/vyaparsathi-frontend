import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Button, Stack, TextField, MenuItem, CircularProgress, Alert,
  Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { ArrowBackIosNew, Lock, LockOpen } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { getPeriodLocks, lockPeriod, unlockPeriod } from '../../services/api';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 2, currentYear - 1, currentYear];

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PeriodLockManagement() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isOwner = user?.role === 'OWNER';

  const [year, setYear] = useState(currentYear);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [modal, setModal] = useState({ open: false, mode: null, period: null }); // mode: 'lock'|'unlock'
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPeriodLocks(year);
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load periods.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const openModal = (mode, period) => {
    setReason('');
    setSubmitError(null);
    setModal({ open: true, mode, period });
  };

  const closeModal = () => {
    if (submitting) return;
    setModal({ open: false, mode: null, period: null });
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setSubmitError('Reason is required.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { period } = modal;
      const payload = {
        year: period.year,
        month: period.month,
        formType: period.formType || 'ALL',
        reason: reason.trim(),
      };
      if (modal.mode === 'lock') {
        await lockPeriod(payload);
      } else {
        await unlockPeriod(payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const { period: mp } = modal;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 960, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
        <Button
          startIcon={<ArrowBackIosNew fontSize="small" />}
          onClick={() => navigate(-1)}
          size="small"
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          Back
        </Button>
      </Stack>

      <Typography variant="h5" fontWeight={800} mb={0.5}>
        Period Lock Management
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Lock a financial period to prevent back-dated entries. Only OWNER can unlock a locked period.
      </Typography>

      {/* Year selector */}
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <TextField
          select
          label="Financial Year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 160 }}
        >
          {YEAR_OPTIONS.map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" size="small" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Month</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Locked Date</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Locked By</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periods.map((p) => {
                const isLocked = p.status === 'LOCKED';
                return (
                  <TableRow key={p.month} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{MONTHS[p.month - 1]}</TableCell>
                    <TableCell>{String(p.month).padStart(2, '0')}/{p.year}</TableCell>
                    <TableCell>
                      <Chip
                        label={isLocked ? 'Locked' : 'Open'}
                        color={isLocked ? 'error' : 'success'}
                        size="small"
                        icon={isLocked ? <Lock fontSize="inherit" /> : <LockOpen fontSize="inherit" />}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(p.lockedAt)}</TableCell>
                    <TableCell>{p.lockedBy || '—'}</TableCell>
                    <TableCell>
                      {isLocked ? (
                        isOwner ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<LockOpen fontSize="small" />}
                            onClick={() => openModal('unlock', p)}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Unlock
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.disabled">Owner only</Typography>
                        )
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<Lock fontSize="small" />}
                          onClick={() => openModal('lock', p)}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Lock Period
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Lock / Unlock confirmation modal */}
      <Dialog open={modal.open} onClose={closeModal} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {modal.mode === 'lock' ? 'Lock Period' : 'Unlock Period'}
        </DialogTitle>
        <DialogContent>
          {mp && (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                {modal.mode === 'lock'
                  ? `Lock ${MONTHS[(mp.month || 1) - 1]} ${mp.year}? No new invoices, payments or adjustments can be posted into this period once locked.`
                  : `Unlock ${MONTHS[(mp.month || 1) - 1]} ${mp.year}? This will allow back-dated entries into a previously closed period.`
                }
              </DialogContentText>
              {modal.mode === 'unlock' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Unlocking is an audited action visible to all admins. Provide a clear justification.
                </Alert>
              )}
              <TextField
                label="Reason *"
                fullWidth
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                error={!!submitError && !reason.trim()}
                helperText={!reason.trim() && submitError ? submitError : ''}
                size="small"
                autoFocus
              />
              {submitError && reason.trim() && (
                <Alert severity="error" sx={{ mt: 1.5 }}>{submitError}</Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeModal} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={modal.mode === 'lock' ? 'error' : 'warning'}
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting
              ? 'Please wait…'
              : modal.mode === 'lock' ? 'Lock Period' : 'Unlock Period'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
