import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, IconButton, DialogActions, Avatar, Stack, useMediaQuery, Divider, Tabs, Tab, Grid, Paper
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import StoreIcon from '@mui/icons-material/Store';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import PeopleIcon from '@mui/icons-material/People';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import HandymanIcon from '@mui/icons-material/Handyman';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import BugReportIcon from '@mui/icons-material/BugReport';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import BuildIcon from '@mui/icons-material/Build';

const vyaparSathiFeatures = [
  {
    title: 'itemCatalog',
    icon: <StoreIcon color="primary" fontSize="large" />,
    desc: 'Manage all your products and variants easily.'
  },
  {
    title: 'inventory',
    icon: <PriceCheckIcon color="primary" fontSize="large" />,
    desc: 'Real-time stock tracking and alerts.'
  },
  {
    title: 'sales',
    icon: <PeopleIcon color="primary" fontSize="large" />,
    desc: 'Record and analyze your daily sales.'
  },
  {
    title: 'reports',
    icon: <AnalyticsIcon color="primary" fontSize="large" />,
    desc: 'Detailed reports for smarter decisions.'
  },
  {
    title: 'customers',
    icon: <PeopleIcon color="primary" fontSize="large" />,
    desc: 'Customer management and history.'
  },
  {
    title: 'purchaseOrders',
    icon: <CheckCircleOutlineIcon color="primary" fontSize="large" />,
    desc: 'Easy purchase order creation.'
  },
  {
    title: 'expenses',
    icon: <PriceCheckIcon color="primary" fontSize="large" />,
    desc: 'Track all business expenses.'
  },
  {
    title: 'analytics',
    icon: <AnalyticsIcon color="primary" fontSize="large" />,
    desc: 'Business insights & trends.'
  }
];

const desiFixServices = [
  { title: "Plumbing", icon: <PlumbingIcon color="primary" fontSize="large" />, descKey: "Expert plumbing solutions for your home." },
  { title: "Electrical", icon: <ElectricalServicesIcon color="primary" fontSize="large" />, descKey: "Trusted electricians for every electrical need." },
  { title: "Carpentry", icon: <HandymanIcon color="primary" fontSize="large" />, descKey: "Furniture repairs and woodwork." },
  { title: "Cleaning", icon: <CleaningServicesIcon color="primary" fontSize="large" />, descKey: "Home and office cleaning services." },
  { title: "Painting", icon: <FormatPaintIcon color="primary" fontSize="large" />, descKey: "Quality painting for interiors and exteriors." },
  { title: "Car Booking", icon: <DirectionsCarIcon color="primary" fontSize="large" />, descKey: "Book cars for travel or errands." },
  { title: "Gardening", icon: <LocalFloristIcon color="primary" fontSize="large" />, descKey: "Garden setup and maintenance." },
  { title: "Pest Control", icon: <BugReportIcon color="primary" fontSize="large" />, descKey: "Safe and effective pest control." },
  { title: "Water Tank Cleaning", icon: <LocalDrinkIcon color="primary" fontSize="large" />, descKey: "Hygienic water tank cleaning." },
  { title: "Home Repair", icon: <BuildIcon color="primary" fontSize="large" />, descKey: "Any home repair, big or small." }
];

const whyChooseUs = [
  "publicHeader.whyAffordable",
  "publicHeader.whyEasyToUse",
  "publicHeader.whyHindiEnglish",
  "publicHeader.whyForBharat",
  "publicHeader.whySupport",
  "publicHeader.whyCloud"
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`service-tabpanel-${index}`}
      aria-labelledby={`service-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const PublicHeader = () => {
  const { t, i18n } = useTranslation();
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const isMobile = useMediaQuery('(max-width:600px)');

  const handleLangMenuOpen = (event) => setLangAnchorEl(event.currentTarget);
  const handleLangMenuClose = () => setLangAnchorEl(null);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    handleLangMenuClose();
  };

  const handleSupportClick = () => {
    window.open('https://wa.me/919508156282?text=Hi%20DesiTech%20team!%20I%20have%20a%20question.', '_blank');
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:techie.birendra@gmail.com?subject=Support Request for DesiTech`;
  };

  const handleTabChange = (e, newValue) => setTab(newValue);

  return (
    <>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={2}
        sx={{
          background: 'linear-gradient(90deg, #FAF3E3 0%, #F6F7FA 100%)',
          borderBottom: '2px solid #FFD600'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: isMobile ? 56 : 72 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src="/logo192.png"
              sx={{ bgcolor: "#FFD600", width: 48, height: 48, mr: 1 }}
              alt="DesiTech Logo"
            />
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 1 }}>
                {t('publicHeader.companyName', "DesiTech Innovations Pvt Ltd.")}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                {t('publicHeader.companyTagline', "Empowering Bharat's Businesses & Homes Digitally")}
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
            <Button color="inherit" onClick={() => setServicesOpen(true)}>
              {t('publicHeader.ourServices', 'Our Services')}
            </Button>
            <Button color="inherit" startIcon={<WhatsAppIcon />} onClick={handleSupportClick}>
              {t('publicHeader.support', 'Support')}
            </Button>
            <IconButton color="inherit" onClick={handleEmailClick} title={t('publicHeader.emailUs', 'Email Us')}>
              <EmailIcon />
            </IconButton>
            <Button
              color="inherit"
              aria-controls="language-menu"
              aria-haspopup="true"
              onClick={handleLangMenuOpen}
              startIcon={<LanguageIcon />}
            >
              {i18n.language === 'en' ? t('publicHeader.langEnglish', 'English') : t('publicHeader.langHindi', 'हिन्दी')}
            </Button>
            <Menu
              id="language-menu"
              anchorEl={langAnchorEl}
              open={Boolean(langAnchorEl)}
              onClose={handleLangMenuClose}
            >
              <MenuItem onClick={() => changeLanguage('en')} selected={i18n.language === 'en'}>
                <span role="img" aria-label="English" style={{ marginRight: 8 }}>🇬🇧</span> {t('publicHeader.langEnglish', 'English')}
              </MenuItem>
              <MenuItem onClick={() => changeLanguage('hi')} selected={i18n.language === 'hi'}>
                <span role="img" aria-label="Hindi" style={{ marginRight: 8 }}>🇮🇳</span> {t('publicHeader.langHindi', 'हिन्दी')}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Services Modal with Tabs */}
      <Dialog open={servicesOpen} onClose={() => setServicesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          {t('publicHeader.ourServices', 'Our Services')}
          <IconButton
            aria-label="close"
            onClick={() => setServicesOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pb: 1 }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            aria-label="services tabs"
            sx={{ mb: 2 }}
          >
            <Tab label={t('publicHeader.tabVyaparSathi', 'VyaparSathi')} />
            <Tab label={t('publicHeader.tabDesiFix', 'DesiFix')} />
            {/* Add more apps here */}
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 700 }}>
              {t('publicHeader.vyaparSathiTitle', 'VyaparSathi: Business Management Solutions')}
            </Typography>
            <Grid container spacing={2}>
              {vyaparSathiFeatures.map((feature) => (
                <Grid item xs={12} sm={6} key={feature.title}>
                  <Paper elevation={2} sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    px: 2, py: 1.5, borderRadius: 2
                  }}>
                    {feature.icon}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t(feature.title)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t(`publicHeader.${feature.title}Desc`, feature.desc)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 700 }}>
              {t('publicHeader.desiFixTitle', 'DesiFix: Doorstep Services')}
            </Typography>
            <Grid container spacing={2}>
              {desiFixServices.map((feature) => (
                <Grid item xs={12} sm={6} key={feature.title}>
                  <Paper elevation={2} sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    px: 2, py: 1.5, borderRadius: 2
                  }}>
                    {feature.icon}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t(`publicHeader.${feature.title}`, feature.title)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t(`publicHeader.${feature.title}Desc`, feature.descKey)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </DialogContent>
        <Divider sx={{ my: 0 }} />
        <Box sx={{ px: 2, pt: 2, pb: 2 }}>
          <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 1, fontWeight: 600 }}>
            {t('publicHeader.whyChooseUs', 'Why Choose Us?')}
          </Typography>
          {whyChooseUs.map((why, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <CheckCircleOutlineIcon fontSize="small" color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">{t(why)}</Typography>
            </Box>
          ))}
        </Box>
        <DialogActions>
          <Button onClick={() => setServicesOpen(false)}>
            {t('publicHeader.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PublicHeader;