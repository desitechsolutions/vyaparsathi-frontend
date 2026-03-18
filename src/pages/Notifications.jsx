import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemAvatar, 
  Avatar, ListItemText, Divider, Chip, IconButton, Button, 
  Stack, Tab, Tabs, Tooltip, CircularProgress, Alert
} from '@mui/material';
import {
  NotificationsActive, Inventory, Payments, LocalShipping, 
  DeleteSweep, DoneAll, Info, ErrorOutline, WarningAmber
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';

// Import your API functions
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications 
} from '../services/api'; 

dayjs.extend(relativeTime);

export default function Notifications() {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replace this with your actual Auth/User Context email
  const currentUserEmail = "admin@shop.com"

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetchNotifications(currentUserEmail);
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      setError(t('notificationsPage.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(currentUserEmail);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Bulk update failed", err);
    }
  };

  const handleClearAll = async () => {
    try {
      if (window.confirm("Are you sure you want to delete all notifications?")) {
        await clearAllNotifications(currentUserEmail);
        setNotifications([]);
      }
    } catch (err) {
      console.error("Clear all failed", err);
    }
  };

  const handleSingleRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (tabValue === 0) return notifications;
    const typeMap = { 1: 'inventory', 2: 'payment' };
    return notifications.filter(n => n.type === typeMap[tabValue]);
  }, [tabValue, notifications]);

  const getIcon = (type) => {
    switch (type) {
      case 'inventory': return <Inventory sx={{ color: '#f59e0b' }} />;
      case 'payment': return <Payments sx={{ color: '#10b981' }} />;
      case 'delivery': return <LocalShipping sx={{ color: '#3b82f6' }} />;
      default: return <Info color="primary" />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a">{t('notificationsPage.title')}</Typography>
          <Typography color="text.secondary">Stay updated with inventory, payments, and system alerts.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button 
            disabled={notifications.length === 0}
            startIcon={<DoneAll />} 
            onClick={handleMarkAllRead} 
            sx={{ textTransform: 'none' }}
          >
            {t('notificationsPage.markAllRead')}
          </Button>
          <Tooltip title="Clear All">
            <span>
                <IconButton 
                    disabled={notifications.length === 0} 
                    onClick={handleClearAll} 
                    color="error"
                >
                    <DeleteSweep />
                </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)} 
          sx={{ px: 2, pt: 1, borderBottom: '1px solid #f1f5f9' }}
        >
          <Tab label={t('notificationsPage.all')} />
          <Tab label="Inventory" />
          <Tab label="Payments" />
        </Tabs>

        {loading ? (
          <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress size={30} /></Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.length === 0 ? (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <NotificationsActive sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                <Typography color="text.secondary">{t('notificationsPage.noNotifications')}</Typography>
              </Box>
            ) : (
              filteredNotifications.map((notif, index) => (
                <React.Fragment key={notif.id}>
                  <ListItem 
                    onClick={() => !notif.read && handleSingleRead(notif.id)}
                    alignItems="flex-start"
                    sx={{ 
                      bgcolor: notif.read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                      '&:hover': { bgcolor: '#f8fafc', cursor: notif.read ? 'default' : 'pointer' },
                      transition: '0.2s',
                      py: 2
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                        {getIcon(notif.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="subtitle1" fontWeight={notif.read ? 600 : 800}>
                            {notif.title}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {dayjs(notif.timestamp).fromNow()}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Box mt={0.5}>
                          <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                            {notif.message}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            {notif.priority === 'high' && (
                              <Chip label="Urgent" size="small" color="error" icon={<ErrorOutline />} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                            )}
                            {!notif.read && (
                              <Chip label="New" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                            )}
                          </Stack>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </Paper>

      <Paper sx={{ mt: 4, p: 3, borderRadius: 4, bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <WarningAmber color="action" />
          <Typography variant="body2" color="text.secondary">
            <strong>Pro Tip:</strong> Urgent notifications like low stock are highlighted in red. Manage these in your Admin Settings.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}