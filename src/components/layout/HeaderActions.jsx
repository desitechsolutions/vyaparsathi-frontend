import React from 'react';
import {
  Box, IconButton, Badge, Menu, MenuItem, Chip, Tooltip, useTheme, Stack, Divider,
  ListItemIcon, Typography, keyframes, Button,
} from '@mui/material';
import { ReportProblemOutlined as ReportProblemOutlinedIcon } from '@mui/icons-material';
import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { BrightnessHigh as BrightnessHighIcon } from '@mui/icons-material';
import { DarkMode as DarkModeIcon } from '@mui/icons-material';
import { BrightnessAuto as BrightnessAutoIcon } from '@mui/icons-material';
import { WorkspacePremium as WorkspacePremiumIcon } from '@mui/icons-material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { Receipt as ReceiptIcon, CreditCard as CreditCardIcon, Inventory as InventoryIcon } from '@mui/icons-material';
import { Close as CloseIcon } from '@mui/icons-material';
import StatusIndicators from './StatusIndicators';
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
    light: <BrightnessHighIcon sx={{ fontSize: 20 }} />,
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

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getAlertSeverity = (alert) => {
    if (alert.currentStock === 0) return 'critical';
    if (alert.currentStock <= alert.reorderLevel) return 'warning';
    return 'info';
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
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      {/* GROUP 1: NOTIFICATIONS (Critical - Always Visible) */}
      {hasAlerts && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Tooltip title={alertTooltip}>
            <IconButton
              color="inherit"
              onClick={onNotificationOpen}
              size="small"
              aria-label={`Notifications: ${alertCount} alert${alertCount !== 1 ? 's' : ''}`}
              aria-expanded={Boolean(notificationAnchor)}
              aria-haspopup="menu"
              sx={{
                animation: criticalCount > 0 ? `${pulse} 2s infinite` : 'none',
              }}
            >
              <Badge badgeContent={alertCount} color="error">
                {criticalCount > 0 ? <ReportProblemOutlinedIcon /> : <NotificationsIcon />}
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notification Dropdown Menu - Enhanced */}
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={onNotificationClose}
            PaperProps={{ sx: { minWidth: 380, maxHeight: 500, borderRadius: 2, mt: 1.5 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {/* Header with Clear All */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {alertCount} Alert{alertCount !== 1 ? 's' : ''}
              </Typography>
              <IconButton
                size="small"
                onClick={onNotificationClose}
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                title="Close"
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Divider sx={{ my: 0 }} />

            {/* Alert Items - Enhanced with Severity */}
            {(alerts || []).slice(0, 5).map((alert, idx) => {
              const severity = getAlertSeverity(alert);
              const severityColor = severity === 'critical' ? 'error.main' : severity === 'warning' ? 'warning.main' : 'info.main';
              const severityLabel = severity === 'critical' ? 'CRITICAL' : 'LOW STOCK';

              return (
                <Box key={idx}>
                  <MenuItem
                    sx={{
                      py: 2,
                      px: 2,
                      display: 'flex',
                      gap: 1.5,
                      alignItems: 'flex-start',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    {/* Severity Indicator */}
                    <Box sx={{
                      width: 4,
                      height: 68,
                      bgcolor: severityColor,
                      borderRadius: 1,
                      flexShrink: 0,
                    }} />

                    {/* Content */}
                    <Box flex={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box flex={1}>
                          <Typography fontWeight={700} fontSize="0.9rem">
                            {alert.itemName || 'Item'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {severityLabel}
                          </Typography>
                          <Typography fontSize="0.75rem" color="text.secondary" sx={{ mt: 0.5 }}>
                            Stock: {alert.currentStock || 0} / Reorder: {alert.reorderLevel || 0}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {formatRelativeTime(alert.createdAt)}
                        </Typography>
                      </Stack>

                      {/* Action Buttons */}
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            onNotificationClose();
                            navigate('/low-stock-alerts');
                          }}
                          sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => {
                            onNotificationClose();
                          }}
                          sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}
                        >
                          Dismiss
                        </Button>
                      </Stack>
                    </Box>
                  </MenuItem>
                  {idx < Math.min(4, alerts.length - 1) && <Divider sx={{ my: 0 }} />}
                </Box>
              );
            })}

            <Divider sx={{ my: 0 }} />

            {/* Footer */}
            <MenuItem
              onClick={() => {
                onNotificationClose();
                navigate('/low-stock-alerts');
              }}
              sx={{ py: 1.5, justifyContent: 'center', bgcolor: 'action.hover' }}
            >
              <Typography color="primary" fontWeight={600} fontSize="0.85rem">
                View All Alerts →
              </Typography>
            </MenuItem>
          </Menu>
        </Stack>
      )}

      {/* DIVIDER - Desktop Only */}
      {!isMobile && <Divider orientation="vertical" flexItem sx={{ my: 1 }} />}

      {/* GROUP 2: ACTIONS (Desktop Only) */}
      {!isMobile && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Tooltip title="Quick Actions">
            <IconButton
              color="inherit"
              onClick={onQuickActionOpen}
              size="small"
              aria-label="Quick actions menu"
              aria-expanded={Boolean(quickActionAnchor)}
              aria-haspopup="menu"
            >
              <AddCircleIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={quickActionAnchor}
            open={Boolean(quickActionAnchor)}
            onClose={onQuickActionClose}
            PaperProps={{ sx: { minWidth: 280, borderRadius: 2, mt: 1.5 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {/* Header */}
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Quick Actions
              </Typography>
            </Box>
            <Divider sx={{ my: 0 }} />

            {/* Sales Group */}
            <Box sx={{ p: 1.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                SALES
              </Typography>
            </Box>
            <MenuItem
              onClick={() => handleQuickAction('/sales')}
              sx={{ py: 1.5, px: 2, gap: 2, display: 'flex' }}
            >
              <ReceiptIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Box flex={1}>
                <Typography fontWeight={600} fontSize="0.9rem">New Sale</Typography>
                <Typography variant="caption" color="text.secondary">⌘ Shift + N</Typography>
              </Box>
            </MenuItem>

            <Divider sx={{ my: 1 }} />

            {/* Payments Group */}
            <Box sx={{ p: 1.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                PAYMENTS
              </Typography>
            </Box>
            <MenuItem
              onClick={() => handleQuickAction('/customer-payments')}
              sx={{ py: 1.5, px: 2, gap: 2, display: 'flex' }}
            >
              <CreditCardIcon sx={{ fontSize: 20, color: 'success.main' }} />
              <Box flex={1}>
                <Typography fontWeight={600} fontSize="0.9rem">Advance Payment</Typography>
                <Typography variant="caption" color="text.secondary">⌘ Shift + P</Typography>
              </Box>
            </MenuItem>

            <Divider sx={{ my: 1 }} />

            {/* Inventory Group */}
            <Box sx={{ p: 1.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                INVENTORY
              </Typography>
            </Box>
            <MenuItem
              onClick={() => handleQuickAction('/stock')}
              sx={{ py: 1.5, px: 2, gap: 2, display: 'flex' }}
            >
              <InventoryIcon sx={{ fontSize: 20, color: 'warning.main' }} />
              <Box flex={1}>
                <Typography fontWeight={600} fontSize="0.9rem">Add Product</Typography>
                <Typography variant="caption" color="text.secondary">⌘ Shift + A</Typography>
              </Box>
            </MenuItem>
          </Menu>

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
        </Stack>
      )}

      {/* DIVIDER - Desktop Only */}
      {!isMobile && <Divider orientation="vertical" flexItem sx={{ my: 1 }} />}

      {/* GROUP 3: PREFERENCES (Desktop Only) */}
      {!isMobile && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Tooltip title="Language">
            <IconButton
              color="inherit"
              onClick={onLanguageMenuOpen}
              size="small"
              aria-label="Language selector"
              aria-expanded={Boolean(languageMenuAnchor)}
              aria-haspopup="menu"
            >
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

          <Tooltip title={`Switch to ${themeNextLabel[colorPreference]}`}>
            <IconButton
              color="inherit"
              onClick={cycleColorPreference}
              size="small"
              aria-label={`Theme: currently ${colorPreference}. Click to switch to ${themeNextLabel[colorPreference]}`}
              sx={{ transition: 'transform 200ms', '&:hover': { transform: 'scale(1.1)' } }}
            >
              {themeIconMap[colorPreference]}
            </IconButton>
          </Tooltip>

          <StatusIndicators isMobile={isMobile} />
        </Stack>
      )}

      {/* DIVIDER - Desktop Only */}
      {!isMobile && <Divider orientation="vertical" flexItem sx={{ my: 1 }} />}

      {/* GROUP 4: USER (Always Visible) */}
    </Stack>
  );
};

export default HeaderActions;
