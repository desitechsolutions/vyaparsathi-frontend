import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';

export const CustomerCsvImportDialog = ({ open, onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const resp = await onImport(file);
      if (resp.success) {
        setResult(resp.data);
      } else {
        setError(resp.error || 'Import failed.');
      }
    } catch (err) {
      setError(err.message || 'Import error occurred.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleReset} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'common.white' }}>
            <UploadIcon />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Import Customers from CSV
          </Typography>
        </Box>
        <IconButton onClick={handleReset} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!result ? (
          <>
            <Box
              sx={{
                p: 4,
                border: '2px dashed',
                borderColor: file ? 'primary.main' : 'divider',
                borderRadius: 3,
                bgcolor: 'background.default',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
              component="label"
            >
              <input type="file" accept=".csv" hidden onChange={handleFileChange} />
              <FileIcon sx={{ fontSize: 48, color: file ? 'primary.main' : 'text.secondary', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700}>
                {file ? file.name : 'Click or Drag CSV file here'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported format: .csv with columns Name, Phone, Email, Customer Type, GSTIN, Address, City, State, Pincode, Credit Limit
              </Typography>
            </Box>

            {uploading && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Uploading and processing records...
                </Typography>
                <LinearProgress sx={{ mt: 0.5, borderRadius: 1 }} />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <SuccessIcon color="success" sx={{ fontSize: 56, mb: 1 }} />
            <Typography variant="h6" fontWeight={700}>
              Import Completed
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Successfully imported <strong>{result.importedCount || 0}</strong> customers.
              {result.skippedCount > 0 && ` Skipped ${result.skippedCount} rows.`}
            </Typography>

            {result.errors && result.errors.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'left', maxHeight: 150, overflowY: 'auto' }}>
                <Typography variant="caption" color="error" fontWeight={700}>
                  Issues encountered:
                </Typography>
                <List dense>
                  {result.errors.map((err, idx) => (
                    <ListItem key={idx} disableGutters>
                      <ListItemText
                        primary={err}
                        primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleReset} color="inherit">
          {result ? 'Done' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || uploading}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {uploading ? 'Importing...' : 'Start Import'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
