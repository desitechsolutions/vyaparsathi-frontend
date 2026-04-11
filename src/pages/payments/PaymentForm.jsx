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

// Modern color palette
const theme = {
  primary: '#0f766e',
  primaryLight: '#14b8a6',
  secondary: '#7c3aed',
  danger: '#dc2626',
  warning: '#f59e0b',
  success: '#10b981',
  background: '#f8fafc',
  cardBg: '#ffffff',
  borderColor: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
};

const METHOD_META = {
  CASH:        { label: 'Cash',        Icon: CashIcon,   color: '#059669', bg: alpha('#10b981', 0.08) },
  CARD:        { label: 'Card',        Icon: CardIcon,   color: '#7c3aed', bg: alpha('#7c3aed', 0.08) },
  UPI:         { label: 'UPI',         Icon: UpiIcon,    color: '#0f766e', bg: alpha('#0f766e', 0.08) },
  NET_BANKING: { label: 'Net Banking', Icon: BankIcon,   color: '#0f766e', bg: alpha('#0f766e', 0.08) },
  CHEQUE:      { label: 'Cheque',      Icon: CheckIcon,  color: '#7c3aed', bg: alpha('#7c3aed', 0.08) },
};

const PaymentForm = ({ 
  customers, customerSales, selectedCustomer, selectedSale, 
  paymentMethods, paymentDate, formErrors, submitting, 
  onCustomerChange, onSaleChange, onMethodChange, 
  onAddMethod, onRemoveMethod, onPaymentDateChange, 
  onSubmit, paymentMethodOptions, needsTransactionId, formatAmount,
  globalNotes, setGlobalNotes, theme: themeProps
}) => {
  const customTheme = themeProps || theme;
  
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
      transition: 'all 0.3s ease',
      '& fieldset': { borderColor: '#cbd5e1', transition: 'border-color 0.3s ease' },
      '&:hover fieldset': { borderColor: '#94a3b8' },
      '&.Mui-focused fieldset': { borderColor: customTheme.primary },
    },
    '& .MuiOutlinedInput-input': {
      fontSize: '0.95rem',
    },
  };

  const cardHeaderSx = {
    px: 2.5,
    py: 2,
    background: 'linear-gradient(135deg, #f0fdf4 0%, #f0fdfa 100%)',
    borderBottom: `2px solid ${alpha(customTheme.primary, 0.15)}`,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
  };

  const cardSx = {
    borderRadius: 3,
    border: `1.5px solid ${alpha(customTheme.primary, 0.12)}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      borderColor: alpha(customTheme.primary, 0.25),
    },
  };

  const handlePreventInvalidKeys = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
  };

  const handleQuickFill = (pct) => {
    if (!dueAmount) return;
    const amount = (dueAmount * pct / 100).toFixed(2);
    onMethodChange(0, 'amount', amount);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <form onSubmit={onSubmit}>
        <Stack spacing={3}>

          {/* ─── Card 1: Entity Selection ─────────────────────────────────── */}
          <Paper elevation={0} sx={cardSx}>
            <Box sx={cardHeaderSx}>
              <Box sx={{ 
                p: 1, 
                borderRadius: 1.5, 
                bgcolor: alpha(customTheme.primary, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserIcon fontSize="small" sx={{ color: customTheme.primary, fontWeight: 800 }} />
              </Box>
              <Typography variant="subtitle2" fontWeight={800} color={customTheme.textPrimary} sx={{ fontSize: '0.95rem' }}>
                Step 1 — Select Customer & Invoice
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
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
                            <InputAdornment position="start">
                              <UserIcon fontSize="small" sx={{ color: customTheme.primary, opacity: 0.6 }} />
                            </InputAdornment>
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
                    >
                      <MenuItem value="BULK" sx={{ fontWeight: 800, color: customTheme.primary, py: 1.5 }}>
                        ⭐ All Pending Invoices (Bulk / Advance)
                      </MenuItem>
                      <Divider />
                      {customerSales.map(s => (
                        <MenuItem key={s.saleId} value={s.saleId} sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" fontWeight={700}>{s.invoiceNo}</Typography>
                            <Chip 
                              label={`Due: ${formatAmount(s.dueAmount)}`} 
                              size="small" 
                              sx={{ 
                                height: 20, 
                                fontSize: '0.65rem', 
                                fontWeight: 700,
                                bgcolor: alpha(customTheme.danger, 0.1),
                                color: customTheme.danger,
                                border: `1px solid ${alpha(customTheme.danger, 0.2)}`
                              }} 
                            />
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
          <Paper elevation={0} sx={cardSx}>
            <Box sx={{ ...cardHeaderSx, justifyContent: 'space-between' }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 1.5, 
                  bgcolor: alpha(customTheme.primary, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PaymentsIcon fontSize="small" sx={{ color: customTheme.primary, fontWeight: 800 }} />
                </Box>
                <Typography variant="subtitle2" fontWeight={800} color={customTheme.textPrimary} sx={{ fontSize: '0.95rem' }}>
                  Step 2 — Payment Details
                </Typography>
              </Stack>
              
              {!isBulk && dueAmount > 0 && paymentMethods.length === 1 && (
                <Stack direction="row" spacing={0.75}>
                  {[25, 50, 100].map(pct => (
                    <Chip
                      key={pct}
                      label={`${pct}%`}
                      size="small"
                      onClick={() => handleQuickFill(pct)}
                      sx={{ 
                        height: 22, 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        bgcolor: alpha(customTheme.primary, 0.08), 
                        color: customTheme.primary,
                        border: `1px solid ${alpha(customTheme.primary, 0.2)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          bgcolor: alpha(customTheme.primary, 0.15),
                          borderColor: customTheme.primary,
                          transform: 'translateY(-2px)',
                        } 
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                {paymentMethods.map((pm, idx) => {
                  const meta = METHOD_META[pm.paymentMethod] || METHOD_META['CASH'];
                  return (
                    <Paper
                      key={idx}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        border: `1.5px solid ${alpha(meta.color, 0.25)}`,
                        bgcolor: meta.bg,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: alpha(meta.color, 0.4),
                          bgcolor: alpha(meta.color, 0.06),
                        }
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
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
                                    fontSize: '0.75rem',
                                    bgcolor: selected ? m.color : 'rgba(0,0,0,0.04)',
                                    color: selected ? '#fff' : customTheme.textSecondary,
                                    border: selected ? `1.5px solid ${m.color}` : `1px solid #cbd5e1`,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&:hover': { 
                                      bgcolor: selected ? m.color : alpha(m.color || customTheme.primary, 0.1),
                                      transform: 'translateY(-2px)',
                                      boxShadow: `0 4px 12px ${alpha(m.color || customTheme.primary, 0.2)}`
                                    },
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
                                fontSize: '1.1rem',
                                transition: 'all 0.3s ease',
                                '& fieldset': { borderColor: alpha(meta.color, 0.4), transition: 'border-color 0.3s ease' },
                                '&:hover fieldset': { borderColor: meta.color },
                                '&.Mui-focused fieldset': { borderColor: meta.color, borderWidth: 2 },
                              }
                            }}
                            inputProps={{ min: 0, step: 'any' }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start"><Typography fontWeight={800} color={meta.color} sx={{ fontSize: '1.1rem' }}>₹</Typography></InputAdornment>,
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
                            placeholder={needsTransactionId(pm.paymentMethod) ? "e.g., UTR/RRN/Reference number" : "Optional reference"}
                          />
                        </Grid>

                        {/* Remove */}
                        <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {paymentMethods.length > 1 && (
                            <Tooltip title="Remove payment method">
                              <IconButton 
                                size="small" 
                                onClick={() => onRemoveMethod(idx)}
                                sx={{
                                  color: customTheme.danger,
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    bgcolor: alpha(customTheme.danger, 0.1),
                                    transform: 'rotate(90deg) scale(1.1)'
                                  }
                                }}
                              >
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
                  sx={{ 
                    borderRadius: 2, 
                    textTransform: 'none', 
                    fontWeight: 700, 
                    alignSelf: 'flex-start', 
                    mt: 1,
                    borderColor: alpha(customTheme.primary, 0.3),
                    color: customTheme.primary,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha(customTheme.primary, 0.05),
                      borderColor: customTheme.primary,
                    }
                  }}
                >
                  + Split Payment
                </Button>
              </Stack>
            </Box>
          </Paper>

          {/* ─── Card 3: Date & Notes ──────────────────────────────────────── */}
          <Paper elevation={0} sx={cardSx}>
            <Box sx={cardHeaderSx}>
              <Box sx={{ 
                p: 1, 
                borderRadius: 1.5, 
                bgcolor: alpha(customTheme.primary, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <EventIcon fontSize="small" sx={{ color: customTheme.primary, fontWeight: 800 }} />
              </Box>
              <Typography variant="subtitle2" fontWeight={800} color={customTheme.textPrimary} sx={{ fontSize: '0.95rem' }}>
                Step 3 — Date & Remarks
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
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
                      startAdornment: <InputAdornment position="start"><EventIcon fontSize="small" sx={{ color: customTheme.primary, opacity: 0.6 }} /></InputAdornment>,
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
                      startAdornment: <InputAdornment position="start"><NoteIcon fontSize="small" sx={{ color: customTheme.primary, opacity: 0.6 }} /></InputAdornment>,
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
              border: `2px solid ${isOverpaid ? alpha(customTheme.warning, 0.5) : totalEntered > 0 ? alpha(customTheme.success, 0.4) : alpha(customTheme.borderColor, 0.5)}`,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              background: totalEntered > 0 
                ? 'linear-gradient(135deg, #f0fdf4 0%, #f0fdfa 100%)'
                : '#ffffff',
            }}
          >
            <Box sx={{ p: 3 }}>
              {totalEntered > 0 && (
                <Box sx={{
                  mb: 3,
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: isOverpaid ? alpha(customTheme.warning, 0.08) : alpha(customTheme.success, 0.08),
                  border: `1.5px solid ${isOverpaid ? alpha(customTheme.warning, 0.3) : alpha(customTheme.success, 0.25)}`,
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Stack spacing={0.5} sx={{ flex: 1 }}>
                      <Typography variant="caption" fontWeight={800} color={customTheme.textSecondary} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {isBulk ? '💳 Bulk / Advance Allocation' : '📄 Invoice Allocation'}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color={isOverpaid ? customTheme.warning : customTheme.success}
                        sx={{ fontSize: '0.9rem' }}
                      >
                        {isBulk 
                          ? '✓ Applied to oldest pending dues. Excess held as advance credit.'
                          : isOverpaid 
                            ? `⚠️ Overpaying by ${formatAmount(Math.abs(remainingBalance))}`
                            : `✓ Balance remaining: ${formatAmount(remainingBalance)}`
                        }
                      </Typography>
                    </Stack>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(isOverpaid ? customTheme.warning : customTheme.primary, 0.1),
                      border: `1.5px solid ${alpha(isOverpaid ? customTheme.warning : customTheme.primary, 0.25)}`,
                    }}>
                      <Typography 
                        variant="h6" 
                        fontWeight={900} 
                        color={isOverpaid ? customTheme.warning : customTheme.primary}
                        sx={{ fontSize: '1.25rem' }}
                      >
                        {formatAmount(totalEntered)}
                      </Typography>
                    </Box>
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
                  py: 1.8, 
                  borderRadius: 2.5, 
                  fontWeight: 900, 
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  letterSpacing: '0.3px',
                  background: (submitting || !selectedSale || totalEntered <= 0)
                    ? undefined
                    : `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.primaryLight} 100%)`,
                  boxShadow: (submitting || !selectedSale || totalEntered <= 0)
                    ? 'none'
                    : `0 8px 24px ${alpha(customTheme.primary, 0.35)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: `linear-gradient(135deg, #065f46 0%, ${customTheme.primary} 100%)`,
                    boxShadow: `0 12px 32px ${alpha(customTheme.primary, 0.5)}`,
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                {submitting
                  ? <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  : null
                }
                {submitting
                  ? 'Processing...'
                  : totalEntered > 0
                    ? `✓ Confirm Payment — ${formatAmount(totalEntered)}`
                    : 'Enter amount to proceed'
                }
              </Button>

              {!selectedSale && (
                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: customTheme.textSecondary, textAlign: 'center', fontWeight: 600 }}>
                  Please select an invoice to proceed
                </Typography>
              )}
            </Box>
          </Paper>

        </Stack>
      </form>
    </Box>
  );
};

export default PaymentForm;