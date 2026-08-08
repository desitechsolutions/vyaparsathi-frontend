import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography, Paper, Stack } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchReceivingById } from '../../services/api';
import GRNPrintDocument from '../../components/receiving/GRNPrintDocument';

const PrintGRNPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receiving, setReceiving] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchReceivingById(id)
      .then((res) => {
        setReceiving(res.data || res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load receiving details for print:", err);
        setError("Failed to load Goods Receipt Note details.");
        setLoading(false);
      });
  }, [id]);

  const handleClose = () => {
    if (window.opener || window.history.length <= 1) {
      window.close();
      setTimeout(() => {
        navigate('/receivings');
      }, 100);
    } else {
      navigate('/receivings');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/receivings')} sx={{ mt: 2 }}>
          Back to Goods Receipts
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      {/* Top Action Bar (Hidden during printing) */}
      <Paper
        className="no-print"
        elevation={0}
        sx={{
          maxWidth: '210mm',
          mx: 'auto',
          p: 2,
          mb: 3,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Button startIcon={<CloseIcon />} onClick={handleClose} variant="outlined" color="inherit">
          Close Window
        </Button>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">A4 Portrait ERP Print Preview</Typography>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ fontWeight: 700 }}>
            Print GRN Document
          </Button>
        </Stack>
      </Paper>

      {/* Printable A4 Document */}
      <Paper elevation={3} sx={{ maxWidth: '210mm', mx: 'auto', borderRadius: 1 }}>
        <GRNPrintDocument receiving={receiving} />
      </Paper>
    </Box>
  );
};

export default PrintGRNPage;
