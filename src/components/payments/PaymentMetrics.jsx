/**
 * PaymentMetrics.jsx
 *
 * Reusable KPI metric card for the Payment Analytics Dashboard.
 *
 * Props:
 *   title    {string}   Card label
 *   value    {number}   Raw numeric value
 *   currency {boolean}  Format as INR when true (default true)
 *   trend    {number}   % change vs previous period (+ve / -ve / 0 / null)
 *   icon     {element}  MUI SvgIcon component
 *   color    {string}   Accent hex (accent bar + value color)
 *   loading  {boolean}  Show skeleton state
 *   tooltip  {string}   Optional hover tooltip for the label
 *   subLabel {string}   Optional secondary line below the value
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box, Card, CardContent, Skeleton, Stack, Tooltip, Typography, alpha,
} from '@mui/material';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import TrendingDownIcon  from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon  from '@mui/icons-material/TrendingFlat';
import { useAppPalette } from '../../hooks/useAppPalette';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupees with smart scale suffixes.
 *   < 1 000      → ₹X
 *   1 000+       → ₹1.2k
 *   1 00 000+    → ₹1.2L
 *   1 00 00 000+ → ₹1.2Cr
 */
export const formatINR = (n) => {
  const num = Number(n ?? 0);
  if (Number.isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `₹${(num / 1e3).toFixed(1)}k`;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/** Full INR string, no abbreviation — shown inside tooltip. */
export const formatINRFull = (n) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Trend indicator sub-component ────────────────────────────────────────────

function TrendIndicator({ trend }) {
  if (trend === null || trend === undefined) return null;

  const abs = Math.abs(trend);
  const formatted = `${abs.toFixed(1)}%`;

  if (trend > 0.5) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.3} sx={{ mt: 0.75 }}>
        <TrendingUpIcon sx={{ fontSize: 14, color: '#059669' }} />
        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, fontSize: '0.7rem' }}>
          +{formatted}
        </Typography>
      </Stack>
    );
  }

  if (trend < -0.5) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.3} sx={{ mt: 0.75 }}>
        <TrendingDownIcon sx={{ fontSize: 14, color: '#dc2626' }} />
        <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700, fontSize: '0.7rem' }}>
          {formatted}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={0.3} sx={{ mt: 0.75 }}>
      <TrendingFlatIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>
        {formatted}
      </Typography>
    </Stack>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const PaymentMetrics = ({
  title    = 'Metric',
  value    = 0,
  currency = true,
  trend    = null,
  icon: Icon,
  color    = '#0f766e',
  loading  = false,
  tooltip  = '',
  subLabel = '',
}) => {
  const palette = useAppPalette();

  const displayValue = currency ? formatINR(value) : Number(value ?? 0).toLocaleString('en-IN');
  const fullValue    = currency ? formatINRFull(value) : String(value ?? 0);

  return (
    <Card
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: 2.5,
        border: `1.5px solid ${alpha(color, 0.18)}`,
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 22px ${alpha(color, 0.15)}`,
          borderColor: alpha(color, 0.36),
        },
      }}
    >
      {/* Accent bar */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.45)} 100%)`,
          borderRadius: '10px 10px 0 0',
        }}
      />

      <CardContent sx={{ pt: 2.5, pb: '16px !important', px: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.75}>

          {/* Icon badge */}
          {Icon && (
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: alpha(color, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              <Icon sx={{ fontSize: 22, color }} aria-hidden="true" />
            </Box>
          )}

          {/* Text block */}
          <Box sx={{ flex: 1, minWidth: 0 }}>

            {/* Label */}
            <Tooltip
              title={tooltip || ''}
              placement="top"
              arrow
              disableHoverListener={!tooltip}
            >
              <Typography
                variant="caption"
                component="p"
                sx={{
                  color: palette.textSecondary,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  fontSize: '0.7rem',
                  lineHeight: 1.3,
                  mb: 0.5,
                  cursor: tooltip ? 'help' : 'default',
                  userSelect: 'none',
                }}
              >
                {title}
              </Typography>
            </Tooltip>

            {/* Value */}
            {loading ? (
              <Skeleton variant="text" width={90} height={38} sx={{ borderRadius: 1 }} />
            ) : (
              <Tooltip title={fullValue} placement="bottom" arrow>
                <Typography
                  component="p"
                  sx={{
                    fontWeight: 900,
                    fontSize: 'clamp(1.25rem, 3vw, 1.7rem)',
                    lineHeight: 1.1,
                    color,
                    letterSpacing: '-0.5px',
                    cursor: 'default',
                  }}
                  aria-label={`${title}: ${displayValue}`}
                >
                  {displayValue}
                </Typography>
              </Tooltip>
            )}

            {/* Sub-label */}
            {subLabel && !loading && (
              <Typography
                variant="caption"
                component="p"
                sx={{
                  color: palette.textSecondary,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  mt: 0.5,
                }}
              >
                {subLabel}
              </Typography>
            )}

            {/* Trend badge */}
            {!loading && <TrendIndicator trend={trend} />}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

PaymentMetrics.propTypes = {
  title:    PropTypes.string,
  value:    PropTypes.number,
  currency: PropTypes.bool,
  trend:    PropTypes.number,
  icon:     PropTypes.elementType,
  color:    PropTypes.string,
  loading:  PropTypes.bool,
  tooltip:  PropTypes.string,
  subLabel: PropTypes.string,
};

export default PaymentMetrics;
