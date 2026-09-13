import React from 'react';
import { Button, Tooltip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

/**
 * Exports a payments array to a CSV file and triggers a browser download.
 *
 * Props:
 *   payments  — array of payment objects (required)
 *   filename  — base filename without date suffix or extension (default "payments")
 *   disabled  — force-disable the button regardless of payments length
 *   sx        — additional MUI sx styles
 *   size      — MUI Button size (default "small")
 *   variant   — MUI Button variant (default "outlined")
 */
const PaymentExportButton = ({
  payments = [],
  filename = 'payments',
  disabled = false,
  sx = {},
  size = 'small',
  variant = 'outlined',
}) => {
  const isDisabled = disabled || !payments.length;

  const handleExport = () => {
    if (isDisabled) return;

    const headers = [
      'Date',
      'Invoice / Type',
      'Amount (INR)',
      'Method',
      'Transaction ID',
      'Status',
    ];

    const rows = payments.map((p) => [
      new Date(p.paymentDate).toLocaleString('en-IN'),
      p.invoiceNumber || 'Account Advance',
      Number(p.amount || 0).toFixed(2),
      p.paymentMethod || '',
      p.transactionId || p.reference || '-',
      p.status || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    const blob = new Blob(['﻿' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Tooltip title={isDisabled ? 'No payments to export' : 'Export current page to CSV'} arrow>
      {/* <span> wrapper keeps tooltip active when button is disabled */}
      <span>
        <Button
          size={size}
          variant={variant}
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
          disabled={isDisabled}
          aria-label="Export payments to CSV"
          tabIndex={0}
          sx={{ textTransform: 'none', fontWeight: 700, ...sx }}
        >
          Export CSV
        </Button>
      </span>
    </Tooltip>
  );
};

export default PaymentExportButton;
