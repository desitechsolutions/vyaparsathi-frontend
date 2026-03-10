import React, { useRef, useState } from 'react';
import { 
  Grid, Card, CardContent, Button, RadioGroup, FormControlLabel, Radio, 
  TextField, Typography, Box, Checkbox, FormControl, InputLabel, 
  Select as MuiSelect, MenuItem, Divider, Tooltip, Alert, Collapse, Switch
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
}) => {
  // Prescription capture state
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  // prescriptionImage stores the captured image as a base64 data URL.
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Jewellery: PAN mandatory when cash sale > ₹2,00,000 (IT Act Sec. 269ST)
  const PAN_THRESHOLD = 200000;
  const isHighValueJewellery = isJewellery && Number(formData.totalAmount) >= PAN_THRESHOLD;
  const isPanMissing = isHighValueJewellery && !formData.buyerPan?.trim();

  const openCamera = async () => {
    setPrescriptionDialogOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      // Camera not available — user can still upload manually
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setPrescriptionDialogOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      setPrescriptionImage(canvas.toDataURL('image/jpeg'));
    }
    closeCamera();
  };

  // Validation: Check if GST is required but customer doesn't have one
  const isGstMissing = formData.isGstRequired === 'yes' && selectedCustomer && !selectedCustomer.gstNumber;

  // Issue 5: For pharmacy, GST is always applicable (medicine has GST by law),
  // regardless of whether the customer has a GSTIN on file.
  // For jewellery, GST at 3% is also always applicable.
  const isGstDisabled = (isPharmacy || isJewellery) ? false : (!selectedCustomer || !selectedCustomer.gstNumber);
  const handleGstToggle = (e) => {
    if (e.target.value === 'yes' && isGstDisabled) {
      // Logic handled by the 'disabled' prop on Radio, but this is a safety check
      return;
    }
    setFormData((prev) => ({ ...prev, isGstRequired: e.target.value }));
  };
  const copyCustomerAddress = () => {
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
  };

  // Helper to check if new customer form is valid
  const isNewCustomerValid = () => {
    return newCustomerData.name.trim() !== '' && 
           newCustomerData.phone.trim().length >= 10;
  };

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
            {/* Customer/Patient Selection */}
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
              
              {/* GST Warning Logic — only relevant for non-pharmacy (pharmacy has item-level GST) */}
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

          {/* ---- INVOICE TYPE — Jewellery label ---- */}
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
                {/* Capture Prescription Button */}
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

          {/* ---- JEWELLERY: High-Value Transaction PAN Capture ---- */}
          {isJewellery && (
            <Box sx={{ mb: 2 }}>
              {/* PAN Alert for high-value cash transactions */}
              {isHighValueJewellery && (
                <Alert
                  severity={isPanMissing ? 'warning' : 'success'}
                  sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}
                  icon={isPanMissing ? <WarningAmberIcon /> : undefined}
                >
                  {isPanMissing
                    ? 'PAN required: Sale amount ≥ ₹2,00,000. Collecting buyer PAN is mandatory under IT Act Sec. 269ST.'
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
                    error={isPanMissing}
                    helperText={isHighValueJewellery ? 'Mandatory for transactions ≥ ₹2,00,000' : 'Optional for smaller transactions'}
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

          {/* Delivery Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.deliveryRequired || false}
                    onChange={e => setFormData(prev => ({ ...prev, deliveryRequired: e.target.checked }))}
                    icon={<LocalShippingIcon color="disabled" />}
                    checkedIcon={<LocalShippingIcon color="primary" />}
                  />
                }
                label={<Typography sx={{ fontWeight: 700 }}>Enable Delivery</Typography>}
              />
              {formData.deliveryRequired && selectedCustomer && (
                <Button 
                  size="small" 
                  startIcon={<HomeIcon />} 
                  onClick={copyCustomerAddress}
                  sx={{ textTransform: 'none' }}
                >
                  Use Customer Address
                </Button>
              )}
            </Box>

            <Collapse in={formData.deliveryRequired}>
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Delivery Address"
                      multiline
                      rows={2}
                      fullWidth
                      value={formData.deliveryAddress || ''}
                      onChange={e => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Delivery Charge"
                      type="number"
                      fullWidth
                      value={formData.deliveryCharge || ''}
                      onChange={e => {
                          const val = parseFloat(e.target.value);
                          const cleanVal = isNaN(val) ? '' : Math.max(0, val); 
                          setFormData(prev => ({ ...prev, deliveryCharge: cleanVal }));
                        }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>,
                        }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Delivery Paid By</InputLabel>
                      <MuiSelect
                        value={formData.deliveryPaidBy || ''}
                        label="Delivery Paid By"
                        onChange={e => setFormData(prev => ({ ...prev, deliveryPaidBy: e.target.value }))}
                      >
                        <MenuItem value="CUSTOMER">Customer (To Pay)</MenuItem>
                        <MenuItem value="SHOP">Shop (Inclusive)</MenuItem>
                      </MuiSelect>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Delivery Notes"
                      placeholder="Special instructions..."
                      fullWidth
                      value={formData.deliveryNotes || ''}
                      onChange={e => setFormData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>
        </CardContent>
      </Card>

      {/* NEW CUSTOMER / PATIENT MODAL WITH VALIDATION */}
      <Dialog open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
          <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {isPharmacy ? 'Register New Patient' : 'Create New Customer'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Full Name" 
                required 
                fullWidth 
                error={newCustomerData.name === ''}
                helperText={newCustomerData.name === '' ? 'Name is required' : ''}
                value={newCustomerData.name} 
                onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Phone Number" 
                required 
                fullWidth 
                error={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10}
                helperText={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10 ? 'Enter valid phone' : ''}
                value={newCustomerData.phone} 
                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} 
              />
            </Grid>
            {isPharmacy && (
              <>
                <Grid item xs={6} sm={4}>
                  <TextField
                    label="Age"
                    type="number"
                    fullWidth
                    value={newCustomerData.age || ''}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, age: e.target.value })}
                    inputProps={{ min: 0, max: 130 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <MuiSelect
                      value={newCustomerData.gender || ''}
                      label="Gender"
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, gender: e.target.value })}
                    >
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </MuiSelect>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!newCustomerData.isChronicPatient}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, isChronicPatient: e.target.checked })}
                        color="warning"
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={600}>
                        Chronic Patient
                      </Typography>
                    }
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField label="Address Line 1" fullWidth value={newCustomerData.addressLine1} onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine1: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="City" fullWidth value={newCustomerData.city} onChange={(e) => setNewCustomerData({ ...newCustomerData, city: e.target.value })} />
            </Grid>
            {!isPharmacy && (
              <Grid item xs={12} sm={6}>
                <TextField label="GST Number" fullWidth value={newCustomerData.gstNumber} onChange={(e) => setNewCustomerData({ ...newCustomerData, gstNumber: e.target.value })} />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                label={isPharmacy ? 'Medical Notes / Allergies' : 'Notes'}
                fullWidth
                multiline
                rows={2}
                value={newCustomerData.notes}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })}
                placeholder={isPharmacy ? 'Known allergies, chronic conditions...' : ''}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenCustomerModal(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleNewCustomer} 
            variant="contained" 
            disabled={!isNewCustomerValid()}
          >
            {isPharmacy ? 'Register Patient' : 'Save Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PRESCRIPTION CAPTURE DIALOG */}
      <Dialog open={prescriptionDialogOpen} onClose={closeCamera} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#f0fdf4' }}>
          <CameraAltIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
          Capture Prescription
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', maxHeight: '320px', borderRadius: 8, background: '#000' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {!cameraStream && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Camera access is required to capture a prescription photo.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCamera} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            startIcon={<CameraAltIcon />}
            onClick={capturePhoto}
            disabled={!cameraStream}
          >
            Capture Photo
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CustomerSection;