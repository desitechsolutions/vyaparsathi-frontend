import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Stack, Typography, Skeleton, alpha, Tooltip, Chip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingDownIcon         from '@mui/icons-material/TrendingDown';
import SavingsIcon              from '@mui/icons-material/Savings';
import FiberManualRecordIcon    from '@mui/icons-material/FiberManualRecord';
import { useAppPalette } from '../../hooks/useAppPalette';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Human-readable seconds-ago label. */
function secsAgoLabel(date) {
  if (!date) return null;
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 5)  return 'Just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const formatAmount = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

// ── Sub-component: individual KPI tile ───────────────────────────────────────

const StatTile = ({
  icon: Icon,
  iconBg,
  iconColor,
  accentColor,
  label,
  value,
  subLabel,
  loading,
  tooltip,
  isUpdating = false,
  timestampLabel = null,
}) => {
  const theme = useAppPalette();

  return (
    <Card
      elevation={0}
      // Accessible label: combines label + value so screen readers announce the stat
      aria-label={loading ? `${label}: loading` : `${label}: ${value}${subLabel ? '. ' + subLabel : ''}`}
      // Live region so updates are announced after data changes
      aria-live="polite"
      aria-atomic="true"
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: 2.5,
        border: `1.5px solid`,
        borderColor: isUpdating ? alpha(accentColor, 0.55) : alpha(accentColor, 0.18),
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.35s ease',
        ...(isUpdating && {
          animation: 'statPulse 0.7s ease-in-out 2',
          '@keyframes statPulse': {
            '0%':   { boxShadow: `0 0 0 0 ${alpha(accentColor, 0.35)}` },
            '50%':  { boxShadow: `0 0 0 5px ${alpha(accentColor, 0)}` },
            '100%': { boxShadow: `0 0 0 0 ${alpha(accentColor, 0)}` },
          },
        }),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 20px ${alpha(accentColor, 0.14)}`,
          borderColor: alpha(accentColor, 0.35),
        },
      }}
    >
      {/* Accent bar (decorative) */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${alpha(accentColor, 0.5)} 100%)`,
          borderRadius: '10px 10px 0 0',
        }}
      />

      <CardContent sx={{ pt: 2.5, pb: '16px !important', px: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.75}>
          {/* Icon (decorative — card aria-label carries the accessible name) */}
          <Box
            aria-hidden="true"
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              mt: 0.25,
            }}
          >
            <Icon sx={{ fontSize: 22, color: iconColor }} />
          </Box>

          {/* Text (hidden from AT individually — card-level aria-label covers it) */}
          <Box sx={{ flex: 1, minWidth: 0 }} aria-hidden="true">
            <Tooltip title={tooltip || ''} placement="top" arrow disableHoverListener={!tooltip}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.textSecondary,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  fontSize: '0.7rem',
                  display: 'block',
                  lineHeight: 1.3,
                  mb: 0.5,
                  cursor: tooltip ? 'help' : 'default',
                }}
              >
                {label}
              </Typography>
            </Tooltip>

            {loading ? (
              <Skeleton variant="text" width={90} height={38} sx={{ borderRadius: 1 }} />
            ) : (
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
                  lineHeight: 1.1,
                  color: accentColor,
                  letterSpacing: '-0.5px',
                }}
              >
                {value}
              </Typography>
            )}

            {subLabel && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.textSecondary,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  mt: 0.5,
                  display: 'block',
                }}
              >
                {subLabel}
              </Typography>
            )}

            {timestampLabel && (
              <Typography
                variant="caption"
                aria-label={`Balance updated ${timestampLabel}`}
                sx={{
                  color: alpha(accentColor, 0.7),
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  mt: 0.5,
                  display: 'block',
                  letterSpacing: '0.2px',
                }}
              >
                Updated {timestampLabel}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * PaymentStatsCards
 *
 * Three KPI tiles displayed in the page header area:
 *   1. Total Outstanding Due (across all / selected customer)
 *   2. Received Today (today's payment total from summary)
 *   3. Advance Credit (for selected customer)
 *
 * Props:
 *   totalDue         {number}       Sum of all outstanding due amounts
 *   receivedToday    {number}       Total payments received today
 *   advanceBalance   {number}       Advance credit for selected customer (0 if none)
 *   loading          {boolean}      Show skeleton state
 *   selectedCustomer {object|null}  Currently selected customer
 *   lastUpdate       {Date|null}    Timestamp of last real-time balance update
 *   isLive           {boolean}      Whether the WebSocket connection is active
 *   isUpdating       {boolean}      True for ~2 s after each live update (triggers pulse)
 */
const PaymentStatsCards = ({
  totalDue = 0,
  receivedToday = 0,
  advanceBalance = 0,
  loading = false,
  selectedCustomer = null,
  lastUpdate  = null,
  isLive      = false,
  isUpdating  = false,
}) => {
  // Local ticker: recalculates the "X sec ago" label every second
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastUpdate) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [lastUpdate]);

  const timestampLabel = secsAgoLabel(lastUpdate);

  return (
    <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
      {/* Live badge row */}
      {(isLive || lastUpdate) && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          spacing={0.75}
          sx={{ mb: 1 }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLive && (
            <Chip
              size="small"
              icon={
                <FiberManualRecordIcon
                  sx={{
                    fontSize: '8px !important',
                    color: '#22c55e !important',
                    animation: 'liveDot 2s ease-in-out infinite',
                    '@keyframes liveDot': {
                      '0%, 100%': { opacity: 1 },
                      '50%':      { opacity: 0.35 },
                    },
                  }}
                />
              }
              label="Live"
              aria-label="Real-time balance updates are active"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 800,
                bgcolor: alpha('#22c55e', 0.12),
                color: '#16a34a',
                border: `1px solid ${alpha('#22c55e', 0.3)}`,
                letterSpacing: '0.3px',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
          {!isLive && (
            <Chip
              size="small"
              label="Offline"
              aria-label="Real-time updates paused — WebSocket disconnected"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: alpha('#6b7280', 0.1),
                color: '#6b7280',
                border: `1px solid ${alpha('#6b7280', 0.25)}`,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
        </Stack>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
      >
        {/* KPI 1: Outstanding */}
        <StatTile
          icon={TrendingDownIcon}
          iconBg={alpha('#dc2626', 0.1)}
          iconColor="#dc2626"
          accentColor="#dc2626"
          label={selectedCustomer ? 'Customer Due' : 'Total Outstanding'}
          value={formatAmount(totalDue)}
          subLabel={totalDue > 0 ? 'Pending collection' : 'All settled'}
          loading={loading}
          tooltip={selectedCustomer
            ? `Outstanding balance for ${selectedCustomer.name}`
            : 'Total pending dues across all customers'}
          isUpdating={isUpdating}
        />

        {/* KPI 2: Received Today */}
        <StatTile
          icon={AccountBalanceWalletIcon}
          iconBg={alpha('#059669', 0.1)}
          iconColor="#059669"
          accentColor="#059669"
          label="Received Today"
          value={formatAmount(receivedToday)}
          subLabel="Today's collections"
          loading={loading}
          tooltip="Total payments recorded today"
          isUpdating={isUpdating}
        />

        {/* KPI 3: Advance Credit */}
        <StatTile
          icon={SavingsIcon}
          iconBg={alpha('#2563eb', 0.1)}
          iconColor="#2563eb"
          accentColor="#2563eb"
          label="Advance Credit"
          value={formatAmount(advanceBalance)}
          subLabel={selectedCustomer ? `${selectedCustomer.name}'s wallet` : 'Select customer'}
          loading={loading}
          tooltip="Prepaid balance available for future invoices"
          isUpdating={isUpdating}
          timestampLabel={timestampLabel}
        />
      </Stack>
    </Box>
  );
};

export default PaymentStatsCards;
