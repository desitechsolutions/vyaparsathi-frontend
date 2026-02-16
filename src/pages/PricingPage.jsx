import React, { useState } from 'react';
import { 
  Box, Grid, Card, Typography, Button, Container, Stack, ToggleButton, ToggleButtonGroup,
  Chip, List, ListItem, ListItemIcon, ListItemText, Divider, CircularProgress, 
  Modal, TextField, IconButton, Fade, Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import { QRCodeSVG } from 'qrcode.react'; 
import { useSubscription } from '../context/SubscriptionContext';

const PricingPage = () => {
  const { plans, loading, initiateTrial, getStatus, subscription, verifyPayment } = useSubscription();

  // UI States
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [utr, setUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  const [error, setError] = useState('');

  const status = getStatus();

  if (loading) return (
    <Box sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={40} thickness={4} sx={{ color: '#1E293B' }} />
    </Box>
  );

  // Logic to show trial banner
  const isTrialAvailable = status === 'FREE' || !subscription?.tier || subscription?.tier === 'FREE';

  const handleOpenPayment = (plan, finalPrice) => {
    setSelectedPlan({ ...plan, finalPrice });
    setOpenPayment(true);
    setError('');
  };

  const handleVerifySubmission = async () => {
    if (utr.length < 12) {
      setError('Please enter a valid 12-digit UTR number');
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyPayment(utr, selectedPlan.tier);
      setOpenPayment(false);
      setUtr('');
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please check your UTR.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#FDFDFD', minHeight: '100vh', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        
        {/* Header Section */}
        <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mb: 10 }}>
          <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 3 }}>
            PREMIUM ACCESS
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 950, color: '#1E293B', fontSize: { xs: '2.5rem', md: '3.5rem' }, letterSpacing: '-0.02em' }}>
            Elevate your <span style={{ color: '#3b82f6' }}>Business.</span>
          </Typography>
          
          <Paper elevation={0} sx={{ mt: 4, p: 0.6, bgcolor: '#F1F5F9', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <ToggleButtonGroup
              value={billingCycle}
              exclusive
              onChange={(e, val) => val && setBillingCycle(val)}
              sx={{ '& .MuiToggleButton-root': { border: 'none', borderRadius: '12px !important', px: 4, py: 1, fontWeight: 700, textTransform: 'none' } }}
            >
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="yearly">
                Yearly <Chip label="SAVE 20%" size="small" sx={{ ml: 1, bgcolor: '#22C55E', color: '#FFF', fontWeight: 900, height: 18, fontSize: '0.65rem' }} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Paper>
        </Stack>

        {/* Pricing Cards Grid */}
        <Grid container spacing={4} justifyContent="center" alignItems="stretch" sx={{ overflow: 'visible' }}>
          {plans.map((plan) => {
            // CORRECTED LOGIC: Distinguish between verifying this specific plan vs. an active plan
            const isPendingThisPlan = status === 'PENDING' && subscription?.tier === plan.tier;
            const isCurrentlyActive = subscription?.tier === plan.tier && subscription?.premium === true;

            const isBusiness = plan.tier === 'PRO' || plan.tier === 'BUSINESS';
            const isEnterprise = plan.tier === 'ENTERPRISE';
            
            const basePrice = Number(plan.monthlyPrice) || 0;
            const cyclePrice = billingCycle === 'monthly' ? basePrice : Math.round(basePrice * 0.8);
            const gstTotal = Math.round(cyclePrice * 1.18);

            return (
              <Grid item key={plan.id} xs={12} md={4} sx={{ display: 'flex', overflow: 'visible' }}>
                <Card sx={{ 
                  width: '100%', p: 5, borderRadius: '28px', position: 'relative', 
                  display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease',
                  overflow: 'visible',
                  border: isBusiness ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                  boxShadow: isBusiness ? '0 25px 50px -12px rgba(59, 130, 246, 0.2)' : '0 10px 20px -5px rgba(0,0,0,0.04)',
                  bgcolor: isEnterprise ? '#0F172A' : '#FFF',
                  color: isEnterprise ? '#FFF' : '#1E293B',
                  zIndex: isBusiness ? 2 : 1,
                  '&:hover': { transform: 'translateY(-10px)' }
                }}>
                  
                  {isBusiness && (
                    <Chip 
                      label="Most Popular" 
                      sx={{ 
                        position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', 
                        fontWeight: 900, bgcolor: '#3B82F6', color: '#FFF', px: 2, zIndex: 10,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', textTransform: 'uppercase', fontSize: '0.65rem'
                      }} 
                    />
                  )}

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight={800}>{plan.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 2 }}>
                      <Typography variant="h3" fontWeight={900}>₹{cyclePrice}</Typography>
                      <Typography variant="subtitle1" sx={{ ml: 1, opacity: 0.6, fontWeight: 700 }}>/mo</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.4, mt: 1, display: 'block' }}>
                      ₹{gstTotal} including 18% GST
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 4, borderColor: isEnterprise ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }} />

                  <List sx={{ mb: 5, flexGrow: 1 }}>
                    {plan.features.map((f, i) => (
                      <ListItem key={i} disableGutters sx={{ py: 1, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 32, mt: 0.2 }}>
                          <CheckCircleIcon sx={{ color: isEnterprise ? '#38BDF8' : '#3B82F6', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                            primary={f} 
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600, sx: { opacity: 0.85 } }} 
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button 
                    fullWidth 
                    variant="contained"
                    size="large"
                    onClick={() => handleOpenPayment(plan, gstTotal)}
                    // Disable button if this plan is already active OR if any plan is currently being verified
                    disabled={isCurrentlyActive || status === 'PENDING'}
                    
                    sx={{ 
                        py: 2, borderRadius: '16px', fontWeight: 900, textTransform: 'none',
                        bgcolor: isEnterprise ? '#FFF' : (isBusiness ? '#3B82F6' : '#F1F5F9'),
                        color: isEnterprise ? '#0F172A' : (isBusiness ? '#FFF' : '#1E293B'),
                        '&:hover': { bgcolor: isEnterprise ? '#E2E8F0' : (isBusiness ? '#2563EB' : '#E2E8F0') },
                        "&.Mui-disabled": { bgcolor: isCurrentlyActive ? '#22C55E' : '#F1F5F9', color: isCurrentlyActive ? '#FFF' : '#94A3B8' }
                    }}
                  >
                    {isCurrentlyActive ? 'Current Plan' : 
                     isPendingThisPlan ? 'Verifying Payment...' : 
                     (status === 'PENDING' ? 'Verification in Progress' : 'Upgrade Now')}
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* --- FREE TRIAL BANNER --- */}
        {isTrialAvailable && (
          <Fade in={true} timeout={1000}>
            <Box sx={{ 
              mt: 10, p: 4, borderRadius: '24px', textAlign: 'center',
              background: 'linear-gradient(90deg, #F0F9FF 0%, #E0F2FE 100%)',
              border: '1px solid #BAE6FD', display: 'flex', flexWrap: 'wrap',
              alignItems: 'center', justifyContent: 'center', gap: 4
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <AutoAwesomeIcon sx={{ color: '#0284C7', fontSize: 32 }} />
                <Box textAlign="left">
                  <Typography variant="h6" fontWeight={900} color="#0369A1">Not ready to pay?</Typography>
                  <Typography variant="body2" color="#075985">Get 14 days of Business Pro features for absolutely free.</Typography>
                </Box>
              </Stack>
              <Button 
                variant="contained" 
                size="large"
                disabled={startingTrial || status === 'PENDING'}
                onClick={async () => {
                  setStartingTrial(true);
                  try { await initiateTrial(); } finally { setStartingTrial(false); }
                }}
                sx={{ borderRadius: '12px', px: 4, py: 1.5, fontWeight: 900, bgcolor: '#0369A1', '&:hover': { bgcolor: '#075985' } }}
              >
                {startingTrial ? <CircularProgress size={24} color="inherit" /> : 'Start 14-Day Free Trial'}
              </Button>
            </Box>
          </Fade>
        )}

        <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={{ xs: 3, md: 8 }} 
            justifyContent="center" 
            alignItems="center"
            sx={{ mt: 10, opacity: 0.6 }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUserIcon fontSize="small" color="success" />
                <Typography variant="caption" fontWeight={700}>HDFC Corporate Account</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon fontSize="small" color="primary" />
                <Typography variant="caption" fontWeight={700}>Manual UTR Verification</Typography>
            </Box>
        </Stack>
      </Container>

      {/* Payment Modal */}
      <Modal open={openPayment} onClose={() => !isSubmitting && setOpenPayment(false)} closeAfterTransition>
        <Fade in={openPayment}>
            <Box sx={{ 
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                width: { xs: '95%', sm: 500 }, bgcolor: '#FFF', borderRadius: '32px', p: { xs: 3, md: 5 }, 
                textAlign: 'center', boxShadow: '0 30px 70px rgba(0,0,0,0.3)', outline: 'none'
            }}>
                <IconButton 
                    onClick={() => setOpenPayment(false)} 
                    sx={{ position: 'absolute', top: 20, right: 20, bgcolor: '#F8FAFC' }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>

                <Typography variant="h5" fontWeight={900} mb={0.5}>Scan & Pay</Typography>
                <Typography variant="body2" color="text.secondary" mb={4}>Complete your upgrade to <b>{selectedPlan?.name}</b></Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ 
                            p: 2, bgcolor: '#F8FAFC', borderRadius: '20px', 
                            border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center' 
                        }}>
                            <QRCodeSVG 
                                value={`upi://pay?pa=9508156282@pz&pn=VyaparSathi&am=${selectedPlan?.finalPrice}&cu=INR&tn=VS_${selectedPlan?.tier}`} 
                                size={160}
                                includeMargin={false}
                            />
                            <Typography variant="h5" fontWeight={950} mt={2}>₹{selectedPlan?.finalPrice}</Typography>
                            <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 800, mt: 0.5 }}>9508156282@pz</Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle2" fontWeight={800} mb={2} color="primary">How to pay:</Typography>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Typography sx={{ bgcolor: 'primary.main', color: '#fff', width: 20, height: 20, borderRadius: '50%', textAlign: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>1</Typography>
                                <Typography variant="caption" fontWeight={600} color="text.secondary">Scan QR code with any UPI app.</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Typography sx={{ bgcolor: 'primary.main', color: '#fff', width: 20, height: 20, borderRadius: '50%', textAlign: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>2</Typography>
                                <Typography variant="caption" fontWeight={600} color="text.secondary">Pay exact amount (₹{selectedPlan?.finalPrice}).</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Typography sx={{ bgcolor: 'primary.main', color: '#fff', width: 20, height: 20, borderRadius: '50%', textAlign: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>3</Typography>
                                <Typography variant="caption" fontWeight={600} color="text.secondary">Copy 12-digit UTR/Ref No.</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

                <Box>
                    <Typography variant="subtitle2" fontWeight={800} mb={1.5} textAlign="left">
                        Step 4: Enter UTR Number
                    </Typography>
                    <TextField 
                        fullWidth 
                        placeholder="12-digit Transaction ID"
                        variant="outlined"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        error={!!error}
                        helperText={error || "Verification usually takes 1-2 hours"}
                        sx={{ 
                            mb: 3, 
                            '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F1F5F9', '& fieldset': { border: 'none' } } 
                        }}
                    />
                    <Button 
                        fullWidth variant="contained" size="large"
                        onClick={handleVerifySubmission}
                        disabled={utr.length < 12 || isSubmitting}
                        sx={{ py: 2, borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem' }}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit for Activation'}
                    </Button>
                </Box>
            </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default PricingPage;