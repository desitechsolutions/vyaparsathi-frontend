/**
 * PaymentTrendChart.jsx
 *
 * Recharts line/area chart displaying daily or weekly payment collections.
 *
 * Props:
 *   data        {Array}   [{date: 'YYYY-MM-DD', amount: number}]
 *   granularity {'DAY'|'WEEK'} Controls x-axis label density
 *   loading     {boolean} Show skeleton overlay
 *   color       {string}  Line + area fill color (default teal)
 *   height      {number}  Chart height in px (default 260)
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
} from 'recharts';
import { Box, Skeleton, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Smart INR formatter for the Y-axis tick labels.
 * Keeps labels short so they don't crowd the axis.
 */
const yTickFormatter = (v) => {
  const n = Number(v ?? 0);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}k`;
  return `₹${n}`;
};

/**
 * Format a date string for the x-axis tick, adapting to granularity.
 *   DAY  → "23 Aug"
 *   WEEK → "W34 '25"
 */
const xTickFormatter = (dateStr, granularity) => {
  if (!dateStr) return '';
  const d = dayjs(dateStr);
  if (!d.isValid()) return dateStr;
  if (granularity === 'WEEK') return `W${d.week()} '${d.format('YY')}`;
  return d.format('D MMM');
};

// ── Custom tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, granularity }) => {
  if (!active || !payload?.length) return null;

  const amount  = payload[0]?.value ?? 0;
  const fullINR = `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const d       = dayjs(label);
  const dateLabel = granularity === 'WEEK'
    ? `Week ${d.week()}, ${d.year()}`
    : d.isValid() ? d.format('ddd, D MMM YYYY') : label;

  return (
    <Box
      role="tooltip"
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        px: 1.75,
        py: 1.25,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        minWidth: 160,
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
        {dateLabel}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'text.primary' }}>
        {fullINR}
      </Typography>
    </Box>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const PaymentTrendChart = ({
  data        = [],
  granularity = 'DAY',
  loading     = false,
  color       = '#0f766e',
  height      = 260,
}) => {
  const theme = useTheme();

  // Reduce tick count on small datasets or weekly view to avoid crowding
  const tickInterval = useMemo(() => {
    if (granularity === 'WEEK') return 0;
    if (data.length <= 14) return 0;
    if (data.length <= 31) return 2;
    return 6;
  }, [data.length, granularity]);

  const gridColor  = theme.palette.divider;
  const textColor  = theme.palette.text.secondary;
  const areaFill   = alpha(color, 0.15);
  const gradId     = 'payTrendGrad';

  if (loading) {
    return (
      <Skeleton
        variant="rectangular"
        width="100%"
        height={height}
        sx={{ borderRadius: 2 }}
      />
    );
  }

  if (!data.length) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: alpha(color, 0.03),
        }}
        role="img"
        aria-label="No trend data available"
      >
        <Typography variant="body2" color="text.secondary">
          No data for selected range
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color}    stopOpacity={0.22} />
              <stop offset="95%" stopColor={color}    stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={(v) => xTickFormatter(v, granularity)}
            interval={tickInterval}
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tickFormatter={yTickFormatter}
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={false}
            tickLine={false}
            width={58}
          />

          <ReTooltip
            content={<CustomTooltip granularity={granularity} />}
            cursor={{ stroke: color, strokeWidth: 1.5, strokeDasharray: '4 2' }}
          />

          <Area
            type="monotone"
            dataKey="amount"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{
              r: 5,
              fill: color,
              stroke: theme.palette.background.paper,
              strokeWidth: 2,
            }}
            isAnimationActive={true}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

PaymentTrendChart.propTypes = {
  data:        PropTypes.arrayOf(PropTypes.shape({ date: PropTypes.string, amount: PropTypes.number })),
  granularity: PropTypes.oneOf(['DAY', 'WEEK']),
  loading:     PropTypes.bool,
  color:       PropTypes.string,
  height:      PropTypes.number,
};

export default PaymentTrendChart;
