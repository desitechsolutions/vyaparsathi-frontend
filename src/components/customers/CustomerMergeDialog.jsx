import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import { fetchCustomersPaged, mergeCustomers } from '../../services/api';

/**
 * Merge two customers. The current record is the target (kept); the
 * user picks a source (dropped after re-linking). All transactional
 * data — sales, quotations, sales orders, credit notes, payments,
 * refunds, receipts, ledger — is re-attached to the target on the
 * backend, so the merge is destructive but non-lossy.
 *
 * <p>Typeahead uses the paged customers endpoint (500 cap in
 * fetchCustomers), so it works even on shops with lots of records.</p>
 */
export default function CustomerMergeDialog({ open, onClose, targetCustomer, onMerged }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [source, setSource] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) {
      setSource(null);
      setQuery('');
      setError('');
      setResult(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const params = { size: 50, sortBy: 'name', sortDir: 'asc' };
    if (query.trim()) params.search = query.trim();
    fetchCustomersPaged(params)
      .then((res) => {
        if (cancelled) return;
        const list = (res?.content || []).filter((c) => c.id !== targetCustomer?.id);
        setOptions(list);
      })
      .catch(() => { if (!cancelled) setOptions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, query, targetCustomer?.id]);

  const canMerge = !!(source && source.id !== targetCustomer?.id);

  const doMerge = async () => {
    setBusy(true);
    setError('');
    try {
      const summary = await mergeCustomers(source.id, targetCustomer.id);
      setResult(summary);
      setConfirmOpen(false);
      if (onMerged) onMerged(summary);
    } catch (e) {
      setError(e?.response?.data?.message || 'Merge failed.');
    } finally {
      setBusy(false);
    }
  };

  const summaryRows = useMemo(() => {
    if (!result) return [];
    const numericKeys = ['sales', 'quotations', 'salesOrders', 'creditNotes', 'payments', 'paymentReceipts', 'refunds', 'ledgerEntries', 'segmentsUnioned'];
    return numericKeys
      .filter((k) => typeof result[k] === 'number' && result[k] > 0)
      .map((k) => ({ key: k, value: result[k] }));
  }, [result]);

  return (
    <>
      <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CallMergeIcon color="primary" />
            <span>Merge customer</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {result ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                Merge complete
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.sourceName} was merged into {result.targetName}.
              </Typography>
              {summaryRows.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {summaryRows.map((r) => (
                      <Chip key={r.key} size="small" label={`${r.value} ${r.key}`} sx={{ fontWeight: 600 }} />
                    ))}
                  </Stack>
                </Box>
              )}
            </Alert>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Pick the customer that should be <em>merged into</em>{' '}
                <strong>{targetCustomer?.name}</strong>. All invoices, payments, credit notes and
                other records from the source will be re-linked to this profile, and the source
                customer will be deleted.
              </DialogContentText>

              <Autocomplete
                fullWidth
                options={options}
                loading={loading}
                filterOptions={(x) => x}
                inputValue={query}
                onInputChange={(_, v) => setQuery(v)}
                value={source}
                onChange={(_, v) => setSource(v)}
                getOptionLabel={(o) => (o ? `${o.name}${o.phone ? ' · ' + o.phone : ''}` : '')}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Source customer (will be merged & deleted)"
                    placeholder="Search by name, phone, email…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading && <CircularProgress size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              {source && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={700}>Merge preview</Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>{source.name}</strong> (source) → will be merged into{' '}
                    <strong>{targetCustomer?.name}</strong> (target).
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="warning.main">
                    ⚠ This action cannot be undone. All invoices, payments, credit notes, ledger
                    entries and segments from the source will move to the target, and the source
                    customer profile will be deleted.
                  </Typography>
                </Box>
              )}

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>{result ? 'Close' : 'Cancel'}</Button>
          {!result && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<CallMergeIcon />}
              onClick={() => setConfirmOpen(true)}
              disabled={!canMerge || busy}
              disableElevation
            >
              Merge
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Second confirmation — merging deletes data, needs a beat */}
      <Dialog open={confirmOpen} onClose={busy ? undefined : () => setConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>Confirm merge?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Merge <strong>{source?.name}</strong> into <strong>{targetCustomer?.name}</strong>?
            The source customer will be deleted after re-linking all data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={busy}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={doMerge} disabled={busy}>
            Yes, merge
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
