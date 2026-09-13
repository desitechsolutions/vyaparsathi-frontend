/**
 * PaymentAllocationGrid.jsx
 *
 * Multi-invoice payment allocation table for Phase 2B.
 * Shows all open invoices for the selected customer and lets
 * the user distribute a single payment amount across them.
 *
 * Props:
 *   customerSales      {Array}    All sales for the selected customer (dueAmount > 0 = open)
 *   totalPayment       {number}   Total payment amount entered by the user
 *   onAllocationChange {Function} Called with allocations array: [{ saleId, amount }]
 *
 * Desktop: full table with sticky header.
 * Mobile  : vertical card stack (breakpoint < sm).
 * Accessible: ARIA labels, 44px touch targets, keyboard navigation.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  alpha,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';

import ClearAllIcon from '@mui/icons-material/ClearAll';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { useAppPalette } from '../../hooks/useAppPalette';

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** Percentage of the due amount being covered (0–100, capped). */
const calcPct = (allocated, due) => {
  if (!due || due <= 0) return 0;
  return Math.min(100, Math.round((allocated / due) * 100));
};

/** Color-coded chip label for the partial-pay percentage. */
const PctChip = ({ pct, theme }) => {
  if (pct <= 0) return null;
  const full = pct >= 100;
  return (
    <Chip
      label={full ? 'Full' : `${pct}%`}
      size="small"
      sx={{
        height: 20,
        fontSize: '0.68rem',
        fontWeight: 800,
        bgcolor: full ? alpha('#059669', 0.12) : alpha(theme.primary, 0.1),
        color: full ? '#059669' : theme.primary,
        border: `1px solid ${full ? alpha('#059669', 0.25) : alpha(theme.primary, 0.2)}`,
        px: 0.25,
      }}
    />
  );
};

// ── Desktop table row ──────────────────────────────────────────────────────────

const DesktopRow = ({
  sale,
  checked,
  allocationAmount,
  remaining,
  onToggle,
  onAmountChange,
  theme,
}) => {
  const pct = calcPct(allocationAmount, sale.dueAmount);
  const isOver = allocationAmount > sale.dueAmount + 0.001;

  return (
    <TableRow
      hover
      selected={checked}
      sx={{
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        '&.Mui-selected': {
          bgcolor: alpha(theme.primary, 0.05),
          '&:hover': { bgcolor: alpha(theme.primary, 0.08) },
        },
      }}
      onClick={() => onToggle(sale.saleId)}
      role="row"
    >
      {/* Checkbox */}
      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          onChange={() => onToggle(sale.saleId)}
          size="small"
          inputProps={{
            'aria-label': `Select invoice ${sale.invoiceNo}`,
          }}
          sx={{
            color: alpha(theme.primary, 0.4),
            '&.Mui-checked': { color: theme.primary },
          }}
        />
      </TableCell>

      {/* Invoice # */}
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <ReceiptLongIcon sx={{ fontSize: 14, color: theme.primary, flexShrink: 0 }} />
          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem' }}>
            {sale.invoiceNo || `#${sale.saleId}`}
          </Typography>
        </Stack>
      </TableCell>

      {/* Due Date */}
      <TableCell>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          {fmtDate(sale.saleDate)}
        </Typography>
      </TableCell>

      {/* Amount Due */}
      <TableCell align="right">
        <Typography
          variant="body2"
          fontWeight={800}
          sx={{ fontSize: '0.85rem', color: '#dc2626' }}
        >
          {fmt(sale.dueAmount)}
        </Typography>
      </TableCell>

      {/* Allocation input */}
      <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ minWidth: 130 }}>
        <TextField
          size="small"
          type="number"
          value={allocationAmount === 0 && !checked ? '' : allocationAmount || ''}
          disabled={!checked}
          error={isOver}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            const val = parseFloat(raw);
            onAmountChange(sale.saleId, isNaN(val) ? 0 : Math.max(0, val));
          }}
          onKeyDown={(e) => {
            if (['-', 'e', 'E'].includes(e.key)) e.preventDefault();
          }}
          inputProps={{
            min: 0,
            step: 'any',
            'aria-label': `Allocation amount for invoice ${sale.invoiceNo}`,
            style: { textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', padding: '6px 8px' },
          }}
          sx={{
            width: 120,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              bgcolor: checked ? 'background.paper' : alpha('#000', 0.03),
              '& fieldset': {
                borderColor: isOver ? 'error.main' : alpha(theme.primary, 0.25),
              },
              '&:hover fieldset': {
                borderColor: isOver ? 'error.main' : theme.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: isOver ? 'error.main' : theme.primary,
                borderWidth: 2,
              },
            },
          }}
          placeholder="0.00"
        />
      </TableCell>

      {/* Partial % */}
      <TableCell align="center">
        <PctChip pct={pct} theme={theme} />
      </TableCell>

      {/* Remaining after allocation */}
      <TableCell align="right">
        {checked && allocationAmount > 0 ? (
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              fontSize: '0.8rem',
              color: isOver ? '#dc2626' : '#059669',
            }}
          >
            {isOver
              ? `-${fmt(allocationAmount - sale.dueAmount)}`
              : fmt(Math.max(0, sale.dueAmount - allocationAmount))}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.8rem' }}>
            —
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
};

// ── Mobile card ────────────────────────────────────────────────────────────────

const MobileCard = ({
  sale,
  checked,
  allocationAmount,
  onToggle,
  onAmountChange,
  theme,
}) => {
  const pct = calcPct(allocationAmount, sale.dueAmount);
  const isOver = allocationAmount > sale.dueAmount + 0.001;

  return (
    <Paper
      elevation={0}
      sx={{
        border: `2px solid`,
        borderColor: checked ? theme.primary : alpha(theme.primary, 0.15),
        borderRadius: 2.5,
        bgcolor: checked ? alpha(theme.primary, 0.03) : 'background.paper',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 1.5, py: 1.25, cursor: 'pointer' }}
        onClick={() => onToggle(sale.saleId)}
      >
        <Checkbox
          checked={checked}
          onChange={() => onToggle(sale.saleId)}
          size="small"
          onClick={(e) => e.stopPropagation()}
          inputProps={{ 'aria-label': `Select invoice ${sale.invoiceNo}` }}
          sx={{
            p: 0.5,
            color: alpha(theme.primary, 0.4),
            '&.Mui-checked': { color: theme.primary },
          }}
        />
        <ReceiptLongIcon sx={{ fontSize: 15, color: theme.primary }} />
        <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: '0.83rem', flex: 1 }}>
          {sale.invoiceNo || `#${sale.saleId}`}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
          {fmtDate(sale.saleDate)}
        </Typography>
      </Stack>

      {/* Due amount + input row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          px: 1.5,
          pb: 1.25,
          borderTop: checked ? `1px solid ${alpha(theme.primary, 0.12)}` : 'none',
          pt: checked ? 1.25 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block' }}>
            DUE
          </Typography>
          <Typography variant="body2" fontWeight={900} sx={{ color: '#dc2626', fontSize: '0.9rem' }}>
            {fmt(sale.dueAmount)}
          </Typography>
        </Box>

        {checked && (
          <>
            <Box sx={{ flex: 1, maxWidth: 140 }}>
              <TextField
                size="small"
                type="number"
                fullWidth
                value={allocationAmount || ''}
                error={isOver}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, '');
                  const val = parseFloat(raw);
                  onAmountChange(sale.saleId, isNaN(val) ? 0 : Math.max(0, val));
                }}
                onKeyDown={(e) => {
                  if (['-', 'e', 'E'].includes(e.key)) e.preventDefault();
                }}
                inputProps={{
                  min: 0,
                  step: 'any',
                  'aria-label': `Allocation amount for invoice ${sale.invoiceNo}`,
                  style: { textAlign: 'right', fontWeight: 700, fontSize: '0.85rem' },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': { borderColor: isOver ? 'error.main' : alpha(theme.primary, 0.3) },
                    '&:hover fieldset': { borderColor: isOver ? 'error.main' : theme.primary },
                    '&.Mui-focused fieldset': { borderColor: isOver ? 'error.main' : theme.primary, borderWidth: 2 },
                  },
                }}
                placeholder="0.00"
              />
            </Box>
            <PctChip pct={pct} theme={theme} />
          </>
        )}
      </Stack>
    </Paper>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

/**
 * PaymentAllocationGrid
 *
 * Props:
 *   customerSales      {Array}    Sales array from the wizard state
 *   totalPayment       {number}   Total payment amount (from wizard Step 2 input)
 *   onAllocationChange {Function} (allocations: [{saleId, amount}]) => void
 */
const PaymentAllocationGrid = ({ customerSales = [], totalPayment = 0, onAllocationChange }) => {
  const theme = useAppPalette();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // Set of saleId strings that are selected
  const [selected, setSelected] = useState(new Set());
  // Map saleId -> allocated amount (number)
  const [amounts, setAmounts] = useState({});

  // Only open invoices are allocatable
  const openSales = useMemo(
    () => customerSales.filter((s) => (s.dueAmount || 0) > 0),
    [customerSales]
  );

  // Derived totals
  const totalAllocated = useMemo(() => {
    let sum = 0;
    selected.forEach((id) => {
      sum += parseFloat(amounts[id] || 0);
    });
    return sum;
  }, [selected, amounts]);

  const excessAmount = useMemo(
    () => Math.max(0, totalAllocated - totalPayment),
    [totalAllocated, totalPayment]
  );

  const remainingToAllocate = useMemo(
    () => Math.max(0, totalPayment - totalAllocated),
    [totalPayment, totalAllocated]
  );

  const isOverAllocated = totalAllocated > totalPayment + 0.001;

  // Notify parent whenever selection/amounts change
  useEffect(() => {
    const allocations = [];
    selected.forEach((id) => {
      const amt = parseFloat(amounts[id] || 0);
      if (amt > 0) allocations.push({ saleId: id, amount: amt });
    });
    onAllocationChange?.(allocations);
  }, [selected, amounts, onAllocationChange]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggle = useCallback((saleId) => {
    const sid = String(saleId);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) {
        next.delete(sid);
        // Clear amount when deselecting
        setAmounts((a) => {
          const n = { ...a };
          delete n[sid];
          return n;
        });
      } else {
        next.add(sid);
      }
      return next;
    });
  }, []);

  const handleAmountChange = useCallback((saleId, value) => {
    const sid = String(saleId);
    setAmounts((prev) => ({ ...prev, [sid]: value }));
  }, []);

  const handleAllocateAll = useCallback(() => {
    const newSelected = new Set();
    const newAmounts = {};
    openSales.forEach((s) => {
      newSelected.add(String(s.saleId));
      newAmounts[String(s.saleId)] = parseFloat(s.dueAmount.toFixed(2));
    });
    setSelected(newSelected);
    setAmounts(newAmounts);
  }, [openSales]);

  const handleClearAll = useCallback(() => {
    setSelected(new Set());
    setAmounts({});
  }, []);

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      const newSelected = new Set(openSales.map((s) => String(s.saleId)));
      setSelected(newSelected);
    } else {
      setSelected(new Set());
      setAmounts({});
    }
  }, [openSales]);

  const allSelected = openSales.length > 0 && selected.size === openSales.length;
  const someSelected = selected.size > 0 && selected.size < openSales.length;

  // ── Empty state ────────────────────────────────────────────────────────────

  if (openSales.length === 0) {
    return (
      <Alert
        severity="success"
        sx={{ borderRadius: 2, fontSize: '0.85rem' }}
      >
        No open invoices found for this customer. Any payment will be held as advance credit.
      </Alert>
    );
  }

  // ── Footer summary ─────────────────────────────────────────────────────────

  const renderFooter = () => (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2.5,
        border: `1.5px solid ${isOverAllocated ? alpha('#dc2626', 0.3) : alpha(theme.primary, 0.2)}`,
        bgcolor: isOverAllocated
          ? alpha('#dc2626', 0.03)
          : alpha(theme.primary, 0.03),
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.82rem' }}>
            Total Payment
          </Typography>
          <Typography variant="body2" fontWeight={800} sx={{ fontSize: '0.88rem' }}>
            {fmt(totalPayment)}
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.82rem' }}>
            Total Allocated
          </Typography>
          <Typography
            variant="body2"
            fontWeight={800}
            sx={{ fontSize: '0.88rem', color: isOverAllocated ? '#dc2626' : theme.primary }}
          >
            {fmt(totalAllocated)}
          </Typography>
        </Stack>

        {!isOverAllocated && remainingToAllocate > 0.001 && (
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.82rem' }}>
              Unallocated (advance)
            </Typography>
            <Typography variant="body2" fontWeight={800} sx={{ fontSize: '0.88rem', color: '#d97706' }}>
              {fmt(remainingToAllocate)}
            </Typography>
          </Stack>
        )}

        {excessAmount > 0.001 && (
          <>
            <Divider sx={{ my: 0.25 }} />
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <InfoOutlinedIcon sx={{ fontSize: 15, color: '#d97706', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontSize: '0.76rem', color: '#d97706', fontWeight: 600 }}>
                Amount exceeding due: {fmt(excessAmount)} (will become advance)
              </Typography>
            </Stack>
          </>
        )}
      </Stack>

      {isOverAllocated && (
        <Alert
          severity="error"
          icon={<WarningAmberIcon fontSize="small" />}
          sx={{ mt: 1.5, borderRadius: 2, fontSize: '0.78rem', py: 0.5 }}
        >
          Total allocated ({fmt(totalAllocated)}) exceeds payment amount ({fmt(totalPayment)}). Reduce allocations to continue.
        </Alert>
      )}
    </Paper>
  );

  // ── Action buttons ─────────────────────────────────────────────────────────

  const renderActions = () => (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
        onClick={handleAllocateAll}
        aria-label="Allocate full due amount to all invoices"
        sx={{
          minHeight: 36,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.78rem',
          borderColor: alpha(theme.primary, 0.4),
          color: theme.primary,
          '&:hover': { borderColor: theme.primary, bgcolor: alpha(theme.primary, 0.05) },
        }}
      >
        Allocate All
      </Button>

      <Button
        variant="outlined"
        size="small"
        startIcon={<ClearAllIcon sx={{ fontSize: 16 }} />}
        onClick={handleClearAll}
        disabled={selected.size === 0}
        aria-label="Clear all allocations"
        sx={{
          minHeight: 36,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.78rem',
          borderColor: alpha('#dc2626', 0.4),
          color: '#dc2626',
          '&:hover': { borderColor: '#dc2626', bgcolor: alpha('#dc2626', 0.04) },
          '&:disabled': { borderColor: 'divider', color: 'text.disabled' },
        }}
      >
        Clear
      </Button>

      {selected.size > 0 && (
        <Chip
          label={`${selected.size} invoice${selected.size !== 1 ? 's' : ''} selected`}
          size="small"
          sx={{
            height: 28,
            fontSize: '0.75rem',
            fontWeight: 700,
            bgcolor: alpha(theme.primary, 0.08),
            color: theme.primary,
            border: `1px solid ${alpha(theme.primary, 0.2)}`,
            alignSelf: 'center',
          }}
        />
      )}
    </Stack>
  );

  // ── Mobile layout ──────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <Box>
        {renderActions()}
        <Stack spacing={1.5}>
          {openSales.map((sale) => (
            <MobileCard
              key={sale.saleId}
              sale={sale}
              checked={selected.has(String(sale.saleId))}
              allocationAmount={parseFloat(amounts[String(sale.saleId)] || 0)}
              onToggle={handleToggle}
              onAmountChange={handleAmountChange}
              theme={theme}
            />
          ))}
        </Stack>
        {renderFooter()}
      </Box>
    );
  }

  // ── Desktop table layout ───────────────────────────────────────────────────

  const headerCellSx = {
    fontWeight: 800,
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'text.secondary',
    bgcolor: alpha(theme.primary, 0.04),
    borderBottom: `2px solid ${alpha(theme.primary, 0.15)}`,
    whiteSpace: 'nowrap',
    py: 1.25,
  };

  return (
    <Box>
      {renderActions()}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: `1.5px solid ${alpha(theme.primary, 0.15)}`,
          borderRadius: 2.5,
          overflow: 'hidden',
          '& .MuiTableCell-root': {
            borderColor: alpha(theme.primary, 0.1),
          },
        }}
      >
        <Table size="small" aria-label="Invoice allocation table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={headerCellSx}>
                <Tooltip title={allSelected ? 'Deselect all' : 'Select all'} placement="top">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={handleSelectAll}
                    size="small"
                    inputProps={{ 'aria-label': 'Select all open invoices' }}
                    sx={{
                      color: alpha(theme.primary, 0.4),
                      '&.Mui-checked': { color: theme.primary },
                      '&.MuiCheckbox-indeterminate': { color: theme.primary },
                    }}
                  />
                </Tooltip>
              </TableCell>
              <TableCell sx={headerCellSx}>Invoice #</TableCell>
              <TableCell sx={headerCellSx}>Date</TableCell>
              <TableCell align="right" sx={headerCellSx}>Amount Due</TableCell>
              <TableCell align="right" sx={headerCellSx}>Allocate (₹)</TableCell>
              <TableCell align="center" sx={headerCellSx}>Partial</TableCell>
              <TableCell align="right" sx={headerCellSx}>Balance Left</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {openSales.map((sale) => (
              <DesktopRow
                key={sale.saleId}
                sale={sale}
                checked={selected.has(String(sale.saleId))}
                allocationAmount={parseFloat(amounts[String(sale.saleId)] || 0)}
                remaining={Math.max(0, sale.dueAmount - parseFloat(amounts[String(sale.saleId)] || 0))}
                onToggle={handleToggle}
                onAmountChange={handleAmountChange}
                theme={theme}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {renderFooter()}
    </Box>
  );
};

export default PaymentAllocationGrid;
