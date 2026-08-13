import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, CircularProgress, TablePagination, Alert,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';

import {
  listQuotations,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  cancelQuotation,
  convertQuotationToSale,
  getQuotationSignedUrl,
  downloadReceiptPdf,
} from '../services/api';

const STATUS_COLORS = {
  DRAFT: 'default',
  SENT: 'info',
  ACCEPTED: 'success',
  REJECTED: 'error',
  EXPIRED: 'warning',
  CANCELLED: 'error',
  CONVERTED: 'primary',
};

const STATUS_FILTERS = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'CONVERTED'];
const EDITABLE_STATUSES = new Set(['DRAFT', 'SENT']);

const Quotations = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Reject dialog (kept inline — small, non-form flow)
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const status = statusFilter === 'ALL' ? null : statusFilter;
      const res = await listQuotations(page, rowsPerPage, status, null);
      setRows(res?.content ?? []);
      setTotalElements(res?.totalElements ?? 0);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load quotations');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredRows = rows.filter((q) => {
    if (!searchTerm.trim()) return true;
    const needle = searchTerm.toLowerCase();
    return (
      (q.quotationNo || '').toLowerCase().includes(needle) ||
      (q.customer?.name || '').toLowerCase().includes(needle) ||
      (q.customer?.phone || '').toLowerCase().includes(needle)
    );
  });

  // ── Row actions ─────────────────────────────────────────────
  const guarded = async (fn, msg) => {
    try {
      await fn();
      await loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || `${msg} failed`);
    }
  };

  const handleDownload = async (row) => {
    try {
      const signedPath = await getQuotationSignedUrl(row.id);
      await downloadReceiptPdf(
        signedPath,
        `quotation_${(row.quotationNo || row.id).toString().replace(/[\/\\]/g, '_')}.pdf`,
      );
    } catch (err) {
      setErrorMsg('Failed to download quotation PDF');
    }
  };

  const handleConvert = async (row) => {
    try {
      const res = await convertQuotationToSale(row.id);
      const saleId = res?.data?.data?.convertedToSaleId ?? res?.data?.convertedToSaleId;
      if (saleId) {
        navigate(`/sales/drafts?resumeId=${saleId}`);
      } else {
        await loadData();
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Conversion failed');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} mb={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>Quotations</Typography>
            <Typography variant="body2" color="text.secondary">
              Non-binding price offers. Draft → Sent → Accepted → Convert to Sale.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadData}><RefreshIcon /></IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/quotations/new')}
              sx={{ fontWeight: 700 }}
            >
              New Quotation
            </Button>
          </Stack>
        </Stack>

        {/* Filters & search */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ md: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by quotation number, customer name or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 280, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
            {STATUS_FILTERS.map((s) => (
              <Chip
                key={s}
                label={s}
                onClick={() => { setStatusFilter(s); setPage(0); }}
                color={statusFilter === s ? 'primary' : 'default'}
                variant={statusFilter === s ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            ))}
          </Stack>
        </Stack>

        {errorMsg && <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Quotation No</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Expiry</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={22} /></TableCell></TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {rows.length === 0
                      ? <>No quotations yet. Click <strong>New Quotation</strong> to create one.</>
                      : 'No quotations match your search.'}
                  </TableCell>
                </TableRow>
              ) : filteredRows.map((q) => (
                <TableRow key={q.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{q.quotationNo}</TableCell>
                  <TableCell>{q.quotationDate ? new Date(q.quotationDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{q.customer?.name || 'Walk-in'}</Typography>
                    {q.customer?.phone && <Typography variant="caption" color="text.secondary">{q.customer.phone}</Typography>}
                  </TableCell>
                  <TableCell>
                    {q.expiryDate
                      ? <Typography variant="body2">{new Date(q.expiryDate).toLocaleDateString('en-IN')}</Typography>
                      : <Typography variant="body2" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                    ₹{Number(q.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={q.status} color={STATUS_COLORS[q.status] || 'default'} sx={{ fontWeight: 700 }} />
                    {q.convertedInvoiceNo && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                        → {q.convertedInvoiceNo}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {EDITABLE_STATUSES.has(q.status) && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => navigate(`/quotations/${q.id}/edit`)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Download PDF">
                      <IconButton size="small" onClick={() => handleDownload(q)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {(q.status === 'DRAFT' || q.status === 'SENT') && (
                      <Tooltip title="Send to customer">
                        <IconButton size="small" color="info"
                          onClick={() => guarded(() => sendQuotation(q.id), 'Send')}>
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(q.status === 'SENT' || q.status === 'DRAFT') && (
                      <Tooltip title="Mark accepted">
                        <IconButton size="small" color="success"
                          onClick={() => guarded(() => acceptQuotation(q.id), 'Accept')}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(q.status === 'SENT' || q.status === 'DRAFT') && (
                      <Tooltip title="Reject">
                        <IconButton size="small" color="error"
                          onClick={() => { setRejectTarget(q); setRejectReason(''); }}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {q.status !== 'CONVERTED' && q.status !== 'CANCELLED' && q.status !== 'REJECTED' && q.status !== 'EXPIRED' && (
                      <Tooltip title="Convert to Sale">
                        <IconButton size="small" color="primary" onClick={() => handleConvert(q)}>
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(q.status === 'DRAFT' || q.status === 'SENT' || q.status === 'ACCEPTED') && (
                      <Tooltip title="Cancel">
                        <IconButton size="small"
                          onClick={() => guarded(() => cancelQuotation(q.id), 'Cancel')}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>

      {/* Reject Dialog — small enough to stay inline */}
      <Dialog open={rejectTarget !== null} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Reject Quotation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Rejecting <strong>{rejectTarget?.quotationNo}</strong>. This is a terminal action.
          </Typography>
          <TextField
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={async () => {
            const id = rejectTarget.id;
            setRejectTarget(null);
            await guarded(() => rejectQuotation(id, rejectReason), 'Reject');
          }}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Quotations;
