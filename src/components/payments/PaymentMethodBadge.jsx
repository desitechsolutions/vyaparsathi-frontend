import React from 'react';
import { Chip, alpha } from '@mui/material';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

// ── Method metadata ────────────────────────────────────────────────────────────

const METHOD_CONFIG = {
  CASH:        { label: 'Cash',        color: '#059669', bg: '#dcfce7', Icon: LocalAtmIcon },
  CARD:        { label: 'Card',        color: '#7c3aed', bg: '#ede9fe', Icon: CreditCardIcon },
  UPI:         { label: 'UPI',         color: '#0f766e', bg: '#ccfbf1', Icon: PhoneAndroidIcon },
  NET_BANKING: { label: 'Net Banking', color: '#2563eb', bg: '#dbeafe', Icon: AccountBalanceIcon },
  CHEQUE:      { label: 'Cheque',      color: '#b45309', bg: '#fef3c7', Icon: CheckBoxIcon },
};

const FALLBACK = { label: '—', color: '#64748b', bg: '#f1f5f9', Icon: null };

/**
 * PaymentMethodBadge
 *
 * Reusable color-coded Chip for a payment method value.
 *
 * Props:
 *   method   {string}  e.g. 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'CHEQUE'
 *   size     {string}  'small' | 'medium' (default 'small')
 *   showIcon {boolean} Show the method icon (default true)
 *   sx       {object}  Extra sx overrides passed to Chip
 */
const PaymentMethodBadge = ({ method, size = 'small', showIcon = false, sx = {} }) => {
  const config = METHOD_CONFIG[method] ?? FALLBACK;
  const { label, color, bg, Icon } = config;

  return (
    <Chip
      icon={showIcon && Icon ? <Icon style={{ fontSize: 13, color }} aria-hidden="true" /> : undefined}
      label={label}
      size={size}
      aria-label={`Payment method: ${label}`}
      sx={{
        height: size === 'small' ? 24 : 28,
        fontSize: size === 'small' ? '0.72rem' : '0.8rem',
        fontWeight: 700,
        bgcolor: bg,
        color,
        border: `1px solid ${alpha(color, 0.25)}`,
        letterSpacing: '0.2px',
        '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
        ...sx,
      }}
    />
  );
};

export default PaymentMethodBadge;
