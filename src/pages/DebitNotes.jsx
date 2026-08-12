import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Chip, Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, IconButton, Tooltip, Stack, CircularProgress, TablePagination, Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

import { listDebitNotes, getDebitNoteSignedUrl, downloadReceiptPdf } from '../services/api';

const STATUS_COLORS = {
  ISSUED: 'default',
  PARTIALLY_APPLIED: 'warning',
  FULLY_APPLIED: 'success',
  CANCELLED: 'error',
};

const DebitNotes = () => {
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await listDebitNotes(page, rowsPerPage);
      const payload = res?.data ?? res;
      setRows(payload?.content ?? []);
      setTotalElements(payload?.totalElements ?? 0);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load debit notes');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDownload = async (row) => {
    try {
      const signedPath = await getDebitNoteSignedUrl(row.id);
      await downloadReceiptPdf(
        signedPath,
        `debit_note_${(row.debitNoteNo || row.id).toString().replace(/[\/\\]/g, '_')}.pdf`,
      );
    } catch {
      setErrorMsg('Failed to download debit note PDF');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Debit Notes</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Debit notes are auto-issued when you approve a purchase return. Each one reduces the amount you owe the supplier.
            </Typography>
          </Box>
          <IconButton onClick={loadData}><RefreshIcon /></IconButton>
        </Stack>

        {errorMsg && <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Debit Note No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Against Purchase Invoice</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Applied</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={22} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No debit notes yet.
                </TableCell></TableRow>
              ) : rows.map((dn) => (
                <TableRow key={dn.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{dn.debitNoteNo}</TableCell>
                  <TableCell>{dn.debitNoteDate || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{dn.purchaseInvoiceNo || '—'}</TableCell>
                  <TableCell>{dn.supplier?.supplierName || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>₹{Number(dn.totalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">₹{Number(dn.appliedAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={dn.status || 'ISSUED'} color={STATUS_COLORS[dn.status] || 'default'} />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Download PDF">
                      <IconButton size="small" onClick={() => handleDownload(dn)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
    </Box>
  );
};

export default DebitNotes;
