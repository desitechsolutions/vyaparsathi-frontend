import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, Stack, Card, CardContent, 
  LinearProgress, Alert, List, ListItem, ListItemIcon, ListItemText, Divider, Chip 
} from '@mui/material';
import { 
  CloudUpload, Storage, Download, History, 
  CheckCircle, Computer, Save, Security 
} from '@mui/icons-material';
import dayjs from 'dayjs';

export default function Backup() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastBackup, setLastBackup] = useState(dayjs().format('DD MMM YYYY, hh:mm A'));
  const [status, setStatus] = useState('');

  const handleBackup = (type) => {
    setLoading(true);
    setProgress(0);
    setStatus(type === 'cloud' ? 'Syncing to Secure Cloud...' : 'Generating Local Archive...');

    // Simulate progress for UX
    const interval = setInterval(() => {
      setProgress((old) => {
        if (old === 100) {
          clearInterval(interval);
          setLoading(false);
          setLastBackup(dayjs().format('DD MMM YYYY, hh:mm A'));
          return 100;
        }
        return Math.min(old + 10, 100);
      });
    }, 200);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900}>Database & Backup</Typography>
        <Typography color="text.secondary">Secure your business data and manage exports</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Backup Actions */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Stack spacing={3}>
              <Box sx={{ p: 3, bgcolor: '#f0f9ff', borderRadius: 3, border: '1px solid #bae6fd' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <History color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>Last Successful Backup</Typography>
                      <Typography variant="caption" color="text.secondary">{lastBackup}</Typography>
                    </Box>
                  </Stack>
                  <Chip label="System Secure" color="success" size="small" icon={<CheckCircle />} />
                </Stack>
              </Box>

              <Typography variant="h6" fontWeight={800}>Instant Actions</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }} onClick={() => handleBackup('cloud')}>
                    <CardContent>
                      <Stack spacing={1} alignItems="center" textAlign="center">
                        <CloudUpload color="primary" sx={{ fontSize: 40 }} />
                        <Typography fontWeight={700}>Cloud Backup</Typography>
                        <Typography variant="caption" color="text.secondary">Sync all data to encrypted cloud storage</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }} onClick={() => handleBackup('local')}>
                    <CardContent>
                      <Stack spacing={1} alignItems="center" textAlign="center">
                        <Computer color="secondary" sx={{ fontSize: 40 }} />
                        <Typography fontWeight={700}>Local Export</Typography>
                        <Typography variant="caption" color="text.secondary">Download a .JSON data dump to your PC</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {loading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" fontWeight={700} gutterBottom display="block">{status}</Typography>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" fontWeight={800}>Full Data Export (CSV Pack)</Typography>
              <Typography variant="body2" color="text.secondary">Extract individual modules for external analysis.</Typography>
              
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {['Items', 'Customers', 'Sales', 'Expenses'].map((module) => (
                  <Button 
                    key={module} 
                    variant="outlined" 
                    startIcon={<Download />} 
                    sx={{ borderRadius: 2, mb: 1 }}
                  >
                    {module}
                  </Button>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Security Info */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: '#1e293b', color: 'white' }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Security />
                  <Typography fontWeight={800}>Security Protocol</Typography>
                </Stack>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Your data is encrypted using AES-256 before being transmitted. Local exports contain sensitive information; keep them in a safe place.
                </Typography>
                <List size="small" sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }}>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 30 }}><CheckCircle sx={{ color: '#10b981', fontSize: 18 }} /></ListItemIcon>
                    <ListItemText primary="Automatic Daily Backups" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 30 }}><CheckCircle sx={{ color: '#10b981', fontSize: 18 }} /></ListItemIcon>
                    <ListItemText primary="Point-in-time Recovery" />
                  </ListItem>
                </List>
              </Stack>
            </Paper>

            <Alert severity="info" sx={{ borderRadius: 3 }}>
              You can schedule automatic email reports in the <strong>Admin Settings</strong>.
            </Alert>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}