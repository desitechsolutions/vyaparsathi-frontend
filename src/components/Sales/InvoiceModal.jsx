import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { Document, Page } from 'react-pdf';

const InvoiceModal = ({ open, setOpen, invoicePdf, pageNumber, setPageNumber, numPages, onDocumentLoadSuccess }) => {
  // Helper function to convert Uint8Array to base64
  const arrayBufferToBase64 = (buffer) => {
    try {
      if (!buffer || !(buffer instanceof Uint8Array)) {
        throw new Error('Invalid buffer: Must be a Uint8Array');
      }
      let binary = '';
      for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error('Error converting to base64:', error.message);
      return null;
    }
  };

  const pdfDataUrl = invoicePdf ? `data:application/pdf;base64,${arrayBufferToBase64(invoicePdf)}` : null;
  console.log('PDF Data URL for Download:', pdfDataUrl); // Debug log

  const handleDownload = () => {
    if (pdfDataUrl) {
      const link = document.createElement('a');
      link.href = pdfDataUrl;
      link.download = `invoice_${new Date().toISOString().split('T')[0]}.pdf`; // Dynamic filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Invoice Preview</DialogTitle>
      <DialogContent>
        {pdfDataUrl ? (
          <Document
            file={pdfDataUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('PDF Load Error:', error.message)}
            loading={<Typography>Loading PDF...</Typography>}
          >
            <Page pageNumber={pageNumber} />
          </Document>
        ) : (
          <Typography color="error">Failed to load PDF. Please try again.</Typography>
        )}
        {numPages ? <Typography>Page {pageNumber} of {numPages}</Typography> : <Typography>Page {pageNumber} of ...</Typography>}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          disabled={!numPages || pageNumber <= 1}
          sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}
        >
          Previous
        </Button>
        <Button
          onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
          disabled={!numPages || pageNumber >= numPages}
          sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}
        >
          Next
        </Button>
        <Button onClick={() => setOpen(false)} sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' }}}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!pdfDataUrl}
          onClick={handleDownload}
          sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceModal;