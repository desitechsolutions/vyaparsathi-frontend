import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Typography, CircularProgress, Alert
} from '@mui/material';
import { LocalShipping } from '@mui/icons-material';
import { generateEWayBill } from '../../services/api';

/**
 * Issue 5 UI Component: EWayBillDialog
 * Modal dialog form to collect transport details and generate an E-Way Bill for an invoice.
 */
export default function EWayBillDialog({ open, sale, onClose, onSuccess }) {
  const [transporterId, setTransporterId] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [distance, setDistance] = useState('100');
  const [transportMode, setTransportMode] = useState('ROAD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!sale) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      setError('Vehicle Number is required');
      return;
    }

    const targetSaleId = sale?.id || sale?.saleId || sale?._id || (typeof sale === 'number' || typeof sale === 'string' ? sale : null);

    if (!targetSaleId) {
      setError('Sale ID is missing. Cannot generate E-Way Bill.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        saleId: Number(targetSaleId),
        transporterId: transporterId.trim() || null,
        transporterName: transporterName.trim() || null,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        distanceKm: parseInt(distance, 10) || 100,
        modeOfTransport: transportMode,
        transportMode: transportMode,
      };

      const result = await generateEWayBill(payload);
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Failed to generate E-Way Bill:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to generate E-Way Bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping color="primary" />
          <Typography variant="h6" fontWeight={700}>Generate E-Way Bill</Typography>
        </DialogTitle>

        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="subtitle2" color="textSecondary" mb={2}>
            Invoice #: <strong>{sale.invoiceNo || sale.id}</strong> | Total: <strong>₹{Number(sale.totalAmount || 0).toFixed(2)}</strong>
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vehicle Number"
                placeholder="e.g. MH04AB1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Transport Mode"
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                size="small"
              >
                <MenuItem value="ROAD">Road</MenuItem>
                <MenuItem value="RAIL">Rail</MenuItem>
                <MenuItem value="AIR">Air</MenuItem>
                <MenuItem value="SHIP">Ship</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transporter Name"
                placeholder="e.g. VRL Logistics"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transporter GSTIN / ID"
                placeholder="e.g. 27ABCDE1234F1Z5"
                value={transporterId}
                onChange={(e) => setTransporterId(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Approx. Distance (Km)"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <LocalShipping />}
          >
            {loading ? 'Generating...' : 'Generate E-Way Bill'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
