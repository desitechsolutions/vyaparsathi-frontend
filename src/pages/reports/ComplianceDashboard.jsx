import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box, Container, Paper, Stack, Typography, Chip, Button, IconButton,
  Grid, MenuItem, TextField, CircularProgress, Snackbar, Alert, Divider,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  VerifiedUser as ShieldIcon,
  Assessment as GapIcon,
  Print as PrintIcon,
  Numbers as NumbersIcon,
  LocalShipping as EwbIcon,
} from '@mui/icons-material';

import {
  fetchSequenceGaps, fetchPrintAudit, fetchEInvoiceCoverage, fetchEwayCoverage,
} from '../../services/api';

const DOC_TABLES = [
  { value: 'sale',              label: 'Tax invoices',   numberCol: 'invoice_no' },
  { value: 'purchase_order',    label: 'Purchase orders', numberCol: 'po_number' },
  { value: 'receiving',         label: 'GRNs',            numberCol: 'gr_number' },
  { value: 'purchase_return',   label: 'Purchase returns', numberCol: 'return_no' },
  { value: 'debit_notes',       label: 'Debit notes',     numberCol: 'debit_note_no' },
  { value: 'credit_notes',      label: 'Credit notes',    numberCol: 'credit_note_no' },
];

const StatCard = ({ icon, label, value, color, subtitle }) => {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{
      p: 2.5, borderRadius: 2,
      border: '1px solid', borderColor: 'divider',
      height: '100%',
    }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{
          display: 'inline-flex', p: 1.25, borderRadius: 1.5,
          bgcolor: alpha(color, 0.1), color,
        }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={800}
            sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, mt: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

const ComplianceDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [selectedTable, setSelectedTable] = useState('sale');
  const [selectedNumberCol, setSelectedNumberCol] = useState('invoice_no');
  const [minPrints, setMinPrints] = useState(2);

  const [gaps, setGaps] = useState([]);
  const [prints, setPrints] = useState([]);
  const [einv, setEinv] = useState({});
  const [eway, setEway] = useState({});

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [g, p, e, w] = await Promise.all([
        fetchSequenceGaps(selectedTable, selectedNumberCol).catch(() => []),
        fetchPrintAudit(minPrints).catch(() => []),
        fetchEInvoiceCoverage().catch(() => ({})),
        fetchEwayCoverage().catch(() => ({})),
      ]);
      setGaps(Array.isArray(g) ? g : []);
      setPrints(Array.isArray(p) ? p : []);
      setEinv(e || {});
      setEway(w || {});
    } catch {
      setSnackbar({ open: true, message: 'Failed to load compliance data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedTable, selectedNumberCol, minPrints]);

  useEffect(() => { refresh(); }, [refresh]);

  const totalGapCount = gaps.reduce((n, g) => n + (Number(g.missingCount) || 0), 0);
  const covered = Number(einv.withIrn || 0);
  const uncovered = Number(einv.withoutIrn || 0);
  const coveragePct = Number(einv.coveragePct || 0);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        {/* Header */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}
          justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton size="small" onClick={() => navigate(-1)}><BackIcon /></IconButton>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800}
                sx={{ letterSpacing: 0.6 }}>REPORTS · COMPLIANCE</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4, lineHeight: 1.2 }}>
                Compliance monitoring
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Document integrity, IRN coverage, and e-way bill status across the enterprise doc suite.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip icon={<ShieldIcon fontSize="small" />}
              label="CBIC rule 46(b) compliant" color="success" variant="outlined"
              sx={{ fontWeight: 700, borderRadius: 1 }} />
            <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
          </Stack>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* KPI cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<GapIcon />} label="SEQUENCE GAPS"
              value={gaps.length}
              subtitle={totalGapCount > 0 ? `${totalGapCount} missing doc numbers` : 'No gaps detected'}
              color={gaps.length ? theme.palette.error.main : theme.palette.success.main} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<PrintIcon />} label={`REPRINTED ≥${minPrints}×`}
              value={prints.length}
              subtitle={prints.length ? 'Investigate frequent reprints' : 'Nothing unusual'}
              color={prints.length ? theme.palette.warning.main : theme.palette.success.main} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<NumbersIcon />} label="IRN COVERAGE"
              value={`${coveragePct}%`}
              subtitle={`${covered}/${Number(einv.totalTaxInvoices || 0)} tax invoices`}
              color={coveragePct >= 90 ? theme.palette.success.main : coveragePct >= 50 ? theme.palette.warning.main : theme.palette.error.main} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EwbIcon />} label="ACTIVE E-WAY BILLS"
              value={Number(eway.activeEwbs || 0)}
              subtitle="Currently valid"
              color={theme.palette.info.main} />
          </Grid>
        </Grid>

        {/* Sequence gaps + Print audit */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{
              borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
            }}>
              <Box sx={{
                px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.text.primary, 0.02),
              }}>
                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>Document number gaps</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Detects missing numbers per FY — CBIC rule 46(b).
                    </Typography>
                  </Box>
                  <TextField size="small" select
                    value={selectedTable}
                    onChange={(e) => {
                      const t = DOC_TABLES.find((d) => d.value === e.target.value);
                      setSelectedTable(e.target.value);
                      if (t) setSelectedNumberCol(t.numberCol);
                    }}
                    sx={{ minWidth: 180 }}>
                    {DOC_TABLES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Box>
              <TableContainer sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>From #</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>To #</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Missing</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gaps.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Stack alignItems="center" spacing={1}>
                            <ShieldIcon sx={{ fontSize: 36, color: 'success.main' }} />
                            <Typography variant="body2" color="text.secondary">
                              No sequence gaps — numbering is continuous.
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )}
                    {gaps.map((g, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{g.from}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{g.to}</TableCell>
                        <TableCell align="right">
                          <Chip label={g.missingCount} size="small" color="error"
                            sx={{ fontWeight: 700, borderRadius: 1 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{
              borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
            }}>
              <Box sx={{
                px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.text.primary, 0.02),
              }}>
                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>Print audit</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Documents reprinted more than N times — flags suspicious activity.
                    </Typography>
                  </Box>
                  <TextField size="small" type="number" label="Min prints"
                    value={minPrints} onChange={(e) => setMinPrints(Number(e.target.value) || 2)}
                    inputProps={{ min: 1, max: 50 }}
                    sx={{ width: 120 }} />
                </Stack>
              </Box>
              <TableContainer sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Doc #</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Prints</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Last printed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prints.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Stack alignItems="center" spacing={1}>
                            <ShieldIcon sx={{ fontSize: 36, color: 'success.main' }} />
                            <Typography variant="body2" color="text.secondary">
                              No documents reprinted more than {minPrints} times.
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )}
                    {prints.map((p, i) => (
                      <TableRow key={i} hover>
                        <TableCell>
                          <Chip label={String(p.documentType).replace('_', ' ')} size="small" variant="outlined"
                            sx={{ fontWeight: 700, borderRadius: 1 }} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {p.documentNumber || `#${p.documentId}`}
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={p.printCount} size="small" color="warning"
                            sx={{ fontWeight: 700, borderRadius: 1 }} />
                        </TableCell>
                        <TableCell>{p.lastPrintedAt ? new Date(p.lastPrintedAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        }) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* IRN + EWB coverage strip */}
        <Paper elevation={0} sx={{
          mt: 3, p: 3, borderRadius: 2,
          border: '1px solid', borderColor: 'divider',
        }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" fontWeight={800} color="text.secondary"
                sx={{ letterSpacing: 0.6 }}>E-INVOICE COVERAGE</Typography>
              <Stack direction="row" spacing={2} alignItems="baseline" sx={{ mt: 0.5, mb: 1.5 }}>
                <Typography variant="h4" fontWeight={800}>{coveragePct}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  {covered} of {Number(einv.totalTaxInvoices || 0)} tax invoices have IRN
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={coveragePct}
                sx={{
                  height: 8, borderRadius: 1,
                  bgcolor: alpha(theme.palette.text.primary, 0.06),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: coveragePct >= 90 ? theme.palette.success.main :
                             coveragePct >= 50 ? theme.palette.warning.main :
                             theme.palette.error.main,
                    borderRadius: 1,
                  },
                }} />
              {uncovered > 0 && (
                <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ mt: 1, display: 'block' }}>
                  {uncovered} tax invoice(s) without IRN — generate before filing GSTR-1.
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" fontWeight={800} color="text.secondary"
                sx={{ letterSpacing: 0.6 }}>ACTIVE E-WAY BILLS</Typography>
              <Stack direction="row" spacing={2} alignItems="baseline" sx={{ mt: 0.5 }}>
                <Typography variant="h4" fontWeight={800}>{Number(eway.activeEwbs || 0)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  currently in transit
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Interstate shipments &gt; ₹50k require an EWB. Cancel + regenerate on route change.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default ComplianceDashboard;
