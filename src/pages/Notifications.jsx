import React, { useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemAvatar, 
  Avatar, ListItemText, Divider, Chip, IconButton, Button, 
  Stack, Tab, Tabs, Tooltip
} from '@mui/material';
import {
  NotificationsActive, Inventory, Payments, LocalShipping, 
  DeleteSweep, DoneAll, Info, ErrorOutline, WarningAmber
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function Notifications() {
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: 'inventory', 
      title: 'Low Stock Alert', 
      message: 'Parle-G 100g is below the reorder level (Remaining: 2 packs).', 
      time: dayjs().subtract(10, 'minute').toISOString(),
      read: false,
      priority: 'high'
    },
    { 
      id: 2, 
      type: 'payment', 
      title: 'Due Payment', 
      message: 'Invoice #INV-2024 from Raj Gupta is overdue by 2 days.', 
      time: dayjs().subtract(2, 'hour').toISOString(),
      read: false,
      priority: 'medium'
    },
    { 
      id: 3, 
      type: 'delivery', 
      title: 'Delivery Out', 
      message: 'Order #882 has been picked up for delivery to Civil Lines.', 
      time: dayjs().subtract(5, 'hour').toISOString(),
      read: true,
      priority: 'low'
    }
  ]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

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
          <Typography variant="h4" fontWeight={900} color="#0f172a">Notifications</Typography>
          <Typography color="text.secondary">Stay updated with inventory, payments, and system alerts.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<DoneAll />} onClick={handleMarkAllRead} sx={{ textTransform: 'none' }}>
            Mark all read
          </Button>
          <Tooltip title="Clear All">
            <IconButton onClick={handleClearAll} color="error"><DeleteSweep /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)} 
          sx={{ px: 2, pt: 1, borderBottom: '1px solid #f1f5f9' }}
        >
          <Tab label="All" />
          <Tab label="Inventory" />
          <Tab label="Payments" />
        </Tabs>

        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <NotificationsActive sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
              <Typography color="text.secondary">All caught up! No new notifications.</Typography>
            </Box>
          ) : (
            notifications.map((notif, index) => (
              <React.Fragment key={notif.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    bgcolor: notif.read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                    '&:hover': { bgcolor: '#f8fafc' },
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
                          {dayjs(notif.time).fromNow()}
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
                {index < notifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      {/* Settings Preview */}
      <Paper sx={{ mt: 4, p: 3, borderRadius: 4, bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <WarningAmber color="action" />
          <Typography variant="body2" color="text.secondary">
            <strong>Notification Preferences:</strong> You are receiving alerts for low stock and overdue payments. Change this in <strong>Admin {'>'} User Settings.</strong>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}