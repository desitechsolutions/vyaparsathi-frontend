import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Paper, Typography, Container, Stack, Chip, Button, TextField,
  InputAdornment, LinearProgress, Alert, Avatar, Autocomplete, Skeleton,
  Tooltip, IconButton, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, List, ListItem, ListItemAvatar, ListItemText,
  Popover, useMediaQuery,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Search as SearchIcon,
  AccountBalanceWallet as WalletIcon,
  ShoppingCart as CartIcon,
  LocalShipping as SupplierIcon,
  Inventory as InventoryIcon,
  FilterAltOff as FilterAltOffIcon,
  History as HistoryIcon,
  Speed as SpeedIcon,
  AutoAwesome as SuggestIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  NotificationsPaused as SnoozeIcon,
  NotificationsActive as UnsnoozeIcon,
  FileDownloadOutlined as FileDownloadIcon,
  BookmarkBorder as ViewsIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Tune as TuneIcon,
  Rule as RuleIcon,
} from '@mui/icons-material';

import {
  fetchLowStockAlerts, bulkPatchItemVariants, getSuppliers,
  snoozeAlert, listActiveSnoozes, listSavedViews, saveSavedView, deleteSavedView,
} from '../services/api';
import { useAlerts } from '../context/AlertContext';
import CustomToolbar from './items/components/CustomToolbar';

const formatInr = (val) =>
  Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

// Snooze duration — 24 h wall-clock; server stores per-user snoozedUntil timestamp.
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000;

// Safe JSON parse used when reading payloadJson fields from saved-view server responses.
const safeParseJson = (str) => {
  try { return JSON.parse(str) || {}; } catch { return {}; }
};

// KPI cell — same convention inlined on ItemsPage / Stock. Kept local per
// project pattern; extraction waits for a fourth consumer.
const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box sx={{
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    borderRight: divider ? '1px solid' : 'none',
    borderColor: 'divider',
  }}>
    <Box sx={{
      display: 'inline-flex', p: 1, borderRadius: 1,
      bgcolor: alpha(color, 0.1), color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}
        sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} color="text.primary"
        sx={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

// ── 30-day stockout timeline ─────────────────────────────────────────
// Compact horizontal SVG strip that plots each alert's predicted stockout
// day within the next 30 days. Multiple variants on the same day stack as
// a taller bar so a critical cluster is visible at a glance. Clicking a
// day filters the grid to those variants — the enterprise "what's about
// to hurt me" jump-off. Kept as an inline SVG so the page doesn't need to
// depend on a chart library.
const TIMELINE_WINDOW_DAYS = 30;

const TimelineForecast = ({ alerts, theme, onSelectDay, selectedDay, onClear }) => {
  const buckets = useMemo(() => {
    const map = new Map();
    for (const a of alerts) {
      const d = a.daysOfSupply;
      if (d == null) continue;
      // Clamp to [0, TIMELINE_WINDOW_DAYS]. Anything already out (negative)
      // goes into day 0; anything beyond the window is skipped.
      if (d > TIMELINE_WINDOW_DAYS) continue;
      const day = Math.max(0, Number(d));
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(a);
    }
    return map;
  }, [alerts]);

  const maxCount = useMemo(() => {
    let m = 0;
    for (const list of buckets.values()) if (list.length > m) m = list.length;
    return m;
  }, [buckets]);

  if (buckets.size === 0) return null;

  // Layout math — 30 columns evenly spaced. Each column can grow up to
  // MAX_BAR_HEIGHT px vertically scaled against maxCount so one hot day
  // doesn't visually flatten the rest.
  const COL_WIDTH = 100 / (TIMELINE_WINDOW_DAYS + 1); // percent
  const MAX_BAR_HEIGHT = 32;
  const today = new Date();

  const dayLabel = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <Box sx={{
      p: 2, borderRadius: 2,
      border: '1px solid', borderColor: 'divider',
      bgcolor: 'background.paper', mb: 2,
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
          STOCKOUT FORECAST · NEXT {TIMELINE_WINDOW_DAYS} DAYS
        </Typography>
        {selectedDay != null && (
          <Button size="small" onClick={onClear}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
            Clear day filter
          </Button>
        )}
      </Stack>
      <Box sx={{ position: 'relative', height: MAX_BAR_HEIGHT + 20 }}>
        {[...buckets.entries()].map(([day, list]) => {
          const h = maxCount > 0 ? Math.max(4, (list.length / maxCount) * MAX_BAR_HEIGHT) : 4;
          const color = day <= 3 ? theme.palette.error.main
            : day <= 7 ? theme.palette.warning.main
            : theme.palette.info.main;
          const isSel = selectedDay === day;
          return (
            <Tooltip
              key={day}
              title={`${dayLabel(day)} · ${list.length} variant${list.length === 1 ? '' : 's'}`}
              arrow>
              <Box
                onClick={() => onSelectDay(day)}
                sx={{
                  position: 'absolute',
                  left: `${day * COL_WIDTH}%`,
                  bottom: 20,
                  width: `${COL_WIDTH * 0.7}%`,
                  height: h,
                  bgcolor: color,
                  opacity: isSel ? 1 : selectedDay != null ? 0.35 : 0.85,
                  borderRadius: 0.5,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s, transform 0.15s',
                  outline: isSel ? `2px solid ${color}` : 'none',
                  outlineOffset: 2,
                  '&:hover': { opacity: 1, transform: 'scaleY(1.05)' },
                }}
              />
            </Tooltip>
          );
        })}
        {/* Axis ticks — today, +7, +14, +21, +30 */}
        {[0, 7, 14, 21, 30].map((d) => (
          <Typography
            key={d}
            variant="caption"
            sx={{
              position: 'absolute',
              left: `${d * COL_WIDTH}%`,
              bottom: 0,
              transform: 'translateX(-30%)',
              color: 'text.disabled',
              fontSize: '0.65rem',
              whiteSpace: 'nowrap',
            }}>
            {d === 0 ? 'Today' : `+${d}d`}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

const FilterChip = ({ active, onClick, label, count, color }) => (
  <Chip
    label={
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        {label}
        <Box component="span" sx={{ opacity: 0.7, fontWeight: 500 }}>{count}</Box>
      </Box>
    }
    size="small" onClick={onClick} clickable
    variant={active ? 'filled' : 'outlined'}
    sx={{
      fontWeight: 600, borderRadius: 1,
      bgcolor: active ? (color || 'primary.main') : 'transparent',
      color: active ? 'common.white' : 'text.primary',
      borderColor: color || 'divider',
      '&:hover': {
        bgcolor: active
          ? (color || 'primary.main')
          : (color ? alpha(color, 0.08) : 'action.hover'),
      },
    }}
  />
);

const LowStockAlerts = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { manuallySetAlerts } = useAlerts();

  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [snoozeMap, setSnoozeMap] = useState({});
  const [showSnoozed, setShowSnoozed] = useState(false);

  // Saved views state
  const [savedViews, setSavedViews] = useState([]);
  const [viewsAnchor, setViewsAnchor] = useState(null);
  const [newViewName, setNewViewName] = useState('');

  // Bulk edit dialog state (V79 — 2c/2e)
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkPatch, setBulkPatch] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  // Rules info popover state (per-row)
  const [rulesAnchor, setRulesAnchor] = useState(null);
  const [rulesRow, setRulesRow] = useState(null);

  // Timeline day filter — set by clicking a bar in the forecast strip;
  // narrows the grid to variants stocking out on that specific day.
  const [timelineDay, setTimelineDay] = useState(null);

  // Load suppliers lazily — only when the bulk edit dialog opens for the
  // first time. Keeps the initial page render lean and lets shops without
  // suppliers still use the rest of the page.
  useEffect(() => {
    if (bulkEditOpen && suppliers.length === 0) {
      getSuppliers()
        .then((res) => setSuppliers(Array.isArray(res) ? res : []))
        .catch(() => setSuppliers([]));
    }
  }, [bulkEditOpen, suppliers.length]);

  // Load active snoozes from server on mount — persisted per-user so the
  // same snooze state is visible across devices and browser sessions.
  useEffect(() => {
    listActiveSnoozes('LOW_STOCK')
      .then((data) => {
        const map = {};
        const now = Date.now();
        for (const s of (Array.isArray(data) ? data : [])) {
          const expiresAt = new Date(s.snoozedUntil).getTime();
          if (expiresAt > now) map[s.alertKey] = expiresAt;
        }
        setSnoozeMap(map);
      })
      .catch(() => {}); // snooze is best-effort; failure = empty map
  }, []);

  // Load saved views from server on mount.
  useEffect(() => {
    listSavedViews('low_stock')
      .then((data) => {
        setSavedViews(
          (Array.isArray(data) ? data : []).map((v) => ({
            id: v.id,
            name: v.name,
            ...safeParseJson(v.payloadJson),
          }))
        );
      })
      .catch(() => {});
  }, []);

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [supplierFilter, setSupplierFilter] = useState(null);
  const [levelFilter, setLevelFilter] = useState('ALL'); // ALL | CRITICAL | LOW | WITH_SUPPLIER | ON_ORDER
  const searchInputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchLowStockAlerts();
      const data = Array.isArray(response.data) ? response.data : [];
      // DataGrid needs a stable `id` — variantId is unique per row here.
      setAlerts(data.map((a) => ({ ...a, id: a.itemVariantId })));
      if (manuallySetAlerts) manuallySetAlerts(data);
    } catch (err) {
      setError(t('lowStockPage.noAlerts'));
    } finally {
      setIsLoading(false);
    }
  }, [manuallySetAlerts, t]);

  useEffect(() => { load(); }, [load]);

  // ⌘K / Ctrl+K focuses the search input — matches Stock / ItemsPage.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const supplierOptions = useMemo(() => {
    const set = new Set();
    alerts.forEach((a) => { if (a.supplierName) set.add(a.supplierName); });
    return Array.from(set).sort();
  }, [alerts]);

  const stats = useMemo(() => {
    return alerts.reduce((acc, a) => {
      // Use the BE-computed suggestion (which nets on-order) when available;
      // fall back to the raw threshold gap. Keeps the KPI honest with what
      // the buyer sees in the Investment column.
      const needed = a.suggestedOrderQty != null
        ? Number(a.suggestedOrderQty)
        : Math.max(0, Number(a.threshold || 0) - Number(a.currentStock || 0));
      const cost = needed * Number(a.lastPurchasePrice || 0);
      const onOrderVal = Number(a.quantityOnOrder || 0) * Number(a.lastPurchasePrice || 0);
      return {
        total: acc.total + 1,
        critical: acc.critical + (a.alertLevel === 'CRITICAL' ? 1 : 0),
        onOrder: acc.onOrder + Number(a.quantityOnOrder || 0),
        onOrderValue: acc.onOrderValue + onOrderVal,
        cost: acc.cost + cost,
      };
    }, { total: 0, critical: 0, onOrder: 0, onOrderValue: 0, cost: 0 });
  }, [alerts]);

  const chipCounts = useMemo(() => ({
    ALL: alerts.length,
    CRITICAL: alerts.filter((a) => a.alertLevel === 'CRITICAL').length,
    LOW: alerts.filter((a) => a.alertLevel === 'LOW').length,
    WITH_SUPPLIER: alerts.filter((a) => a.supplierName).length,
    ON_ORDER: alerts.filter((a) => Number(a.quantityOnOrder || 0) > 0).length,
    A: alerts.filter((a) => a.abcClass === 'A').length,
    B: alerts.filter((a) => a.abcClass === 'B').length,
    C: alerts.filter((a) => a.abcClass === 'C').length,
  }), [alerts]);

  const hasFilters = Boolean(searchText || supplierFilter || levelFilter !== 'ALL' || timelineDay != null);

  const clearAllFilters = () => {
    setSearchText('');
    setSupplierFilter(null);
    setLevelFilter('ALL');
    setTimelineDay(null);
  };

  // Declared here (not below with the other helpers) because the
  // `filteredAlerts`, `selectionGroups`, and `snoozedCount` memos below
  // reference these — `const` declarations sit in the TDZ until the line
  // runs, so touching them later in the file crashes render.
  const isSnoozed = (variantId) => {
    const exp = snoozeMap[String(variantId)];
    return typeof exp === 'number' && exp > Date.now();
  };

  // Preferred reorder quantity for a row — velocity-aware suggestedOrderQty
  // when available, otherwise the raw threshold-gap. Centralised so the
  // Restock button, Investment column, CSV export, and selectionGroups
  // memo stay consistent.
  const preferredReorderQty = (row) => {
    if (row.suggestedOrderQty != null) return Number(row.suggestedOrderQty);
    return Math.max(0, Number(row.threshold || 0) - Number(row.currentStock || 0));
  };

  const filteredAlerts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return alerts
      .filter((a) => {
        // Snooze filter runs first — hidden by default unless the toggle
        // is on, in which case only snoozed rows show (matches Gmail
        // "Snoozed" folder semantics).
        const snoozed = isSnoozed(a.itemVariantId);
        if (showSnoozed) {
          if (!snoozed) return false;
        } else if (snoozed) {
          return false;
        }
        if (q) {
          const hay = `${a.itemName || ''} ${a.sku || ''} ${a.supplierName || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (supplierFilter && a.supplierName !== supplierFilter) return false;
        if (levelFilter === 'CRITICAL' && a.alertLevel !== 'CRITICAL') return false;
        if (levelFilter === 'LOW' && a.alertLevel !== 'LOW') return false;
        if (levelFilter === 'WITH_SUPPLIER' && !a.supplierName) return false;
        if (levelFilter === 'ON_ORDER' && !(Number(a.quantityOnOrder || 0) > 0)) return false;
        if (levelFilter === 'A' && a.abcClass !== 'A') return false;
        if (levelFilter === 'B' && a.abcClass !== 'B') return false;
        if (levelFilter === 'C' && a.abcClass !== 'C') return false;
        if (timelineDay != null) {
          const d = a.daysOfSupply;
          if (d == null) return false;
          const clamped = Math.max(0, Number(d));
          if (clamped !== timelineDay) return false;
        }
        return true;
      })
      .sort((a, b) => (a.alertLevel === 'CRITICAL' ? -1 : 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, searchText, supplierFilter, levelFilter, snoozeMap, showSnoozed, timelineDay]);

  // Groups the current selection by supplier so a bulk order creates one
  // draft PO per supplier rather than a single mixed PO the buyer would
  // have to split by hand. Rows without a supplier land in the "Unassigned"
  // bucket the user can still process manually.
  const selectionGroups = useMemo(() => {
    if (selection.length === 0) return [];
    const selected = alerts.filter((a) => selection.includes(a.itemVariantId));
    const map = new Map();
    for (const a of selected) {
      const key = a.supplierId != null ? String(a.supplierId) : 'UNASSIGNED';
      if (!map.has(key)) {
        map.set(key, {
          supplierId: a.supplierId ?? null,
          supplierName: a.supplierName || 'Unassigned',
          variants: [],
          totalCost: 0,
        });
      }
      const g = map.get(key);
      g.variants.push(a);
      g.totalCost += preferredReorderQty(a) * Number(a.lastPurchasePrice || 0);
    }
    return Array.from(map.values())
      .sort((x, y) => (x.supplierName || '').localeCompare(y.supplierName || ''));
  }, [selection, alerts]);

  const handleBulkOrderClick = () => {
    if (selection.length === 0) return;
    if (selectionGroups.length === 1) {
      const only = selectionGroups[0];
      navigate(buildBulkPoUrl(only));
      return;
    }
    setBulkDialogOpen(true);
  };

  const buildBulkPoUrl = (group) => {
    const ids = group.variants.map((v) => v.itemVariantId).join(',');
    const supplierPart = group.supplierId != null ? `&supplierId=${group.supplierId}` : '';
    return `/purchase-orders/bulk?ids=${ids}${supplierPart}`;
  };

  // Opens each supplier group in its own tab so buyers can review and confirm
  // each draft independently. Matches NetSuite / Cin7 behavior — a single
  // navigation would flatten the split back into one PO.
  const createAllDrafts = () => {
    let opened = 0;
    for (const g of selectionGroups) {
      const w = window.open(buildBulkPoUrl(g), '_blank', 'noopener,noreferrer');
      if (w) opened += 1;
    }
    setBulkDialogOpen(false);
    setSelection([]);
    if (opened < selectionGroups.length) {
      setError('Your browser blocked some pop-ups — enable pop-ups for this site to open every draft at once.');
    } else {
      setSuccessMsg(`Opened ${opened} draft POs, one per supplier.`);
    }
  };

  const goToSingleRestock = (variantId, qty) => {
    navigate(`/purchase-orders/?variantId=${variantId}&qty=${qty}`);
  };

  const snoozeVariant = async (variantId) => {
    const snoozedUntil = new Date(Date.now() + SNOOZE_DURATION_MS);
    // Update local state immediately for instant UI feedback.
    setSnoozeMap((prev) => ({ ...prev, [String(variantId)]: snoozedUntil.getTime() }));
    setSuccessMsg('Alert snoozed for 24 hours.');
    try {
      await snoozeAlert({
        alertType: 'LOW_STOCK',
        alertKey: String(variantId),
        // Backend expects LocalDateTime — strip Z and ms so Java can parse it.
        snoozedUntil: snoozedUntil.toISOString().slice(0, 19),
      });
    } catch {
      // Revert on server failure so a reload doesn't show a phantom snooze.
      setSnoozeMap((prev) => {
        const next = { ...prev };
        delete next[String(variantId)];
        return next;
      });
    }
  };

  const unsnoozeVariant = async (variantId) => {
    // Remove from local state immediately.
    setSnoozeMap((prev) => {
      const next = { ...prev };
      delete next[String(variantId)];
      return next;
    });
    try {
      // Overwrite with a past snoozedUntil so the server also considers it expired.
      await snoozeAlert({
        alertType: 'LOW_STOCK',
        alertKey: String(variantId),
        snoozedUntil: new Date(Date.now() - 60_000).toISOString().slice(0, 19),
      });
    } catch {
      // Best-effort; local state is already correct.
    }
  };

  const snoozedCount = useMemo(
    () => alerts.filter((a) => isSnoozed(a.itemVariantId)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alerts, snoozeMap],
  );

  // Client-side CSV — same pattern the redesigned ItemsPage uses. Escapes
  // the RFC-4180 rule set (double-quote wrap, doubled-quote for embedded ").
  const csvEscape = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportCsv = () => {
    if (filteredAlerts.length === 0) {
      setError('Nothing to export — clear filters or wait for alerts to load.');
      return;
    }
    const header = [
      'SKU', 'Product', 'Alert Level', 'ABC', 'Trend',
      'Current Stock', 'Threshold', 'Unit',
      'Supplier', 'On Order', 'Avg Daily Sales', 'Days Of Supply',
      'Stockout Date', 'Suggested Qty', 'Last Unit Cost', 'Investment Needed',
    ];
    const stockoutIso = (days) => {
      if (days == null) return '';
      const d = new Date();
      d.setDate(d.getDate() + Number(days));
      return d.toISOString().split('T')[0];
    };
    const lines = filteredAlerts.map((a) => {
      const suggested = preferredReorderQty(a);
      const investment = suggested * Number(a.lastPurchasePrice || 0);
      return [
        a.sku, a.itemName, a.alertLevel,
        a.abcClass || '',
        a.salesTrend || '',
        a.currentStock, a.threshold, a.unit,
        a.supplierName || '',
        a.quantityOnOrder || 0,
        a.avgDailySales != null ? Number(a.avgDailySales).toFixed(2) : '',
        a.daysOfSupply != null ? a.daysOfSupply : '',
        stockoutIso(a.daysOfSupply),
        suggested,
        a.lastPurchasePrice != null ? Number(a.lastPurchasePrice).toFixed(2) : '',
        investment.toFixed(2),
      ].map(csvEscape).join(',');
    });
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `low_stock_alerts_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMsg(`Exported ${filteredAlerts.length} alerts to CSV.`);
  };

  const applyView = (view) => {
    setSearchText(view.searchText || '');
    setSupplierFilter(view.supplierFilter || null);
    setLevelFilter(view.levelFilter || 'ALL');
    setViewsAnchor(null);
    setSuccessMsg(`Loaded view "${view.name}".`);
  };

  const saveCurrentView = async () => {
    const name = newViewName.trim();
    if (!name) return;
    const payloadJson = JSON.stringify({ searchText, supplierFilter, levelFilter });
    const existing = savedViews.find((v) => v.name === name);
    try {
      const saved = await saveSavedView({
        ...(existing?.id ? { id: existing.id } : {}),
        surface: 'low_stock',
        name,
        payloadJson,
      });
      setSavedViews((prev) => [
        ...prev.filter((v) => v.name !== name),
        { id: saved.id, name: saved.name, ...safeParseJson(saved.payloadJson) },
      ]);
      setNewViewName('');
      setSuccessMsg(`Saved view "${name}".`);
    } catch {
      setError('Failed to save view. Please try again.');
    }
  };

  const deleteView = async (name) => {
    const target = savedViews.find((v) => v.name === name);
    // Optimistic update — remove from UI immediately.
    setSavedViews((prev) => prev.filter((v) => v.name !== name));
    if (target?.id) {
      try {
        await deleteSavedView(target.id);
      } catch {
        // Restore the view if server delete failed.
        setSavedViews((prev) => [...prev, target]);
      }
    }
  };

  // Bulk edit — sends only the fields the user actually filled in so
  // untouched fields on the selected variants stay put.
  const submitBulkPatch = async () => {
    if (selection.length === 0) return;
    const payload = { ids: selection };
    const numeric = (v) => (v === '' || v == null ? undefined : Number(v));
    if (bulkPatch.lowStockThreshold !== undefined) payload.lowStockThreshold = numeric(bulkPatch.lowStockThreshold);
    if (bulkPatch.reorderPoint !== undefined) payload.reorderPoint = numeric(bulkPatch.reorderPoint);
    if (bulkPatch.reorderQty !== undefined) payload.reorderQty = numeric(bulkPatch.reorderQty);
    if (bulkPatch.safetyStock !== undefined) payload.safetyStock = numeric(bulkPatch.safetyStock);
    if (bulkPatch.maxStock !== undefined) payload.maxStock = numeric(bulkPatch.maxStock);
    if (bulkPatch.leadTimeDays !== undefined) payload.leadTimeDays = numeric(bulkPatch.leadTimeDays);
    if (bulkPatch.preferredSupplierId !== undefined) payload.preferredSupplierId = bulkPatch.preferredSupplierId;

    // Guard: if nothing was set, don't bother the server.
    const touched = Object.keys(payload).filter((k) => k !== 'ids' && payload[k] !== undefined);
    if (touched.length === 0) {
      setError('Set at least one field before saving.');
      return;
    }

    setBulkSaving(true);
    try {
      const res = await bulkPatchItemVariants(payload);
      const updated = res?.data?.updated ?? selection.length;
      setSuccessMsg(`Updated ${updated} variant${updated === 1 ? '' : 's'}.`);
      setBulkEditOpen(false);
      setBulkPatch({});
      setSelection([]);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk update failed. Please try again.');
    } finally {
      setBulkSaving(false);
    }
  };

  const openRulesPopover = (event, row) => {
    setRulesAnchor(event.currentTarget);
    setRulesRow(row);
  };

  const closeRulesPopover = () => {
    setRulesAnchor(null);
    setRulesRow(null);
  };

  // ── Columns ────────────────────────────────────────────────────────

  const columns = [
    {
      field: 'itemName',
      headerName: 'Product',
      flex: 1.5, minWidth: 240,
      renderCell: (params) => {
        const initials = (params.value || 'x').trim().slice(0, 1).toUpperCase();
        const level = params.row.alertLevel;
        const levelColor = level === 'CRITICAL' ? theme.palette.error.main
          : theme.palette.warning.main;
        // ABC badge — A / B / C from BE Pareto bucketing. Only render when
        // present so a new SKU with no history stays clean.
        const abc = params.row.abcClass;
        const abcColor = abc === 'A' ? theme.palette.error.main
          : abc === 'B' ? theme.palette.warning.main
          : abc === 'C' ? theme.palette.text.secondary
          : null;
        return (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5, width: '100%' }}>
            <Avatar variant="rounded"
              sx={{
                width: 36, height: 36, borderRadius: 1,
                bgcolor: alpha(levelColor, 0.15), color: levelColor, fontWeight: 700,
              }}>
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" fontWeight={700} noWrap>{params.value}</Typography>
                {abc && (
                  <Tooltip
                    title={abc === 'A'
                      ? 'Class A — top revenue contributor (focus first)'
                      : abc === 'B'
                        ? 'Class B — mid revenue contributor'
                        : 'Class C — long tail'}
                    arrow>
                    <Chip label={abc} size="small"
                      sx={{
                        height: 18, fontSize: '0.65rem', fontWeight: 800, borderRadius: 0.75,
                        bgcolor: alpha(abcColor, 0.15), color: abcColor,
                        border: '1px solid', borderColor: alpha(abcColor, 0.3),
                        '& .MuiChip-label': { px: 0.75 },
                      }} />
                  </Tooltip>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {params.row.sku}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      field: 'currentStock',
      headerName: 'Current / Threshold',
      flex: 1.1, minWidth: 180,
      renderCell: (params) => {
        const current = Number(params.value || 0);
        const threshold = Number(params.row.threshold || 0);
        const pct = threshold > 0 ? Math.min((current / threshold) * 100, 100) : 0;
        const level = params.row.alertLevel;
        const barColor = level === 'CRITICAL' ? 'error' : 'warning';
        return (
          <Tooltip title={`Restock target: ${threshold} ${params.row.unit || ''}`} arrow>
            <Box sx={{ width: '100%' }}>
              <Stack direction="row" justifyContent="space-between" mb={0.25}>
                <Typography variant="caption" fontWeight={700}>
                  {current} / {threshold} {params.row.unit || ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(pct)}%
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={pct} color={barColor}
                sx={{ height: 5, borderRadius: 2 }} />
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: 'supplierName',
      headerName: 'Supplier',
      flex: 1, minWidth: 160,
      renderCell: (params) => params.value
        ? (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <SupplierIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" noWrap>{params.value}</Typography>
          </Stack>
        )
        : <Typography variant="caption" color="text.disabled">— No supplier</Typography>,
    },
    {
      field: 'quantityOnOrder',
      headerName: 'On order',
      flex: 0.7, minWidth: 110,
      renderCell: (params) => {
        const qty = Number(params.value || 0);
        return qty > 0
          ? (
            <Chip size="small" label={`${qty} ${params.row.unit || ''}`}
              sx={{
                fontWeight: 700, borderRadius: 1,
                bgcolor: alpha(theme.palette.info.main, 0.12),
                color: theme.palette.info.main,
                border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.3),
              }} />
          )
          : <Typography variant="caption" color="text.disabled">—</Typography>;
      },
    },
    {
      field: 'avgDailySales',
      headerName: 'Velocity',
      flex: 1, minWidth: 160,
      renderCell: (params) => {
        const velocity = Number(params.value || 0);
        const days = params.row.daysOfSupply;
        if (velocity <= 0) {
          return <Typography variant="caption" color="text.disabled">No recent sales</Typography>;
        }
        const daysColor = days == null ? 'text.secondary'
          : days <= 3 ? 'error.main'
          : days <= 7 ? 'warning.main'
          : 'success.main';
        // Trend badge — UP means recent 15d sold faster than the prior 15d.
        // The buyer usually cares about UP the most: order sooner than the
        // formula recommends.
        const trend = params.row.salesTrend;
        let TrendIcon = null;
        let trendColor = theme.palette.text.secondary;
        let trendLabel = '';
        if (trend === 'UP') {
          TrendIcon = TrendingUpIcon;
          trendColor = theme.palette.error.main; // urgent — accelerating demand
          trendLabel = 'Accelerating';
        } else if (trend === 'DOWN') {
          TrendIcon = TrendingDownIcon;
          trendColor = theme.palette.success.main;
          trendLabel = 'Slowing';
        } else if (trend === 'FLAT') {
          TrendIcon = TrendingFlatIcon;
          trendLabel = 'Steady';
        }
        return (
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <SpeedIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={700}>
                {velocity.toFixed(velocity < 1 ? 2 : 1)}/day
              </Typography>
              {TrendIcon && (
                <Tooltip title={trendLabel} arrow>
                  <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
                </Tooltip>
              )}
            </Stack>
            {days != null && (
              <Typography variant="caption" sx={{ color: daysColor, fontWeight: 600 }}>
                Out in {days}d
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'stockoutDate',
      headerName: 'Stockout',
      flex: 0.8, minWidth: 120,
      // Derived column — `today + daysOfSupply`. Renders as a date pill
      // color-graded to match the velocity column so a buyer sees both
      // "runs out in Nd" and "on <date>" without doing the math.
      valueGetter: (params) => {
        const days = params.row?.daysOfSupply;
        if (days == null) return null;
        const d = new Date();
        d.setDate(d.getDate() + Number(days));
        // Store as YYYY-MM-DD so sort works chronologically.
        return d.toISOString().split('T')[0];
      },
      renderCell: (params) => {
        const days = params.row.daysOfSupply;
        if (days == null || !params.value) {
          return <Typography variant="caption" color="text.disabled">—</Typography>;
        }
        const color = days <= 3 ? theme.palette.error.main
          : days <= 7 ? theme.palette.warning.main
          : theme.palette.success.main;
        const date = new Date(params.value);
        const label = date.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short',
        });
        return (
          <Tooltip title={date.toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })} arrow>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25,
              borderRadius: 1, bgcolor: alpha(color, 0.12),
            }}>
              <Typography variant="caption" fontWeight={700} sx={{ color }}>
                {label}
              </Typography>
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: 'suggestedOrderQty',
      headerName: 'Suggested qty',
      flex: 0.9, minWidth: 130,
      renderCell: (params) => {
        const qty = Number(params.value || 0);
        if (qty <= 0) {
          return <Typography variant="caption" color="text.disabled">—</Typography>;
        }
        return (
          <Tooltip title="Recommended reorder based on threshold gap and 14-day sales cover" arrow>
            <Chip size="small"
              icon={<SuggestIcon sx={{ fontSize: 14 }} />}
              label={`${qty} ${params.row.unit || ''}`}
              sx={{
                fontWeight: 700, borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.25),
                '& .MuiChip-icon': { color: theme.palette.primary.main },
              }} />
          </Tooltip>
        );
      },
    },
    {
      field: 'lastPurchasePrice',
      headerName: 'Last unit cost',
      flex: 0.8, minWidth: 130,
      renderCell: (params) => params.value != null
        ? <Typography variant="body2" color="text.secondary">₹{formatInr(params.value)}</Typography>
        : <Typography variant="caption" color="text.disabled">—</Typography>,
    },
    {
      field: 'investment',
      headerName: 'Investment needed',
      flex: 1, minWidth: 160,
      // Uses the smarter suggestedOrderQty from the BE when available (which
      // factors in on-order + sales velocity), and falls back to the raw
      // threshold-gap for older payloads without the field.
      valueGetter: (params) => {
        const suggested = params.row?.suggestedOrderQty;
        const needed = suggested != null
          ? Number(suggested)
          : Math.max(0, Number(params.row?.threshold || 0) - Number(params.row?.currentStock || 0));
        return needed * Number(params.row?.lastPurchasePrice || 0);
      },
      renderCell: (params) => {
        const suggested = params.row.suggestedOrderQty;
        const needed = suggested != null
          ? Number(suggested)
          : Math.max(0, Number(params.row.threshold || 0) - Number(params.row.currentStock || 0));
        const value = params.value || 0;
        return (
          <Box>
            <Typography variant="body2" fontWeight={800} color="primary.main">
              ₹{formatInr(value)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              for {needed} {params.row.unit || 'units'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'alertLevel',
      headerName: 'Status',
      flex: 0.6, minWidth: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small"
          sx={{
            fontWeight: 800, fontSize: '0.65rem', borderRadius: 1, letterSpacing: 0.4,
          }}
          color={params.value === 'CRITICAL' ? 'error' : 'warning'} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.7, minWidth: 130,
      sortable: false, filterable: false,
      renderCell: (params) => {
        const qty = preferredReorderQty(params.row);
        const variantId = params.row.itemVariantId;
        const snoozed = isSnoozed(variantId);
        const row = params.row;
        // Show the rules icon only when at least one reorder rule is set —
        // an alert whose only signal is the legacy lowStockThreshold has
        // nothing extra to show.
        const hasRules = row.reorderPoint != null || row.reorderQty != null
          || row.safetyStock != null || row.maxStock != null
          || row.leadTimeDays != null || row.preferredSupplierName;
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Button variant="outlined" size="small" startIcon={<CartIcon fontSize="inherit" />}
              onClick={() => goToSingleRestock(variantId, qty)}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              {t('lowStockPage.restock') || 'Restock'}
            </Button>
            {hasRules && (
              <Tooltip title="Show reorder rules">
                <IconButton size="small" aria-label="Show reorder rules"
                  onClick={(e) => openRulesPopover(e, row)}>
                  <RuleIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={snoozed ? 'Unsnooze — return to active alerts' : 'Snooze for 24 hours'}>
              <IconButton size="small"
                aria-label={snoozed ? 'Unsnooze alert' : 'Snooze alert for 24 hours'}
                onClick={() => (snoozed ? unsnoozeVariant(variantId) : snoozeVariant(variantId))}>
                {snoozed
                  ? <UnsnoozeIcon fontSize="small" color="primary" />
                  : <SnoozeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  const dataGridSx = {
    border: 0,
    '& .MuiDataGrid-columnHeaders': {
      bgcolor: alpha(theme.palette.text.primary, 0.04),
      borderBottom: '1px solid', borderColor: 'divider',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 700, fontSize: '0.72rem',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
    '& .MuiDataGrid-row:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>

        {/* ── Header ────────────────────────────────────── */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between"
          alignItems={{ md: 'center' }} mb={2.5} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary"
              sx={{ letterSpacing: -0.4 }}>
              Low Stock Alerts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reorder variants whose on-hand quantity dropped below the configured threshold
              {stats.total > 0 ? ` · ${stats.total} alerts · ${stats.critical} critical` : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {snoozedCount > 0 && (
              <Button variant={showSnoozed ? 'contained' : 'outlined'} size="small"
                color={showSnoozed ? 'primary' : 'inherit'}
                startIcon={showSnoozed ? <UnsnoozeIcon /> : <SnoozeIcon />}
                onClick={() => setShowSnoozed((s) => !s)}
                sx={{
                  borderRadius: 1.5, fontWeight: 600, textTransform: 'none',
                  boxShadow: 'none',
                }}>
                {showSnoozed ? 'Active alerts' : `Snoozed (${snoozedCount})`}
              </Button>
            )}
            <Button variant="outlined" size="small" startIcon={<ViewsIcon />}
              onClick={(e) => setViewsAnchor(e.currentTarget)}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Views{savedViews.length > 0 ? ` (${savedViews.length})` : ''}
            </Button>
            <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />}
              onClick={exportCsv}
              disabled={filteredAlerts.length === 0}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Export CSV
            </Button>
            <Button variant="outlined" size="small" startIcon={<HistoryIcon />}
              onClick={() => navigate('/purchase-orders')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Purchase Orders
            </Button>
            {selection.length > 0 && (
              <Button variant="outlined" size="small" startIcon={<TuneIcon />}
                onClick={() => setBulkEditOpen(true)}
                sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
                Bulk Edit ({selection.length})
              </Button>
            )}
            {selection.length > 0 && (
              <Button variant="contained" size="small" startIcon={<CartIcon />}
                onClick={handleBulkOrderClick}
                sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
                Create Bulk Order ({selection.length})
              </Button>
            )}
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
            {error}
          </Alert>
        )}

        {/* ── KPI strip ─────────────────────────────────── */}
        <Paper elevation={0}
          sx={{
            border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}>
          <KpiCell icon={<InventoryIcon fontSize="small" />} label="TOTAL ALERTS"
            value={isLoading ? '—' : stats.total.toLocaleString('en-IN')}
            color={theme.palette.primary.main} divider />
          <KpiCell icon={<WarningIcon fontSize="small" />} label="CRITICAL"
            value={isLoading ? '—' : stats.critical}
            color={stats.critical > 0 ? theme.palette.error.main : theme.palette.text.secondary}
            divider />
          <KpiCell icon={<CartIcon fontSize="small" />} label="ON ORDER"
            value={isLoading ? '—' : `${stats.onOrder}`}
            color={stats.onOrder > 0 ? theme.palette.info.main : theme.palette.text.secondary}
            divider />
          <KpiCell icon={<WalletIcon fontSize="small" />} label="EST. REPLENISHMENT"
            value={isLoading ? '—' : `₹${formatInr(stats.cost)}`}
            color={theme.palette.success.main} />
        </Paper>

        {/* ── Stockout timeline forecast (Tier 3d) ──────── */}
        {!isLoading && alerts.length > 0 && (
          <TimelineForecast
            alerts={alerts}
            theme={theme}
            selectedDay={timelineDay}
            onSelectDay={(d) => setTimelineDay((prev) => (prev === d ? null : d))}
            onClear={() => setTimelineDay(null)}
          />
        )}

        {/* ── Grid + filters ────────────────────────────── */}
        <Paper elevation={0} sx={{
          borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Stack sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }} spacing={1.5}>
            {/* Row 1 — search + supplier */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}
              alignItems={{ md: 'center' }}>
              <TextField
                inputRef={searchInputRef}
                placeholder="Search name, SKU, or supplier  ·  ⌘K"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              <Autocomplete
                options={supplierOptions}
                value={supplierFilter}
                onChange={(_, v) => setSupplierFilter(v)}
                size="small"
                sx={{ minWidth: 220 }}
                renderInput={(p) => <TextField {...p} placeholder="All suppliers" />}
              />
              {hasFilters && (
                <Button size="small" startIcon={<FilterAltOffIcon fontSize="small" />}
                  onClick={clearAllFilters}
                  sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
                  Clear
                </Button>
              )}
            </Stack>

            {/* Row 2 — level chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" useFlexGap>
              <FilterChip active={levelFilter === 'ALL'} onClick={() => setLevelFilter('ALL')}
                label="All" count={chipCounts.ALL} />
              <FilterChip active={levelFilter === 'CRITICAL'} onClick={() => setLevelFilter('CRITICAL')}
                label="Critical" count={chipCounts.CRITICAL} color={theme.palette.error.main} />
              <FilterChip active={levelFilter === 'LOW'} onClick={() => setLevelFilter('LOW')}
                label="Low" count={chipCounts.LOW} color={theme.palette.warning.main} />
              <FilterChip active={levelFilter === 'WITH_SUPPLIER'}
                onClick={() => setLevelFilter('WITH_SUPPLIER')}
                label="With supplier" count={chipCounts.WITH_SUPPLIER} />
              <FilterChip active={levelFilter === 'ON_ORDER'}
                onClick={() => setLevelFilter('ON_ORDER')}
                label="On order" count={chipCounts.ON_ORDER} color={theme.palette.info.main} />
              {chipCounts.A > 0 && (
                <FilterChip active={levelFilter === 'A'}
                  onClick={() => setLevelFilter('A')}
                  label="Class A" count={chipCounts.A} color={theme.palette.error.main} />
              )}
              {chipCounts.B > 0 && (
                <FilterChip active={levelFilter === 'B'}
                  onClick={() => setLevelFilter('B')}
                  label="Class B" count={chipCounts.B} color={theme.palette.warning.main} />
              )}
              {chipCounts.C > 0 && (
                <FilterChip active={levelFilter === 'C'}
                  onClick={() => setLevelFilter('C')}
                  label="Class C" count={chipCounts.C} />
              )}
              <Box sx={{ flex: 1 }} />
              {hasFilters && (
                <Typography variant="caption" color="text.secondary">
                  Showing {filteredAlerts.length} of {alerts.length}
                </Typography>
              )}
            </Stack>
          </Stack>

          {isLoading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={44}
                  sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : filteredAlerts.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', px: 3 }}>
              <Avatar variant="rounded" sx={{
                width: 56, height: 56, borderRadius: 2, mx: 'auto', mb: 2,
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: 'success.main',
              }}>
                <InventoryIcon />
              </Avatar>
              <Typography variant="body1" fontWeight={700} gutterBottom>
                {hasFilters ? 'No alerts match the current filters' : 'All variants are well stocked'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {hasFilters
                  ? 'Try clearing filters or expanding the search.'
                  : 'You have no items below their configured threshold right now.'}
              </Typography>
            </Box>
          ) : (
            <DataGrid
              rows={filteredAlerts}
              columns={columns}
              autoHeight
              disableRowSelectionOnClick
              rowHeight={60}
              density="standard"
              checkboxSelection
              rowSelectionModel={selection}
              onRowSelectionModelChange={(m) => setSelection(m)}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
              slots={{ toolbar: CustomToolbar }}
              sx={dataGridSx}
              localeText={{ noRowsLabel: t('lowStockPage.noAlerts') }}
            />
          )}
        </Paper>
      </Container>

      {/* ── Saved views popover ──────────────────────────────────────── */}
      <Popover
        open={Boolean(viewsAnchor)}
        anchorEl={viewsAnchor}
        onClose={() => setViewsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 320, borderRadius: 2, mt: 0.5,
            border: '1px solid', borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block', mb: 1 }}>
            SAVED VIEWS
          </Typography>
          {savedViews.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No saved views yet. Configure filters and save the current combination below.
            </Typography>
          ) : (
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              {savedViews.map((v) => (
                <Stack key={v.name} direction="row" alignItems="center" spacing={0.5}>
                  <Button
                    onClick={() => applyView(v)}
                    sx={{
                      justifyContent: 'flex-start', flex: 1,
                      textTransform: 'none', fontWeight: 600,
                      color: 'text.primary', borderRadius: 1,
                    }}>
                    {v.name}
                  </Button>
                  <Tooltip title="Delete view">
                    <IconButton size="small" aria-label={`Delete view ${v.name}`}
                      onClick={() => deleteView(v.name)}>
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
          )}
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block', mb: 1 }}>
            SAVE CURRENT FILTERS
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small" fullWidth placeholder="View name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveCurrentView(); }}
            />
            <Button variant="contained" size="small" startIcon={<SaveIcon />}
              onClick={saveCurrentView} disabled={!newViewName.trim()}
              sx={{
                borderRadius: 1.5, fontWeight: 700, textTransform: 'none',
                boxShadow: 'none',
              }}>
              Save
            </Button>
          </Stack>
        </Box>
      </Popover>

      {/* ── Reorder rules info popover (per-row) ─────────────────────── */}
      <Popover
        open={Boolean(rulesAnchor)}
        anchorEl={rulesAnchor}
        onClose={closeRulesPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 300, borderRadius: 2, mt: 0.5,
            border: '1px solid', borderColor: 'divider',
          },
        }}
      >
        {rulesRow && (
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block', mb: 1 }}>
              REORDER RULES · {rulesRow.sku}
            </Typography>
            <Stack spacing={0.75}>
              {[
                ['Reorder point', rulesRow.reorderPoint, rulesRow.unit],
                ['Fixed reorder qty', rulesRow.reorderQty, rulesRow.unit],
                ['Safety stock', rulesRow.safetyStock, rulesRow.unit],
                ['Max stock', rulesRow.maxStock, rulesRow.unit],
                ['Lead time', rulesRow.leadTimeDays, 'days'],
              ].map(([label, val, unit]) => (
                <Stack key={label} direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {val != null ? `${val} ${unit || ''}`.trim() : '—'}
                  </Typography>
                </Stack>
              ))}
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Preferred supplier</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ maxWidth: 160 }} noWrap>
                  {rulesRow.preferredSupplierName || '—'}
                </Typography>
              </Stack>
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              Change these on the item form, or use Bulk Edit to update several variants at once.
            </Typography>
          </Box>
        )}
      </Popover>

      {/* ── Bulk edit dialog (V79 — 2e) ──────────────────────────────── */}
      <Dialog open={bulkEditOpen} onClose={() => setBulkEditOpen(false)}
        fullWidth maxWidth="sm" fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, fontSize: '1.15rem' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TuneIcon color="primary" fontSize="small" />
            Bulk edit reorder rules — {selection.length} variants
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Alert severity="info" sx={{ borderRadius: 1.5, mb: 2 }}>
            Only the fields you fill in will be updated. Leave a field blank
            to leave it unchanged on the selected variants.
          </Alert>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Low stock threshold" type="number" size="small" fullWidth
                value={bulkPatch.lowStockThreshold ?? ''}
                onChange={(e) => setBulkPatch({ ...bulkPatch, lowStockThreshold: e.target.value })}
                inputProps={{ min: 0, step: 'any' }}
              />
              <TextField
                label="Reorder point" type="number" size="small" fullWidth
                value={bulkPatch.reorderPoint ?? ''}
                onChange={(e) => setBulkPatch({ ...bulkPatch, reorderPoint: e.target.value })}
                inputProps={{ min: 0, step: 'any' }}
                helperText="Wins over threshold when set"
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Fixed reorder qty" type="number" size="small" fullWidth
                value={bulkPatch.reorderQty ?? ''}
                onChange={(e) => setBulkPatch({ ...bulkPatch, reorderQty: e.target.value })}
                inputProps={{ min: 0, step: 'any' }}
                helperText="When set, overrides the velocity-based suggestion"
              />
              <TextField
                label="Safety stock" type="number" size="small" fullWidth
                value={bulkPatch.safetyStock ?? ''}
                onChange={(e) => setBulkPatch({ ...bulkPatch, safetyStock: e.target.value })}
                inputProps={{ min: 0, step: 'any' }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Max stock" type="number" size="small" fullWidth
                value={bulkPatch.maxStock ?? ''}
                onChange={(e) => setBulkPatch({ ...bulkPatch, maxStock: e.target.value })}
                inputProps={{ min: 0, step: 'any' }}
              />
              <TextField
                label="Lead time (days)" type="number" size="small" fullWidth
                value={bulkPatch.leadTimeDays ?? ''}
                onChange={(e) => setBulkPatch({ ...bulkPatch, leadTimeDays: e.target.value })}
                inputProps={{ min: 0, step: 1 }}
              />
            </Stack>
            <Autocomplete
              options={suppliers}
              getOptionLabel={(s) => s?.name || ''}
              isOptionEqualToValue={(a, b) => a?.id === b?.id}
              value={suppliers.find((s) => s.id === bulkPatch.preferredSupplierId) || null}
              onChange={(_, v) => setBulkPatch({ ...bulkPatch, preferredSupplierId: v ? v.id : null })}
              size="small"
              renderInput={(p) => (
                <TextField {...p} label="Preferred supplier"
                  helperText="Assign a preferred supplier — overrides the last-PO fallback" />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02),
          borderTop: '1px solid', borderColor: 'divider', gap: 1,
        }}>
          <Button onClick={() => { setBulkEditOpen(false); setBulkPatch({}); }}
            disabled={bulkSaving}
            sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" onClick={submitBulkPatch} disabled={bulkSaving}
            startIcon={bulkSaving ? undefined : <SaveIcon />}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            {bulkSaving ? 'Saving…' : `Apply to ${selection.length}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk PO — split by supplier confirmation ─────────────────── */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)}
        fullWidth maxWidth="sm" fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, fontSize: '1.15rem' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CartIcon color="primary" fontSize="small" />
            Split into {selectionGroups.length} draft purchase orders
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Alert severity="info" sx={{ borderRadius: 1.5, mb: 2 }}>
            Your selection spans {selectionGroups.length} suppliers.
            Confirming will open one draft PO per supplier in a new tab —
            enable pop-ups if your browser blocks them.
          </Alert>
          <List disablePadding>
            {selectionGroups.map((g, idx) => (
              <ListItem key={g.supplierId ?? `unassigned-${idx}`}
                divider={idx < selectionGroups.length - 1}
                sx={{ py: 1.25, px: 0 }}>
                <ListItemAvatar>
                  <Avatar variant="rounded" sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main', borderRadius: 1,
                    width: 36, height: 36,
                  }}>
                    <SupplierIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={700}>
                      {g.supplierName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {g.variants.length} variants · Estimated ₹{formatInr(g.totalCost)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{
          p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02),
          borderTop: '1px solid', borderColor: 'divider', gap: 1,
        }}>
          <Button onClick={() => setBulkDialogOpen(false)}
            sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" onClick={createAllDrafts}
            startIcon={<CartIcon />}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            Create {selectionGroups.length} drafts
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 1.5 }}>{successMsg}</Alert>
      </Snackbar>
      <Snackbar
        open={!!error} autoHideDuration={5000} onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 1.5 }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LowStockAlerts;
