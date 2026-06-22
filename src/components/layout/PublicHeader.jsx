'use client';

import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Dialog,
  IconButton, Stack, useMediaQuery, 
  Grid, useTheme, Divider, Container, Menu, MenuItem, TextField,
  CircularProgress, Avatar, Alert, Snackbar
} from '@mui/material';
import { useTranslation } from 'react-i18next';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CloudIcon from '@mui/icons-material/Cloud';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { bookDemo } from '../../services/api';
import FeaturesModal from '../modals/FeaturesModal';
import ServicesModal from '../modals/ServicesModal';
import AboutModal from '../modals/AboutModal';
import ContactModal from '../modals/ContactModal';

const PublicHeader = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Modal States
  const [servicesOpen, setServicesOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  
  // Form & Feedback States
  const [loading, setLoading] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [anchorEl, setAnchorEl] = useState(null);

  const [demoData, setDemoData] = useState({
    name: '',
    email: '',
    phone: '',
    business: '',
    city: '',
    note: ''
  });

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleBookDemo = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await bookDemo({
        name: demoData.name,
        email: demoData.email,
        phone: demoData.phone,
        company: demoData.business,
        serviceType: 'VyaparSathi Live Demo',
        message: `Request for Live Demo.\nLocation: ${demoData.city}\nRequirements: ${demoData.note}`
      });

      if (response.status === 200) {
        setDemoSuccess(true);
        setSnackbar({ 
          open: true, 
          message: 'Demo request sent successfully! Our team will contact you.', 
          severity: 'success' 
        });
      }
    } catch (error) {
      console.error("Demo Submission Error:", error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Submission failed. Please try WhatsApp.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDemoModal = () => {
    setDemoOpen(false);
    // Delay resetting data to allow modal close animation
    setTimeout(() => {
        setDemoSuccess(false);
        setDemoData({ name: '', email: '', phone: '', business: '', city: '', note: '' });
    }, 300);
  };

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(16px)', 
          borderBottom: '1px solid rgba(0,0,0,0.08)', 
          color: '#0f172a',
          transition: 'all 0.3s ease-in-out',
          top: 0,
          zIndex: 100
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: { xs: 70, md: 85 } }}>
            {/* Logo Section */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 'auto' }}>
              <Box sx={{ height: { xs: 40, md: 55 }, display: 'flex', alignItems: 'center' }}>
                <img src="/desitechsolution.png" alt="DesiTech Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' }, height: 35, my: 'auto' }} />
              <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Typography variant="subtitle2" fontWeight={900} color="primary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  {t('publicHeader.companyTagline')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {t('publicHeader.birumaTechnology')}
                </Typography>
              </Box>
            </Stack>

            {/* Navigation & Action Buttons - Desktop */}
            {!isMobile && (
              <Stack direction="row" spacing={3} alignItems="center">
                <Button 
                  onClick={() => setFeaturesOpen(true)} 
                  sx={{ fontWeight: 700, textTransform: 'none', color: 'text.primary', fontSize: '0.95rem' }}
                >
                  ✨ {t('publicHeader.features')}
                </Button>
                <Button 
                  onClick={() => setServicesOpen(true)} 
                  sx={{ fontWeight: 700, textTransform: 'none', color: 'text.primary', fontSize: '0.95rem' }}
                >
                  🛠️ {t('publicHeader.services')}
                </Button>
                <Button 
                  onClick={() => setAboutOpen(true)} 
                  sx={{ fontWeight: 700, textTransform: 'none', color: 'text.primary', fontSize: '0.95rem' }}
                >
                  🏢 {t('publicHeader.aboutUs')}
                </Button>
                <Button 
                  onClick={() => setContactOpen(true)} 
                  sx={{ fontWeight: 700, textTransform: 'none', color: 'text.primary', fontSize: '0.95rem' }}
                >
                  📞 {t('publicHeader.contact')}
                </Button>
              </Stack>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={{ xs: 0.5, md: 1 }} alignItems="center" sx={{ ml: 'auto' }}>
              {isMobile && (
                <IconButton 
                  onClick={(e) => setAnchorEl(e.currentTarget)} 
                  color="inherit"
                  sx={{ 
                    transition: 'all 0.3s',
                    '&:hover': { transform: 'scale(1.1)' }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              <Button 
                variant="contained" 
                onClick={() => setDemoOpen(true)} 
                sx={{ 
                  borderRadius: 2, 
                  fontWeight: 800, 
                  display: { xs: 'none', md: 'flex' }, 
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(59, 130, 246, 0.35)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s'
                }}
              >
                📅 {t('publicHeader.bookDemo') || 'Book Demo'}
              </Button>

              <Button 
                onClick={toggleLanguage} 
                sx={{ 
                  fontWeight: 700, 
                  minWidth: 50, 
                  color: 'primary.main',
                  textTransform: 'uppercase',
                  fontSize: '0.85rem',
                  '&:hover': { bgcolor: 'primary.light', color: 'primary.dark' }
                }}
              >
                {i18n.language === 'en' ? 'हिन्दी' : 'EN'}
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Menu */}
      <Menu 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)} 
        onClose={() => setAnchorEl(null)} 
        PaperProps={{ 
          sx: { 
            width: '90vw',
            maxWidth: 280,
            mt: 1.5, 
            borderRadius: 3, 
            p: 1.5,
            boxShadow: '0 10px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.08)'
          } 
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => { setFeaturesOpen(true); setAnchorEl(null); }} 
          sx={{ fontWeight: 700, py: 1.5 }}
        >
          ✨ {t('publicHeader.features') || 'Features'}
        </MenuItem>
        <MenuItem 
          onClick={() => { setServicesOpen(true); setAnchorEl(null); }} 
          sx={{ fontWeight: 700, py: 1.5 }}
        >
          🛠️ {t('publicHeader.services') || 'Services'}
        </MenuItem>
        <MenuItem 
          onClick={() => { setAboutOpen(true); setAnchorEl(null); }} 
          sx={{ fontWeight: 700, py: 1.5 }}
        >
          🏢 {t('publicHeader.aboutUs') || 'About Us'}
        </MenuItem>
        <MenuItem 
          onClick={() => { setContactOpen(true); setAnchorEl(null); }} 
          sx={{ fontWeight: 700, py: 1.5 }}
        >
          📞 {t('publicHeader.contact') || 'Contact'}
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem 
          onClick={() => { setDemoOpen(true); setAnchorEl(null); }} 
          sx={{ 
            fontWeight: 700, 
            py: 1.5,
            color: 'primary.main',
            bgcolor: 'primary.light'
          }}
        >
          📅 {t('publicHeader.bookDemo') || 'Book Demo'}
        </MenuItem>
      </Menu>

      {/* Modals */}
      <FeaturesModal open={featuresOpen} onClose={() => setFeaturesOpen(false)} />
      <ServicesModal open={servicesOpen} onClose={() => setServicesOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Demo Booking Dialog */}
      <Dialog open={demoOpen} onClose={loading ? null : resetDemoModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        {!demoSuccess ? (
          <Grid container>
            <Grid item xs={12} md={5} sx={{ bgcolor: '#f8fafc', p: 4, borderRight: '1px solid #e2e8f0' }}>
              <Typography variant="h5" fontWeight={900} color="primary" gutterBottom>Technical Demo</Typography>
              <Typography variant="body2" color="text.secondary" mb={4}>Guided by our technical leads.</Typography>
              <Stack spacing={2.5}>
                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}><EngineeringIcon /></Avatar>
                    <Box><Typography variant="subtitle2" fontWeight={800}>Birendra Shaw</Typography><Typography variant="caption" color="text.secondary">Technical Expert/Lead</Typography></Box>
                  </Stack>
                </Box>
                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'secondary.main' }}><CloudIcon /></Avatar>
                    <Box><Typography variant="subtitle2" fontWeight={800}>Uma Shankar Pandey</Typography><Typography variant="caption" color="text.secondary">Cloud Lead/Marketing Head</Typography></Box>
                  </Stack>
                </Box>
                <Alert severity="success" sx={{ borderRadius: 2, mt: 2 }} icon={<CheckCircleOutlineIcon fontSize="small" />}>
                  <Typography variant="caption" fontWeight={700}>⚡ 2-4 Hours response promise</Typography>
                </Alert>
              </Stack>
            </Grid>

            <Grid item xs={12} md={7} sx={{ p: 4 }}>
              <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight={900}>Schedule Demo</Typography>
                <IconButton onClick={resetDemoModal} disabled={loading}><CloseIcon /></IconButton>
              </Box>
              <form onSubmit={handleBookDemo}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required label="Full Name" size="small" value={demoData.name} onChange={(e) => setDemoData({...demoData, name: e.target.value})} disabled={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required label="Email Address" type="email" size="small" value={demoData.email} onChange={(e) => setDemoData({...demoData, email: e.target.value})} disabled={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required label="WhatsApp Number" size="small" value={demoData.phone} onChange={(e) => setDemoData({...demoData, phone: e.target.value})} disabled={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Business Name" size="small" value={demoData.business} onChange={(e) => setDemoData({...demoData, business: e.target.value})} disabled={loading} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="City / Location" size="small" value={demoData.city} onChange={(e) => setDemoData({...demoData, city: e.target.value})} disabled={loading} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="Specific Requirements?" size="small" value={demoData.note} onChange={(e) => setDemoData({...demoData, note: e.target.value})} disabled={loading} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      fullWidth 
                      size="large" 
                      variant="contained" 
                      type="submit" 
                      disabled={loading} 
                      sx={{ py: 1.5, fontWeight: 900, borderRadius: 2 }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : '✅ Request Demo Slot'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight={900}>Booking Confirmed!</Typography>
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>Thanks <b>{demoData.name}</b>. Our technical team will reach out to you shortly via WhatsApp/Email.</Typography>
            <Button variant="outlined" sx={{ mt: 4, borderRadius: 2, px: 4, fontWeight: 800 }} onClick={resetDemoModal}>Back to Home</Button>
          </Box>
        )}
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PublicHeader;