/**
 * CustomerPaymentPage.jsx  — v2 (complete redesign)
 *
 * Production-grade, mobile-first payment hub.
 *
 * Layout:
 *   xs–sm  : Full-width stacked cards, bottom-style tabs in the header
 *   md+    : Container-constrained, tabbed (New Payment | History)
 *
 * Sections:
 *   1. Page header  — title, quick-stats (PaymentStatsCards), refresh
 *   2. Tab: "New Payment" — PaymentWizard (3-step)
 *   3. Tab: "History"     — PaymentHistory (filters + DataGrid)
 *
 * Features:
 *   - Loading skeletons instead of spinners
 *   - Toast notifications (bottom-right Snackbar)
 *   - Keyboard shortcut: Ctrl+P / Cmd+P => switch to New Payment tab
 *   - URL param  ?saleId=  pre-selects a specific invoice
 *   - Optimistic success notification (shows before history re-fetches)
 */

import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from 'react';
import {
  Box, Button, Tabs, Tab, Snackbar, Alert, Container,
  Typography, Stack, IconButton, Tooltip, Divider, alpha,
  Skeleton, Chip, useMediaQuery, Fab,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Icons
import ArrowBackIcon          from '@mui/icons-material/ArrowBack';
import RefreshIcon            from '@mui/icons-material/Refresh';
import PaymentsIcon           from '@mui/icons-material/Payments';
import HistoryIcon            from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloudDoneIcon          from '@mui/icons-material/CloudDone';
import SyncIcon               from '@mui/icons-material/Sync';
import FlashOnIcon            from '@mui/icons-material/FlashOn';

// Hooks & services
import { useAppPalette }              from '../../hooks/useAppPalette';
import usePaymentWebSocket            from '../../hooks/usePaymentWebSocket';
import useOfflineQueueReplay          from '../../hooks/useOfflineQueueReplay';
import {
  fetchSalesWithDue,
  fetchCustomers,
  recordDuePaymentsBatch,
  recordBulkPayment,
  fetchCustomerAdvanceBalance,
  fetchPaymentsSummary,
} from '../../services/api';

// Components
import PaymentWizard        from '../../components/payments/PaymentWizard';
import PaymentStatsCards    from '../../components/payments/PaymentStatsCards';
import PaymentHistory       from './PaymentHistory';
import QuickPaymentSheet    from '../../components/payments/QuickPaymentSheet';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Today's date as YYYY-MM-DD (used to fetch daily summary). */
const todayStr = () => new Date().toISOString().slice(0, 10);

/** Key for persisting recent-customer IDs in localStorage. */
const RECENT_KEY = 'recent_payment_customers_v1';
const MAX_RECENT  = 6;

function loadRecentIds() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw).slice(0, MAX_RECENT) : [];
  } catch { return []; }
}

function pushRecentId(id) {
  try {
    const prev = loadRecentIds().filter((x) => String(x) !== String(id));
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}

// ── Main Component ────────────────────────────────────────────────────────────

const CustomerPaymentPage = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSaleId  = searchParams.get('saleId');

  const palette     = useAppPalette();
  const muiTheme    = useTheme();
  const isMobile    = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // ── Tab ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState(0);

  // ── Data ─────────────────────────────────────────────────────────────────
  const [customers,      setCustomers]      = useState([]);
  const [allSales,       setAllSales]       = useState([]);
  const [advanceBalance, setAdvanceBalance] = useState(0);
  const [receivedToday,  setReceivedToday]  = useState(0);

  // ── UI ───────────────────────────────────────────────────────────────────
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState(null);
  const [syncing,        setSyncing]        = useState(false);
  const [lastSync,       setLastSync]       = useState(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [snackbar,       setSnackbar]       = useState({ open: false, message: '', severity: 'success' });

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [recentCustomerIds, setRecentCustomerIds] = useState(loadRecentIds);

  // Pre-selected customer from URL (used to seed wizard initial state)
  const [initialCustomer, setInitialCustomer] = useState(null);

  // Quick Payment Sheet (Phase 4A)
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);

  const hasInitializedFromUrl = useRef(false);

  // ── Currently selected customer (tracked for WS filtering) ───────────────
  // The wizard manages its own internal selectedCustomer; we mirror it here
  // via onCustomerChange so the WebSocket hook can filter to that customer.
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Stable ref so the WS effect closure always sees the latest value
  // without needing to be a dependency (avoids duplicate toast on customer swap).
  const selectedCustomerRef = useRef(selectedCustomer);
  useEffect(() => { selectedCustomerRef.current = selectedCustomer; }, [selectedCustomer]);

  // ── Real-time balance sync via WebSocket ──────────────────────────────────
  const {
    balanceUpdate,
    lastUpdate:  wsLastUpdate,
    isConnected: wsConnected,
  } = usePaymentWebSocket({ customerId: selectedCustomer?.id });

  // ── Pulse flag: true for 2 s after each live update ──────────────────────
  const [isUpdating,    setIsUpdating]    = useState(false);
  const updateTimerRef = useRef(null);

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalDue = useMemo(
    () => allSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0),
    [allSales]
  );

  /** Resolved customer objects for the quick-sheet's recent chips. */
  const recentCustomers = useMemo(
    () => recentCustomerIds
      .map((id) => customers.find((c) => String(c.id) === String(id)))
      .filter(Boolean),
    [recentCustomerIds, customers]
  );

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async (showSyncIndicator = false) => {
    if (showSyncIndicator) setSyncing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const today = todayStr();
      const [custRes, salesRes, summaryRes] = await Promise.allSettled([
        fetchCustomers(),
        fetchSalesWithDue(),
        fetchPaymentsSummary(today, today),
      ]);

      // ← Check if critical APIs failed
      const custFailed = custRes.status === 'rejected';
      const salesFailed = salesRes.status === 'rejected';

      // If all or critical APIs failed, show error page
      if (custFailed && salesFailed) {
        const errorMsg = custRes.reason?.message || 'Backend service unavailable';
        setLoadError({
          title: 'Connection Error',
          message: errorMsg.includes('network') || !errorMsg
            ? 'Unable to connect to backend. Please check your internet or contact support.'
            : errorMsg,
          canRetry: true,
        });
        return;
      }

      const custData  = custRes.status  === 'fulfilled' ? (custRes.value.data  || []) : [];
      const salesData = salesRes.status === 'fulfilled' ? (salesRes.value.data || []) : [];

      setCustomers(custData);
      setAllSales(salesData);

      if (summaryRes.status === 'fulfilled') {
        const summary = summaryRes.value?.data;
        const received = summary?.totalReceived ?? summary?.totalAmount ?? summary?.data?.totalReceived ?? 0;
        setReceivedToday(Number(received) || 0);
      }

      // Seed wizard with URL param on first load
      if (initialSaleId && !hasInitializedFromUrl.current) {
        const sale = salesData.find((s) => String(s.saleId) === String(initialSaleId));
        if (sale) {
          const cust = custData.find((c) => String(c.id) === String(sale.customerId));
          if (cust) setInitialCustomer(cust);
          hasInitializedFromUrl.current = true;
        }
      }

      setLastSync(new Date());
    } catch (err) {
      setLoadError({
        title: 'Something Went Wrong',
        message: err.message || 'Failed to load data. Please try again.',
        canRetry: true,
      });
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [initialSaleId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Advance balance (re-fetches when wizard customer changes) ─────────────
  // We pass a callback down to the wizard via onCustomerChange prop.
  const fetchAdvance = useCallback(async (customerId) => {
    if (!customerId) { setAdvanceBalance(0); return; }
    try {
      const res = await fetchCustomerAdvanceBalance(customerId);
      setAdvanceBalance(res?.data?.data ?? 0);
    } catch { /* non-critical */ }
  }, []);

  // ── Payment submission ────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (payload) => {
    setSubmitting(true);
    try {
      if (payload.isBulk) {
        await recordBulkPayment({
          customerId:    payload.customerId,
          totalAmount:   payload.amount,
          paymentMethod: payload.paymentMethod,
          paymentDate:   payload.paymentDate,
          notes:         payload.notes,
        });
      } else {
        await recordDuePaymentsBatch([{
          sourceId:      payload.saleId,
          sourceType:    'SALE',
          amount:        payload.amount,
          paymentMethod: payload.paymentMethod,
          paymentDate:   payload.paymentDate,
          customerId:    payload.customerId,
          transactionId: payload.transactionId,
          notes:         payload.notes,
        }]);
      }

      // Track customer as recent
      pushRecentId(payload.customerId);
      setRecentCustomerIds(loadRecentIds());

      setSnackbar({ open: true, message: `Payment of ₹${Number(payload.amount).toLocaleString('en-IN')} recorded successfully`, severity: 'success' });

      // Refresh background data
      loadData(true);
      fetchAdvance(payload.customerId);
      setHistoryRefreshKey((k) => k + 1);

      // Switch to history tab so user can see the new entry
      setTimeout(() => setTab(1), 800);

    } catch (err) {
      const msg = err.response?.data?.message || 'Transaction failed. Please try again.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
      throw err; // re-throw so wizard keeps showing (doesn't auto-advance)
    } finally {
      setSubmitting(false);
    }
  }, [loadData, fetchAdvance]);

  // ── Quick Payment Sheet submission (Phase 4A) ─────────────────────────────
  //
  // Called by QuickPaymentSheet.  Always a bulk allocation for speed.
  // The sheet handles offline queuing itself; this runs only when online.

  const handleQuickSubmit = useCallback(async (payload) => {
    await recordBulkPayment({
      customerId:    payload.customerId,
      totalAmount:   payload.amount,
      paymentMethod: payload.paymentMethod,
      paymentDate:   payload.paymentDate,
    });

    // Track recent customer & refresh
    pushRecentId(payload.customerId);
    setRecentCustomerIds(loadRecentIds());

    setSnackbar({
      open:     true,
      message:  `Quick payment of ₹${Number(payload.amount).toLocaleString('en-IN')} recorded for ${payload.customerName}`,
      severity: 'success',
    });

    loadData(true);
    setHistoryRefreshKey((k) => k + 1);

    // Navigate to history so the rep can see confirmation
    setTimeout(() => setTab(1), 600);
  }, [loadData]);

  // ── Keyboard shortcut: Ctrl/Cmd+P → New Payment ───────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setTab(0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Offline queue replay with auth validation (SECURITY) ──────────────────
  // When coming back online, replays queued payments but only if current user
  // matches the user who originally queued them. Clears queue on auth mismatch.
  useOfflineQueueReplay(async (item) => {
    try {
      await recordBulkPayment({
        customerId: item.customerId,
        totalAmount: item.amount,
        paymentMethod: item.paymentMethod,
        paymentDate: item.paymentDate,
      });
      setSnackbar({
        open: true,
        message: `Offline payment replayed: ₹${Number(item.amount).toLocaleString('en-IN')} for ${item.customerName}`,
        severity: 'success',
      });
      loadData(true);
      setHistoryRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('[Offline Replay] Failed:', err);
      setSnackbar({
        open: true,
        message: `Failed to replay offline payment. Manual entry may be required.`,
        severity: 'error',
      });
    }
  });

  // ── React to real-time payment events ─────────────────────────────────────
  // Triggers only when a new WS event arrives (object identity changes).
  // Uses a ref for selectedCustomer so swapping customers doesn't cause a
  // spurious re-run that would show a duplicate toast.
  useEffect(() => {
    if (!balanceUpdate) return;

    // Update advance balance when the event is for the selected customer
    const newAdvance =
      balanceUpdate.newAdvanceBalance ??
      balanceUpdate.newBalance         ??
      balanceUpdate.advanceBalance     ??
      null;

    const sc = selectedCustomerRef.current;
    if (newAdvance !== null && sc &&
        String(balanceUpdate.customerId) === String(sc.id)) {
      setAdvanceBalance(Number(newAdvance));
    }

    // Update individual sale's remaining due if the event carries one
    if (balanceUpdate.saleId != null && balanceUpdate.dueAmount !== undefined) {
      setAllSales((prev) =>
        prev.map((s) =>
          String(s.saleId) === String(balanceUpdate.saleId)
            ? { ...s, dueAmount: Number(balanceUpdate.dueAmount) }
            : s
        )
      );
    }

    // Subtle "Balance updated" toast (info severity — not alarming)
    setSnackbar({ open: true, message: 'Balance updated', severity: 'info' });

    // Trigger pulse animation for 2 s
    setIsUpdating(true);
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => setIsUpdating(false), 2000);
  }, [balanceUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup pulse timer on unmount
  useEffect(
    () => () => { if (updateTimerRef.current) clearTimeout(updateTimerRef.current); },
    []
  );

  // ── Sync status label ─────────────────────────────────────────────────────

  const syncLabel = useMemo(() => {
    if (syncing) return 'Syncing…';
    if (!lastSync) return null;
    const diff = Math.floor((Date.now() - lastSync.getTime()) / 60000);
    if (diff < 1) return 'Just synced';
    if (diff < 60) return `${diff}m ago`;
    return lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }, [syncing, lastSync]);

  // ── Error Page ────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <Box
        sx={{
          bgcolor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: 500,
          }}
        >
          <Box
            sx={{
              fontSize: 64,
              mb: 2,
              color: palette.error,
            }}
          >
            ⚠️
          </Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {loadError.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            {loadError.message}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
            {loadError.canRetry && (
              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  setLoadError(null);
                  loadData();
                }}
                sx={{ minWidth: 160 }}
              >
                Try Again
              </Button>
            )}
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
              sx={{ minWidth: 160 }}
            >
              Go Home
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            If the problem persists, please contact support.
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
      // Keyboard shortcut hint for screen readers
      aria-label="Customer Payments page"
    >
      {/* Visually-hidden live region: announces real-time balance updates to screen readers */}
      <Box
        aria-live="polite"
        aria-atomic="true"
        role="status"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
          p: 0,
          m: -1,
        }}
      >
        {balanceUpdate ? 'Balance updated in real time' : ''}
      </Box>

      {/* ══ PAGE HEADER ══════════════════════════════════════════════════════ */}
      <Box
        component="header"
        sx={{
          background: palette.headerGradient,
          color: '#fff',
          boxShadow: `0 4px 24px ${alpha(palette.primary, 0.25)}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3, md: 4 } }}>

          {/* Top row: back + title + refresh */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ pt: { xs: 2, md: 2.5 }, pb: 1.5 }}
            spacing={1}
          >
            {/* Back */}
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              aria-label="Go back"
              sx={{
                color: '#fff',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.9rem',
                minHeight: 44,
                borderRadius: 2,
                px: 1.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', transform: 'translateX(-2px)' },
                transition: 'all 0.2s ease',
              }}
            >
              {isMobile ? '' : 'Back'}
            </Button>

            {/* Title + icon */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, justifyContent: { xs: 'flex-start', sm: 'center' }, pl: { xs: 0.5, sm: 0 } }}>
              <Box
                aria-hidden="true"
                sx={{
                  p: 0.875,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 22, color: '#fff' }} />
              </Box>
              <Box>
                <Typography
                  component="h1"
                  variant="h6"
                  fontWeight={900}
                  sx={{ color: '#fff', lineHeight: 1.1, fontSize: { xs: '1rem', sm: '1.15rem' }, letterSpacing: '-0.3px' }}
                >
                  Customer Payments
                </Typography>
                {syncLabel && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    aria-live="polite"
                    aria-atomic="true"
                    role="status"
                  >
                    {syncing
                      ? <SyncIcon aria-hidden="true" sx={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
                      : <CloudDoneIcon aria-hidden="true" sx={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }} />
                    }
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                      {syncLabel}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>

            {/* Refresh */}
            <Tooltip title="Refresh data (Ctrl+R)" arrow>
              <IconButton
                size="small"
                onClick={() => loadData(true)}
                disabled={syncing || loading}
                aria-label="Refresh payment data"
                sx={{
                  color: '#fff',
                  minWidth: 44,
                  minHeight: 44,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', transform: 'rotate(180deg)' },
                  '&:disabled': { color: 'rgba(255,255,255,0.4)' },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Stats row — skeleton while loading */}
          <Box sx={{ pb: 2 }} role="region" aria-label="Summary statistics">
            {loading ? (
              <Stack direction="row" spacing={1.5} aria-label="Loading statistics" aria-busy="true">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    height={72}
                    sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}
                    aria-hidden="true"
                  />
                ))}
              </Stack>
            ) : (
              <Stack
                direction="row"
                spacing={{ xs: 1, sm: 1.5 }}
                sx={{ overflowX: 'auto', pb: 0.5 }}
                aria-live="polite"
                aria-atomic="false"
              >
                {/* Mini stat chips in header (compact version) */}
                <StatChip
                  label="Total Due"
                  value={`₹${Number(totalDue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  color="#fca5a5"
                  bg="rgba(239,68,68,0.18)"
                />
                <StatChip
                  label="Today"
                  value={`₹${Number(receivedToday).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  color="#86efac"
                  bg="rgba(34,197,94,0.18)"
                />
                <StatChip
                  label="Advance"
                  value={`₹${Number(advanceBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  color="#93c5fd"
                  bg="rgba(59,130,246,0.18)"
                />
              </Stack>
            )}
          </Box>

          {/* Tab bar */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            aria-label="Payment page sections"
            sx={{
              minHeight: 46,
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.65)',
                fontWeight: 700,
                textTransform: 'none',
                minHeight: 46,
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                transition: 'color 0.2s ease',
                minWidth: { xs: 100, sm: 140 },
                '&:hover': { color: 'rgba(255,255,255,0.9)' },
                '&.Mui-selected': { color: '#fff' },
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#fff',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              icon={<PaymentsIcon fontSize="small" />}
              iconPosition="start"
              label="New Payment"
              id="tab-new-payment"
              aria-controls="tabpanel-new-payment"
            />
            <Tab
              icon={<HistoryIcon fontSize="small" />}
              iconPosition="start"
              label="History"
              id="tab-history"
              aria-controls="tabpanel-history"
            />
          </Tabs>
        </Container>
      </Box>

      {/* ══ PAGE BODY ════════════════════════════════════════════════════════ */}
      <Box component="main" sx={{ flex: 1, py: { xs: 3, md: 4 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>

          {/* Stats cards (full detail below header, not just chips) */}
          <PaymentStatsCards
            totalDue={totalDue}
            receivedToday={receivedToday}
            advanceBalance={advanceBalance}
            loading={loading}
            lastUpdate={wsLastUpdate}
            isLive={wsConnected}
            isUpdating={isUpdating}
            selectedCustomer={selectedCustomer}
          />

          {/* Tab panels */}
          {/* Tab 0: New Payment */}
          <Box
            role="tabpanel"
            id="tabpanel-new-payment"
            aria-labelledby="tab-new-payment"
            hidden={tab !== 0}
          >
            {tab === 0 && (
              loading ? (
                <WizardSkeleton />
              ) : (
                <PaymentWizard
                  key={`wizard-${initialCustomer?.id || 'new'}`}
                  customers={customers}
                  allSales={allSales}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                  recentCustomerIds={recentCustomerIds}
                  initialCustomer={initialCustomer}
                  initialSaleId={initialSaleId}
                  onCustomerChange={setSelectedCustomer}
                />
              )
            )}
          </Box>

          {/* Tab 1: Payment History */}
          <Box
            role="tabpanel"
            id="tabpanel-history"
            aria-labelledby="tab-history"
            hidden={tab !== 1}
          >
            {tab === 1 && (
              <PaymentHistory
                customerId={null}
                refreshKey={historyRefreshKey}
              />
            )}
          </Box>
        </Container>
      </Box>

      {/* ══ QUICK ENTRY FAB (Phase 4A) ═══════════════════════════════════════ */}
      {/*
        Visible on all screen sizes but especially useful on mobile.
        Positioned bottom-right, above the safe-area inset on iOS.
        Hides when the QuickPaymentSheet is open to avoid visual clutter.
      */}
      {!quickSheetOpen && (
        <Fab
          variant="extended"
          color="primary"
          onClick={() => setQuickSheetOpen(true)}
          aria-label="Open quick payment entry"
          sx={{
            position: 'fixed',
            bottom: `max(24px, env(safe-area-inset-bottom, 24px))`,
            right: 24,
            zIndex: 1200,
            borderRadius: 3,
            fontWeight: 900,
            fontSize: '0.88rem',
            textTransform: 'none',
            letterSpacing: '0.2px',
            gap: 0.75,
            minHeight: 50,
            px: 2.5,
            boxShadow: `0 6px 20px ${alpha(palette.primary, 0.45)}`,
            background: `linear-gradient(135deg, ${palette.primaryDark} 0%, ${palette.primary} 60%, ${palette.tealLight} 100%)`,
            color: '#fff',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 10px 28px ${alpha(palette.primary, 0.55)}`,
              background: `linear-gradient(135deg, ${palette.primaryDark} 0%, ${palette.primary} 60%, ${palette.tealLight} 100%)`,
            },
            '&:active': { transform: 'translateY(0)' },
          }}
        >
          <FlashOnIcon sx={{ fontSize: 18 }} />
          Quick Entry
        </Fab>
      )}

      {/* ══ QUICK PAYMENT SHEET (Phase 4A) ══════════════════════════════════ */}
      <QuickPaymentSheet
        open={quickSheetOpen}
        onClose={() => setQuickSheetOpen(false)}
        onSubmit={handleQuickSubmit}
        recentCustomers={recentCustomers}
        customers={customers}
      />

      {/* ══ TOAST NOTIFICATIONS ══════════════════════════════════════════════ */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          role="status"
          aria-live={snackbar.severity === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
          sx={{
            borderRadius: 2.5,
            fontSize: '0.9rem',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            '& .MuiAlert-icon': { fontSize: '1.3rem', alignSelf: 'center' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Compact colored stat chip in the header strip. */
const StatChip = ({ label, value, color, bg }) => (
  <Box
    role="group"
    aria-label={`${label}: ${value}`}
    sx={{
      px: 1.5,
      py: 0.875,
      borderRadius: 2,
      bgcolor: bg,
      border: `1px solid ${alpha(color, 0.35)}`,
      flexShrink: 0,
      backdropFilter: 'blur(8px)',
    }}
  >
    <Typography aria-hidden="true" variant="caption" sx={{ color: alpha(color, 0.85), fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
      {label}
    </Typography>
    <Typography aria-hidden="true" variant="subtitle2" sx={{ color, fontWeight: 900, fontSize: '0.9rem', lineHeight: 1.2 }}>
      {value}
    </Typography>
  </Box>
);

/** Skeleton placeholder shown while initial data loads in the wizard panel. */
const WizardSkeleton = () => (
  <Box sx={{ maxWidth: 640, mx: 'auto' }}>
    {/* Stepper skeleton */}
    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
      {[1, 2, 3].map((i) => (
        <Stack key={i} alignItems="center" spacing={1} sx={{ flex: 1, maxWidth: 120 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={60} height={16} />
        </Stack>
      ))}
    </Stack>

    {/* Step card skeleton */}
    <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2 }} />

    {/* Navigation buttons skeleton */}
    <Stack direction="row" justifyContent="flex-end">
      <Skeleton variant="rounded" width={140} height={48} sx={{ borderRadius: 2.5 }} />
    </Stack>
  </Box>
);

export default CustomerPaymentPage;
