import React from 'react';
import { Chip, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import UndoIcon from '@mui/icons-material/Undo';

// ── Status metadata ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PAID:           { label: 'Paid',           color: '#059669', bg: '#dcfce7', Icon: CheckCircleIcon },
  SUCCESS:        { label: 'Success',        color: '#059669', bg: '#dcfce7', Icon: CheckCircleIcon },
  PARTIALLY_PAID: { label: 'Partial',        color: '#ea580c', bg: '#fff7ed', Icon: WarningAmberIcon },
  PENDING:        { label: 'Pending',        color: '#d97706', bg: '#fef3c7', Icon: AccessTimeIcon },
  FAILED:         { label: 'Failed',         color: '#dc2626', bg: '#fee2e2', Icon: CancelIcon },
  REFUNDED:       { label: 'Refunded',       color: '#7c3aed', bg: '#ede9fe', Icon: UndoIcon },
  CANCELLED:      { label: 'Cancelled',      color: '#64748b', bg: '#f1f5f9', Icon: CancelIcon },
};

const FALLBACK = { label: '—', color: '#64748b', bg: '#f1f5f9', Icon: null };

/**
 * PaymentStatusBadge
 *
 * Reusable color-coded Chip for a payment status value.
 *
 * Props:
 *   status   {string}  e.g. 'PAID' | 'PENDING' | 'FAILED' | 'PARTIALLY_PAID'
 *   size     {string}  'small' | 'medium' (default 'small')
 *   showIcon {boolean} Show the status icon (default false)
 *   sx       {object}  Extra sx overrides passed to Chip
 */
const PaymentStatusBadge = ({ status, size = 'small', showIcon = false, sx = {} }) => {
  const config = STATUS_CONFIG[status] ?? FALLBACK;
  const { label, color, bg, Icon } = config;

  return (
    <Chip
      icon={showIcon && Icon ? <Icon style={{ fontSize: 13, color }} aria-hidden="true" /> : undefined}
      label={label}
      size={size}
      aria-label={`Payment status: ${label}`}
      sx={{
        height: size === 'small' ? 26 : 30,
        fontSize: size === 'small' ? '0.72rem' : '0.8rem',
        fontWeight: 800,
        bgcolor: bg,
        color,
        border: `1px solid ${alpha(color, 0.3)}`,
        letterSpacing: '0.3px',
        '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
        ...sx,
      }}
    />
  );
};

export default PaymentStatusBadge;
