import React from 'react';
import { 
  Box, Paper, Grid, Autocomplete, TextField, FormControl, 
  InputLabel, Select, MenuItem, Typography, Button, 
  IconButton, Tooltip, Stack, CircularProgress, Divider, 
  Alert, alpha, InputAdornment 
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  DeleteOutline as DeleteIcon,
  Payments as PaymentsIcon,
  Event as EventIcon,
  Description as NoteIcon,
  AccountCircle as UserIcon,
  Receipt as InvoiceIcon
} from '@mui/icons-material';

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
  
  const isBulk = selectedSale === 'BULK';
  const remainingBalance = isBulk ? 0 : (selectedSaleObj?.dueAmount || 0) - totalEntered;
  const isOverpaid = !isBulk && remainingBalance < 0;

  // Aesthetic input styles matching the Management Dashboard theme
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: '#fcfdfe',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#cbd5e1' },
    },
  };

  const handlePreventInvalidKeys = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4, 
        borderRadius: 4, 
        maxWidth: 900, 
        mx: 'auto', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#6366f1', 0.1), display: 'flex' }}>
          <PaymentsIcon color="primary" />
        </Box>
        <Typography variant="h6" fontWeight={900}>
          {isBulk ? "Bulk Payment / Advance Receipt" : "Invoice-Specific Payment"}
        </Typography>
      </Stack>

      <form onSubmit={onSubmit}>
        <Grid container spacing={3}>
          {/* Section 1: Entity Selection */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={customers}
              getOptionLabel={o => `${o.name} (${o.phone || 'No Phone'})`}
              value={selectedCustomer}
              onChange={(_, v) => onCustomerChange(v)}
              renderInput={(p) => (
                <TextField 
                  {...p} 
                  label="Customer Name" 
                  required 
                  sx={inputSx}
                  InputProps={{
                    ...p.InputProps,
                    startAdornment: (
                      <InputAdornment position="start"><UserIcon fontSize="small" color="action" /></InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required disabled={!selectedCustomer} sx={inputSx}>
              <InputLabel>Select Invoice / Sale</InputLabel>
              <Select 
                value={selectedSale || ''} 
                label="Select Invoice / Sale" 
                onChange={e => onSaleChange(e.target.value)}
                startAdornment={<InputAdornment position="start"><InvoiceIcon fontSize="small" color="action" /></InputAdornment>}
              >
                <MenuItem value="BULK" sx={{ fontWeight: 800, color: 'primary.main', py: 1.5 }}>
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

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={900}>Payment Breakdown</Typography>
            </Divider>
          </Grid>

          {/* Section 2: Multi-Method Splitting */}
          {paymentMethods.map((pm, idx) => (
            <React.Fragment key={idx}>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="Method"
                  value={pm.paymentMethod}
                  onChange={e => onMethodChange(idx, 'paymentMethod', e.target.value)}
                  sx={inputSx}
                >
                  {paymentMethodOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth 
                  label="Amount" 
                  type="number" 
                  value={pm.amount}
                  error={!!formErrors[`amount${idx}`] || isOverpaid}
                  onChange={e => onMethodChange(idx, 'amount', e.target.value)}
                  onKeyDown={handlePreventInvalidKeys}
                  sx={inputSx}
                  inputProps={{ min: 0, step: 'any' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth 
                  label={needsTransactionId(pm.paymentMethod) ? "Transaction / UTR ID" : "Reference"}
                  value={pm.transactionId || pm.reference || ''}
                  error={!!formErrors[`transactionId${idx}`]}
                  onChange={e => onMethodChange(idx, needsTransactionId(pm.paymentMethod) ? 'transactionId' : 'reference', e.target.value)}
                  required={needsTransactionId(pm.paymentMethod)}
                  sx={inputSx}
                />
              </Grid>

              <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {paymentMethods.length > 1 && (
                  <Tooltip title="Remove Method">
                    <IconButton color="error" onClick={() => onRemoveMethod(idx)} sx={{ bgcolor: alpha('#ef4444', 0.05) }}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Grid>
            </React.Fragment>
          ))}

          <Grid item xs={12}>
             <Button 
                startIcon={<AddIcon />} 
                onClick={onAddMethod} 
                variant="outlined" 
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Add Multi-Mode Split
              </Button>
          </Grid>

          {/* Section 3: Metadata */}
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Payment Date" 
              type="datetime-local" 
              InputLabelProps={{ shrink: true }} 
              value={paymentDate} 
              onChange={e => onPaymentDateChange(e.target.value)}
              sx={inputSx}
              InputProps={{
                startAdornment: <InputAdornment position="start"><EventIcon fontSize="small" color="action" /></InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Global Notes" 
              multiline 
              rows={1} 
              value={globalNotes} 
              onChange={e => setGlobalNotes(e.target.value)} 
              sx={inputSx}
              InputProps={{
                startAdornment: <InputAdornment position="start"><NoteIcon fontSize="small" color="action" /></InputAdornment>,
              }}
            />
          </Grid>

          {/* Section 4: Validation & Submission */}
          <Grid item xs={12}>
            {totalEntered > 0 && (
              <Alert 
                severity={isOverpaid ? "warning" : "success"} 
                variant="outlined"
                sx={{ 
                  borderRadius: 3, 
                  borderWidth: '1px',
                  bgcolor: isOverpaid ? alpha('#fff7ed', 0.5) : alpha('#f0fdf4', 0.5),
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={700}>
                    {isBulk ? "Advance / Bulk Allocation" : "Allocation to Invoice"}
                  </Typography>
                  <Typography variant="body2" fontWeight={900}>
                    Total: {formatAmount(totalEntered)}
                  </Typography>
                </Stack>
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  {isBulk 
                    ? `This payment will be applied to pending dues. Any excess will remain as an advance credit.`
                    : isOverpaid 
                      ? `Warning: You are overpaying this invoice by ${formatAmount(Math.abs(remainingBalance))}.`
                      : `Balance remaining after this payment: ${formatAmount(remainingBalance)}`
                  }
                </Typography>
              </Alert>
            )}

            <Button 
                fullWidth 
                variant="contained" 
                type="submit" 
                size="large" 
                disabled={submitting || !selectedSale || totalEntered <= 0} 
                sx={{ 
                  py: 1.8, 
                  mt: 3, 
                  borderRadius: 3, 
                  fontWeight: 900, 
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : `Post Payment of ${formatAmount(totalEntered)}`}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default PaymentForm;