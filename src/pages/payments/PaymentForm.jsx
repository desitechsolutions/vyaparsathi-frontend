import React from 'react';
import { 
  Box, Paper, Grid, Autocomplete, TextField, FormControl, 
  InputLabel, Select, MenuItem, Typography, Button, 
  IconButton, Tooltip, Stack, CircularProgress, Divider, 
  Alert, alpha, InputAdornment, Chip
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  DeleteOutline as DeleteIcon,
  Payments as PaymentsIcon,
  Event as EventIcon,
  Description as NoteIcon,
  AccountCircle as UserIcon,
  Receipt as InvoiceIcon,
  LocalAtm as CashIcon,
  CreditCard as CardIcon,
  PhoneAndroid as UpiIcon,
  AccountBalance as BankIcon,
  CheckCircleOutline as CheckIcon,
} from '@mui/icons-material';

const METHOD_META = {
  CASH:        { label: 'Cash',        Icon: CashIcon,   color: '#10b981', bg: alpha('#10b981', 0.08) },
  CARD:        { label: 'Card',        Icon: CardIcon,   color: '#6366f1', bg: alpha('#6366f1', 0.08) },
  UPI:         { label: 'UPI',         Icon: UpiIcon,    color: '#f59e0b', bg: alpha('#f59e0b', 0.08) },
  NET_BANKING: { label: 'Net Banking', Icon: BankIcon,   color: '#3b82f6', bg: alpha('#3b82f6', 0.08) },
  CHEQUE:      { label: 'Cheque',      Icon: CheckIcon,  color: '#8b5cf6', bg: alpha('#8b5cf6', 0.08) },
};

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
  const dueAmount = isBulk ? 0 : (selectedSaleObj?.dueAmount || 0);
  const remainingBalance = isBulk ? 0 : dueAmount - totalEntered;
  const isOverpaid = !isBulk && remainingBalance < 0;

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: '#fff',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#94a3b8' },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
  };

  const handlePreventInvalidKeys = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
  };

  // Quick-fill shortcut buttons (% of due)
  const handleQuickFill = (pct) => {
    if (!dueAmount) return;
    const amount = (dueAmount * pct / 100).toFixed(2);
    onMethodChange(0, 'amount', amount);
  };

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      <form onSubmit={onSubmit}>
        <Stack spacing={2.5}>

          {/* ─── Card 1: Entity Selection ─────────────────────────────────── */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                Step 1 — Select Customer & Invoice
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2}>
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
                        size="small"
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
                  <FormControl fullWidth required disabled={!selectedCustomer} sx={inputSx} size="small">
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
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body2" fontWeight={700}>{s.invoiceNo}</Typography>
                            <Chip label={`Due: ${formatAmount(s.dueAmount)}`} size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* ─── Card 2: Payment Method ────────────────────────────────────── */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentsIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                Step 2 — Payment Details
              </Typography>
              {!isBulk && dueAmount > 0 && paymentMethods.length === 1 && (
                <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
                  {[25, 50, 100].map(pct => (
                    <Chip
                      key={pct}
                      label={`${pct}%`}
                      size="small"
                      onClick={() => handleQuickFill(pct)}
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', '&:hover': { bgcolor: alpha('#6366f1', 0.16) } }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                {paymentMethods.map((pm, idx) => {
                  const meta = METHOD_META[pm.paymentMethod] || METHOD_META['CASH'];
                  return (
                    <Paper
                      key={idx}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: `1px solid`,
                        borderColor: alpha(meta.color, 0.25),
                        bgcolor: meta.bg,
                      }}
                    >
                      <Grid container spacing={1.5} alignItems="center">
                        {/* Method selector as button chips */}
                        <Grid item xs={12}>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            {paymentMethodOptions.map(opt => {
                              const m = METHOD_META[opt.value] || {};
                              const selected = pm.paymentMethod === opt.value;
                              return (
                                <Chip
                                  key={opt.value}
                                  label={opt.label}
                                  onClick={() => onMethodChange(idx, 'paymentMethod', opt.value)}
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    bgcolor: selected ? m.color : 'rgba(0,0,0,0.04)',
                                    color: selected ? '#fff' : 'text.secondary',
                                    border: selected ? 'none' : '1px solid #e2e8f0',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: selected ? m.color : alpha(m.color || '#000', 0.08) },
                                  }}
                                />
                              );
                            })}
                          </Stack>
                        </Grid>

                        {/* Amount */}
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth 
                            label="Amount (₹)" 
                            type="number" 
                            value={pm.amount}
                            error={!!formErrors[`amount${idx}`] || isOverpaid}
                            onChange={e => onMethodChange(idx, 'amount', e.target.value)}
                            onKeyDown={handlePreventInvalidKeys}
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: '#fff',
                                fontWeight: 800,
                                fontSize: '1.05rem',
                                '& fieldset': { borderColor: alpha(meta.color, 0.4) },
                                '&:hover fieldset': { borderColor: meta.color },
                                '&.Mui-focused fieldset': { borderColor: meta.color },
                              }
                            }}
                            inputProps={{ min: 0, step: 'any' }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start"><Typography fontWeight={800} color={meta.color}>₹</Typography></InputAdornment>,
                            }}
                          />
                        </Grid>

                        {/* Transaction ID */}
                        <Grid item xs={12} sm={7}>
                          <TextField
                            fullWidth 
                            label={needsTransactionId(pm.paymentMethod) ? "Transaction / UTR ID *" : "Reference (optional)"}
                            value={pm.transactionId || pm.reference || ''}
                            error={!!formErrors[`transactionId${idx}`]}
                            onChange={e => onMethodChange(idx, needsTransactionId(pm.paymentMethod) ? 'transactionId' : 'reference', e.target.value)}
                            required={needsTransactionId(pm.paymentMethod)}
                            size="small"
                            sx={inputSx}
                            placeholder={needsTransactionId(pm.paymentMethod) ? "Enter reference / UTR number" : "Optional"}
                          />
                        </Grid>

                        {/* Remove */}
                        <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {paymentMethods.length > 1 && (
                            <Tooltip title="Remove">
                              <IconButton size="small" color="error" onClick={() => onRemoveMethod(idx)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}

                <Button 
                  startIcon={<AddIcon />} 
                  onClick={onAddMethod} 
                  variant="outlined"
                  size="small"
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start', mt: 0.5 }}
                >
                  Split Payment
                </Button>
              </Stack>
            </Box>
          </Paper>

          {/* ─── Card 3: Date & Notes ──────────────────────────────────────── */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                Step 3 — Date & Remarks
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth 
                    label="Payment Date & Time" 
                    type="datetime-local" 
                    InputLabelProps={{ shrink: true }} 
                    value={paymentDate} 
                    onChange={e => onPaymentDateChange(e.target.value)}
                    size="small"
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><EventIcon fontSize="small" color="action" /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth 
                    label="Notes / Remarks" 
                    multiline 
                    rows={1} 
                    value={globalNotes} 
                    onChange={e => setGlobalNotes(e.target.value)} 
                    size="small"
                    sx={inputSx}
                    placeholder="Optional note for this transaction"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><NoteIcon fontSize="small" color="action" /></InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* ─── Summary & Submit ──────────────────────────────────────────── */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `2px solid ${isOverpaid ? '#f59e0b' : totalEntered > 0 ? '#10b981' : '#e2e8f0'}`,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            <Box sx={{ p: 2.5 }}>
              {totalEntered > 0 && (
                <Box sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isOverpaid ? alpha('#f59e0b', 0.06) : alpha('#10b981', 0.05),
                  border: `1px solid ${isOverpaid ? alpha('#f59e0b', 0.3) : alpha('#10b981', 0.2)}`,
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack spacing={0.25}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {isBulk ? 'Advance / Bulk Allocation' : 'Allocation to Invoice'}
                      </Typography>
                      <Typography variant="caption" color={isOverpaid ? 'warning.main' : 'success.dark'}>
                        {isBulk 
                          ? 'Applied to oldest pending dues. Excess held as advance credit.'
                          : isOverpaid 
                            ? `⚠ Overpaying by ${formatAmount(Math.abs(remainingBalance))}`
                            : `Balance remaining: ${formatAmount(remainingBalance)}`
                        }
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={900} color={isOverpaid ? 'warning.main' : 'success.dark'}>
                      {formatAmount(totalEntered)}
                    </Typography>
                  </Stack>
                </Box>
              )}

              <Button 
                fullWidth 
                variant="contained" 
                type="submit" 
                size="large" 
                disabled={submitting || !selectedSale || totalEntered <= 0} 
                sx={{ 
                  py: 1.6, 
                  borderRadius: 2.5, 
                  fontWeight: 900, 
                  fontSize: '1rem',
                  textTransform: 'none',
                  background: (submitting || !selectedSale || totalEntered <= 0)
                    ? undefined
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: (submitting || !selectedSale || totalEntered <= 0)
                    ? 'none'
                    : '0 8px 20px rgba(99,102,241,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    boxShadow: '0 12px 24px rgba(99,102,241,0.45)',
                  }
                }}
              >
                {submitting
                  ? <CircularProgress size={22} color="inherit" />
                  : totalEntered > 0
                    ? `Confirm Payment — ${formatAmount(totalEntered)}`
                    : 'Enter amount to proceed'
                }
              </Button>
            </Box>
          </Paper>

        </Stack>
      </form>
    </Box>
  );
};

export default PaymentForm;