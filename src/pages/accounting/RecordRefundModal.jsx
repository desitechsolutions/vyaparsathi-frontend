import React, { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Alert, Stack, Typography, Chip, CircularProgress,
} from '@mui/material';
import { refundCreditNote } from '../../services/api';

const PAYMENT_MODES = [
  { value: 'CASH',   label: 'Cash' },
  { value: 'BANK',   label: 'Bank transfer / NEFT / IMPS' },
  { value: 'UPI',    label: 'UPI' },
  { value: 'CHEQUE', label: 'Cheque' },
];

const formatInr = (v) =>
  Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/**
 * Record a cash / bank refund payout for the remaining credit balance.
 * Once submitted, the credit note is marked as {@code refunded=true} and
 * cannot receive further allocations.
 *
 * Props: open, onClose, onRefunded, creditNote (with remaining balance).
 */
export default function RecordRefundModal({ open, onClose, onRefunded, creditNote }) {
  const remaining = useMemo(() => {
    if (!creditNote) return 0;
    return Math.max(Number(creditNote.totalAmount || 0) - Number(creditNote.appliedAmount || 0), 0);
  }, [creditNote]);

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('BANK');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (open) {
      setAmount(String(remaining || ''));
      setMode('BANK'); setReference(''); setNote(''); setError(null);
    }
  }, [open, remaining]);

  const nAmount = Number(amount);
  const invalid = !amount || isNaN(nAmount) || nAmount <= 0 || nAmount > remaining;

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await refundCreditNote(creditNote.id, nAmount, mode, reference?.trim() || null,
        note?.trim() || null);
      onRefunded && onRefunded();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || 'Refund recording failed');
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={800}>Record refund</Typography>
          <Chip size="small" label={`Remaining: INR ${formatInr(remaining)}`}
            color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
        </Stack>
        {creditNote?.customer?.name && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Refunding <strong>{creditNote.customer.name}</strong> against Credit Note{' '}
            <strong>{creditNote.creditNoteNo}</strong>. Once recorded, this credit
            cannot be applied to further invoices.
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField required label="Refund amount" type="number" size="small"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            InputProps={{ startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>INR</Typography> }}
            helperText={`Max INR ${formatInr(remaining)}`}
            error={amount && invalid} />
          <TextField select required label="Payment mode" size="small"
            value={mode} onChange={(e) => setMode(e.target.value)}>
            {PAYMENT_MODES.map((m) => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </TextField>
          <TextField label="Reference #" size="small"
            value={reference} onChange={(e) => setReference(e.target.value)}
            helperText="UTR / cheque no / UPI ref — optional but strongly recommended" />
          <TextField label="Internal note" size="small" multiline minRows={2}
            value={note} onChange={(e) => setNote(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={submit}
          disabled={invalid || busy}>
          {busy ? <CircularProgress size={18} /> : 'Record refund'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
