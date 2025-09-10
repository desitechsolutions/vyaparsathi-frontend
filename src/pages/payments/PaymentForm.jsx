import React from 'react';
import {
  Box,
  Paper,
  Grid,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const PaymentForm = ({
  customers,
  customerSales,
  selectedCustomer,
  selectedSale,
  selectedSaleObj,
  paymentMethods,
  paymentDate,
  formErrors,
  submitting,
  dueAmount,
  disablePaymentFields,
  onCustomerChange,
  onSaleChange,
  onMethodChange,
  onAddMethod,
  onRemoveMethod,
  onPaymentDateChange,
  onSubmit,
  paymentMethodOptions,
  needsTransactionId,
  transactionIdMandatory,
  formatAmount,
}) => {
  const isPaid = dueAmount === 0;

  return (
    <Paper sx={{ maxWidth: 650, mx: 'auto', mt: 2, p: 2 }}>
      <form onSubmit={onSubmit}>
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            options={customers}
            getOptionLabel={option => option.name || ""}
            value={selectedCustomer}
            onChange={(_, newValue) => onCustomerChange(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Customer" fullWidth />
            )}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="normal" error={!!formErrors.selectedSale} disabled={!selectedCustomer}>
            <InputLabel id="sale-select-label">Select Sale</InputLabel>
            <Select
              labelId="sale-select-label"
              value={selectedSale}
              label="Select Sale"
              onChange={(e) => onSaleChange(e.target.value)}
            >
              <MenuItem value="">Select a sale</MenuItem>
              {customerSales.map((sale) => (
                <MenuItem key={sale.saleId} value={sale.saleId}>
                  {sale.invoiceNo} (Due: {formatAmount(sale.dueAmount)})
                </MenuItem>
              ))}
            </Select>
            {formErrors.selectedSale && (
              <Typography color="error" variant="caption">
                {formErrors.selectedSale}
              </Typography>
            )}
          </FormControl>
        </Box>
        {selectedSaleObj && (
          <>
            {formErrors.due && (
              <Alert severity="error" sx={{ mt: 1 }}>{formErrors.due}</Alert>
            )}
            {formErrors.total && (
              <Alert severity="error" sx={{ mt: 1 }}>{formErrors.total}</Alert>
            )}
            {paymentMethods.map((pm, idx) => (
              <Grid container spacing={1} key={idx} alignItems="center" sx={{ mt: 2, borderBottom: '1px solid #eee', pb: 2 }}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Method</InputLabel>
                    <Select
                      value={pm.paymentMethod}
                      label="Method"
                      onChange={(e) => onMethodChange(idx, 'paymentMethod', e.target.value)}
                      disabled={disablePaymentFields}
                    >
                      {paymentMethodOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Amount"
                    value={pm.amount}
                    onChange={(e) => {
                      let val = e.target.value.replace(/^0+/, '');
                      onMethodChange(idx, 'amount', val);
                      if (
                        parseFloat(val) > dueAmount &&
                        !formErrors[`amount${idx}`]
                      ) {
                        // error handling left to parent
                      }
                    }}
                    type="number"
                    error={!!formErrors[`amount${idx}`]}
                    helperText={formErrors[`amount${idx}`]}
                    disabled={disablePaymentFields}
                    inputProps={{ min: 0, max: dueAmount }}
                  />
                </Grid>
                {needsTransactionId(pm.paymentMethod) && (
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Transaction ID"
                      value={pm.transactionId}
                      onChange={(e) => onMethodChange(idx, 'transactionId', e.target.value)}
                      required={transactionIdMandatory(pm.paymentMethod)}
                      error={!!formErrors[`transactionId${idx}`]}
                      helperText={formErrors[`transactionId${idx}`]}
                      placeholder={
                        pm.paymentMethod === 'CHEQUE'
                          ? 'Cheque No.'
                          : pm.paymentMethod === 'UPI'
                          ? 'UPI Ref/UTR'
                          : pm.paymentMethod === 'NET_BANKING'
                          ? 'IMPS/NEFT Ref'
                          : pm.paymentMethod === 'CARD'
                          ? 'POS Slip Ref'
                          : 'Transaction Ref'
                      }
                      disabled={disablePaymentFields}
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Reference"
                    value={pm.reference}
                    onChange={(e) => onMethodChange(idx, 'reference', e.target.value)}
                    placeholder="Reference (optional)"
                    disabled={disablePaymentFields}
                  />
                </Grid>
                <Grid item xs={12} sm={9}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={pm.notes}
                    onChange={(e) => onMethodChange(idx, 'notes', e.target.value)}
                    placeholder="Notes (optional)"
                    disabled={disablePaymentFields}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Stack direction="row" spacing={1}>
                    {paymentMethods.length > 1 && (
                      <Tooltip title="Remove payment method">
                        <IconButton color="error" onClick={() => onRemoveMethod(idx)} disabled={disablePaymentFields}>
                          <RemoveIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {idx === paymentMethods.length - 1 && (
                      <Tooltip title="Add another payment method">
                        <IconButton color="primary" onClick={onAddMethod} disabled={disablePaymentFields}>
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            ))}
            <TextField
              fullWidth
              sx={{ mt: 2 }}
              label="Payment Date & Time"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={paymentDate}
              onChange={(e) => onPaymentDateChange(e.target.value)}
              disabled={disablePaymentFields}
            />
            <Tooltip title={isPaid ? "This sale is already fully paid. Payment not allowed." : ""}>
              <span>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  type="submit"
                  sx={{ mt: 3, py: 1.5, borderRadius: '8px' }}
                  disabled={submitting || isPaid}
                  startIcon={<PaymentIcon />}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : 'Record Payment'}
                </Button>
              </span>
            </Tooltip>
          </>
        )}
      </form>
    </Paper>
  );
};

export default PaymentForm;