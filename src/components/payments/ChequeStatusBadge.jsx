import React from 'react';
import { Chip, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';

// ── Status metadata ────────────────────────────────────────────────────────────

const CHEQUE_STATUS_CONFIG = {
  ISSUED:    { label: 'Issued',    color: '#2563eb', bg: '#dbeafe', Icon: AccessTimeIcon },
  CLEARED:   { label: 'Cleared',   color: '#059669', bg: '#dcfce7', Icon: CheckCircleIcon },
  BOUNCED:   { label: 'Bounced',   color: '#dc2626', bg: '#fee2e2', Icon: CancelIcon },
  CANCELLED: { label: 'Cancelled', color: '#64748b', bg: '#f1f5f9', Icon: DoNotDisturbOnIcon },
};

const FALLBACK = { label: '—', color: '#64748b', bg: '#f1f5f9', Icon: null };

/**
 * ChequeStatusBadge
 *
 * Color-coded Chip for a cheque status value.
 * Used across payment history, ChequeTrackerDialog, and admin dashboards.
 *
 * Props:
 *   status   {string}  'ISSUED' | 'CLEARED' | 'BOUNCED' | 'CANCELLED'
 *   size     {string}  'small' | 'medium' (default 'small')
 *   showIcon {boolean} Show the status icon (default true)
 *   sx       {object}  Extra sx overrides passed to Chip
 */
const ChequeStatusBadge = ({ status, size = 'small', showIcon = true, sx = {} }) => {
  const config = CHEQUE_STATUS_CONFIG[status] ?? FALLBACK;
  const { label, color, bg, Icon } = config;

  return (
    <Chip
      icon={showIcon && Icon ? <Icon style={{ fontSize: 13, color }} /> : undefined}
      label={label}
      size={size}
      aria-label={`Cheque status: ${label}`}
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

export default ChequeStatusBadge;
