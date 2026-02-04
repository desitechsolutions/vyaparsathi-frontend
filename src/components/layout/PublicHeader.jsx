import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Dialog, DialogTitle,
  DialogContent, IconButton, DialogActions, Stack, useMediaQuery, 
  Tabs, Tab, Grid, Paper, useTheme, Chip, Divider, Container
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CodeIcon from '@mui/icons-material/Code';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import BrushIcon from '@mui/icons-material/Brush';
import StorageIcon from '@mui/icons-material/Storage';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ConstructionIcon from '@mui/icons-material/Construction';
import InfoIcon from '@mui/icons-material/Info';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const PublicHeader = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Modal States
  const [servicesOpen, setServicesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const techServices = [
    { category: "Web Development", icon: <CodeIcon />, desc: "Scalable and secure web applications.", items: ["React & Next.js", "Spring Boot APIs", "Admin Dashboards"], stack: ["React", "Java"] },
    { category: "Mobile App Development", icon: <SmartphoneIcon />, desc: "High-performance cross-platform apps.", items: ["Android Apps", "React Native", "Flutter"], stack: ["Android", "Flutter"] },
    { category: "Cloud & DevOps", icon: <CloudQueueIcon />, desc: "Cloud infrastructure & automation.", items: ["AWS Setup", "Docker & CI/CD", "Microservices"], stack: ["AWS", "Kubernetes"] },
    { category: "UI / UX Design", icon: <BrushIcon />, desc: "Conversion-focused designs.", items: ["Wireframes", "App UI", "Design Systems"], stack: ["Figma", "MUI"] },
    { category: "Data & Database", icon: <StorageIcon />, desc: "Reliable data architecture.", items: ["Database Design", "Migration", "Optimization"], stack: ["PostgreSQL", "MongoDB"] },
    { category: "Consulting", icon: <ContactSupportIcon />, desc: "Architecture and long-term support.", items: ["Code Review", "Security Audits", "Maintenance"], stack: ["Security", "Architecture"] }
  ];

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          color: '#0f172a'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: { xs: 70, md: 95 } }}>
            
            {/* BRANDING SECTION */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ height: { xs: 45, md: 65 } }}>
                <img src="/desitechsolution.png" alt="DesiTech Logo" style={{ height: '100%', width: 'auto' }} />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' }, height: 40, my: 'auto' }} />
              <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Typography variant="subtitle2" fontWeight={900} color="primary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('publicHeader.companyTagline')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {t('publicHeader.birumaTechnology')}
                </Typography>
              </Box>
            </Stack>

            {/* NAVIGATION ACTIONS */}
            <Stack direction="row" spacing={{ xs: 0.5, md: 1.5 }} alignItems="center">
              <Button onClick={() => setServicesOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', color: 'text.primary' }}>
                {t('publicHeader.services')}
              </Button>
              <Button onClick={() => setAboutOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', color: 'text.primary' }}>
                {t('publicHeader.aboutUs')}
              </Button>
              <Button onClick={() => setContactOpen(true)} sx={{ fontWeight: 800, textTransform: 'none', color: 'text.primary' }}>
                {t('publicHeader.contact')}
              </Button>
              
              <Button onClick={toggleLanguage} sx={{ fontWeight: 800, minWidth: 50, color: 'primary.main' }}>
                {i18n.language === 'en' ? 'हिन्दी' : 'EN'}
              </Button>

              <Button
                variant="contained"
                disableElevation
                startIcon={<WhatsAppIcon />}
                onClick={() => window.open('https://wa.me/919508156282', '_blank')}
                sx={{ borderRadius: 2, bgcolor: '#10b981', fontWeight: 800, display: { xs: 'none', md: 'flex' } }}
              >
                {t('publicHeader.connect')}
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* MODAL: SERVICES */}
      <Dialog open={servicesOpen} onClose={() => setServicesOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={900}>{t('publicHeader.expertise')}</Typography>
          <IconButton onClick={() => setServicesOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={t('publicHeader.engineering')} sx={{ fontWeight: 800 }} />
            <Tab label={<span>{t('publicHeader.desiFix')} <Chip label={t('publicHeader.comingSoon')} size="small" variant="outlined" sx={{ ml: 1, height: 20 }} /></span>} sx={{ fontWeight: 800 }} />
          </Tabs>
          {tab === 0 ? (
            <Grid container spacing={2}>
              {techServices.map((s, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, height: '100%', transition: '0.3s', '&:hover': { borderColor: 'primary.main', bgcolor: '#f8fafc' } }}>
                    <Box sx={{ color: 'primary.main', mb: 1.5 }}>{s.icon}</Box>
                    <Typography variant="subtitle1" fontWeight={800}>{s.category}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>{s.desc}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {s.stack.map(tag => <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700 }} />)}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <ConstructionIcon sx={{ fontSize: 50, color: 'divider', mb: 2 }} />
              <Typography variant="h6" fontWeight={800}>{t('publicHeader.productOngoing')}</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: ABOUT US */}
      <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={900}>{t('publicHeader.aboutDesiTech')}</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <RocketLaunchIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
            <strong>{t('publicHeader.companyName')}</strong> {t('publicHeader.isAUnitOf')} <strong>{t('publicHeader.birumaTechnology')}</strong> 
            {t('publicHeader.aboutText')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button onClick={() => setAboutOpen(false)} variant="outlined" sx={{ borderRadius: 2, fontWeight: 800 }}>{t('publicHeader.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: CONTACT US */}
      <Dialog open={contactOpen} onClose={() => setContactOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={900}>{t('publicHeader.getInTouch')}</Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmailIcon color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{t('publicHeader.emailUs')}</Typography>
                <Typography variant="body2" fontWeight={800}>{t('publicHeader.emailAddress')}</Typography>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <WhatsAppIcon sx={{ color: '#10b981' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{t('publicHeader.whatsappSupport')}</Typography>
                <Typography variant="body2" fontWeight={800}>{t('publicHeader.whatsappNumber')}</Typography>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocationOnIcon sx={{ color: '#f43f5e' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{t('publicHeader.office')}</Typography>
                <Typography variant="body2" fontWeight={800}>{t('publicHeader.officeLocation')}</Typography>
              </Box>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button fullWidth onClick={() => setContactOpen(false)} variant="contained" sx={{ borderRadius: 2, py: 1.5, fontWeight: 800 }}>{t('publicHeader.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PublicHeader;