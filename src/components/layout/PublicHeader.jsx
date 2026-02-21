'use client';

import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Dialog, DialogTitle,
  DialogContent, IconButton, DialogActions, Stack, useMediaQuery, 
  Tabs, Tab, Grid, Paper, useTheme, Chip, Divider, Container, Menu, MenuItem, TextField,
  CircularProgress, Avatar, Alert, Snackbar
} from '@mui/material';
import { useTranslation } from 'react-i18next';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CodeIcon from '@mui/icons-material/Code';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import BrushIcon from '@mui/icons-material/Brush';
import StorageIcon from '@mui/icons-material/Storage';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MenuIcon from '@mui/icons-material/Menu';
import InventoryIcon from '@mui/icons-material/Inventory';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PublicIcon from '@mui/icons-material/Public';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CloudIcon from '@mui/icons-material/Cloud';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import { bookDemo } from '../../services/api';

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
  const [tab, setTab] = useState(0);
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

  // UI Content Arrays
  const featureModules = [
    { title: "Inventory", icon: <InventoryIcon color="primary" />, features: ["Item Mgmt", "Stock Alerts", "PO Tracking"] },
    { title: "Sales", icon: <PointOfSaleIcon color="success" />, features: ["GST Billing", "Delivery", "Customer Ledger"] },
    { title: "Finance", icon: <AccountBalanceIcon color="warning" />, features: ["Tax Compliance", "Expenses", "Daily Cash"] },
    { title: "Analytics", icon: <AssessmentIcon color="info" />, features: ["Category Sales", "Trends", "Audit Logs"] },
    { title: "Workforce", icon: <PeopleIcon color="secondary" />, features: ["Payroll", "Staff Mgmt", "Permissions"] },
    { title: "Core", icon: <SecurityIcon sx={{ color: '#475569' }} />, features: ["Cloud Backup", "Multi-Shop", "Security"] }
  ];

  const techServices = [
    { category: "Web Development", icon: <CodeIcon />, desc: "Scalable and secure web applications." },
    { category: "Mobile Apps", icon: <SmartphoneIcon />, desc: "High-performance cross-platform apps." },
    { category: "Cloud & DevOps", icon: <CloudQueueIcon />, desc: "Cloud infrastructure & automation." },
    { category: "UI/UX Design", icon: <BrushIcon />, desc: "Conversion-focused designs." },
    { category: "Database", icon: <StorageIcon />, desc: "Reliable data architecture." },
    { category: "Consulting", icon: <ContactSupportIcon />, desc: "Architecture and support." }
  ];

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#0f172a' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: { xs: 70, md: 95 } }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ height: { xs: 45, md: 65 } }}>
                <img src="/desitechsolution.png" alt="DesiTech Logo" style={{ height: '100%', width: 'auto' }} />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' }, height: 40, my: 'auto' }} />
              <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Typography variant="subtitle2" fontWeight={900} color="primary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                   VyaparSathi ERP
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Biruma Technology Solutions
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={{ xs: 0.5, md: 1.5 }} alignItems="center">
              {!isMobile ? (
                <>
                  <Button onClick={() => setFeaturesOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', color: 'text.primary' }}>Features</Button>
                  <Button onClick={() => setServicesOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', color: 'text.primary' }}>Services</Button>
                  <Button onClick={() => setAboutOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', color: 'text.primary' }}>About</Button>
                  <Button onClick={() => setContactOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', color: 'text.primary' }}>Contact</Button>
                </>
              ) : (
                <>
                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit"><MenuIcon /></IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { width: 220, mt: 1.5, borderRadius: 3, p: 1 } }}>
                    <MenuItem onClick={() => { setFeaturesOpen(true); setAnchorEl(null); }} sx={{ fontWeight: 700 }}>🚀 Features</MenuItem>
                    <MenuItem onClick={() => { setAboutOpen(true); setAnchorEl(null); }} sx={{ fontWeight: 700 }}>🏢 About Us</MenuItem>
                    <MenuItem onClick={() => { setContactOpen(true); setAnchorEl(null); }} sx={{ fontWeight: 700 }}>📞 Contact Us</MenuItem>
                    <MenuItem onClick={() => { setDemoOpen(true); setAnchorEl(null); }} sx={{ fontWeight: 700, color: 'primary.main' }}>📅 Book Demo</MenuItem>
                  </Menu>
                </>
              )}
              <Button onClick={toggleLanguage} sx={{ fontWeight: 800, minWidth: 50, color: 'primary.main' }}>{i18n.language === 'en' ? 'हिन्दी' : 'EN'}</Button>
              <Button variant="outlined" onClick={() => setDemoOpen(true)} sx={{ borderRadius: 2, fontWeight: 800, display: { xs: 'none', md: 'flex' }, borderWidth: 2 }}>Book Demo</Button>
              <Button variant="contained" disableElevation startIcon={<WhatsAppIcon />} onClick={() => window.open('https://wa.me/919508156282', '_blank')} sx={{ borderRadius: 2, bgcolor: '#10b981', fontWeight: 800, display: { xs: 'none', md: 'flex' }, '&:hover': { bgcolor: '#059669' } }}>Connect</Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={demoOpen} onClose={loading ? null : resetDemoModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        {!demoSuccess ? (
            <Grid container>
                <Grid item xs={12} md={5} sx={{ bgcolor: '#f8fafc', p: 4, borderRight: '1px solid #e2e8f0' }}>
                    <Typography variant="h5" fontWeight={900} color="primary" gutterBottom>Technical Demo</Typography>
                    <Typography variant="body2" color="text.secondary" mb={4}>Guided by our technical leads.</Typography>
                    <Stack spacing={2.5}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'white' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ bgcolor: 'primary.main' }}><EngineeringIcon /></Avatar>
                                <Box><Typography variant="subtitle2" fontWeight={800}>Birendra Shaw</Typography><Typography variant="caption" color="text.secondary">Technical Expert/Lead</Typography></Box>
                            </Stack>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'white' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ bgcolor: 'secondary.main' }}><CloudIcon /></Avatar>
                                <Box><Typography variant="subtitle2" fontWeight={800}>Uma Shankar Pandey</Typography><Typography variant="caption" color="text.secondary">Cloud Lead/Marketing Head</Typography></Box>
                            </Stack>
                        </Paper>
                        <Alert severity="success" sx={{ borderRadius: 3, mt: 2 }} icon={<CheckCircleOutlineIcon fontSize="small" />}><Typography variant="caption" fontWeight={700}>⚡ 2-4 Hours response promise.</Typography></Alert>
                    </Stack>
                </Grid>

                <Grid item xs={12} md={7} sx={{ p: 4 }}>
                    <Box display="flex" justifyContent="space-between" mb={3}><Typography variant="h5" fontWeight={900}>Schedule Demo</Typography><IconButton onClick={resetDemoModal} disabled={loading}><CloseIcon /></IconButton></Box>
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
                                    endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    sx={{ py: 1.5, fontWeight: 900, borderRadius: 2 }}
                                >
                                    {loading ? 'Processing Request...' : 'Request Demo Slot'}
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

      {/* About Modal */}
      <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogContent sx={{ p: 0 }}>
          <Grid container>
            <Grid item xs={12} md={5} sx={{ bgcolor: 'primary.main', color: 'white', p: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h4" fontWeight={900} gutterBottom>Our Mission</Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>Empowering Indian SMEs with world-class technology.</Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><VerifiedUserIcon /> <Typography variant="subtitle2">ISO Certified Standards</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><PublicIcon /> <Typography variant="subtitle2">Made in India</Typography></Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={7} sx={{ p: 5 }}>
              <Typography variant="h6" fontWeight={800} color="primary">DesiTech Solutions</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, lineHeight: 1.7 }}>
                Part of <b>Biruma Technology Solutions Private Limited</b> (CIN: U62010HR2025PTC139151). <b>VyaparSathi</b> is our flagship ERP built for efficiency.
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight={800}>Core Values</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}><Typography variant="caption" fontWeight={900}>Transparency</Typography><Typography variant="caption" display="block" color="text.secondary">Honest pricing & clear audits.</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" fontWeight={900}>Innovation</Typography><Typography variant="caption" display="block" color="text.secondary">AI-driven stock insights.</Typography></Grid>
              </Grid>
              <Button fullWidth variant="outlined" sx={{ mt: 4, borderRadius: 3, fontWeight: 800 }} onClick={() => setAboutOpen(false)}>Close</Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={contactOpen} onClose={() => setContactOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}><Typography variant="h5" fontWeight={900}>Get in Touch</Typography></DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }} onClick={() => window.location.href = 'mailto:info@desitechsolutions.com'}>
                <Avatar sx={{ bgcolor: '#eff6ff', color: 'primary.main' }}><EmailIcon /></Avatar>
                <Box><Typography variant="caption" fontWeight={700} color="text.secondary">Email Sales</Typography><Typography variant="body2" fontWeight={800}>info@desitechsolutions.com</Typography></Box>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f0fdf4' } }} onClick={() => window.open('https://wa.me/919508156282', '_blank')}>
                <Avatar sx={{ bgcolor: '#f0fdf4', color: '#10b981' }}><WhatsAppIcon /></Avatar>
                <Box><Typography variant="caption" fontWeight={700} color="text.secondary">WhatsApp Support</Typography><Typography variant="body2" fontWeight={800}>+91 95081 56282</Typography></Box>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#fff1f2', color: '#f43f5e' }}><LocationOnIcon /></Avatar>
                <Box><Typography variant="caption" fontWeight={700} color="text.secondary">Headquarters</Typography><Typography variant="body2" fontWeight={800}>Gurgaon, Haryana, India</Typography></Box>
              </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button fullWidth onClick={() => setContactOpen(false)} sx={{ fontWeight: 800 }}>Close</Button></DialogActions>
      </Dialog>

      {/* Features Modal */}
      <Dialog open={featuresOpen} onClose={() => setFeaturesOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={900}>VyaparSathi Features</Typography>
          <IconButton onClick={() => setFeaturesOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {featureModules.map((module, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 4, height: '100%', bgcolor: '#f8fafc' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>{module.icon}<Typography variant="subtitle2" fontWeight={800}>{module.title}</Typography></Stack>
                  {module.features.map((feat, fi) => <Typography key={fi} variant="caption" display="block" sx={{ color: 'text.secondary' }}>• {feat}</Typography>)}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button fullWidth variant="contained" disableElevation sx={{ borderRadius: 2 }} onClick={() => setFeaturesOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* Services Modal */}
      <Dialog open={servicesOpen} onClose={() => setServicesOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={900}>Our Tech Expertise</Typography>
          <IconButton onClick={() => setServicesOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}><Tab label="Engineering" sx={{ fontWeight: 800 }} /><Tab label="Consulting" sx={{ fontWeight: 800 }} /></Tabs>
          <Grid container spacing={2}>
            {techServices.map((s, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, transition: '0.3s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' } }}>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>{s.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={800}>{s.category}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PublicHeader;