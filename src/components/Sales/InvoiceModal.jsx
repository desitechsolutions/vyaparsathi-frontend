import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  IconButton, Box, Tooltip, TextField, CircularProgress
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';

// Use local public folder worker for best compatibility
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const InvoiceModal = ({
  open, setOpen, invoicePdf, pageNumber, setPageNumber, numPages, onDocumentLoadSuccess, onClose
}) => {
  const pdfUrlRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Generate Blob URL from Uint8Array
  const pdfUrl = useMemo(() => {
    if (!invoicePdf) return null;
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }
    const blob = new Blob([invoicePdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    pdfUrlRef.current = url;
    return url;
  }, [invoicePdf]);

  // Cleanup blob url on unmount or close
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, []);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `invoice_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Print using hidden iframe so it works for Blob URLs
  const handlePrint = () => {
    if (!pdfUrl) return;
    setIsPrinting(true);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = function () {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setIsPrinting(false);
        // Remove the iframe after 30 seconds (enough for the user to finish printing)
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 30000); // 30 seconds
      }, 500);
    };
  };

  useEffect(() => {
    if (!open) setIsPrinting(false);
  }, [open]);

  // Keyboard navigation for user convenience
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight' && numPages && pageNumber < numPages) setPageNumber(p => p + 1);
      if (e.key === 'ArrowLeft' && pageNumber > 1) setPageNumber(p => p - 1);
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line
  }, [open, pageNumber, numPages]);

  // PATCH: Centralize close logic to always call onClose if provided
  const handleClose = () => {
    setOpen(false);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
        <Box>
          <Typography variant="h6" component="span">
            Invoice Preview
          </Typography>
        </Box>
        <Tooltip title="Close">
          <IconButton onClick={handleClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent sx={{
        background: '#f8fafc',
        minHeight: 470,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 2
      }}>
        {pdfUrl ? (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => (
              <Typography color="error" sx={{ mt: 2 }}>
                Failed to load PDF: {error?.message || 'Unknown error'}
              </Typography>
            )}
            loading={<Typography sx={{ mt: 8 }}>Loading PDF...</Typography>}
            options={{ cMapUrl: "cmaps/", cMapPacked: true }}
          >
            <Page
              pageNumber={pageNumber}
              width={520}
              loading={<Box sx={{ mt: 8 }}><CircularProgress /></Box>}
            />
          </Document>
        ) : (
          <Typography color="error" sx={{ mt: 4 }}>Failed to load PDF. Please try again.</Typography>
        )}
        {/* Page controls */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            mt: 2,
            width: '100%',
          }}
        >
          <Tooltip title="Previous Page">
            <span>
              <IconButton
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={!numPages || pageNumber <= 1}
                size="small"
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <TextField
            value={pageNumber}
            onChange={e => {
              const val = Number(e.target.value);
              if (!isNaN(val) && val >= 1 && val <= (numPages || 1)) setPageNumber(val);
            }}
            size="small"
            variant="outlined"
            inputProps={{
              style: { width: 32, textAlign: "center", fontWeight: 600 },
              min: 1,
              max: numPages || 1,
              "aria-label": "Go to page"
            }}
            sx={{ width: 48 }}
          />
          <Typography variant="body2" sx={{ minWidth: 69 }}>
            / {numPages || '...'}
          </Typography>
          <Tooltip title="Next Page">
            <span>
              <IconButton
                onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
                disabled={!numPages || pageNumber >= numPages}
                size="small"
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Box>
          <Tooltip title="Download PDF">
            <span>
              <Button
                onClick={handleDownload}
                variant="contained"
                color="primary"
                disabled={!pdfUrl}
                startIcon={<DownloadIcon />}
                sx={{ mr: 2 }}
              >
                Download
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Print Invoice">
            <span>
              <Button
                onClick={handlePrint}
                variant="contained"
                color="secondary"
                disabled={!pdfUrl || isPrinting}
                startIcon={<PrintIcon />}
              >
                {isPrinting ? <CircularProgress size={18} color="inherit" /> : "Print"}
              </Button>
            </span>
          </Tooltip>
        </Box>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceModal;