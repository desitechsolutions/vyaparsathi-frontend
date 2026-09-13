import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const ReceiptUploader = ({
  onUpload,
  maxSize = 5242880, // 5MB
  acceptedFormats = ['.pdf', '.jpg', '.jpeg', '.png'],
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file) => {
    setError(null);

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      return;
    }

    // Validate file type
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedFormats.includes(fileExt)) {
      setError(`Invalid file format. Accepted: ${acceptedFormats.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      // Create preview
      if (fileExt === '.pdf') {
        setPreview('PDF: ' + file.name);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }

      // Call upload handler
      if (onUpload) {
        await onUpload(file);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Card
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed #2196f3',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: '#1976d2',
          backgroundColor: '#f5f5f5',
        },
      }}
    >
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography color="textSecondary">Uploading...</Typography>
          </Box>
        ) : preview ? (
          <Box>
            {preview.startsWith('PDF:') ? (
              <Typography variant="body2">{preview}</Typography>
            ) : (
              <img src={preview} alt="Receipt preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
            )}
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => setPreview(null)}
            >
              Upload Different File
            </Button>
          </Box>
        ) : (
          <Box>
            <CloudUploadIcon sx={{ fontSize: 48, color: '#2196f3', mb: 1 }} />
            <Typography variant="h6">Drag & drop receipt here</Typography>
            <Typography variant="body2" color="textSecondary">
              or
            </Typography>
            <input
              type="file"
              hidden
              id="receipt-upload"
              onChange={handleFileInput}
              accept={acceptedFormats.join(',')}
            />
            <label htmlFor="receipt-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 1 }}
              >
                Browse Files
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Max size: {maxSize / 1024 / 1024}MB | Formats: {acceptedFormats.join(', ')}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiptUploader;
