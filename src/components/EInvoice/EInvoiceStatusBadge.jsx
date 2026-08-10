import React from 'react';
import { Chip, Box, Tooltip, Stack } from '@mui/material';
import { CheckCircle, Cancel, HourglassEmpty, LocalShipping } from '@mui/icons-material';

/**
 * Issue 5 UI Component: EInvoiceStatusBadge
 * Displays the current GST E-Invoice status and E-Way Bill badge for sales invoices.
 */
export default function EInvoiceStatusBadge({ sale }) {
  if (!sale) return null;

  const status = sale.einvoiceStatus || 'NOT_GENERATED';
  const irn = sale.irn;
  const ewayBillNo = sale.ewayBillNo;

  const getStatusConfig = () => {
    switch (status) {
      case 'GENERATED':
        return {
          label: 'E-Invoice Active',
          color: 'success',
          icon: <CheckCircle style={{ fontSize: 16 }} />,
        };
      case 'CANCELLED':
        return {
          label: 'E-Invoice Cancelled',
          color: 'error',
          icon: <Cancel style={{ fontSize: 16 }} />,
        };
      default:
        return {
          label: 'E-Invoice Pending',
          color: 'default',
          icon: <HourglassEmpty style={{ fontSize: 16 }} />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <Tooltip title={irn ? `IRN: ${irn}` : 'E-Invoice not yet generated'}>
        <Chip
          icon={config.icon}
          label={config.label}
          color={config.color}
          size="small"
          variant={status === 'NOT_GENERATED' ? 'outlined' : 'filled'}
          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
        />
      </Tooltip>

      {ewayBillNo && (
        <Tooltip title={`E-Way Bill #: ${ewayBillNo}`}>
          <Chip
            icon={<LocalShipping style={{ fontSize: 16 }} />}
            label={`E-Way Bill: ${ewayBillNo.substring(0, 10)}...`}
            color="primary"
            size="small"
            variant="filled"
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        </Tooltip>
      )}

      {irn && status === 'GENERATED' && (
        <Box component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace' }}>
          IRN: {irn.substring(0, 8)}...{irn.substring(irn.length - 6)}
        </Box>
      )}
    </Stack>
  );
}
