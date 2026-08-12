import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Chip, Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, IconButton, Tooltip, Stack, CircularProgress, TablePagination, Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

import { listCreditNotes, getCreditNoteSignedUrl, downloadReceiptPdf } from '../services/api';

const STATUS_COLORS = {
  ISSUED: 'default',
  PARTIALLY_APPLIED: 'warning',
  FULLY_APPLIED: 'success',
  CANCELLED: 'error',
};

const CreditNotes = () => {
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
      const res = await listCreditNotes(page, rowsPerPage);
      const payload = res?.data ?? res;
      setRows(payload?.content ?? []);
      setTotalElements(payload?.totalElements ?? 0);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load credit notes');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDownload = async (row) => {
    try {
      const signedPath = await getCreditNoteSignedUrl(row.id);
      await downloadReceiptPdf(
        signedPath,
        `credit_note_${(row.creditNoteNo || row.id).toString().replace(/[\/\\]/g, '_')}.pdf`,
      );
    } catch {
      setErrorMsg('Failed to download credit note PDF');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Credit Notes</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Credit notes are auto-issued when you process a sales return. They can also be created manually to give a
              customer a credit against a future invoice.
            </Typography>
          </Box>
          <IconButton onClick={loadData}><RefreshIcon /></IconButton>
        </Stack>

        {errorMsg && <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Credit Note No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Against Invoice</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
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
                  No credit notes yet.
                </TableCell></TableRow>
              ) : rows.map((cn) => (
                <TableRow key={cn.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{cn.creditNoteNo}</TableCell>
                  <TableCell>{cn.creditNoteDate || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{cn.invoiceNo || '—'}</TableCell>
                  <TableCell>{cn.customer?.name || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>₹{Number(cn.totalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">₹{Number(cn.appliedAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={cn.status || 'ISSUED'} color={STATUS_COLORS[cn.status] || 'default'} />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Download PDF">
                      <IconButton size="small" onClick={() => handleDownload(cn)}>
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

export default CreditNotes;
