import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid, Card, CardContent, Button, RadioGroup, FormControlLabel, Radio,
  TextField, Typography, Box, Checkbox, FormControl, InputLabel,
  Select as MuiSelect, MenuItem, Divider, Tooltip, Alert, Collapse, Chip, Stack, alpha
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from 'react-select';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HomeIcon from '@mui/icons-material/Home';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TuneIcon from '@mui/icons-material/Tune';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DoneIcon from '@mui/icons-material/Done';
import EditIcon from '@mui/icons-material/Edit';

import { useTheme } from '@mui/material/styles';
import getSalesSelectStyles from '../../styles/SalesStyles';
import StatutoryFieldset from '../StatutoryFieldset';

const CustomerSection = ({
  customers,
  selectedCustomer,
  formData,
  setFormData,
  newCustomerData,
  setNewCustomerData,
  handleCustomerSelect,
  handleNewCustomer,
  openCustomerModal,
  setOpenCustomerModal,
  isJewellery,
  compact,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const selectStyles = useMemo(() => getSalesSelectStyles(theme), [theme]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [statutoryModalOpen, setStatutoryModalOpen] = useState(false);

  const PAN_THRESHOLD = 200000;
  const isHighValueJewellery = isJewellery && Number(formData.totalAmount) >= PAN_THRESHOLD;
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isPanFormatValid = !formData.buyerPan?.trim() || PAN_REGEX.test(formData.buyerPan.trim());
  const isPanMissing = isHighValueJewellery && !formData.buyerPan?.trim();
  const isPanError = isPanMissing || (formData.buyerPan?.trim() && !isPanFormatValid);

  const isGstMissing = formData.isGstRequired === 'yes' && selectedCustomer && !selectedCustomer.gstNumber;
  const isGstDisabled = false;
  
  const handleGstToggle = useCallback((e) => {
    setFormData((prev) => ({ ...prev, isGstRequired: e.target.value }));
  }, [setFormData]);

  const copyCustomerAddress = useCallback(() => {
    if (selectedCustomer) {
      const fullAddress = [
        selectedCustomer.addressLine1,
        selectedCustomer.addressLine2,
        selectedCustomer.city,
        selectedCustomer.state,
        selectedCustomer.postalCode
      ].filter(Boolean).join(', ');
      
      setFormData(prev => ({ ...prev, deliveryAddress: fullAddress }));
    }
  }, [selectedCustomer, setFormData]);

  const handleDeliveryAddressChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }));
  }, [setFormData]);

  const handleDeliveryChargeChange = useCallback((e) => {
    const val = parseFloat(e.target.value);
    const cleanVal = isNaN(val) ? '' : Math.max(0, val);
    setFormData(prev => ({ ...prev, deliveryCharge: cleanVal }));
  }, [setFormData]);

  const handleDeliveryPaidByChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, deliveryPaidBy: e.target.value }));
  }, [setFormData]);

  const handleDeliveryNotesChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, deliveryNotes: e.target.value }));
  }, [setFormData]);

  const isNewCustomerValid = () => {
    return newCustomerData.name.trim() !== '' && 
           newCustomerData.phone.trim().length >= 10;
  };

  // Memoized delivery modal content to prevent re-renders
  const DeliveryModalContent = useMemo(() => (
    <>
      {/* Address Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocationOnIcon sx={{ color: 'var(--color-teal)', fontSize: 22 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--color-teal)' }}>
            {t('salesFlow.customer.deliveryAddressTitle')}
          </Typography>
        </Box>

        {selectedCustomer && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={copyCustomerAddress}
            fullWidth
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderColor: 'var(--color-teal)',
              color: 'var(--color-teal)',
              mb: 1.5,
              py: 1,
              '&:hover': {
                bgcolor: alpha('#0f766e', 0.08),
                borderColor: 'var(--color-teal)',
              }
            }}
          >
            {t('salesFlow.customer.useCustomerAddress')}
          </Button>
        )}

        <TextField
          label={t('salesFlow.customer.deliveryAddressTitle')}
          multiline
          rows={3}
          fullWidth
          value={formData.deliveryAddress || ''}
          onChange={handleDeliveryAddressChange}
          placeholder={t('salesFlow.customer.deliveryAddressPlaceholder')}
          size="small"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.95rem',
            },
            '& .MuiOutlinedInput-input::placeholder': {
              opacity: 0.6,
            }
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.75, display: 'block' }}>
          {t('salesFlow.customer.deliveryAddressCaption')}
        </Typography>
      </Box>

      <Divider sx={{ my: 2.5, borderColor: alpha('#0f766e', 0.08) }} />

      {/* Charge & Payment Section */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocalOfferIcon sx={{ color: 'var(--color-teal)', fontSize: 22 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--color-teal)' }}>
            {t('salesFlow.customer.deliveryChargePaymentTitle')}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <TextField
              label={t('salesFlow.customer.chargeAmountLabel')}
              type="number"
              fullWidth
              size="small"
              value={formData.deliveryCharge || ''}
              onChange={handleDeliveryChargeChange}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.75, color: 'var(--color-teal)', fontWeight: 800, fontSize: '1rem' }}>₹</Typography>,
              }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.9rem' }}>{t('salesFlow.customer.paidByLabel')}</InputLabel>
              <MuiSelect
                value={formData.deliveryPaidBy || ''}
                label={t('salesFlow.customer.paidByLabel')}
                onChange={handleDeliveryPaidByChange}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-input': {
                    py: 1,
                  }
                }}
              >
                <MenuItem value="CUSTOMER">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{t('salesFlow.customer.paidByCustomer')}</span>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('salesFlow.customer.toPay')}</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="SHOP">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{t('salesFlow.customer.paidByShop')}</span>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('salesFlow.customer.inclusive')}</Typography>
                  </Box>
                </MenuItem>
              </MuiSelect>
            </FormControl>
          </Grid>
        </Grid>

        {formData.deliveryCharge > 0 && (
          <Box sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: alpha('#0f766e', 0.08),
            border: `1.5px solid ${alpha('#0f766e', 0.08)}`,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--color-teal)' }}>
                {t('salesFlow.customer.deliveryChargeInfoLabel')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--color-teal)' }}>
                ₹{Number(formData.deliveryCharge).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ height: 1, bgcolor: alpha('#0f766e', 0.08), mb: 1 }} />
            <Typography variant="caption" sx={{ color: 'var(--color-teal)', fontWeight: 700 }}>
              {t('salesFlow.customer.paidByInfo')} <span style={{ fontWeight: 900 }}>{formData.deliveryPaidBy === 'CUSTOMER' ? t('salesFlow.customer.paidByCustomer') : t('salesFlow.customer.paidByShop')}</span>
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2.5, borderColor: alpha('#0f766e', 0.08) }} />

      {/* Special Instructions Section */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--color-teal)', mb: 1.5 }}>
          {t('salesFlow.customer.specialInstructionsTitle')}
        </Typography>
        <TextField
          label={t('salesFlow.customer.deliveryNotesLabel')}
          placeholder={t('salesFlow.customer.deliveryNotesPlaceholder')}
          fullWidth
          multiline
          rows={2}
          size="small"
          value={formData.deliveryNotes || ''}
          onChange={handleDeliveryNotesChange}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.95rem',
            },
            '& .MuiOutlinedInput-input::placeholder': {
              opacity: 0.6,
            }
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
          {t('salesFlow.customer.deliveryNotesCaption')}
        </Typography>
      </Box>
    </>
  ), [formData, selectedCustomer, handleDeliveryAddressChange, handleDeliveryChargeChange, handleDeliveryPaidByChange, handleDeliveryNotesChange, copyCustomerAddress, t]);

  // -----------------------------------------------------------------------
  // COMPACT MODE
  // -----------------------------------------------------------------------
  if (compact) {
    const hasStatutorySet = Boolean(formData.placeOfSupply || formData.supplyType || formData.reverseCharge || formData.billToAddress || formData.shipToAddress);

    return (
      <Box sx={{ width: '100%', minWidth: 0 }}>
        {/* Customer Select + Add Button */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', width: '100%' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Select
              options={customers}
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              placeholder={t('salesFlow.customer.searchCustomerPlaceholder')}
              isSearchable
              isClearable
              styles={selectStyles}
              menuPortalTarget={document.body}
            />
          </Box>
          <Tooltip title={t('salesFlow.customer.addNewCustomer')}>
            <Button
              variant="contained"
              onClick={() => setOpenCustomerModal(true)}
              sx={{
                height: 38,
                minWidth: 38,
                width: 38,
                p: 0,
                flexShrink: 0,
                borderRadius: 1.5,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonAddIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>

        {/* GST & Delivery toggles + Statutory Options + Inline Due / GSTIN */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
          <RadioGroup row value={formData.isGstRequired} onChange={handleGstToggle} sx={{ alignItems: 'center' }}>
            <FormControlLabel
              value="no"
              control={<Radio size="small" />}
              label={<Typography variant="caption" fontWeight={600} fontSize="0.75rem">{t('salesFlow.customer.retailLabel')}</Typography>}
              sx={{ mr: 1 }}
            />
            <FormControlLabel
              value="yes"
              control={<Radio size="small" />}
              label={<Typography variant="caption" fontWeight={600} fontSize="0.75rem">{isJewellery ? t('salesFlow.customer.gstJewelleryShort') : t('salesFlow.customer.taxGst')}</Typography>}
              sx={{ mr: 1 }}
            />
          </RadioGroup>

          {/* Statutory Details Button */}
          <Button
            size="small"
            variant={hasStatutorySet ? "outlined" : "text"}
            color={hasStatutorySet ? "success" : "inherit"}
            startIcon={<TuneIcon sx={{ fontSize: 14 }} />}
            onClick={() => setStatutoryModalOpen(true)}
            sx={{
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 1.5,
              py: 0.25,
              px: 0.75,
              color: hasStatutorySet ? 'success.main' : 'text.secondary',
            }}
          >
            Statutory GST {hasStatutorySet ? '• Set' : ''}
          </Button>

          {/* Visual separator */}
          <Box sx={{ width: '1px', height: 18, bgcolor: 'divider', mx: 0.25 }} />

          <Tooltip title={formData.deliveryRequired ? t('salesFlow.customer.deliveryEnabled') : t('salesFlow.customer.enableDelivery')}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.deliveryRequired || false}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, deliveryRequired: e.target.checked }));
                    if (e.target.checked) {
                      setDeliveryModalOpen(true);
                    }
                  }}
                  size="small"
                  icon={<LocalShippingIcon fontSize="small" color="disabled" />}
                  checkedIcon={<LocalShippingIcon fontSize="small" color="primary" />}
                />
              }
              label={<Typography variant="caption" fontWeight={600} fontSize="0.75rem">{t('salesFlow.customer.deliveryLabel')}</Typography>}
              sx={{ mr: 0 }}
            />
          </Tooltip>

          {/* Inline Due Chip — only rendered when customer has an outstanding balance */}
          {selectedCustomer && Number(selectedCustomer.creditBalance || 0) > 0 && (
            <Chip
              label={`Due ₹${Number(selectedCustomer.creditBalance).toFixed(2)}`}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: '0.72rem', height: 22 }}
            />
          )}

          {isJewellery && formData.buyerPan && (
            <Chip
              label={`PAN: ${formData.buyerPan}`}
              size="small"
              color="secondary"
              variant="outlined"
              onClick={() => setOptionsOpen(true)}
              sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem', height: 22 }}
            />
          )}
        </Box>

        {/* Statutory / GST Modal */}
        <Dialog
          open={statutoryModalOpen}
          onClose={() => setStatutoryModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: `1.5px solid ${alpha('#0f766e', 0.1)}`,
            }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: alpha('#0f766e', 0.05),
            borderBottom: `1px solid ${alpha('#0f766e', 0.1)}`,
            pb: 2,
          }}>
            <TuneIcon color="primary" />
            <span>Statutory / GST Details (Optional)</span>
            {hasStatutorySet && (
              <Chip
                label="Customized"
                size="small"
                color="success"
                variant="outlined"
                sx={{ ml: 'auto', fontWeight: 700 }}
              />
            )}
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <StatutoryFieldset
              title=""
              value={{
                placeOfSupply: formData.placeOfSupply,
                supplyType: formData.supplyType,
                reverseCharge: formData.reverseCharge,
                billToAddress: formData.billToAddress,
                shipToAddress: formData.shipToAddress,
                consigneeAddress: formData.consigneeAddress,
              }}
              onChange={(next) => setFormData((prev) => ({ ...prev, ...next }))}
              showConsignee
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="contained"
              onClick={() => setStatutoryModalOpen(false)}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Done
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delivery Modal */}
        <Dialog 
          open={deliveryModalOpen} 
          onClose={() => setDeliveryModalOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: `1.5px solid ${alpha('#0f766e', 0.08)}`,
            }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 900,
            bgcolor: alpha('#0f766e', 0.08),
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontSize: '1.1rem',
            color: 'var(--color-teal)',
            borderBottom: `2px solid ${alpha('#0f766e', 0.08)}`,
            pb: 2
          }}>
            <LocalShippingIcon sx={{ fontSize: 28 }} />
            <span>{t('salesFlow.customer.deliveryDetailsTitle')}</span>
            {formData.deliveryRequired && (
              <Chip 
                icon={<DoneIcon sx={{ fontSize: 16 }} />}
                label={t('salesFlow.customer.activeChip')}
                size="small"
                color="success"
                variant="outlined"
                sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.7rem' }}
              />
            )}
          </DialogTitle>
          <DialogContent sx={{ 
            mt: 0,
            pt: 2.5,
            pb: 2.5,
            px: 3,
            backgroundColor: 'transparent',
          }}>
            {DeliveryModalContent}
          </DialogContent>
          <DialogActions sx={{
            p: 2.5,
            bgcolor: alpha('#0f766e', 0.08),
            borderTop: `1px solid ${alpha('#0f766e', 0.08)}`,
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end'
          }}>
            <Button 
              onClick={() => setDeliveryModalOpen(false)}
              variant="text"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: alpha('#0f766e', 0.08),
                }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => setDeliveryModalOpen(false)}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                textTransform: 'none',
                fontWeight: 800,
                borderRadius: 2,
                boxShadow: `0 4px 12px ${alpha('#0f766e', 0.08)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha('#0f766e', 0.08)}`,
                },
                px: 3,
                py: 1.2,
              }}
              startIcon={<DoneIcon />}
            >
              {t('salesFlow.customer.saveAndClose')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Options Dialog */}
        <Dialog open={optionsOpen} onClose={() => setOptionsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.default' }}>
            <TuneIcon color="primary" /> {t('salesFlow.customer.saleOptionsTitle')}
            {isJewellery && <Chip label={t('salesFlow.customer.jewelleryChip')} size="small" sx={{ ml: 'auto', bgcolor: 'rgba(139, 92, 246, 0.12)', color: 'var(--color-secondary)' }} />}
          </DialogTitle>
          <DialogContent dividers>
            {isJewellery && (
              <Box sx={{ mb: 3 }}>
                {isHighValueJewellery && (
                  <Alert severity={isPanMissing ? 'warning' : (isPanError ? 'error' : 'success')} sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }} icon={(isPanMissing || isPanError) ? <WarningAmberIcon /> : undefined}>
                    {isPanMissing ? t('salesFlow.customer.panRequiredCompact') : isPanError ? t('salesFlow.customer.panInvalidFormatCompact') : t('salesFlow.customer.panCaptured', { pan: formData.buyerPan })}
                  </Alert>
                )}
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'var(--color-secondary)', mb: 2 }}>{t('salesFlow.customer.jewelleryBuyerDetails')}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField label={t('salesFlow.customer.buyerPanLabel')} fullWidth value={formData.buyerPan || ''} onChange={e => setFormData(prev => ({ ...prev, buyerPan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" inputProps={{ maxLength: 10, style: { textTransform: 'uppercase', letterSpacing: 2 } }} error={isPanError} helperText={isPanError && formData.buyerPan?.trim() ? t('salesFlow.customer.panHelperInvalid') : isHighValueJewellery ? t('salesFlow.customer.panHelperMandatory') : t('salesFlow.customer.panHelperOptional')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label={t('salesFlow.customer.buyerAadhaarLabel')} fullWidth value={formData.buyerAadhaarLast4 || ''} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 4); setFormData(prev => ({ ...prev, buyerAadhaarLast4: val })); }} placeholder="XXXX" inputProps={{ maxLength: 4 }} helperText={t('salesFlow.customer.aadhaarHelperText')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label={t('salesFlow.customer.purposeOccasionLabel')} fullWidth value={formData.jewelleryPurpose || ''} onChange={e => setFormData(prev => ({ ...prev, jewelleryPurpose: e.target.value }))} placeholder={t('salesFlow.customer.purposeOccasionPlaceholder')} helperText={t('salesFlow.customer.printedOnInvoice')} />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
            <Button onClick={() => setOptionsOpen(false)} variant="contained">{t('salesFlow.customer.doneButton')}</Button>
          </DialogActions>
        </Dialog>

        {/* New Customer Modal */}
        <Dialog open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: 'background.default' }}>
            <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('salesFlow.customer.createNewCustomerTitle')}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}><TextField label={t('salesFlow.customer.fullName')} required fullWidth error={newCustomerData.name === ''} helperText={newCustomerData.name === '' ? t('salesFlow.customer.nameRequired') : ''} value={newCustomerData.name} onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField label={t('salesFlow.customer.phoneNumber')} required fullWidth error={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10} helperText={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10 ? t('salesFlow.customer.enterValidPhone') : ''} value={newCustomerData.phone} onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField label={t('salesFlow.customer.addressLine1Label')} fullWidth value={newCustomerData.addressLine1} onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine1: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField label={t('salesFlow.customer.cityLabel')} fullWidth value={newCustomerData.city} onChange={(e) => setNewCustomerData({ ...newCustomerData, city: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField label={t('salesFlow.customer.gstNumberLabel')} fullWidth value={newCustomerData.gstNumber} onChange={(e) => setNewCustomerData({ ...newCustomerData, gstNumber: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField label={t('salesFlow.customer.notesLabel')} fullWidth multiline rows={2} value={newCustomerData.notes} onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
            <Button onClick={() => setOpenCustomerModal(false)} color="inherit">{t('common.cancel')}</Button>
            <Button onClick={handleNewCustomer} variant="contained" disabled={!isNewCustomerValid()}>{t('salesFlow.customer.saveCustomer')}</Button>
          </DialogActions>
        </Dialog>

      </Box>
    );
  }

  return (
    <Grid item xs={12}>
      <Card raised sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" /> {t('salesFlow.customer.transactionDetailsTitle')}
            {isJewellery && (
              <Box component="span" sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'var(--color-secondary)', fontWeight: 700 }}>{t('salesFlow.customer.jewelleryLabel')}</Typography>
              </Box>
            )}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>
                {t('salesFlow.customer.selectCustomerLabel')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Select
                    options={customers}
                    value={selectedCustomer}
                    onChange={handleCustomerSelect}
                    placeholder={t('salesFlow.customer.searchCustomerGstPlaceholder')}
                    isSearchable
                    isClearable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                  />
                </Box>
                <Tooltip title={t('salesFlow.customer.addNewCustomer')}>
                  <Button
                    variant="contained"
                    onClick={() => setOpenCustomerModal(true)}
                    sx={{ minWidth: '50px', borderRadius: '8px' }}
                  >
                    <PersonAddIcon />
                  </Button>
                </Tooltip>
              </Box>

              <Collapse in={isGstMissing}>
                <Alert
                  severity="warning"
                  icon={<WarningAmberIcon fontSize="inherit" />}
                  sx={{ mt: 1, borderRadius: 2, '& .MuiAlert-message': { fontWeight: 500 } }}
                >
                  {t('salesFlow.customer.noGstAlert')}
                </Alert>
              </Collapse>
            </Grid>

            <Grid item xs={12} md={5}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>
                {t('salesFlow.customer.invoiceTypeLabel')} {!isJewellery && isGstDisabled && t('salesFlow.customer.gstRequiresGstin')}
              </Typography>
              <RadioGroup
                  row
                  value={formData.isGstRequired}
                  onChange={handleGstToggle}
                  sx={{ mb: 1 }}
                >
                  <FormControlLabel value="no" control={<Radio size="small" />} label={t('salesFlow.customer.retailNoGst')} />
                  <Tooltip title={isGstDisabled ? t('salesFlow.customer.noGstOnFileFull') : ''}>
                    <FormControlLabel
                      value="yes"
                      control={<Radio size="small" />}
                      label={isJewellery ? t('salesFlow.customer.gstJewellery') : t('salesFlow.customer.taxGst')}
                      disabled={isGstDisabled}
                    />
                  </Tooltip>
                </RadioGroup>

              <TextField
                label={t('salesFlow.customer.totalSaleAmount')}
                fullWidth
                value={formData.totalAmount}
                InputProps={{ 
                  readOnly: true,
                  sx: { fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)', bgcolor: 'rgba(59, 130, 246, 0.08)' } 
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {isJewellery && (
            <Box sx={{ mb: 2 }}>
              {isHighValueJewellery && (
                <Alert
                  severity={isPanMissing ? 'warning' : (isPanError ? 'error' : 'success')}
                  sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}
                  icon={(isPanMissing || isPanError) ? <WarningAmberIcon /> : undefined}
                >
                  {isPanMissing
                    ? t('salesFlow.customer.panRequired')
                    : isPanError
                    ? t('salesFlow.customer.panInvalidFormat')
                    : t('salesFlow.customer.panCaptured', { pan: formData.buyerPan })}
                </Alert>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'var(--color-secondary)' }}>
                  {t('salesFlow.customer.jewelleryBuyerDetails')}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t('salesFlow.customer.buyerPanLabel')}
                    fullWidth
                    value={formData.buyerPan || ''}
                    onChange={e => setFormData(prev => ({ ...prev, buyerPan: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F"
                    inputProps={{ maxLength: 10, style: { textTransform: 'uppercase', letterSpacing: 2 } }}
                    error={isPanError}
                    helperText={
                      isPanError && formData.buyerPan?.trim()
                        ? t('salesFlow.customer.panHelperInvalid')
                        : isHighValueJewellery
                        ? t('salesFlow.customer.panHelperMandatory')
                        : t('salesFlow.customer.panHelperOptional')
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t('salesFlow.customer.buyerAadhaarLabel')}
                    fullWidth
                    value={formData.buyerAadhaarLast4 || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormData(prev => ({ ...prev, buyerAadhaarLast4: val }));
                    }}
                    placeholder="XXXX"
                    inputProps={{ maxLength: 4 }}
                    helperText={t('salesFlow.customer.aadhaarHelperText')}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t('salesFlow.customer.purposeOccasionLabel')}
                    fullWidth
                    value={formData.jewelleryPurpose || ''}
                    onChange={e => setFormData(prev => ({ ...prev, jewelleryPurpose: e.target.value }))}
                    placeholder={t('salesFlow.customer.purposeOccasionPlaceholder')}
                    helperText={t('salesFlow.customer.printedOnInvoice')}
                  />
                </Grid>
              </Grid>
              <Divider sx={{ mt: 2 }} />
            </Box>
          )}

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.deliveryRequired || false}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, deliveryRequired: e.target.checked }));
                      if (e.target.checked) {
                        setDeliveryModalOpen(true);
                      }
                    }}
                    icon={<LocalShippingIcon color="disabled" />}
                    checkedIcon={<LocalShippingIcon color="primary" />}
                  />
                }
                label={<Typography sx={{ fontWeight: 700 }}>{t('salesFlow.customer.enableDeliveryLabel')}</Typography>}
              />
              {formData.deliveryRequired && (
                <Chip
                  label={t('salesFlow.customer.configuredChip')}
                  size="small"
                  color="success"
                  variant="outlined"
                  icon={<DoneIcon />}
                  sx={{ fontWeight: 700 }}
                  onClick={() => setDeliveryModalOpen(true)}
                  clickable
                />
              )}
            </Box>

            {formData.deliveryRequired && (
              <Box sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: alpha('#0f766e', 0.08),
                border: `1.5px solid ${alpha('#0f766e', 0.08)}`,
                mb: 2,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  <LocationOnIcon sx={{ color: 'var(--color-teal)', mt: 0.5, flexShrink: 0, fontSize: 20 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-teal)', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {t('salesFlow.customer.deliveryAddressTitle')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--color-teal)', wordBreak: 'break-word', fontWeight: 600 }}>
                      {formData.deliveryAddress ? formData.deliveryAddress : <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>{t('salesFlow.customer.notSetYet')}</Typography>}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <LocalOfferIcon sx={{ color: 'var(--color-teal)', flexShrink: 0, fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-teal)', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {t('salesFlow.customer.chargeDetailsLabel')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--color-teal)', fontWeight: 800 }}>
                      ₹{Number(formData.deliveryCharge || 0).toFixed(2)} <Typography component="span" variant="caption" sx={{ fontWeight: 600, color: 'var(--color-teal)', ml: 1 }}>({formData.deliveryPaidBy === 'CUSTOMER' ? t('salesFlow.customer.paidByCustomer') : t('salesFlow.customer.paidByShop')})</Typography>
                    </Typography>
                  </Box>
                </Box>

                {formData.deliveryNotes && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha('#0f766e', 0.08)}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-teal)', display: 'block', mb: 0.75, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {t('salesFlow.customer.specialInstructionsTitle')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--color-teal)', display: 'block' }}>
                      {formData.deliveryNotes}
                    </Typography>
                  </Box>
                )}

                <Button 
                  size="small" 
                  variant="text"
                  startIcon={<EditIcon />}
                  onClick={() => setDeliveryModalOpen(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    color: 'var(--color-teal)',
                    mt: 1.5,
                    p: 0,
                    fontSize: '0.85rem',
                  }}
                >
                  {t('salesFlow.customer.editDetails')}
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Delivery Modal */}
      <Dialog 
        open={deliveryModalOpen} 
        onClose={() => setDeliveryModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1.5px solid ${alpha('#0f766e', 0.08)}`,
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 900,
          bgcolor: alpha('#0f766e', 0.08),
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          fontSize: '1.1rem',
          color: 'var(--color-teal)',
          borderBottom: `2px solid ${alpha('#0f766e', 0.08)}`,
          pb: 2
        }}>
          <LocalShippingIcon sx={{ fontSize: 28 }} />
          <span>{t('salesFlow.customer.deliveryDetailsTitle')}</span>
          {formData.deliveryRequired && (
            <Chip
              icon={<DoneIcon sx={{ fontSize: 16 }} />}
              label={t('salesFlow.customer.activeChip')}
              size="small" 
              color="success"
              variant="outlined"
              sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ 
          mt: 0,
          pt: 2.5,
          pb: 2.5,
          px: 3,
          backgroundColor: 'transparent',
        }}>
          {DeliveryModalContent}
        </DialogContent>
        <DialogActions sx={{
          p: 2.5,
          bgcolor: alpha('#0f766e', 0.08),
          borderTop: `1px solid ${alpha('#0f766e', 0.08)}`,
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end'
        }}>
          <Button 
            onClick={() => setDeliveryModalOpen(false)}
            variant="text"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha('#0f766e', 0.08),
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setDeliveryModalOpen(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 2,
              boxShadow: `0 4px 12px ${alpha('#0f766e', 0.08)}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha('#0f766e', 0.08)}`,
              },
              px: 3,
              py: 1.2,
            }}
            startIcon={<DoneIcon />}
          >
            Save & Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW CUSTOMER MODAL */}
      <Dialog open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: 'background.default' }}>
          <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('salesFlow.customer.createNewCustomerTitle')}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField label={t('salesFlow.customer.fullName')} required fullWidth error={newCustomerData.name === ''} helperText={newCustomerData.name === '' ? t('salesFlow.customer.nameRequired') : ''} value={newCustomerData.name} onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label={t('salesFlow.customer.phoneNumber')} required fullWidth error={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10} helperText={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10 ? t('salesFlow.customer.enterValidPhone') : ''} value={newCustomerData.phone} onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label={t('salesFlow.customer.addressLine1Label')} fullWidth value={newCustomerData.addressLine1} onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine1: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label={t('salesFlow.customer.cityLabel')} fullWidth value={newCustomerData.city} onChange={(e) => setNewCustomerData({ ...newCustomerData, city: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label={t('salesFlow.customer.gstNumberLabel')} fullWidth value={newCustomerData.gstNumber} onChange={(e) => setNewCustomerData({ ...newCustomerData, gstNumber: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label={t('salesFlow.customer.notesLabel')} fullWidth multiline rows={2} value={newCustomerData.notes} onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
          <Button onClick={() => setOpenCustomerModal(false)} color="inherit">{t('common.cancel')}</Button>
          <Button onClick={handleNewCustomer} variant="contained" disabled={!isNewCustomerValid()}>{t('salesFlow.customer.saveCustomer')}</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CustomerSection;



