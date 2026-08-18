import React from 'react';
import { Box, Paper, Typography, Stack, LinearProgress, Tooltip } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { inr } from '../../utils/customerFormat';

/**
 * Enterprise aging visualization — four bucket totals (current /
 * 31-60 / 61-90 / 90+) stacked into a single 100%-wide bar so at a
 * glance you can see whether outstanding is fresh or has aged out.
 *
 * <p>Feeds off {@code CustomerStatsDto} aging fields (V115). Renders
 * nothing when total outstanding is zero — no point in showing an
 * empty chart. Uses semantic colors (green→amber→orange→red) matching
 * the industry convention every accountant is used to reading.</p>
 */
const BUCKET_META = [
  { key: 'agingCurrent', label: 'Current (0-30d)', color: '#10B981' },
  { key: 'aging31_60',   label: '31-60 days',      color: '#F59E0B' },
  { key: 'aging61_90',   label: '61-90 days',      color: '#F97316' },
  { key: 'aging90Plus',  label: '90+ days',        color: '#EF4444' },
];

export default function AgingBucketsBar({ stats }) {
  const buckets = BUCKET_META.map((b) => ({
    ...b,
    amount: Number(stats?.[b.key] || 0),
  }));
  const total = buckets.reduce((s, b) => s + b.amount, 0);
  if (total <= 0) return null;

  const oldest = buckets.slice().reverse().find((b) => b.amount > 0);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2.5, mb: 3 }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Receivable aging
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {inr(total)} outstanding across {buckets.filter((b) => b.amount > 0).length} bucket
            {buckets.filter((b) => b.amount > 0).length === 1 ? '' : 's'}
            {oldest && oldest.key !== 'agingCurrent' && (
              <>
                {' '}· <Box component="span" sx={{ color: oldest.color, fontWeight: 700 }}>
                  {oldest.label.toLowerCase()} zone
                </Box>
              </>
            )}
          </Typography>
        </Box>
      </Stack>

      {/* Stacked 100% bar */}
      <Box sx={{
        display: 'flex',
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
        bgcolor: 'action.hover',
        mb: 1.5,
      }}>
        {buckets.map((b) => {
          const pct = total > 0 ? (b.amount / total) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <Tooltip key={b.key} title={`${b.label}: ${inr(b.amount)} (${pct.toFixed(1)}%)`} arrow>
              <Box sx={{ width: `${pct}%`, bgcolor: b.color, transition: 'width 200ms' }} />
            </Tooltip>
          );
        })}
      </Box>

      {/* Legend */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {buckets.map((b) => (
          <Stack key={b.key} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: b.color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {b.label}
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: b.amount > 0 ? 'text.primary' : 'text.disabled' }}>
              {inr(b.amount)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

/**
 * Credit-hold banner + credit-limit utilization bar. Renders
 * a bright warning when {@code customer.creditHold} is true (the
 * customer cannot receive new invoices) and/or a utilization gauge
 * when a credit limit is configured — outstanding / limit → color
 * that goes green ➜ amber ➜ red as the ratio climbs.
 */
export function CreditStatusPanel({ customer, stats }) {
  const outstanding = Number(stats?.outstandingReceivable || 0);
  const limit = Number(customer?.creditLimit || 0);
  const hold = !!customer?.creditHold;
  const hasLimit = limit > 0;
  const utilPct = hasLimit ? Math.min(200, (outstanding / limit) * 100) : 0;
  const utilColor = utilPct >= 100 ? '#EF4444' : utilPct >= 75 ? '#F59E0B' : '#10B981';

  if (!hold && !hasLimit) return null;

  return (
    <Stack spacing={1.5} sx={{ mb: 3 }}>
      {hold && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderColor: 'error.light',
            bgcolor: 'error.50',
          }}
        >
          <BlockIcon color="error" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={800} color="error.main">
              This customer is on credit hold
            </Typography>
            <Typography variant="caption" color="text.secondary">
              New invoices for this customer will be refused by the system. Clear the hold from Edit Profile to resume invoicing.
            </Typography>
          </Box>
        </Paper>
      )}

      {hasLimit && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <WalletIcon fontSize="small" sx={{ color: utilColor }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Credit limit utilization
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>
                {inr(outstanding)} of {inr(limit)} used
                {utilPct >= 100 && (
                  <Box component="span" sx={{ ml: 1, color: '#EF4444', fontWeight: 800 }}>
                    · Limit breached
                  </Box>
                )}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: utilColor }}>
              {utilPct.toFixed(0)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, utilPct)}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { bgcolor: utilColor },
            }}
          />
        </Paper>
      )}
    </Stack>
  );
}

