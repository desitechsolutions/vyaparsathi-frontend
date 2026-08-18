import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import {
  fetchCustomerAttachments,
  uploadCustomerAttachment,
  deleteCustomerAttachment,
  downloadCustomerAttachment,
} from '../../services/api';
import { timeAgo } from '../../utils/customerFormat';

const CATEGORY_LABELS = {
  KYC: 'KYC',
  CONTRACT: 'Contract',
  PO: 'Purchase order',
  INVOICE: 'Invoice',
  OTHER: 'Other',
};

const CATEGORY_OPTIONS = [
  { value: 'OTHER', label: 'Other' },
  { value: 'KYC', label: 'KYC document' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'PO', label: 'Purchase order' },
  { value: 'INVOICE', label: 'Invoice' },
];

const formatBytes = (n) => {
  if (n == null || Number.isNaN(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export default function CustomerAttachmentsPanel({ customerId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadDlg, setUploadDlg] = useState({ open: false, file: null, category: 'OTHER' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: '' });
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchCustomerAttachments(customerId);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load attachments.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const pickFile = () => fileInputRef.current?.click();
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadDlg({ open: true, file, category: 'OTHER' });
    e.target.value = ''; // reset so picking the same file twice still fires
  };

  const doUpload = async () => {
    if (!uploadDlg.file) return;
    setBusy(true);
    setError('');
    try {
      await uploadCustomerAttachment(customerId, uploadDlg.file, uploadDlg.category);
      setUploadDlg({ open: false, file: null, category: 'OTHER' });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete.id) return;
    setBusy(true);
    try {
      await deleteCustomerAttachment(customerId, confirmDelete.id);
      setConfirmDelete({ open: false, id: null, name: '' });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  const doDownload = async (row) => {
    try {
      await downloadCustomerAttachment(customerId, row.id, row.fileName);
    } catch (e) {
      setError(e?.response?.data?.message || 'Download failed.');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={800}>Attachments ({rows.length})</Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={pickFile}
          disableElevation
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Upload
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : rows.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderRadius: 2.5 }}>
          <AttachFileIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No attachments yet. Upload KYC docs, contracts, POs or other files up to 10 MB.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {rows.map((f) => (
            <Paper key={f.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <DescriptionIcon color="action" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 380 }}>
                      {f.fileName}
                    </Typography>
                    {f.category && (
                      <Chip size="small" variant="outlined" label={CATEGORY_LABELS[f.category] || f.category} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(f.sizeBytes)}
                    {f.uploadedBy ? ` · uploaded by ${f.uploadedBy}` : ''}
                    {f.createdAt ? ` · ${timeAgo(f.createdAt)}` : ''}
                  </Typography>
                </Box>
                <Tooltip title="Download">
                  <IconButton size="small" onClick={() => doDownload(f)} aria-label="Download attachment"><DownloadIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => setConfirmDelete({ open: true, id: f.id, name: f.fileName })}
                    aria-label="Delete attachment"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Upload category picker */}
      <Dialog open={uploadDlg.open} onClose={busy ? undefined : () => setUploadDlg({ open: false, file: null, category: 'OTHER' })} maxWidth="xs" fullWidth>
        <DialogTitle>Upload attachment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>{uploadDlg.file?.name}</strong> · {formatBytes(uploadDlg.file?.size)}
          </DialogContentText>
          <TextField
            fullWidth
            select
            size="small"
            label="Category"
            value={uploadDlg.category}
            onChange={(e) => setUploadDlg((s) => ({ ...s, category: e.target.value }))}
          >
            {CATEGORY_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDlg({ open: false, file: null, category: 'OTHER' })} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={doUpload} disabled={busy}>Upload</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmDelete.open} onClose={busy ? undefined : () => setConfirmDelete({ open: false, id: null, name: '' })} maxWidth="xs">
        <DialogTitle>Delete this attachment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{confirmDelete.name}</strong> will be removed from this customer and the file
            will be deleted from storage. This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, id: null, name: '' })} disabled={busy}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete} disabled={busy}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
