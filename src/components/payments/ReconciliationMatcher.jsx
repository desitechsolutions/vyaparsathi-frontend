/**
 * ReconciliationMatcher.jsx
 *
 * Reusable two-column matching component for bank reconciliation.
 *
 * Props:
 *   bankTransactions  — array of { id, date, amount, description, bankRef }
 *   recordedPayments  — array of { id, date, amount, description, reference, customerId, customerName }
 *   onMatch(bankId, paymentId)   — called when a pair is matched
 *   onUnmatch(bankId, paymentId) — called when an existing match is removed
 *
 * Matching logic:
 *   Auto-match: amount must be equal AND date within ±1 calendar day → confidence 100% / 90%
 *   Manual:    user selects one item from each column → clicks "Match" button
 *
 * No external DnD library required — click-select UX works on all devices.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Button,
  Chip, Divider, Tooltip, alpha, useMediaQuery,
  IconButton, Badge, LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAppPalette } from '../../hooks/useAppPalette';

// Icons
import LinkIcon              from '@mui/icons-material/Link';
import LinkOffIcon           from '@mui/icons-material/LinkOff';
import AutoAwesomeIcon       from '@mui/icons-material/AutoAwesome';
import AccountBalanceIcon    from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon       from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import InfoOutlinedIcon      from '@mui/icons-material/InfoOutlined';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
  '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Return absolute difference in calendar days between two date strings/objects. */
const dayDiff = (a, b) => {
  const parse = (v) => {
    const d = typeof v === 'string' ? new Date(v) : v;
    return Math.floor(d.getTime() / 86_400_000);
  };
  return Math.abs(parse(a) - parse(b));
};

/**
 * Compute match confidence between a bank txn and a recorded payment.
 * Returns null if amounts differ, or 100/90/80 based on date proximity.
 */
const confidence = (bank, payment) => {
  if (Math.abs(Number(bank.amount) - Number(payment.amount)) > 0.009) return null;
  const dd = dayDiff(bank.date, payment.date);
  if (dd === 0) return 100;
  if (dd === 1) return 90;
  return null; // > 1 day: not auto-matched
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Coloured confidence pill. */
const ConfidencePill = ({ pct }) => {
  const bg = pct === 100 ? '#22c55e' : '#f59e0b';
  return (
    <Chip
      size="small"
      label={`${pct}% match`}
      icon={<AutoAwesomeIcon sx={{ fontSize: '0.75rem !important' }} />}
      sx={{
        bgcolor: alpha(bg, 0.15),
        color: bg,
        fontWeight: 800,
        fontSize: '0.68rem',
        border: `1px solid ${alpha(bg, 0.35)}`,
        height: 22,
        '& .MuiChip-icon': { color: bg, ml: 0.5 },
      }}
    />
  );
};

/** A single transaction card — works for both bank and payment sides. */
const TxnCard = ({
  item,
  side,           // 'bank' | 'payment'
  isSelected,
  isMatched,
  matchedWith,    // label of matched counterpart
  confidence: pct,
  onSelect,
  onUnmatch,
}) => {
  const palette  = useAppPalette();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';

  const border = isMatched
    ? `2px solid ${palette.success}`
    : isSelected
      ? `2px solid ${palette.primary}`
      : `1px solid ${palette.borderColor}`;

  const bg = isMatched
    ? alpha(palette.success, isDark ? 0.12 : 0.06)
    : isSelected
      ? alpha(palette.primary, isDark ? 0.15 : 0.07)
      : palette.cardBg;

  return (
    <Card
      variant="outlined"
      onClick={isMatched ? undefined : onSelect}
      role={isMatched ? undefined : 'button'}
      tabIndex={isMatched ? -1 : 0}
      onKeyDown={isMatched ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      aria-pressed={isSelected}
      aria-label={`${side === 'bank' ? 'Bank' : 'Payment'} ${fmt(item.amount)} on ${fmtDate(item.date)}`}
      sx={{
        border,
        bgcolor: bg,
        cursor: isMatched ? 'default' : 'pointer',
        borderRadius: 2,
        mb: 1.5,
        transition: 'all 0.18s ease',
        '&:hover': isMatched ? {} : {
          borderColor: palette.primary,
          boxShadow: `0 4px 16px ${alpha(palette.primary, 0.14)}`,
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${palette.primary}`,
          outlineOffset: 2,
        },
      }}
    >
      <CardContent sx={{ p: '10px 14px !important' }}>
        <Stack direction="row" alignItems="flex-start" spacing={1}>

          {/* Selection indicator */}
          <Box sx={{ mt: 0.3, flexShrink: 0, color: isMatched ? palette.success : isSelected ? palette.primary : palette.textDisabled }}>
            {isMatched
              ? <CheckCircleIcon fontSize="small" />
              : isSelected
                ? <CheckCircleIcon fontSize="small" />
                : <RadioButtonUncheckedIcon fontSize="small" />
            }
          </Box>

          {/* Main info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                sx={{ fontSize: '0.92rem', color: palette.textPrimary }}
              >
                {fmt(item.amount)}
              </Typography>
              {pct != null && !isMatched && <ConfidencePill pct={pct} />}
              {isMatched && (
                <Chip size="small" label="Matched" color="success" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
              )}
            </Stack>

            <Typography variant="body2" sx={{ color: palette.textSecondary, fontSize: '0.78rem', mt: 0.3 }}>
              {fmtDate(item.date)}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: palette.textPrimary,
                fontSize: '0.8rem',
                mt: 0.4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.description || item.bankRef || item.reference || '—'}
            </Typography>

            {item.customerName && (
              <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: '0.72rem' }}>
                {item.customerName}
              </Typography>
            )}

            {isMatched && matchedWith && (
              <Typography variant="caption" sx={{ color: palette.success, fontWeight: 700, fontSize: '0.72rem', display: 'block', mt: 0.4 }}>
                Matched with: {matchedWith}
              </Typography>
            )}
          </Box>

          {/* Unmatch button */}
          {isMatched && onUnmatch && (
            <Tooltip title="Remove this match" arrow>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onUnmatch(); }}
                aria-label="Remove match"
                sx={{ color: palette.danger, flexShrink: 0, p: 0.5 }}
              >
                <LinkOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const ReconciliationMatcher = ({
  bankTransactions  = [],
  recordedPayments  = [],
  onMatch,
  onUnmatch,
}) => {
  const palette = useAppPalette();
  const theme   = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // selectedBank / selectedPayment: IDs of items the user has clicked to pair
  const [selectedBank,    setSelectedBank]    = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // matches: Map<bankId → paymentId>
  const [matches, setMatches] = useState(() => {
    // Seed with auto-matches (100 / 90% confidence)
    const map = new Map();
    const usedPayments = new Set();
    bankTransactions.forEach((bt) => {
      for (const rp of recordedPayments) {
        if (usedPayments.has(rp.id)) continue;
        const c = confidence(bt, rp);
        if (c != null) {
          map.set(bt.id, { paymentId: rp.id, confidence: c });
          usedPayments.add(rp.id);
          break;
        }
      }
    });
    return map;
  });

  // Confidence map: bankId → confidence% for the top candidate payment
  const autoConfidence = useMemo(() => {
    const map = new Map();
    bankTransactions.forEach((bt) => {
      if (matches.has(bt.id)) return;
      for (const rp of recordedPayments) {
        const c = confidence(bt, rp);
        if (c != null) { map.set(bt.id, c); break; }
      }
    });
    return map;
  }, [bankTransactions, recordedPayments, matches]);

  // Matched payment IDs (for quick lookup)
  const matchedPaymentIds = useMemo(() => {
    const s = new Set();
    matches.forEach(({ paymentId }) => s.add(paymentId));
    return s;
  }, [matches]);

  // Stats
  const matchedCount = matches.size;
  const totalBank    = bankTransactions.length;

  const handleMatch = useCallback(() => {
    if (!selectedBank || !selectedPayment) return;
    const newMatches = new Map(matches);
    newMatches.set(selectedBank, { paymentId: selectedPayment, confidence: 100 });
    setMatches(newMatches);
    setSelectedBank(null);
    setSelectedPayment(null);
    onMatch?.(selectedBank, selectedPayment);
  }, [selectedBank, selectedPayment, matches, onMatch]);

  const handleUnmatch = useCallback((bankId) => {
    const entry = matches.get(bankId);
    if (!entry) return;
    const newMatches = new Map(matches);
    newMatches.delete(bankId);
    setMatches(newMatches);
    onUnmatch?.(bankId, entry.paymentId);
  }, [matches, onUnmatch]);

  // Get label for matched counterpart
  const getPaymentLabel = (paymentId) => {
    const p = recordedPayments.find((r) => r.id === paymentId);
    return p ? `${fmt(p.amount)} · ${fmtDate(p.date)}` : paymentId;
  };

  const getBankLabel = (bankId) => {
    const b = bankTransactions.find((t) => t.id === bankId);
    return b ? `${fmt(b.amount)} · ${fmtDate(b.date)}` : bankId;
  };

  const canMatch = selectedBank && selectedPayment;

  // Progress
  const progressPct = totalBank > 0 ? Math.round((matchedCount / totalBank) * 100) : 0;

  return (
    <Box>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <Box sx={{ mb: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="body2" fontWeight={700} sx={{ color: palette.textPrimary }}>
            {matchedCount} / {totalBank} bank entries matched
          </Typography>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            {progressPct}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(palette.primary, 0.15),
            '& .MuiLinearProgress-bar': { bgcolor: progressPct === 100 ? palette.success : palette.primary, borderRadius: 3 },
          }}
        />
      </Box>

      {/* ── Manual match action bar ────────────────────────────────────────── */}
      {(selectedBank || selectedPayment) && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            p: '10px 16px',
            mb: 2,
            borderRadius: 2,
            bgcolor: alpha(palette.primary, 0.08),
            border: `1px solid ${alpha(palette.primary, 0.25)}`,
          }}
        >
          <InfoOutlinedIcon sx={{ color: palette.primary, fontSize: 18 }} />
          <Typography variant="body2" sx={{ flex: 1, color: palette.textPrimary }}>
            {!selectedBank && !selectedPayment
              ? 'Select one item from each column to match them manually.'
              : !selectedBank
                ? 'Now select a bank transaction on the left.'
                : !selectedPayment
                  ? 'Now select a recorded payment on the right.'
                  : 'Ready to match — click "Match" to confirm.'
            }
          </Typography>
          <Button
            variant="contained"
            size="small"
            disabled={!canMatch}
            onClick={handleMatch}
            startIcon={<LinkIcon />}
            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1.5, minHeight: 36 }}
          >
            Match
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => { setSelectedBank(null); setSelectedPayment(null); }}
            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1.5, minHeight: 36, color: palette.textSecondary }}
          >
            Clear
          </Button>
        </Stack>
      )}

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="flex-start"
      >

        {/* LEFT: Bank transactions */}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <AccountBalanceIcon sx={{ color: palette.primary, fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: palette.textPrimary }}>
              Bank Transactions
            </Typography>
            <Badge
              badgeContent={bankTransactions.filter((b) => !matches.has(b.id)).length}
              color="warning"
              sx={{ ml: 0.5 }}
            >
              <Box />
            </Badge>
          </Stack>

          {bankTransactions.length === 0 ? (
            <Typography variant="body2" sx={{ color: palette.textSecondary, fontStyle: 'italic' }}>
              No bank transactions loaded.
            </Typography>
          ) : (
            bankTransactions.map((bt) => {
              const matchEntry = matches.get(bt.id);
              const isMatched  = !!matchEntry;
              return (
                <TxnCard
                  key={bt.id}
                  item={bt}
                  side="bank"
                  isSelected={selectedBank === bt.id}
                  isMatched={isMatched}
                  matchedWith={isMatched ? getPaymentLabel(matchEntry.paymentId) : null}
                  confidence={!isMatched ? autoConfidence.get(bt.id) : undefined}
                  onSelect={() => setSelectedBank(selectedBank === bt.id ? null : bt.id)}
                  onUnmatch={isMatched ? () => handleUnmatch(bt.id) : null}
                />
              );
            })
          )}
        </Box>

        {/* Divider — vertical on desktop, horizontal on mobile */}
        {isMobile
          ? <Divider flexItem sx={{ my: 0.5 }} />
          : <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        }

        {/* RIGHT: Recorded payments */}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <ReceiptLongIcon sx={{ color: palette.teal, fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: palette.textPrimary }}>
              Recorded Payments
            </Typography>
            <Badge
              badgeContent={recordedPayments.filter((p) => !matchedPaymentIds.has(p.id)).length}
              color="warning"
              sx={{ ml: 0.5 }}
            >
              <Box />
            </Badge>
          </Stack>

          {recordedPayments.length === 0 ? (
            <Typography variant="body2" sx={{ color: palette.textSecondary, fontStyle: 'italic' }}>
              No recorded payments found.
            </Typography>
          ) : (
            recordedPayments.map((rp) => {
              const isMatched = matchedPaymentIds.has(rp.id);
              const matchedBankId = isMatched
                ? [...matches.entries()].find(([, v]) => v.paymentId === rp.id)?.[0]
                : null;
              return (
                <TxnCard
                  key={rp.id}
                  item={rp}
                  side="payment"
                  isSelected={selectedPayment === rp.id}
                  isMatched={isMatched}
                  matchedWith={matchedBankId ? getBankLabel(matchedBankId) : null}
                  onSelect={isMatched ? undefined : () => setSelectedPayment(selectedPayment === rp.id ? null : rp.id)}
                  onUnmatch={null}
                />
              );
            })
          )}
        </Box>
      </Stack>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        sx={{ mt: 2.5, pt: 2, borderTop: `1px dashed ${palette.borderColor}` }}
      >
        {[
          { icon: <CheckCircleIcon sx={{ fontSize: 14, color: palette.success }} />, label: 'Matched' },
          { icon: <AutoAwesomeIcon sx={{ fontSize: 14, color: '#f59e0b' }} />, label: 'Auto-match candidate (same amount ±1 day)' },
          { icon: <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: palette.textDisabled }} />, label: 'Unmatched — click to select, then "Match"' },
          { icon: <LinkOffIcon sx={{ fontSize: 14, color: palette.danger }} />, label: 'Remove a match' },
        ].map(({ icon, label }) => (
          <Stack key={label} direction="row" alignItems="center" spacing={0.5}>
            {icon}
            <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: '0.72rem' }}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default ReconciliationMatcher;
