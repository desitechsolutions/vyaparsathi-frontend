import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  alpha,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';

import { useAppPalette } from '../../hooks/useAppPalette';
import { usePaymentFilters } from '../../hooks/usePaymentFilters';
import AdvancedPaymentFilter from '../../components/payments/AdvancedPaymentFilter';
import ReceiptDownloadButton from '../../components/payments/ReceiptDownloadButton';
import PaymentExportButton from '../../components/payments/PaymentExportButton';
import RefundDialog from '../../components/payments/RefundDialog';
import PaymentMethodBadge from '../../components/payments/PaymentMethodBadge';
import PaymentStatusBadge from '../../components/payments/PaymentStatusBadge';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** "23 Aug, 14:30" */
const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  const day = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${day}, ${time}`;
};

// ── Column factory ────────────────────────────────────────────────────────────

const buildColumns = (customTheme, onRefundClick) => [
  {
    field: 'paymentDate',
    headerName: 'Date & Time',
    width: 165,
    minWidth: 140,
    renderCell: ({ value }) => (
      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.84rem', letterSpacing: '-0.1px' }}>
        {formatDate(value)}
      </Typography>
    ),
  },
  {
    field: 'customerName',
    headerName: 'Customer',
    flex: 1,
    minWidth: 130,
    sortable: false,
    renderCell: ({ value, row }) => {
      const name = value || row.customer?.name || '';
      return name ? (
        <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.84rem' }}>
          {name}
        </Typography>
      ) : <Typography variant="caption" color="text.secondary">—</Typography>;
    },
  },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 130,
    minWidth: 100,
    type: 'number',
    headerAlign: 'right',
    align: 'right',
    renderCell: ({ value }) => (
      <Typography variant="body2" fontWeight={900} sx={{ color: customTheme.success, fontSize: '0.9rem', letterSpacing: '-0.2px' }}>
        {formatCurrency(value)}
      </Typography>
    ),
  },
  {
    field: 'paymentMethod',
    headerName: 'Method',
    width: 135,
    minWidth: 100,
    sortable: false,
    renderCell: ({ value }) => value ? <PaymentMethodBadge method={value} /> : <Typography variant="caption" color="text.secondary">—</Typography>,
  },
  {
    field: 'reference',
    headerName: 'Reference',
    flex: 1,
    minWidth: 130,
    sortable: false,
    renderCell: ({ value, row }) => {
      const ref = value || row.transactionId || '';
      return (
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.79rem',
            color: ref ? customTheme.textPrimary : customTheme.textSecondary,
            letterSpacing: '0.1px',
          }}
        >
          {ref || '—'}
        </Typography>
      );
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    minWidth: 100,
    sortable: false,
    renderCell: ({ value }) => value ? <PaymentStatusBadge status={value} showIcon /> : <Typography variant="caption" color="text.secondary">—</Typography>,
  },
  {
    field: '_actions',
    headerName: 'Actions',
    width: 96,
    minWidth: 80,
    sortable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: ({ row }) => (
      <Stack direction="row" spacing={0.25} justifyContent="center">
        <ReceiptDownloadButton
          paymentId={row.id}
          invoiceNumber={row.invoiceNumber}
          sx={{ color: customTheme.primary }}
        />
        <Tooltip title="Refund this payment" arrow>
          <span>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onRefundClick(row);
              }}
              disabled={!row.id || Number(row.amount) <= 0}
              aria-label="Refund payment"
              sx={{
                color: customTheme.danger || '#dc2626',
                minWidth: 32,
                minHeight: 32,
                '&:hover': { bgcolor: alpha('#dc2626', 0.08) },
              }}
            >
              <ReplayIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    ),
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * PaymentHistory
 *
 * Self-contained payment history panel for a single customer.
 * All data-fetching is handled internally via usePaymentFilters.
 *
 * Props:
 *   customerId  {string|number|null}  The customer whose payments to display.
 *   refreshKey  {number}              Increment from the parent to force a re-fetch
 *                                     (e.g. after recording a new payment).
 */
const PaymentHistory = ({ customerId, refreshKey = 0 }) => {
  const customTheme = useAppPalette();

  const {
    payments,
    filters,
    setFilters,
    page,
    setPage,
    rowsPerPage,
    loading,
    total,
    refetch,
    snackbar,
    handleSnackbarClose,
  } = usePaymentFilters(customerId);

  // Respond to refreshKey bumps from the parent without calling refetch on mount.
  const prevRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (prevRefreshKey.current !== refreshKey) {
      prevRefreshKey.current = refreshKey;
      refetch();
    }
  }, [refreshKey, refetch]);

  const [refundTarget, setRefundTarget] = React.useState(null);

  const columns = buildColumns(customTheme, setRefundTarget);

  const dataGridSx = {
    border: 'none',
    fontFamily: 'inherit',
    '& .MuiDataGrid-columnHeaders': {
      bgcolor: alpha(customTheme.primary, 0.05),
      fontWeight: 800,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      borderBottom: `2px solid ${alpha(customTheme.primary, 0.18)}`,
      color: customTheme.textPrimary,
      minHeight: '44px !important',
    },
    '& .MuiDataGrid-columnHeader': {
      minHeight: '44px !important',
    },
    '& .MuiDataGrid-cell': {
      borderBottom: `1px solid ${alpha(customTheme.primary, 0.07)}`,
      display: 'flex',
      alignItems: 'center',
      minHeight: '52px !important',
    },
    '& .MuiDataGrid-row': {
      minHeight: '52px !important',
      transition: 'background-color 0.15s ease',
    },
    '& .MuiDataGrid-row:hover': {
      bgcolor: alpha(customTheme.primary, 0.04),
    },
    '& .MuiDataGrid-row.Mui-selected': {
      bgcolor: alpha(customTheme.primary, 0.06),
      '&:hover': { bgcolor: alpha(customTheme.primary, 0.08) },
    },
    '& .MuiDataGrid-footerContainer': {
      borderTop: `1.5px solid ${alpha(customTheme.primary, 0.12)}`,
      bgcolor: alpha(customTheme.primary, 0.02),
      minHeight: '52px',
    },
    '& .MuiTablePagination-root': {
      color: customTheme.textPrimary,
      '& .MuiTablePagination-displayedRows': { fontSize: '0.82rem' },
    },
    '& .MuiDataGrid-virtualScroller': {
      minHeight: 200,
    },
    overflowX: 'auto',
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1.5px solid ${alpha(customTheme.primary, 0.14)}`,
        overflow: 'hidden',
        boxShadow: `0 2px 8px ${alpha(customTheme.primary, 0.06)}`,
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: `0 4px 16px ${alpha(customTheme.primary, 0.1)}`,
        },
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 1.75, md: 2 },
          borderBottom: `1.5px solid ${alpha(customTheme.primary, 0.12)}`,
          background: `linear-gradient(135deg, ${alpha(customTheme.primary, 0.04)} 0%, transparent 100%)`,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
        >
          {/* Title + count */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              aria-hidden="true"
              sx={{
                p: 1,
                borderRadius: 1.5,
                bgcolor: alpha(customTheme.primary, 0.1),
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <HistoryIcon sx={{ fontSize: 20, color: customTheme.primary }} />
            </Box>
            <Box>
              <Typography
                component="h2"
                variant="h6"
                fontWeight={800}
                color={customTheme.textPrimary}
                sx={{ fontSize: '0.95rem', lineHeight: 1.2 }}
              >
                Payment History
              </Typography>
              <Typography
                variant="caption"
                color={customTheme.textSecondary}
                sx={{ fontSize: '0.72rem' }}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {loading
                  ? 'Loading…'
                  : `${total.toLocaleString('en-IN')} record${total !== 1 ? 's' : ''}${customerId ? '' : ' across all customers'}`}
              </Typography>
            </Box>
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            <PaymentExportButton
              payments={payments}
              filename={`payments_${customerId ? `customer_${customerId}` : 'all'}_${new Date().toISOString().slice(0, 10)}`}
              disabled={loading || !payments.length}
              sx={{
                borderColor: alpha(customTheme.success, 0.4),
                color: customTheme.success,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.82rem',
                minHeight: 36,
                borderRadius: 2,
                '&:hover': {
                  borderColor: customTheme.success,
                  bgcolor: alpha(customTheme.success, 0.06),
                },
              }}
            />
            <Tooltip title="Refresh history" arrow>
              <IconButton
                size="small"
                onClick={refetch}
                disabled={loading}
                aria-label="Refresh payment history"
                sx={{
                  color: customTheme.primary,
                  bgcolor: alpha(customTheme.primary, 0.08),
                  minWidth: 36,
                  minHeight: 36,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    bgcolor: alpha(customTheme.primary, 0.15),
                    transform: 'rotate(180deg)',
                  },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <AdvancedPaymentFilter
        filters={filters}
        onFiltersChange={setFilters}
        loading={loading}
      />

      {/* ── DataGrid ─────────────────────────────────────────────── */}
      <Box
        sx={{ bgcolor: 'background.paper', width: '100%', overflowX: 'auto' }}
        role="region"
        aria-label="Payment history table"
      >
        <DataGrid
          rows={payments}
          columns={columns}
          getRowId={(row) => row.id}
          aria-label={loading ? 'Payment history, loading' : `Payment history, ${total} records`}

          // Server-side pagination
          paginationMode="server"
          rowCount={total}
          page={page}
          pageSize={rowsPerPage}
          onPageChange={setPage}
          rowsPerPageOptions={[10, 20, 50]}

          loading={loading}
          disableSelectionOnClick
          autoHeight
          density="standard"

          components={{
            NoRowsOverlay: () => (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1.5}
                sx={{ height: '100%', minHeight: 240, py: 6 }}
              >
                <Box sx={{
                  p: 2.5,
                  borderRadius: '50%',
                  bgcolor: alpha(customTheme.primary, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <HistoryIcon sx={{ fontSize: 44, color: alpha(customTheme.primary, 0.35) }} />
                </Box>
                <Typography variant="body1" color={customTheme.textPrimary} fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                  No payments found
                </Typography>
                <Typography variant="body2" color={customTheme.textSecondary} sx={{ maxWidth: 280, textAlign: 'center', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {customerId
                    ? 'Try adjusting your filters or date range to see more records'
                    : 'No payment records match the current filters'}
                </Typography>
              </Stack>
            ),
          }}

          sx={dataGridSx}
        />
      </Box>

      {/* ── Refund Dialog ────────────────────────────────────────── */}
      <RefundDialog
        open={refundTarget !== null}
        payment={refundTarget}
        onClose={() => setRefundTarget(null)}
        onSuccess={() => {
          setRefundTarget(null);
          refetch();
        }}
      />

      {/* ── Error Snackbar (wired from usePaymentFilters) ────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={handleSnackbarClose}
          role="status"
          aria-live={snackbar.severity === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default PaymentHistory;
