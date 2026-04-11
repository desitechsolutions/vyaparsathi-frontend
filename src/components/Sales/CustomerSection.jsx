import React, { useRef, useState, useCallback, useMemo } from 'react';
import { 
  Grid, Card, CardContent, Button, RadioGroup, FormControlLabel, Radio, 
  TextField, Typography, Box, Checkbox, FormControl, InputLabel, 
  Select as MuiSelect, MenuItem, Divider, Tooltip, Alert, Collapse, Switch, Chip, Stack, alpha
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
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TuneIcon from '@mui/icons-material/Tune';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DoneIcon from '@mui/icons-material/Done';
import EditIcon from '@mui/icons-material/Edit';

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
  isPharmacy,
  isJewellery,
  compact,
}) => {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const PAN_THRESHOLD = 200000;
  const isHighValueJewellery = isJewellery && Number(formData.totalAmount) >= PAN_THRESHOLD;
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isPanFormatValid = !formData.buyerPan?.trim() || PAN_REGEX.test(formData.buyerPan.trim());
  const isPanMissing = isHighValueJewellery && !formData.buyerPan?.trim();
  const isPanError = isPanMissing || (formData.buyerPan?.trim() && !isPanFormatValid);

  const openCamera = async () => {
    setPrescriptionDialogOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      // Camera not available
    }
  };

  const closeCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setPrescriptionDialogOpen(false);
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      setPrescriptionImage(canvas.toDataURL('image/jpeg'));
    }
    closeCamera();
  }, [closeCamera]);

  const isGstMissing = formData.isGstRequired === 'yes' && selectedCustomer && !selectedCustomer.gstNumber;
  const isGstDisabled = (isPharmacy || isJewellery) ? false : (!selectedCustomer || !selectedCustomer.gstNumber);
  
  const handleGstToggle = useCallback((e) => {
    if (e.target.value === 'yes' && isGstDisabled) return;
    setFormData((prev) => ({ ...prev, isGstRequired: e.target.value }));
  }, [isGstDisabled, setFormData]);

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
          <LocationOnIcon sx={{ color: '#0f766e', fontSize: 22 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f766e' }}>
            Delivery Address
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
              borderColor: '#0f766e',
              color: '#0f766e',
              mb: 1.5,
              py: 1,
              '&:hover': {
                bgcolor: alpha('#0f766e', 0.05),
                borderColor: '#0f766e',
              }
            }}
          >
            Use Customer Address
          </Button>
        )}

        <TextField 
          label="Delivery Address" 
          multiline 
          rows={3}
          fullWidth 
          value={formData.deliveryAddress || ''} 
          onChange={handleDeliveryAddressChange}
          placeholder="Enter complete delivery address or click 'Use Customer Address'"
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
        <Typography variant="caption" sx={{ color: '#64748b', mt: 0.75, display: 'block' }}>
          Street, building, apartment, city, postal code
        </Typography>
      </Box>

      <Divider sx={{ my: 2.5, borderColor: alpha('#0f766e', 0.1) }} />

      {/* Charge & Payment Section */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocalOfferIcon sx={{ color: '#0f766e', fontSize: 22 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f766e' }}>
            Delivery Charge & Payment
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Charge Amount"
              type="number"
              fullWidth
              size="small"
              value={formData.deliveryCharge || ''}
              onChange={handleDeliveryChargeChange}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.75, color: '#0f766e', fontWeight: 800, fontSize: '1rem' }}>₹</Typography>,
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
              <InputLabel sx={{ fontSize: '0.9rem' }}>Paid By</InputLabel>
              <MuiSelect
                value={formData.deliveryPaidBy || ''}
                label="Paid By"
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
                    <span>Customer</span>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>(To Pay)</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="SHOP">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Shop</span>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>(Inclusive)</Typography>
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
            border: `1.5px solid ${alpha('#0f766e', 0.2)}`,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f766e' }}>
                Delivery Charge:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f766e' }}>
                ₹{Number(formData.deliveryCharge).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ height: 1, bgcolor: alpha('#0f766e', 0.1), mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 700 }}>
              Paid by: <span style={{ fontWeight: 900 }}>{formData.deliveryPaidBy === 'CUSTOMER' ? 'Customer' : 'Shop'}</span>
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2.5, borderColor: alpha('#0f766e', 0.1) }} />

      {/* Special Instructions Section */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f766e', mb: 1.5 }}>
          Special Instructions
        </Typography>
        <TextField
          label="Delivery Notes"
          placeholder="E.g., Ring bell twice, Gate code 1234, Leave at reception..."
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
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.75 }}>
          Optional: Add any special instructions for delivery personnel
        </Typography>
      </Box>
    </>
  ), [formData, selectedCustomer, handleDeliveryAddressChange, handleDeliveryChargeChange, handleDeliveryPaidByChange, handleDeliveryNotesChange, copyCustomerAddress]);

  // -----------------------------------------------------------------------
  // COMPACT MODE
  // -----------------------------------------------------------------------
  if (compact) {
    const selectStyles = {
      control: (base) => ({ ...base, borderRadius: '8px', minHeight: '40px', borderColor: '#e0e0e0', fontSize: '0.875rem' }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Select
              options={customers}
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              placeholder={isPharmacy ? 'Search patient...' : 'Search customer...'}
              isSearchable
              isClearable
              styles={selectStyles}
              menuPortalTarget={document.body}
            />
          </Box>
          <Tooltip title={isPharmacy ? 'Register New Patient' : 'Add New Customer'}>
            <Button variant="contained" onClick={() => setOpenCustomerModal(true)} sx={{ minWidth: 40, p: 1 }}>
              <PersonAddIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <RadioGroup row value={formData.isGstRequired} onChange={handleGstToggle} sx={{ mr: 1 }}>
            <FormControlLabel value="no" control={<Radio size="small" />} label={<Typography variant="caption" fontWeight={600}>Retail</Typography>} sx={{ mr: 1 }} />
            <Tooltip title={isGstDisabled ? 'Customer has no GST number on file' : ''}>
              <FormControlLabel
                value="yes"
                control={<Radio size="small" />}
                label={<Typography variant="caption" fontWeight={600}>{isPharmacy ? 'GST (Med)' : isJewellery ? 'GST 3%' : 'Tax (GST)'}</Typography>}
                disabled={isGstDisabled}
                sx={{ mr: 0 }}
              />
            </Tooltip>
          </RadioGroup>
          
          <Tooltip title={formData.deliveryRequired ? 'Delivery enabled — click to edit' : 'Enable delivery'}>
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
              label={<Typography variant="caption" fontWeight={600}>Delivery</Typography>}
              sx={{ mr: 0 }}
            />
          </Tooltip>
          
          {isPharmacy && formData.doctorName && (
            <Chip label="Rx ✓" size="small" color="success" variant="outlined" onClick={() => setOptionsOpen(true)} sx={{ cursor: 'pointer', fontWeight: 600 }} />
          )}
          {isJewellery && formData.buyerPan && (
            <Chip label={`PAN: ${formData.buyerPan}`} size="small" color="secondary" variant="outlined" onClick={() => setOptionsOpen(true)} sx={{ cursor: 'pointer', fontWeight: 600 }} />
          )}
        </Box>

        {/* Delivery Modal */}
        <Dialog 
          open={deliveryModalOpen} 
          onClose={() => setDeliveryModalOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
            }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 900,
            bgcolor: alpha('#0f766e', 0.05),
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontSize: '1.1rem',
            color: '#0f766e',
            borderBottom: `2px solid ${alpha('#0f766e', 0.1)}`,
            pb: 2
          }}>
            <LocalShippingIcon sx={{ fontSize: 28 }} />
            <span>Delivery Details</span>
            {formData.deliveryRequired && (
              <Chip 
                icon={<DoneIcon sx={{ fontSize: 16 }} />}
                label="Active" 
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
            bgcolor: alpha('#0f766e', 0.02),
            borderTop: `1px solid ${alpha('#0f766e', 0.1)}`,
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
                color: '#64748b',
                '&:hover': {
                  bgcolor: alpha('#0f766e', 0.05),
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
                boxShadow: `0 4px 12px ${alpha('#0f766e', 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha('#0f766e', 0.4)}`,
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

        {/* Options Dialog */}
        <Dialog open={optionsOpen} onClose={() => setOptionsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc' }}>
            <TuneIcon color="primary" /> Sale Options
            {isPharmacy && <Chip label="Pharmacy" size="small" color="primary" sx={{ ml: 'auto' }} />}
            {isJewellery && <Chip label="💎 Jewellery" size="small" sx={{ ml: 'auto', bgcolor: '#ede9fe', color: '#7c3aed' }} />}
          </DialogTitle>
          <DialogContent dividers>
            {isPharmacy && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocalHospitalIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={700} color="primary">Prescription Details</Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {prescriptionImage && <Tooltip title="Prescription captured"><CheckCircleIcon color="success" fontSize="small" /></Tooltip>}
                    <Button size="small" variant={prescriptionImage ? 'outlined' : 'contained'} color={prescriptionImage ? 'success' : 'primary'} startIcon={<CameraAltIcon />} onClick={openCamera} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                      {prescriptionImage ? 'Re-capture Rx' : 'Capture Prescription'}
                    </Button>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Prescribing Doctor" fullWidth value={formData.doctorName || ''} onChange={e => setFormData(prev => ({ ...prev, doctorName: e.target.value }))} placeholder="Dr. Sharma" InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontSize: '0.85rem' }}>Dr.</Typography> }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Doctor Reg. No." fullWidth value={formData.doctorRegistrationNumber || ''} onChange={e => setFormData(prev => ({ ...prev, doctorRegistrationNumber: e.target.value }))} placeholder="MCI-12345" helperText="Required for Schedule H1/X drugs" />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Patient Name / ID" fullWidth value={formData.patientName || ''} onChange={e => setFormData(prev => ({ ...prev, patientName: e.target.value }))} placeholder="For chronic medication tracking" helperText="Links sale to patient history" />
                  </Grid>
                </Grid>
                <Divider sx={{ mt: 2 }} />
              </Box>
            )}

            {isJewellery && (
              <Box sx={{ mb: 3 }}>
                {isHighValueJewellery && (
                  <Alert severity={isPanMissing ? 'warning' : (isPanError ? 'error' : 'success')} sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }} icon={(isPanMissing || isPanError) ? <WarningAmberIcon /> : undefined}>
                    {isPanMissing ? 'PAN required: Sale amount ≥ ₹2,00,000. Mandatory under IT Act Sec. 269ST.' : isPanError ? 'Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).' : `PAN captured: ${formData.buyerPan} ✓`}
                  </Alert>
                )}
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#7c3aed', mb: 2 }}>💎 Jewellery Buyer Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Buyer PAN" fullWidth value={formData.buyerPan || ''} onChange={e => setFormData(prev => ({ ...prev, buyerPan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" inputProps={{ maxLength: 10, style: { textTransform: 'uppercase', letterSpacing: 2 } }} error={isPanError} helperText={isPanError && formData.buyerPan?.trim() ? 'Invalid format — AAAAA9999A' : isHighValueJewellery ? 'Mandatory for transactions ≥ ₹2,00,000' : 'Optional for smaller transactions'} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Buyer Aadhaar (last 4 digits)" fullWidth value={formData.buyerAadhaarLast4 || ''} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 4); setFormData(prev => ({ ...prev, buyerAadhaarLast4: val })); }} placeholder="XXXX" inputProps={{ maxLength: 4 }} helperText="Optional — for KYC records" />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Purpose / Occasion" fullWidth value={formData.jewelleryPurpose || ''} onChange={e => setFormData(prev => ({ ...prev, jewelleryPurpose: e.target.value }))} placeholder="e.g., Wedding, Birthday Gift" helperText="Printed on invoice" />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <Button onClick={() => setOptionsOpen(false)} variant="contained">Done</Button>
          </DialogActions>
        </Dialog>

        {/* New Customer Modal */}
        <Dialog open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
            <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {isPharmacy ? 'Register New Patient' : 'Create New Customer'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}><TextField label="Full Name" required fullWidth error={newCustomerData.name === ''} helperText={newCustomerData.name === '' ? 'Name is required' : ''} value={newCustomerData.name} onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Phone Number" required fullWidth error={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10} helperText={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10 ? 'Enter valid phone' : ''} value={newCustomerData.phone} onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} /></Grid>
              {isPharmacy && (
                <>
                  <Grid item xs={6} sm={4}><TextField label="Age" type="number" fullWidth value={newCustomerData.age || ''} onChange={(e) => setNewCustomerData({ ...newCustomerData, age: e.target.value })} inputProps={{ min: 0, max: 130 }} /></Grid>
                  <Grid item xs={6} sm={4}><FormControl fullWidth><InputLabel>Gender</InputLabel><MuiSelect value={newCustomerData.gender || ''} label="Gender" onChange={(e) => setNewCustomerData({ ...newCustomerData, gender: e.target.value })}><MenuItem value="MALE">Male</MenuItem><MenuItem value="FEMALE">Female</MenuItem><MenuItem value="OTHER">Other</MenuItem></MuiSelect></FormControl></Grid>
                  <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}><FormControlLabel control={<Switch checked={!!newCustomerData.isChronicPatient} onChange={(e) => setNewCustomerData({ ...newCustomerData, isChronicPatient: e.target.checked })} color="warning" />} label={<Typography variant="body2" fontWeight={600}>Chronic Patient</Typography>} /></Grid>
                </>
              )}
              <Grid item xs={12}><TextField label="Address Line 1" fullWidth value={newCustomerData.addressLine1} onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine1: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="City" fullWidth value={newCustomerData.city} onChange={(e) => setNewCustomerData({ ...newCustomerData, city: e.target.value })} /></Grid>
              {!isPharmacy && <Grid item xs={12} sm={6}><TextField label="GST Number" fullWidth value={newCustomerData.gstNumber} onChange={(e) => setNewCustomerData({ ...newCustomerData, gstNumber: e.target.value })} /></Grid>}
              <Grid item xs={12}><TextField label={isPharmacy ? 'Medical Notes / Allergies' : 'Notes'} fullWidth multiline rows={2} value={newCustomerData.notes} onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })} placeholder={isPharmacy ? 'Known allergies, chronic conditions...' : ''} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <Button onClick={() => setOpenCustomerModal(false)} color="inherit">Cancel</Button>
            <Button onClick={handleNewCustomer} variant="contained" disabled={!isNewCustomerValid()}>{isPharmacy ? 'Register Patient' : 'Save Customer'}</Button>
          </DialogActions>
        </Dialog>

        {/* Prescription Capture Dialog */}
        <Dialog open={prescriptionDialogOpen} onClose={closeCamera} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, bgcolor: '#f0fdf4' }}><CameraAltIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />Capture Prescription</DialogTitle>
          <DialogContent dividers sx={{ textAlign: 'center' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '320px', borderRadius: 8, background: '#000' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {!cameraStream && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Camera access is required to capture a prescription photo.</Typography>}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeCamera} color="inherit">Cancel</Button>
            <Button variant="contained" startIcon={<CameraAltIcon />} onClick={capturePhoto} disabled={!cameraStream}>Capture Photo</Button>
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
            <ReceiptIcon color="primary" /> Transaction Details
            {isPharmacy && (
              <Box component="span" sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocalHospitalIcon color="primary" fontSize="small" />
                <Typography variant="caption" color="primary" fontWeight={700}>Pharmacy Sale</Typography>
              </Box>
            )}
            {isJewellery && (
              <Box component="span" sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 700 }}>💎 Jewellery Sale</Typography>
              </Box>
            )}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>
                {isPharmacy ? 'SELECT PATIENT' : 'SELECT CUSTOMER'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Select
                    options={customers}
                    value={selectedCustomer}
                    onChange={handleCustomerSelect}
                    placeholder={isPharmacy ? 'Search patient name or phone...' : 'Search name, phone, or GST...'}
                    isSearchable
                    isClearable
                    styles={{
                      control: (base) => ({ 
                        ...base, 
                        borderRadius: '8px', 
                        minHeight: '45px',
                        borderColor: isGstMissing ? '#ed6c02' : '#e0e0e0'
                      }),
                      menuPortal: base => ({ ...base, zIndex: 9999 })
                    }}
                    menuPortalTarget={document.body}
                  />
                </Box>
                <Tooltip title={isPharmacy ? 'Register New Patient' : 'Add New Customer'}>
                  <Button 
                    variant="contained" 
                    onClick={() => setOpenCustomerModal(true)}
                    sx={{ minWidth: '50px', borderRadius: '8px' }}
                  >
                    <PersonAddIcon />
                  </Button>
                </Tooltip>
              </Box>
              
              <Collapse in={isGstMissing && !isPharmacy}>
                <Alert 
                  severity="warning" 
                  icon={<WarningAmberIcon fontSize="inherit" />}
                  sx={{ mt: 1, borderRadius: 2, '& .MuiAlert-message': { fontWeight: 500 } }}
                >
                  Selected customer does not have a GST number.
                </Alert>
              </Collapse>
            </Grid>

            <Grid item xs={12} md={5}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>
                INVOICE TYPE {!isPharmacy && !isJewellery && isGstDisabled && "(GST requires customer GSTIN)"}
              </Typography>
              <RadioGroup
                  row
                  value={formData.isGstRequired}
                  onChange={handleGstToggle}
                  sx={{ mb: 1 }}
                >
                  <FormControlLabel value="no" control={<Radio size="small" />} label="Retail (No GST)" />
                  <Tooltip title={isGstDisabled ? "Selected customer has no GST number on file" : ""}>
                    <FormControlLabel 
                      value="yes" 
                      control={<Radio size="small" />} 
                      label={isPharmacy ? "Inclusive GST (Medicine)" : isJewellery ? "GST @ 3% (Jewellery)" : "Tax (GST)"}
                      disabled={isGstDisabled}
                    />
                  </Tooltip>
                </RadioGroup>
              
              <TextField
                label="Total Sale Amount"
                fullWidth
                value={formData.totalAmount}
                InputProps={{ 
                  readOnly: true,
                  sx: { fontWeight: 800, fontSize: '1.2rem', color: '#1a56db', bgcolor: '#f0f7ff' } 
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {isPharmacy && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalHospitalIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700} color="primary">
                  Prescription Details
                </Typography>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {prescriptionImage && (
                    <Tooltip title="Prescription captured">
                      <CheckCircleIcon color="success" fontSize="small" />
                    </Tooltip>
                  )}
                  <Button
                    size="small"
                    variant={prescriptionImage ? 'outlined' : 'contained'}
                    color={prescriptionImage ? 'success' : 'primary'}
                    startIcon={<CameraAltIcon />}
                    onClick={openCamera}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                  >
                    {prescriptionImage ? 'Re-capture Rx' : 'Capture Prescription'}
                  </Button>
                </Box>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Prescribing Doctor"
                    fullWidth
                    value={formData.doctorName || ''}
                    onChange={e => setFormData(prev => ({ ...prev, doctorName: e.target.value }))}
                    placeholder="Dr. Sharma"
                    InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontSize: '0.85rem' }}>Dr.</Typography> }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Doctor Reg. No."
                    fullWidth
                    value={formData.doctorRegistrationNumber || ''}
                    onChange={e => setFormData(prev => ({ ...prev, doctorRegistrationNumber: e.target.value }))}
                    placeholder="MCI-12345"
                    helperText="Required for Schedule H1/X drugs"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Patient Name / ID"
                    fullWidth
                    value={formData.patientName || ''}
                    onChange={e => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                    placeholder="For chronic medication tracking"
                    helperText="Links sale to patient history"
                  />
                </Grid>
              </Grid>
              <Divider sx={{ mt: 2 }} />
            </Box>
          )}

          {isJewellery && (
            <Box sx={{ mb: 2 }}>
              {isHighValueJewellery && (
                <Alert
                  severity={isPanMissing ? 'warning' : (isPanError ? 'error' : 'success')}
                  sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}
                  icon={(isPanMissing || isPanError) ? <WarningAmberIcon /> : undefined}
                >
                  {isPanMissing
                    ? 'PAN required: Sale amount ≥ ₹2,00,000. Collecting buyer PAN is mandatory under IT Act Sec. 269ST.'
                    : isPanError
                    ? 'Invalid PAN format. PAN must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).'
                    : `PAN captured: ${formData.buyerPan} ✓`}
                </Alert>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#7c3aed' }}>
                  💎 Jewellery Buyer Details
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Buyer PAN"
                    fullWidth
                    value={formData.buyerPan || ''}
                    onChange={e => setFormData(prev => ({ ...prev, buyerPan: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F"
                    inputProps={{ maxLength: 10, style: { textTransform: 'uppercase', letterSpacing: 2 } }}
                    error={isPanError}
                    helperText={
                      isPanError && formData.buyerPan?.trim()
                        ? 'Invalid format — must be AAAAA9999A (5 letters, 4 digits, 1 letter)'
                        : isHighValueJewellery
                        ? 'Mandatory for transactions ≥ ₹2,00,000'
                        : 'Optional for smaller transactions'
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Buyer Aadhaar (last 4 digits)"
                    fullWidth
                    value={formData.buyerAadhaarLast4 || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormData(prev => ({ ...prev, buyerAadhaarLast4: val }));
                    }}
                    placeholder="XXXX"
                    inputProps={{ maxLength: 4 }}
                    helperText="Optional — for KYC records"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Purpose / Occasion"
                    fullWidth
                    value={formData.jewelleryPurpose || ''}
                    onChange={e => setFormData(prev => ({ ...prev, jewelleryPurpose: e.target.value }))}
                    placeholder="e.g., Wedding, Birthday Gift"
                    helperText="Printed on invoice"
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
                label={<Typography sx={{ fontWeight: 700 }}>Enable Delivery</Typography>}
              />
              {formData.deliveryRequired && (
                <Chip 
                  label="Configured" 
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
                bgcolor: alpha('#0f766e', 0.05),
                border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
                mb: 2,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  <LocationOnIcon sx={{ color: '#0f766e', mt: 0.5, flexShrink: 0, fontSize: 20 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f766e', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      Delivery Address
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f766e', wordBreak: 'break-word', fontWeight: 600 }}>
                      {formData.deliveryAddress ? formData.deliveryAddress : <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#94a3b8' }}>Not set yet</Typography>}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <LocalOfferIcon sx={{ color: '#0f766e', flexShrink: 0, fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f766e', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      Charge Details
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f766e', fontWeight: 800 }}>
                      ₹{Number(formData.deliveryCharge || 0).toFixed(2)} <Typography component="span" variant="caption" sx={{ fontWeight: 600, color: '#0f766e', ml: 1 }}>({formData.deliveryPaidBy === 'CUSTOMER' ? 'Customer' : 'Shop'})</Typography>
                    </Typography>
                  </Box>
                </Box>

                {formData.deliveryNotes && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha('#0f766e', 0.2)}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f766e', display: 'block', mb: 0.75, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      Special Instructions
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#0f766e', display: 'block' }}>
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
                    color: '#0f766e',
                    mt: 1.5,
                    p: 0,
                    fontSize: '0.85rem',
                  }}
                >
                  Edit Details
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
            border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 900,
          bgcolor: alpha('#0f766e', 0.05),
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          fontSize: '1.1rem',
          color: '#0f766e',
          borderBottom: `2px solid ${alpha('#0f766e', 0.1)}`,
          pb: 2
        }}>
          <LocalShippingIcon sx={{ fontSize: 28 }} />
          <span>Delivery Details</span>
          {formData.deliveryRequired && (
            <Chip 
              icon={<DoneIcon sx={{ fontSize: 16 }} />}
              label="Active" 
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
          bgcolor: alpha('#0f766e', 0.02),
          borderTop: `1px solid ${alpha('#0f766e', 0.1)}`,
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
              color: '#64748b',
              '&:hover': {
                bgcolor: alpha('#0f766e', 0.05),
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
              boxShadow: `0 4px 12px ${alpha('#0f766e', 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha('#0f766e', 0.4)}`,
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

      {/* NEW CUSTOMER / PATIENT MODAL */}
      <Dialog open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
          <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {isPharmacy ? 'Register New Patient' : 'Create New Customer'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField label="Full Name" required fullWidth error={newCustomerData.name === ''} helperText={newCustomerData.name === '' ? 'Name is required' : ''} value={newCustomerData.name} onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone Number" required fullWidth error={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10} helperText={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10 ? 'Enter valid phone' : ''} value={newCustomerData.phone} onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} /></Grid>
            {isPharmacy && (
              <>
                <Grid item xs={6} sm={4}><TextField label="Age" type="number" fullWidth value={newCustomerData.age || ''} onChange={(e) => setNewCustomerData({ ...newCustomerData, age: e.target.value })} inputProps={{ min: 0, max: 130 }} /></Grid>
                <Grid item xs={6} sm={4}><FormControl fullWidth><InputLabel>Gender</InputLabel><MuiSelect value={newCustomerData.gender || ''} label="Gender" onChange={(e) => setNewCustomerData({ ...newCustomerData, gender: e.target.value })}><MenuItem value="MALE">Male</MenuItem><MenuItem value="FEMALE">Female</MenuItem><MenuItem value="OTHER">Other</MenuItem></MuiSelect></FormControl></Grid>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}><FormControlLabel control={<Switch checked={!!newCustomerData.isChronicPatient} onChange={(e) => setNewCustomerData({ ...newCustomerData, isChronicPatient: e.target.checked })} color="warning" />} label={<Typography variant="body2" fontWeight={600}>Chronic Patient</Typography>} /></Grid>
              </>
            )}
            <Grid item xs={12}><TextField label="Address Line 1" fullWidth value={newCustomerData.addressLine1} onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine1: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="City" fullWidth value={newCustomerData.city} onChange={(e) => setNewCustomerData({ ...newCustomerData, city: e.target.value })} /></Grid>
            {!isPharmacy && <Grid item xs={12} sm={6}><TextField label="GST Number" fullWidth value={newCustomerData.gstNumber} onChange={(e) => setNewCustomerData({ ...newCustomerData, gstNumber: e.target.value })} /></Grid>}
            <Grid item xs={12}><TextField label={isPharmacy ? 'Medical Notes / Allergies' : 'Notes'} fullWidth multiline rows={2} value={newCustomerData.notes} onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })} placeholder={isPharmacy ? 'Known allergies, chronic conditions...' : ''} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenCustomerModal(false)} color="inherit">Cancel</Button>
          <Button onClick={handleNewCustomer} variant="contained" disabled={!isNewCustomerValid()}>{isPharmacy ? 'Register Patient' : 'Save Customer'}</Button>
        </DialogActions>
      </Dialog>

      {/* PRESCRIPTION CAPTURE DIALOG */}
      <Dialog open={prescriptionDialogOpen} onClose={closeCamera} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#f0fdf4' }}><CameraAltIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />Capture Prescription</DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '320px', borderRadius: 8, background: '#000' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {!cameraStream && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Camera access is required to capture a prescription photo.</Typography>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCamera} color="inherit">Cancel</Button>
          <Button variant="contained" startIcon={<CameraAltIcon />} onClick={capturePhoto} disabled={!cameraStream}>Capture Photo</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CustomerSection;