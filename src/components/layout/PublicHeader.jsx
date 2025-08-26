import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, List, ListItem, ListItemIcon, ListItemText, IconButton, DialogActions
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

const PublicHeader = () => {
  const { t, i18n } = useTranslation();
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  const handleLangMenuOpen = (event) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLangMenuClose = () => {
    setLangAnchorEl(null);
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    handleLangMenuClose();
  };

  const handleSupportClick = () => {
    window.location.href = `mailto:support@thinkteck.com?subject=Support Request for ${t('appName')}`;
  };

  const productFeatures = [
    'itemCatalog', 'inventory', 'sales', 'reports', 'customers', 'purchaseOrders', 'expenses', 'analytics'
  ];

  return (
    <>
      <AppBar position="static" color="transparent" elevation={1} sx={{ backdropFilter: 'blur(10px)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {t('publicHeader.companyName')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button color="inherit" onClick={() => setFeaturesOpen(true)}>
              {t('publicHeader.features')}
            </Button>
            <Button color="inherit" onClick={handleSupportClick}>
              {t('publicHeader.support')}
            </Button>

            <Button
              color="inherit"
              aria-controls="language-menu"
              aria-haspopup="true"
              onClick={handleLangMenuOpen}
              startIcon={<LanguageIcon />}
            >
              {i18n.language === 'en' ? 'English' : 'हिन्दी'}
            </Button>
            <Menu
              id="language-menu"
              anchorEl={langAnchorEl}
              open={Boolean(langAnchorEl)}
              onClose={handleLangMenuClose}
            >
              <MenuItem onClick={() => changeLanguage('en')} selected={i18n.language === 'en'}>English</MenuItem>
              <MenuItem onClick={() => changeLanguage('hi')} selected={i18n.language === 'hi'}>हिन्दी</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Product Features Modal */}
      <Dialog open={featuresOpen} onClose={() => setFeaturesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('publicHeader.productFeaturesTitle')}
          <IconButton
            aria-label="close"
            onClick={() => setFeaturesOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>{t('publicHeader.productFeaturesSubtitle')}</Typography>
          <List>
            {productFeatures.map((feature) => (
              <ListItem key={feature}>
                <ListItemIcon>
                  <CheckCircleOutlineIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={t(feature)} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setFeaturesOpen(false)}>{t('publicHeader.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PublicHeader;