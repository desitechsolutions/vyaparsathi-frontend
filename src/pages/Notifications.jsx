import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button, CircularProgress, Badge
} from '@mui/material';
import { fetchNotifications, markNotificationAsRead } from '../services/api';
// If you have a user context, import it. Otherwise, get recipient from auth or localStorage.
import { useAuthContext } from '../context/AuthContext'; // adjust path as needed

export default function Notifications() {
  const { user } = useAuthContext(); // Or get recipient from localStorage
  const recipient = user?.username || user?.email || localStorage.getItem('username');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchNotifications(recipient);
      setNotifications(res.data);
    } catch (e) {
      setError('Failed to load notifications');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (recipient) loadNotifications();
    // eslint-disable-next-line
  }, [recipient]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      setError('Failed to mark as read');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        Notifications
      </Typography>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      <Paper sx={{ p: 2 }}>
        <List>
          {notifications.length === 0 && (
            <Typography>No notifications found.</Typography>
          )}
          {notifications.map((n) => (
            <ListItem
              key={n.id}
              sx={{
                bgcolor: n.read ? '#f5f5f5' : '#e3f2fd',
                mb: 1,
                borderRadius: 2,
              }}
              secondaryAction={
                !n.read && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleMarkAsRead(n.id)}
                  >
                    Mark as Read
                  </Button>
                )
              }
            >
              <ListItemText
                primary={
                  <Badge
                    color="primary"
                    variant="dot"
                    invisible={n.read}
                  >
                    <span>{n.type}: {n.message}</span>
                  </Badge>
                }
                secondary={
                  <>
                    <span>
                      {new Date(n.timestamp).toLocaleString()}
                      {n.link && (
                        <>
                          {' | '}
                          <a href={n.link} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </>
                      )}
                    </span>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}