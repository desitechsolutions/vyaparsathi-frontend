import React from 'react';
import { Box, Paper, Grid, Autocomplete, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Button, IconButton, Tooltip, Stack, CircularProgress, Divider } from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Alert from '@mui/material/Alert';

const PaymentForm = ({ 
  customers, customerSales, selectedCustomer, selectedSale, 
  paymentMethods, paymentDate, formErrors, submitting, 
  onCustomerChange, onSaleChange, onMethodChange, 
  onAddMethod, onRemoveMethod, onPaymentDateChange, 
  onSubmit, paymentMethodOptions, needsTransactionId, formatAmount,
  globalNotes, setGlobalNotes
}) => {
  const selectedSaleObj = customerSales.find(s => String(s.saleId) === String(selectedSale));
  const totalEntered = paymentMethods.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  
  // Logic for UI validation
  const isBulk = selectedSale === 'BULK';
  const remainingBalance = isBulk ? 0 : (selectedSaleObj?.dueAmount || 0) - totalEntered;
  const isOverpaid = !isBulk && remainingBalance < 0;

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        {isBulk ? "Bulk Payment / Advance Receipt" : "Invoice Payment"}
      </Typography>
      <form onSubmit={onSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={customers}
              getOptionLabel={o => `${o.name} (${o.phone || 'No Phone'})`}
              value={selectedCustomer}
              onChange={(_, v) => onCustomerChange(v)}
              renderInput={(p) => <TextField {...p} label="Customer Name" required />}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required disabled={!selectedCustomer}>
              <InputLabel>Select Invoice / Sale</InputLabel>
              <Select value={selectedSale || ''} label="Select Invoice / Sale" onChange={e => onSaleChange(e.target.value)}>
                <MenuItem value="BULK" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  ⭐ All Pending Invoices (Bulk / Advance)
                </MenuItem>
                <Divider />
                {customerSales.map(s => (
                  <MenuItem key={s.saleId} value={s.saleId}>
                    {s.invoiceNo} — Due: {formatAmount(s.dueAmount)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}><Divider>Payment Details</Divider></Grid>

          {paymentMethods.map((pm, idx) => (
            <React.Fragment key={idx}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Method</InputLabel>
                  <Select value={pm.paymentMethod} label="Method" onChange={e => onMethodChange(idx, 'paymentMethod', e.target.value)}>
                    {paymentMethodOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth label="Amount" type="number" value={pm.amount}
                  error={!!formErrors[`amount${idx}`] || isOverpaid}
                  helperText={isOverpaid ? "Exceeds Invoice Due" : formErrors[`amount${idx}`]}
                  onChange={e => onMethodChange(idx, 'amount', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth 
                  label={needsTransactionId(pm.paymentMethod) ? "Transaction ID" : "Reference"}
                  value={pm.transactionId || pm.reference}
                  error={!!formErrors[`transactionId${idx}`]}
                  onChange={e => onMethodChange(idx, needsTransactionId(pm.paymentMethod) ? 'transactionId' : 'reference', e.target.value)}
                  required={needsTransactionId(pm.paymentMethod)}
                />
              </Grid>
              <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center' }}>
                {paymentMethods.length > 1 && (
                  <IconButton color="error" onClick={() => onRemoveMethod(idx)}><DeleteOutlineIcon /></IconButton>
                )}
              </Grid>
            </React.Fragment>
          ))}

          {!isBulk && (
             <Grid item xs={12}>
                <Button startIcon={<AddCircleOutlineIcon />} onClick={onAddMethod} variant="text">Add Multi-Mode Payment</Button>
             </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Payment Date" type="datetime-local" InputLabelProps={{ shrink: true }} value={paymentDate} onChange={e => onPaymentDateChange(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Notes" multiline rows={1} value={globalNotes} onChange={e => setGlobalNotes(e.target.value)} />
          </Grid>

          <Grid item xs={12}>
            {totalEntered > 0 && (
              <Alert severity={isOverpaid ? "warning" : "success"} sx={{ mt: 2 }}>
                {isBulk 
                  ? `Processing ${formatAmount(totalEntered)} across all dues. Excess will be saved as Advance.`
                  : isOverpaid 
                    ? `Warning: Excess ${formatAmount(Math.abs(remainingBalance))} will not be allocated. Switch to BULK mode to save as advance.`
                    : `Remaining Balance for this invoice: ${formatAmount(remainingBalance)}`
                }
              </Alert>
            )}
            <Button 
                fullWidth variant="contained" type="submit" size="large" 
                disabled={submitting || !selectedSale} sx={{ py: 1.5, mt: 2 }}
            >
              {submitting ? <CircularProgress size={24} /> : `Confirm ${formatAmount(totalEntered)} Payment`}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default PaymentForm;