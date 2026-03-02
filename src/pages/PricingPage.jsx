'use client';

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Grid, Card, Typography, Button, Container, Stack, ToggleButtonGroup, ToggleButton,
  Chip, List, ListItem, ListItemIcon, ListItemText, Divider, CircularProgress, 
  Modal, TextField, IconButton, Fade, Paper, Accordion, AccordionSummary, AccordionDetails,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { QRCodeSVG } from 'qrcode.react'; 
import { useSubscription } from '../context/SubscriptionContext';

const PricingPage = () => {
  const { plans, loading, initiateTrial, getStatus, subscription, verifyPayment, canStartTrial, isPremium} = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState('yearly');
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [utr, setUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const status = getStatus();
  const isExpired = status === 'EXPIRED';
  const upgradeTarget = location.state?.upgradeTo;
  
  const fromBilling = location.state?.from === 'billing';

  const isTrialAvailable = canStartTrial();
  if (loading && (!plans || plans.length === 0)) return (
    <Box sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={40} thickness={4} sx={{ color: '#3b82f6' }} />
    </Box>
  );

  const handleOpenPayment = (plan, finalPrice) => {
    setSelectedPlan({ ...plan, finalPrice });
    setOpenPayment(true);
    setError('');
    setUtr('');
  };

  const handleVerifySubmission = async () => {
    if (utr.length < 12) {
      setError('Please enter a valid 12-digit UTR number');
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyPayment(
        utr, 
        selectedPlan.tier, 
        billingCycle.toUpperCase(),
        selectedPlan.finalPrice
      );
      setOpenPayment(false);
      setUtr('');
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please check your UTR.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyUpi = () => {
    navigator.clipboard.writeText('9508156282@pz');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const faqs = [
    { q: "How does the manual verification work?", a: "Once you submit your 12-digit UTR number after payment, our team verifies it against our bank statement. This usually takes 1-2 business hours." },
    { q: "Can I upgrade my plan later?", a: "Yes! You can upgrade from Starter to Pro at any time. The remaining days of your current plan will be adjusted." },
    { q: "What happens when my trial ends?", a: "Your features will be locked, and you'll be moved to the Free plan. Don't worry, your data remains safe and will be accessible once you subscribe." },
    { q: "Is my payment secure?", a: "We use direct UPI transfers and manual UTR verification to ensure there are no third-party payment gateway failures." }
  ];

  return (
    <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {isExpired && (
        <Box sx={{ bgcolor: '#FEF2F2', borderBottom: '1px solid #FECACA', py: 2 }}>
          <Container maxWidth="lg">
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <ErrorOutlineIcon sx={{ color: '#DC2626' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#991B1B' }}>Subscription Expired</Typography>
                  <Typography variant="caption" sx={{ color: '#7F1D1D' }}>Please renew to restore access to premium features.</Typography>
                </Box>
              </Stack>
              <Button 
                variant="contained" size="small" sx={{ bgcolor: '#DC2626', fontWeight: 700, textTransform: 'none' }}
                onClick={() => document.getElementById('pricing-grid')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Renew Now
              </Button>
            </Stack>
          </Container>
        </Box>
      )}

      <Box sx={{ bgcolor: '#F4F7FF', pt: { xs: 4, md: 6 }, pb: { xs: 15, md: 20 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          
          {fromBilling && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 4 }}>
              <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => navigate('/admin/billing')}
                sx={{ 
                  color: '#64748B', 
                  fontWeight: 800, 
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  '&:hover': { bgcolor: 'transparent', color: '#2563EB' } 
                }}
              >
                Back to Billing
              </Button>
            </Box>
          )}

          <Typography variant="h3" sx={{ fontWeight: 900, color: '#1E293B', mb: 2, letterSpacing: '-0.02em', fontSize: { xs: '2rem', md: '3rem' }, mt: fromBilling ? 0 : 4 }}>
            Plans for businesses of all sizes
          </Typography>
          <Typography variant="h6" sx={{ color: '#64748B', mb: 6, fontWeight: 400, fontSize: '1.1rem' }}>
            Get the tools you need to manage your business efficiently.
          </Typography>

          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
            <Typography variant="body2" sx={{ fontWeight: billingCycle === 'monthly' ? 700 : 500, color: billingCycle === 'monthly' ? '#1E293B' : '#64748B' }}>Monthly</Typography>
            <Paper elevation={0} sx={{ p: 0.5, borderRadius: '50px', bgcolor: '#E2E8F0', display: 'flex' }}>
              <ToggleButtonGroup
                value={billingCycle}
                exclusive
                onChange={(e, val) => val && setBillingCycle(val)}
                sx={{ 
                  '& .MuiToggleButton-root': { 
                    border: 'none', borderRadius: '50px !important', px: 3, py: 0.8, 
                    textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
                    '&.Mui-selected': { bgcolor: '#FFF', color: '#2563EB', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                  } 
                }}
              >
                <ToggleButton value="monthly">Monthly</ToggleButton>
                <ToggleButton value="yearly">Yearly</ToggleButton>
              </ToggleButtonGroup>
            </Paper>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: billingCycle === 'yearly' ? 700 : 500, color: billingCycle === 'yearly' ? '#1E293B' : '#64748B' }}>Yearly</Typography>
              <Chip label="SAVE ON ANNUAL" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 900, height: 20, fontSize: '0.65rem' }} />
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container id="pricing-grid" maxWidth="lg" sx={{ mt: -12, pb: 10 }}>
        <Grid container sx={{ 
          border: '1px solid #E2E8F0', 
          borderRadius: '16px', 
          bgcolor: '#FFF', 
          overflow: 'hidden', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' 
        }}>
          {plans.map((plan, index) => {
            const isThisPlanTier = subscription?.tier === plan.tier;
            const isPaidActive = isThisPlanTier && status === 'ACTIVE';
            const isPendingThisPlan = status === 'PENDING' && isThisPlanTier;
            const isHighlighted = upgradeTarget === plan.tier || plan.isPopular;
            const isPlanExpired = isThisPlanTier && isExpired;
            const isTrialActive = isThisPlanTier && status === 'TRIAL';

            const pricePerMonth = billingCycle === 'monthly' 
              ? (Number(plan.monthlyPrice) || 0) 
              : Math.round((Number(plan.yearlyPrice) || 0) / 12);

            const finalDisplayTotal = billingCycle === 'monthly' 
              ? (Number(plan.monthlyPrice) || 0) 
              : (Number(plan.yearlyPrice) || 0);
        
            const gstTotal = Math.round(finalDisplayTotal * 1.18);

            return (
              <Grid item key={plan.id} xs={12} md={plans.length > 0 ? 12/plans.length : 4} sx={{ 
                borderRight: index !== plans.length - 1 ? { md: '1px solid #E2E8F0' } : 'none',
                borderBottom: { xs: '1px solid #E2E8F0', md: 'none' },
                bgcolor: isHighlighted ? '#F8FAFF' : '#FFF'
              }}>
                <Box sx={{ p: { xs: 4, md: 5 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  
                  {isHighlighted ? (
                    <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
                      <StarIcon sx={{ fontSize: 14, mr: 0.5 }} /> Recommended
                    </Typography>
                  ) : <Box sx={{ height: 21, mb: 1 }} />}
                  
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1E293B' }}>{plan.displayName || plan.tier}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 4, height: 40 }}>
                    {plan.tier === 'FREE' && "Experience basic features at no cost."}
                    {plan.tier === 'STARTER' && "Essential features for small business owners."}
                    {plan.tier === 'PRO' && "Advanced tools for growing businesses."}
                    {plan.tier === 'ENTERPRISE' && "Full control and scalability for large teams."}
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#94A3B8', 
                          textDecoration: 'line-through', 
                          fontWeight: 600,
                          mb: -0.5 
                        }}
                      >
                        ₹{Number(plan.monthlyPrice)}
                      </Typography>
                    )}
                    <Stack direction="row" alignItems="baseline">
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#1E293B' }}>
                        ₹{pricePerMonth}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: '#64748B', ml: 1, fontWeight: 500 }}>
                        / month
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mt: 0.5 }}>
                      {billingCycle === 'yearly' ? 'per Organization per Month' : 'per Organization'}
                    </Typography>
                    
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      {billingCycle === 'yearly' ? '(Billed annually) ' : ''}
                      {plan.yearlyPrice > 0 ? `₹${gstTotal} incl. 18% GST` : 'Free Forever'}
                    </Typography>
                  </Box>
                  <Button 
                    fullWidth 
                    variant={isHighlighted ? "contained" : "outlined"}
                    size="large"
                    onClick={() => handleOpenPayment(plan, gstTotal)}
                    disabled={isPaidActive || (status === 'PENDING' && !isThisPlanTier) || plan.tier === 'FREE'}
                    sx={{ 
                      py: 1.5, mb: 5, borderRadius: '8px', fontWeight: 800, textTransform: 'none',
                      bgcolor: isHighlighted ? '#2563EB' : 'transparent',
                      color: isHighlighted ? '#FFF' : '#2563EB',
                      border: isHighlighted ? 'none' : '2px solid #2563EB',
                      '&:hover': { 
                        bgcolor: isHighlighted ? '#1D4ED8' : 'rgba(37, 99, 235, 0.04)',
                        border: isHighlighted ? 'none' : '2px solid #1D4ED8'
                      }
                    }}
                  >
                    {plan.tier === 'FREE' ? 'Default Plan' : isPaidActive ? 'Current Plan' : isTrialActive ? 'On Trial (Upgrade Now)' : isPendingThisPlan ? 'Verifying...' : (isPlanExpired ? 'Renew Plan' : 'Buy Now')}
                  </Button>

                  <Divider sx={{ mb: 4 }} />

                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#1E293B' }}>Features included:</Typography>
                  <List sx={{ p: 0, flexGrow: 1 }}>
                    {(plan.features || [])
                      .slice() 
                      .sort((a, b) => {
                        const isAExcluded = a.startsWith('-') || a.startsWith('~');
                        const isBExcluded = b.startsWith('-') || b.startsWith('~');
                        if (isAExcluded !== isBExcluded) return isAExcluded ? 1 : -1;
                        const textA = isAExcluded ? a.substring(1).trim() : a.trim();
                        const textB = isBExcluded ? b.substring(1).trim() : b.trim();
                        return textA.localeCompare(textB);
                      })
                      .map((f, i) => {
                        const isExcluded = f.startsWith('-') || f.startsWith('~');
                        const featureText = isExcluded ? f.substring(1) : f;

                        return (
                          <ListItem key={i} disableGutters sx={{ py: 0.6 }}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              {isExcluded ? (
                                <CloseIcon sx={{ color: '#FDA4AF', fontSize: 18 }} /> 
                              ) : (
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} /> 
                              )}
                            </ListItemIcon>
                            <ListItemText 
                              primary={featureText} 
                              primaryTypographyProps={{ 
                                variant: 'body2', 
                                color: isExcluded ? '#94A3B8' : '#475569', 
                                fontWeight: 500,
                              }} 
                            />
                          </ListItem>
                        );
                      })}
                  </List>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {isTrialAvailable ? (
        <Container maxWidth="lg" sx={{ mb: 10 }}>
          <Paper elevation={0} sx={{ 
            p: 5, borderRadius: '16px', bgcolor: '#1E293B', color: '#FFF', 
            display: 'flex', flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: 'center', justifyContent: 'space-between', gap: 3 
          }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <AutoAwesomeIcon sx={{ fontSize: 40, color: '#FCD34D' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Start with a 14-day free trial</Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>No credit card required. Cancel anytime.</Typography>
              </Box>
            </Stack>
            <Button 
              variant="contained" 
              size="large"
              disabled={startingTrial || status === 'PENDING'}
              onClick={async () => {
                setStartingTrial(true);
                try { 
                  await initiateTrial('STARTER'); 
                } catch (err) {
                  console.error("Trial start failed", err);
                } finally { 
                  setStartingTrial(false); 
                }
              }}
              sx={{ bgcolor: '#FFF', color: '#1E293B', fontWeight: 800, px: 6, py: 2, '&:hover': { bgcolor: '#F1F5F9' } }}
            >
              {startingTrial ? <CircularProgress size={24} /> : 'Get Started for Free'}
            </Button>
          </Paper>
        </Container>
     ) : (
        <Container maxWidth="lg" sx={{ mb: 10 }}>
            {!isPremium() && (
                 <Typography variant="body2" textAlign="center" color="text.secondary">
                     Free trial is a one-time offer per shop and is no longer available.
                 </Typography>
            )}
        </Container>
      )}

      <Box sx={{ bgcolor: '#F8FAFC', py: 12 }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 900, textAlign: 'center', mb: 8, color: '#1E293B' }}>Common Questions</Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index} elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid #E2E8F0', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, color: '#334155' }}>{faq.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.7 }}>{faq.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      <Box sx={{ py: 10, bgcolor: '#FFF', borderTop: '1px solid #E2E8F0' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1E293B', mb: 2 }}>
              Have more questions?
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Our team is here to help you choose the right plan for your business.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                title: "Support Enquiry",
                email: "support@desitechsolutions.com",
                phones: ["+91 9508156282", "+91 8447769695"],
                color: "#3b82f6"
              },
              {
                title: "Sales Enquiry",
                email: "sales@desitechsolutions.com",
                phones: ["+91 9508156282", "+91 8447769695"],
                color: "#10b981"
              },
              {
                title: "Info Enquiry",
                email: "info@desitechsolutions.com",
                phones: [],
                color: "#6366f1"
              }
            ].map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 4, 
                    height: '100%', 
                    borderRadius: '16px', 
                    border: '1px solid #E2E8F0',
                    transition: '0.3s',
                    '&:hover': { boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderColor: item.color }
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: item.color }}>
                    {item.title}
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', display: 'block' }}>
                        <a href={`mailto:${item.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {item.email}
                        </a>
                      </Typography>
                    </Box>

                    {item.phones.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                          Call/WhatsApp
                        </Typography>
                        {item.phones.map((phone, pIdx) => (
                          <Typography key={pIdx} variant="body2" sx={{ fontWeight: 600, color: '#1E293B', display: 'block' }}>
                            <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              {phone}
                            </a>
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ mt: 12, textAlign: 'center', py: 6, borderTop: '1px solid #E2E8F0' }}>
            <Stack direction="row" justifyContent="center" spacing={{ xs: 2, md: 6 }} sx={{ mb: 4, opacity: 0.7 }}>
                <Stack direction="row" alignItems="center" spacing={1}><SecurityIcon fontSize="small" color="primary"/> <Typography variant="caption" fontWeight={800}>SECURE UPI PAYMENTS</Typography></Stack>
                <Stack direction="row" alignItems="center" spacing={1}><VerifiedUserIcon fontSize="small" color="primary"/> <Typography variant="caption" fontWeight={800}>MANUAL VERIFICATION</Typography></Stack>
            </Stack>
            <Typography variant="h6" sx={{ fontStyle: 'italic', color: 'text.secondary', maxWidth: '800px', mx: 'auto', fontWeight: 500, lineHeight: 1.6 }}>
                "Built for business owners who value simplicity and transparency. No hidden charges, no complicated contracts—just the tools you need to succeed."
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 900, color: '#1E293B', letterSpacing: 1 }}>
                — TEAM VYAPARSATHI
            </Typography>
        </Box>

      <Modal
        open={openPayment}
        onClose={() => !isSubmitting && setOpenPayment(false)}
        closeAfterTransition
      >
        <Fade in={openPayment}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95%', md: 850 }, 
              bgcolor: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
              outline: 'none',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' }, 
              maxHeight: '90vh',
            }}
          >
      <Box
        sx={{
          width: { xs: '100%', md: '42%' },
          bgcolor: '#F8FAFC',
          p: 4,
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography variant="overline" fontWeight={800} color="primary" sx={{ mb: 2, display: 'block' }}>
            Order Summary
          </Typography>
          
          <Stack spacing={1.5} sx={{ mb: 4 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {selectedPlan?.displayName || selectedPlan?.tier} Plan ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                ₹{Math.round(selectedPlan?.finalPrice / 1.18)}
              </Typography>
            </Stack>
            
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                GST (18%)
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                ₹{selectedPlan?.finalPrice - Math.round(selectedPlan?.finalPrice / 1.18)}
              </Typography>
            </Stack>
            
            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
            
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={800} color="#1E293B">
                Total Amount
              </Typography>
              <Typography variant="subtitle1" fontWeight={900} color="primary.main">
                ₹{selectedPlan?.finalPrice}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ textAlign: 'center', mt: { xs: 2, md: 0 } }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '16px',
              bgcolor: '#FFF',
              border: '1px solid #E2E8F0',
              display: 'inline-block',
              lineHeight: 0,
              boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
              mb: 2
            }}
          >
            <QRCodeSVG
              value={`upi://pay?pa=9508156282@pz&pn=VyaparSathi&am=${selectedPlan?.finalPrice}&cu=INR&tn=VS_${selectedPlan?.tier}`}
              size={160}
            />
          </Paper>
          <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 500, lineHeight: 1.4 }}>
            Scan this QR using PhonePe, Google Pay, <br /> 
            PayTM or any UPI app
          </Typography>
        </Box>
      </Box>


      <Box sx={{ flex: 1, p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={800}>Payment Instructions</Typography>
          <IconButton size="small" onClick={() => !isSubmitting && setOpenPayment(false)} sx={{ bgcolor: '#F1F5F9' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <List sx={{ mb: 3 }}>
          {[
            { step: 1, text: "Open your preferred UPI App" },
            { step: 2, text: `Pay exactly ₹${selectedPlan?.finalPrice} to the QR code` },
            { step: 3, text: "Copy the 12-digit UTR/Transaction ID" }
          ].map((item) => (
            <ListItem key={item.step} disableGutters sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
                  {item.step}
                </Box>
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: '#475569' }} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mb: 4, borderStyle: 'dashed' }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
            Merchant UPI ID
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body1" fontWeight={700} sx={{ letterSpacing: 0.5 }}>9508156282@pz</Typography>
            <Tooltip title={copied ? 'Copied' : 'Copy ID'}>
              <IconButton size="small" onClick={copyUpi} sx={{ color: copied ? 'success.main' : 'primary.main' }}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={800} sx={{ mb: 1 }}>UTR / Transaction ID</Typography>
          <TextField
            fullWidth
            placeholder="Enter 12-digit number"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
            error={!!error}
            helperText={error || "Verification takes 1-2 hours"}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAFC' } }}
          />
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleVerifySubmission}
            disabled={utr.length < 12 || isSubmitting}
            sx={{ py: 2, borderRadius: '12px', fontWeight: 900, fontSize: '1rem', textTransform: 'none' }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'I have Paid • Confirm Now'}
          </Button>

          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 2, opacity: 0.6 }}>
            <SecurityIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption" fontWeight={700}>SECURE 256-BIT ENCRYPTED PAYMENT</Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  </Fade>
</Modal>
</Box>
  );
};

export default PricingPage;