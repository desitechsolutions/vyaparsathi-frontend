import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Box, Menu, MenuItem,
  useMediaQuery, useTheme, Button, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Badge, keyframes,
  InputBase, Divider, ListItemIcon, Paper, CircularProgress, List, ListItemText, ListItemAvatar, Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { searchGlobalData } from '../../services/api';

// Icons
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import SupportIcon from '@mui/icons-material/Support';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useTranslation } from 'react-i18next';
import UserProfile from '../../pages/UserProfile';
import SettingsDialog from '../settings/SettingsDialog';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const AppBranding = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
      <TrendingUpOutlinedIcon sx={{ fontSize: { xs: 28, sm: 35 }, color: 'white' }} />
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: '900', fontSize: '1.4rem', color: 'white', lineHeight: 1 }}>
          {t('appName')}
        </Typography>
        <Typography variant="caption" noWrap sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 0.5 }}>
          {t('tagline')}
        </Typography>
      </Box>
    </Box>
  );
};

const Header = () => {
  const { user, logout } = useAuthContext();
  const { alertCount, criticalCount } = useAlerts();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // --- SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // --- UI STATES ---
  const [anchorEl, setAnchorEl] = useState(null);
  const [quickActionEl, setQuickActionEl] = useState(null);
  const [openSupportDialog, setOpenSupportDialog] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.sub || 'User' : 'User';
  const isLoggedIn = !!user;

  // --- SEARCH DEBOUNCE LOGIC ---
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchGlobalData(searchQuery);
        const data = response.data || response;
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Global search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = (route) => {
    setSearchQuery('');
    setShowResults(false);
    navigate(route);
  };

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleQuickActionOpen = (event) => setQuickActionEl(event.currentTarget);
  const handleClose = () => {
    setAnchorEl(null);
    setQuickActionEl(null);
  };

  const handleLogout = () => { handleClose(); logout(); };
  const changeLanguage = (lng) => { i18n.changeLanguage(lng); localStorage.setItem('language', lng); };

  // --- START: ALERT TOOLTIP LOGIC ---
  const lowCount = alertCount - criticalCount;
  let tooltipMessage = '';

  if (criticalCount > 0 && lowCount > 0) {
    tooltipMessage = `${criticalCount} ${t('header.critical')} and ${lowCount} ${t('header.lowStock')} ${t('header.itemsNeedAttention')}`;
  } else if (criticalCount > 0) {
    tooltipMessage = `${criticalCount} ${t('header.critical')} ${criticalCount > 1 ? t('header.items') : t('header.item')} ${t('header.needImmediateAttention')}`;
  } else if (lowCount > 0) {
    tooltipMessage = `${lowCount} ${t('header.lowStock')} ${lowCount > 1 ? t('header.items') : t('header.item')} ${t('header.needAttention')}`;
  }
  // --- END: ALERT TOOLTIP LOGIC ---

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 60, sm: 70 } }}>
        
        {/* LEFT: Branding */}
        <Box onClick={() => navigate('/')}>
          <AppBranding />
        </Box>

        {/* MIDDLE: Global Search (Desktop & Tablet) */}
        {isLoggedIn && !isMobile && (
          <Box sx={{ flexGrow: 1, mx: { sm: 2, md: 8 }, maxWidth: 600, position: 'relative' }}>
            <Box sx={{ 
              display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.15)', 
              borderRadius: 2, px: 2, transition: '0.3s',
              '&:focus-within': { bgcolor: 'rgba(255,255,255,0.25)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
            }}>
              <SearchIcon sx={{ color: 'rgba(255,255,255,0.8)', mr: 1 }} />
              <InputBase
                placeholder={t('header.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                sx={{ color: 'white', width: '100%', fontSize: '0.95rem', py: 0.8 }}
              />
              {isSearching && <CircularProgress size={20} sx={{ color: 'white', ml: 1 }} />}
            </Box>

            {/* SEARCH RESULTS DROPDOWN */}
            {showResults && (
              <Paper 
                elevation={10}
                sx={{ 
                  position: 'absolute', top: '115%', left: 0, right: 0, 
                  maxHeight: 450, overflowY: 'auto', borderRadius: 2, zIndex: 100,
                  border: '1px solid', borderColor: 'divider'
                }}
              >
                {searchResults.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {searchResults.map((result, index) => (
                      <MenuItem 
                        key={`${result.type}-${result.id}-${index}`} 
                        onClick={() => handleResultClick(result.route)}
                        sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: result.type === 'CUSTOMER' ? 'primary.main' : 
                                     result.type === 'SALE' ? 'success.main' : 'warning.main', 
                            width: 36, height: 36 
                          }}>
                            {result.type === 'CUSTOMER' ? <PersonIcon fontSize="small" /> : 
                             result.type === 'SALE' ? <ReceiptLongIcon fontSize="small" /> : <InventoryIcon fontSize="small" />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={<Typography variant="body2" fontWeight={700}>{result.title}</Typography>}
                          secondary={result.subtitle}
                        />
                        <Box sx={{ textAlign: 'right', ml: 2 }}>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontWeight: 700 }}>
                            {t(`header.${result.type.toLowerCase()}`)}
                          </Typography>
                          <ChevronRightIcon fontSize="small" color="disabled" />
                        </Box>
                      </MenuItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('header.noResultsFound')} "<strong>{searchQuery}</strong>"
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
            
            {/* Click-away overlay to close search results */}
            {showResults && (
              <Box 
                onClick={() => setShowResults(false)} 
                sx={{ position: 'fixed', inset: 0, zIndex: 90, bgcolor: 'transparent' }} 
              />
            )}
          </Box>
        )}

        {/* RIGHT: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
          {isLoggedIn && (
            <>
              {/* QUICK ACTION HUB */}
              <Tooltip title={t('header.quickAction')}>
                <IconButton 
                  onClick={handleQuickActionOpen} 
                  sx={{ 
                    bgcolor: 'secondary.main', color: 'white', 
                    '&:hover': { bgcolor: 'secondary.dark' }, 
                    width: { xs: 36, sm: 42 }, height: { xs: 36, sm: 42 },
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  <AddCircleIcon />
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={quickActionEl}
                open={Boolean(quickActionEl)}
                onClose={handleClose}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                PaperProps={{ sx: { width: 240, mt: 1.5, borderRadius: 2, p: 1 } }}
              >
                <Typography variant="overline" sx={{ px: 2, fontWeight: 800, color: 'primary.main' }}>
                  {t('header.transactionShortcuts')}
                </Typography>
                <MenuItem onClick={() => { handleClose(); navigate('/sales'); }}>
                  <ListItemIcon><ReceiptLongIcon fontSize="small" /></ListItemIcon> 
                  {t('header.newSale')}
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); navigate('/customer-payments'); }}>
                  <ListItemIcon><PaymentsIcon fontSize="small" color="success" /></ListItemIcon> 
                  {t('header.advancePayment')}
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => { handleClose(); navigate('/stock'); }}>
                  <ListItemIcon><InventoryIcon fontSize="small" /></ListItemIcon> 
                  {t('header.addProduct')}
                </MenuItem>
              </Menu>

              {/* ALERTS */}
              {alertCount > 0 && (
                <Tooltip title={tooltipMessage}>
                  <IconButton color="inherit" onClick={() => navigate('/low-stock-alerts')} sx={{ animation: criticalCount > 0 ? `${pulse} 2s infinite` : 'none' }}>
                    <Badge badgeContent={alertCount} color={criticalCount > 0 ? "error" : "warning"}>
                      {criticalCount > 0 ? <ReportProblemOutlinedIcon /> : <NotificationsIcon />}
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}

              <IconButton
                size="small"
                color="inherit"
                onClick={() => changeLanguage(i18n.language === 'en' ? 'hi' : 'en')}
                sx={{ marginRight: 2, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                <LanguageIcon sx={{ fontSize: 20, color: 'white' }} />
                <Typography variant="caption" sx={{ ml: 0.5, color: 'white' }}>
                  {i18n.language === 'en' ? 'हिंदी' : 'Eng'}
                </Typography>
              </IconButton>

              {/* USER PROFILE SECTION */}
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, pl: { sm: 2 }, borderLeft: { sm: '1px solid rgba(255,255,255,0.2)' } }}>
                {!isTablet && (
                  <Typography variant="body2" sx={{ mr: 1.5, fontWeight: 700, color: 'white' }}>
                    {displayName.split(' ')[0]}
                  </Typography>
                )}
                <IconButton onClick={handleMenu} sx={{ p: 0.5, border: '2px solid rgba(255,255,255,0.4)' }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: theme.palette.primary.main, fontWeight: 900, fontSize: '0.85rem' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Box>

              <Menu
                anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                PaperProps={{ sx: { minWidth: 220, mt: 1.5, borderRadius: 2 } }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.username || user?.sub}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { setOpenProfileModal(true); handleClose(); }}>
                  <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon> 
                  {t('header.profile')}
                </MenuItem>
                <MenuItem onClick={() => { setOpenSettingsDialog(true); handleClose(); }}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon> 
                  {t('header.settings')}
                </MenuItem>
                <MenuItem onClick={() => { setOpenSupportDialog(true); handleClose(); }}>
                  <ListItemIcon><SupportIcon fontSize="small" /></ListItemIcon> 
                  {t('header.helpSupport')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon><ExitToAppIcon fontSize="small" color="error" /></ListItemIcon> 
                  {t('header.logout')}
                </MenuItem>
              </Menu>
            </>
          )}

          {!isLoggedIn && (
            <Button color="inherit" onClick={() => navigate('/login')} sx={{ fontWeight: 700 }}>
              {t('header.login')}
            </Button>
          )}
        </Box>
      </Toolbar>

      {/* MODALS & DIALOGS */}
      <UserProfile open={openProfileModal} onClose={() => setOpenProfileModal(false)} />
      <SettingsDialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false)} />
      
      <Dialog open={openSupportDialog} onClose={() => setOpenSupportDialog(false)} PaperProps={{ sx: { borderRadius: 3, maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 900, pb: 0 }}>{t('header.customerSupport')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ mb: 3 }}>
            {t('header.supportMessage')}
          </DialogContentText>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('header.emailSupport')}</Typography>
              <Typography variant="body1" fontWeight={600}>info@desitechsolutions.com</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('header.phoneWhatsapp')}</Typography>
              <Typography variant="body1" fontWeight={600}>+91-950-815-6282</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenSupportDialog(false)} variant="contained" fullWidth sx={{ borderRadius: 2 }}>
            {t('header.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Header;