import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Alert,
  Typography, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Chip, CircularProgress, Box,
} from '@mui/material';
import { allocateCreditToInvoice, fetchCustomerDues } from '../../services/api';

const formatInr = (v) =>
  Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/**
 * Zoho-style "Apply to Invoices" modal. Fetches every unpaid sale for the
 * customer and lets the user split the remaining credit across one or more
 * of them. Total row confirms the split never exceeds the remaining balance.
 *
 * Props:
 *   open, onClose, onApplied
 *   creditNote: { id, customer: { id, name }, appliedAmount, totalAmount, outstanding }
 */
export default function ApplyCreditModal({ open, onClose, onApplied, creditNote }) {
  const [dues, setDues] = useState([]);
  const [amounts, setAmounts] = useState({});      // { saleId: amount }
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remaining = useMemo(() => {
    if (!creditNote) return 0;
    const t = Number(creditNote.totalAmount || 0);
    const a = Number(creditNote.appliedAmount || 0);
    return Math.max(t - a, 0);
  }, [creditNote]);

  const totalToAllocate = useMemo(() =>
    Object.values(amounts).reduce((s, v) => s + (Number(v) || 0), 0),
    [amounts]);

  const load = useCallback(async () => {
    if (!creditNote?.customer?.id) return;
    setLoading(true); setError(null);
    try {
      const res = await fetchCustomerDues(creditNote.customer.id);
      const list = (res?.data ?? res ?? []).filter((s) =>
        Number(s.dueAmount || s.remaining || 0) > 0
      );
      setDues(list);
      setAmounts({});
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load unpaid invoices for this customer.');
    } finally {
      setLoading(false);
    }
  }, [creditNote]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const setAmount = (saleId, value, dueAmount) => {
    const n = Number(value);
    const capped = Math.max(0, Math.min(isNaN(n) ? 0 : n, Number(dueAmount) || 0));
    setAmounts((prev) => ({ ...prev, [saleId]: capped }));
  };

  const canSubmit = totalToAllocate > 0 && totalToAllocate <= remaining && !busy;

  const submit = async () => {
    setBusy(true);
    try {
      const entries = Object.entries(amounts).filter(([, v]) => Number(v) > 0);
      for (const [saleId, amount] of entries) {
        await allocateCreditToInvoice(creditNote.id, Number(saleId), Number(amount),
          'Applied via credit-allocation modal');
      }
      onApplied && onApplied();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || 'Allocation failed');
    } finally {
      setBusy(false);
    }
  };

  const excess = totalToAllocate > remaining;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={800}>
            Apply credit to invoices
          </Typography>
          {creditNote && (
            <Chip size="small" label={`Remaining: INR ${formatInr(remaining)}`}
              color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
          )}
        </Stack>
        {creditNote?.customer?.name && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Customer: <strong>{creditNote.customer.name}</strong>
            {' · '}Credit Note: <strong>{creditNote.creditNoteNo}</strong>
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={22} /></Box>
        ) : dues.length === 0 ? (
          <Alert severity="info">
            This customer has no unpaid invoices right now. Use "Record refund" to
            settle the remaining balance instead.
          </Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Due</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 140 }}>Apply</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dues.map((s) => {
                const due = Number(s.dueAmount || s.remaining || 0);
                const val = amounts[s.id] ?? '';
                return (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {s.invoiceNo || `#${s.id}`}
                    </TableCell>
                    <TableCell>{s.date ? new Date(s.date).toLocaleDateString('en-IN') : '—'}</TableCell>
                    <TableCell align="right">INR {formatInr(s.totalAmount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      INR {formatInr(due)}
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" type="number" value={val}
                        onChange={(e) => setAmount(s.id, e.target.value, due)}
                        inputProps={{ min: 0, max: due, step: '0.01', style: { textAlign: 'right' } }}
                        sx={{ width: 120 }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Stack direction="row" alignItems="center" justifyContent="space-between"
          sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            Total to allocate
          </Typography>
          <Typography variant="h6" fontWeight={800}
            color={excess ? 'error.main' : 'primary.main'}>
            INR {formatInr(totalToAllocate)}
          </Typography>
        </Stack>
        {excess && (
          <Alert severity="error" sx={{ mt: 1 }}>
            Total allocation exceeds remaining credit (INR {formatInr(remaining)}).
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!canSubmit}>
          {busy ? <CircularProgress size={18} /> : 'Apply credit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
