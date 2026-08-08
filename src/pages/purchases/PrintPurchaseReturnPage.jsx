import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography, Paper, Stack } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchPurchaseReturnById, getSupplierById } from '../../services/api';
import PurchaseReturnPrintDocument from '../../components/purchases/PurchaseReturnPrintDocument';

const PrintPurchaseReturnPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchaseReturn, setPurchaseReturn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPurchaseReturnById(id)
      .then(async (res) => {
        const returnData = res.data || res;
        if (returnData.supplierId && (!returnData.supplier || !returnData.supplier.address)) {
          try {
            const supplierRes = await getSupplierById(returnData.supplierId);
            const supplierData = supplierRes.data || supplierRes;
            returnData.supplier = supplierData;
          } catch (suppErr) {
            console.warn("Could not fetch full supplier details:", suppErr);
          }
        }
        setPurchaseReturn(returnData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load Purchase Return details for print:", err);
        setError("Failed to load Goods Return Note details.");
        setLoading(false);
      });
  }, [id]);

  const handleClose = () => {
    if (window.opener || window.history.length <= 1) {
      window.close();
      setTimeout(() => {
        navigate('/purchase-returns');
      }, 100);
    } else {
      navigate('/purchase-returns');
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
        <Button startIcon={<ArrowBackIcon />} onClick={handleClose} sx={{ mt: 2 }}>
          Back to Purchase Returns
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      {/* Top Action Bar (Hidden during printing) */}
      <Paper
        className="no-print"
        elevation={2}
        sx={{
          maxWidth: '210mm',
          mx: 'auto',
          p: 2,
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 3,
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
          <Button variant="contained" color="error" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ fontWeight: 700 }}>
            Print Goods Return Note
          </Button>
        </Stack>
      </Paper>

      {/* Printable A4 Document */}
      <Paper elevation={3} sx={{ maxWidth: '210mm', mx: 'auto', borderRadius: 1 }}>
        <PurchaseReturnPrintDocument purchaseReturn={purchaseReturn} />
      </Paper>
    </Box>
  );
};

export default PrintPurchaseReturnPage;
