import React from 'react';
import {
  Box, IconButton, Badge, Menu, MenuItem, Chip, Tooltip, useTheme, Stack,
  ListItemIcon, Typography, keyframes,
} from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LanguageIcon from '@mui/icons-material/Language';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAlerts } from '../../context/AlertContext';
import { useThemeContext } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const HeaderActions = ({
  notificationAnchor,
  onNotificationOpen,
  onNotificationClose,
  quickActionAnchor,
  onQuickActionOpen,
  onQuickActionClose,
  themeMenuAnchor,
  onThemeMenuOpen,
  onThemeMenuClose,
  languageMenuAnchor,
  onLanguageMenuOpen,
  onLanguageMenuClose,
  isMobile,
  isTablet,
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { alertCount, criticalCount, alerts } = useAlerts();
  const { colorPreference, cycleColorPreference } = useThemeContext();
  const { isPremium, subscription } = useSubscription();
  const theme = useTheme();

  const premium = isPremium();
  const lowCount = alertCount - criticalCount;
  const hasAlerts = alertCount > 0;

  const themeIconMap = {
    light: <LightModeIcon sx={{ fontSize: 20 }} />,
    dark: <DarkModeIcon sx={{ fontSize: 20 }} />,
    auto: <BrightnessAutoIcon sx={{ fontSize: 20 }} />,
  };

  const themeNextLabel = { light: 'Dark', dark: 'Auto', auto: 'Light' };
  const themeCurrentLabel = { light: 'Light', dark: 'Dark', auto: 'Auto' };

  const handleQuickAction = (path) => {
    onQuickActionClose();
    navigate(path);
  };

  const handleChangeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    onLanguageMenuClose();
  };

  let alertTooltip = '';
  if (criticalCount > 0 && lowCount > 0) {
    alertTooltip = `${criticalCount} ${t('header.critical')} and ${lowCount} ${t('header.lowStock')}`;
  } else if (criticalCount > 0) {
    alertTooltip = `${criticalCount} ${t('header.critical')} Items`;
  } else if (lowCount > 0) {
    alertTooltip = `${lowCount} Low Stock Items`;
  }

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      {/* Notification Bell */}
      {hasAlerts && (
        <>
          <Tooltip title={alertTooltip}>
            <IconButton
              color="inherit"
              onClick={onNotificationOpen}
              size="small"
              sx={{
                animation: criticalCount > 0 ? `${pulse} 2s infinite` : 'none',
              }}
            >
              <Badge badgeContent={alertCount} color="error">
                {criticalCount > 0 ? <ReportProblemOutlinedIcon /> : <NotificationsIcon />}
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notification Dropdown Menu */}
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={onNotificationClose}
            PaperProps={{ sx: { minWidth: 320, borderRadius: 2, mt: 1.5 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Typography variant="subtitle2" fontWeight={600}>
                {alertCount} Alert{alertCount !== 1 ? 's' : ''}
              </Typography>
            </MenuItem>

            {(alerts || []).slice(0, 5).map((alert, idx) => (
              <MenuItem key={idx} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <Badge color="error" variant="dot">
                    <Box />
                  </Badge>
                </ListItemIcon>
                <Box>
                  <Typography fontSize="0.85rem" fontWeight={500}>
                    {alert.itemName || 'Item'}
                  </Typography>
                  <Typography fontSize="0.75rem" color="text.secondary">
                    Stock: {alert.currentStock || 0} {alert.unit}
                  </Typography>
                </Box>
              </MenuItem>
            ))}

            <MenuItem onClick={onNotificationClose} sx={{ py: 1 }}>
              <Typography variant="body2" color="primary" fontSize="0.85rem" fontWeight={600}>
                View All Alerts
              </Typography>
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Quick Action Button - Hidden on mobile */}
      {!isMobile && (
        <>
          <Tooltip title="Quick Actions">
            <IconButton color="inherit" onClick={onQuickActionOpen} size="small">
              <AddCircleIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={quickActionAnchor}
            open={Boolean(quickActionAnchor)}
            onClose={onQuickActionClose}
            PaperProps={{ sx: { minWidth: 220, borderRadius: 2, mt: 1.5 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => handleQuickAction('/sales')} sx={{ gap: 1 }}>
              <Typography fontSize="0.9rem">New Sale</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleQuickAction('/customer-payments')} sx={{ gap: 1 }}>
              <Typography fontSize="0.9rem">Advance Payment</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleQuickAction('/stock')} sx={{ gap: 1 }}>
              <Typography fontSize="0.9rem">Add Product</Typography>
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Premium/Trial Badge - Hidden on mobile */}
      {!isMobile && (
        <Chip
          icon={<WorkspacePremiumIcon />}
          label={premium ? subscription?.tier : 'Upgrade'}
          size="small"
          color={premium ? 'success' : 'default'}
          variant="outlined"
          sx={{
            height: 28,
            fontSize: '0.75rem',
            fontWeight: 600,
            ...(premium && {
              background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
              border: 'none',
              color: 'white',
            }),
          }}
        />
      )}

      {/* Language Switcher - Hidden on mobile */}
      {!isMobile && (
        <>
          <Tooltip title="Language">
            <IconButton color="inherit" onClick={onLanguageMenuOpen} size="small">
              <LanguageIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={languageMenuAnchor}
            open={Boolean(languageMenuAnchor)}
            onClose={onLanguageMenuClose}
            PaperProps={{ sx: { minWidth: 150, borderRadius: 2, mt: 1.5 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem selected={i18n.language === 'en'} onClick={() => handleChangeLanguage('en')}>
              English
            </MenuItem>
            <MenuItem selected={i18n.language === 'hi'} onClick={() => handleChangeLanguage('hi')}>
              हिंदी
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Theme Toggle */}
      <Tooltip title={`Switch to ${themeNextLabel[colorPreference]}`}>
        <IconButton
          color="inherit"
          onClick={cycleColorPreference}
          size="small"
          sx={{ transition: 'transform 200ms', '&:hover': { transform: 'scale(1.1)' } }}
        >
          {themeIconMap[colorPreference]}
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default HeaderActions;
