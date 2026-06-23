import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, IconButton,
  TextField, InputAdornment, Stack, Tooltip, Button,
  CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import {
  Search,
  GetApp,
  Add,
  Email,
  CheckCircle,
  Cancel,
  TrendingUp,
  FilterList,
  Refresh,
  Block,
  Restore
} from '@mui/icons-material';
import {
  fetchNewsletterSubscribers,
  fetchNewsletterStats,
  exportNewsletterCsv,
  subscribeNewsletter
} from '../../services/api';
import { toast } from 'react-toastify';
import axios from 'axios';

const NewsletterManager = () => {
  // Stats state
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    unsubscribedSubscribers: 0,
    newThisMonth: 0,
    subscribersBySource: {},
    subscribersByMonth: {}
  });

  // Subscribers state
  const [subscribers, setSubscribers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filter state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(''); // '', 'true', 'false'
  const [sourceFilter, setSourceFilter] = useState('');

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newSource, setNewSource] = useState('MANUAL_ADMIN');
  const [adding, setAdding] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Debounce search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Stats
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchNewsletterStats();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      toast.error('Failed to load newsletter statistics.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Load Subscribers List
  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeParam = activeFilter === 'true' ? true : activeFilter === 'false' ? false : null;
      const data = await fetchNewsletterSubscribers(page, rowsPerPage, debouncedSearch, activeParam, sourceFilter);
      if (data && data.content) {
        setSubscribers(data.content);
        setTotalElements(data.totalElements);
      } else {
        setSubscribers([]);
        setTotalElements(0);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError('Failed to fetch newsletter subscribers.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, activeFilter, sourceFilter]);

  // Effects
  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  useEffect(() => {
    loadStats();
  }, []);

  // Handle Export CSV
  const handleExportCsv = async () => {
    try {
      const activeParam = activeFilter === 'true' ? true : activeFilter === 'false' ? false : null;
      const response = await exportNewsletterCsv(debouncedSearch, activeParam, sourceFilter);
      // response is a blob because of responseType: 'blob' configuration
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Subscribers list exported successfully!');
    } catch (err) {
      console.error('Export CSV error:', err);
      toast.error('Failed to export CSV file.');
    }
  };

  // Handle manual subscriber add
  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    if (!newEmail) return;

    setAdding(true);
    try {
      const res = await subscribeNewsletter(newEmail, newSource);
      toast.success(res || 'Subscriber added successfully!');
      setNewEmail('');
      setAddDialogOpen(false);
      loadSubscribers();
      loadStats();
    } catch (err) {
      console.error('Add subscriber error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to add subscriber.';
      toast.error(errMsg);
    } finally {
      setAdding(false);
    }
  };

  // Toggle user active status (Unsubscribe / Reactivate)
  const handleToggleStatus = async (subscriber) => {
    setActionLoadingId(subscriber.id);
    try {
      if (subscriber.active) {
        // Unsubscribe
        // The endpoint is GET /api/newsletter/unsubscribe?token=...
        // We can hit it directly using axios or a raw GET
        await axios.get(`/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`);
        toast.success(`Successfully unsubscribed ${subscriber.email}`);
      } else {
        // Resubscribe using post subscribe endpoint (which reactivates)
        await subscribeNewsletter(subscriber.email, 'MANUAL_ADMIN');
        toast.success(`Successfully resubscribed ${subscriber.email}`);
      }
      loadSubscribers();
      loadStats();
    } catch (err) {
      console.error('Status toggle failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update subscription status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} sx={{ color: 'white', letterSpacing: '-0.02em', mb: 0.5 }}>
            Newsletter Subscribers
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
            Monitor subscriber growth, filter channels, and export audience database.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => { loadStats(); loadSubscribers(); }}
            startIcon={<Refresh />}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: '#38bdf8',
              color: '#0f172a',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#0ea5e9' }
            }}
          >
            Add Subscriber
          </Button>
        </Stack>
      </Stack>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Audience',
            value: stats.totalSubscribers,
            icon: <Email sx={{ fontSize: 24 }} />,
            color: '#3b82f6',
            desc: 'All-time registrations'
          },
          {
            title: 'Active Subscriptions',
            value: stats.activeSubscribers,
            icon: <CheckCircle sx={{ fontSize: 24 }} />,
            color: '#10b981',
            desc: 'Receiving newsletter'
          },
          {
            title: 'Unsubscribed Users',
            value: stats.unsubscribedSubscribers,
            icon: <Cancel sx={{ fontSize: 24 }} />,
            color: '#f43f5e',
            desc: 'Opted out manually'
          },
          {
            title: 'New This Month',
            value: stats.newThisMonth,
            icon: <TrendingUp sx={{ fontSize: 24 }} />,
            color: '#f59e0b',
            desc: 'Subscribed in current cycle'
          }
        ].map((metric, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper
              sx={{
                p: 3,
                bgcolor: '#1e293b',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                backgroundImage: 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '60px',
                  height: '60px',
                  bgcolor: `${metric.color}10`,
                  borderRadius: '0 0 0 30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: metric.color
                }}
              >
                {metric.icon}
              </Box>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1.1 }}>
                {metric.title}
              </Typography>
              {statsLoading ? (
                <Box sx={{ mt: 1, mb: 0.5 }}><CircularProgress size={24} sx={{ color: metric.color }} /></Box>
              ) : (
                <Typography variant="h4" fontWeight={900} sx={{ color: 'white', mt: 0.5, mb: 0.5 }}>
                  {metric.value}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                {metric.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d' }}>{error}</Alert>}

      {/* Filters Box */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          backgroundImage: 'none'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by Subscriber Email..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
              sx: {
                color: 'white',
                bgcolor: '#0f172a',
                borderRadius: '8px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#38bdf8' }
              }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150, width: { xs: '100%', md: 'auto' } }}>
            <InputLabel id="active-filter-label" sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#38bdf8' } }}>Status</InputLabel>
            <Select
              labelId="active-filter-label"
              id="active-filter"
              value={activeFilter}
              label="Status"
              onChange={(e) => { setActiveFilter(e.target.value); setPage(0); }}
              sx={{
                color: 'white',
                bgcolor: '#0f172a',
                borderRadius: '8px',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
                '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)' }
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="true">Active Only</MenuItem>
              <MenuItem value="false">Unsubscribed Only</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150, width: { xs: '100%', md: 'auto' } }}>
            <InputLabel id="source-filter-label" sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#38bdf8' } }}>Source</InputLabel>
            <Select
              labelId="source-filter-label"
              id="source-filter"
              value={sourceFilter}
              label="Source"
              onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
              sx={{
                color: 'white',
                bgcolor: '#0f172a',
                borderRadius: '8px',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
                '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)' }
              }}
            >
              <MenuItem value="">All Sources</MenuItem>
              <MenuItem value="FOOTER">Footer Form</MenuItem>
              <MenuItem value="Landing Page">Landing Page</MenuItem>
              <MenuItem value="MANUAL_ADMIN">Admin Panel Manual</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={handleExportCsv}
            disabled={subscribers.length === 0}
            startIcon={<GetApp />}
            sx={{
              color: '#38bdf8',
              borderColor: 'rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              textTransform: 'none',
              height: '40px',
              whiteSpace: 'nowrap',
              width: { xs: '100%', md: 'auto' },
              '&:hover': {
                borderColor: '#38bdf8',
                bgcolor: 'rgba(56, 189, 248, 0.05)'
              },
              '&.Mui-disabled': {
                color: 'rgba(255,255,255,0.15)',
                borderColor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Export CSV
          </Button>
        </Stack>
      </Paper>

      {/* Main Table */}
      <TableContainer
        component={Paper}
        sx={{
          bgcolor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
          backgroundImage: 'none',
          boxShadow: 'none'
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
            <TableRow>
              <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}>SUBSCRIBER EMAIL</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}>SOURCE</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}>SUBSCRIBED AT</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}>UNSUBSCRIBED AT</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}>STATUS</TableCell>
              <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10, borderBottom: 0 }}>
                  <CircularProgress sx={{ color: '#38bdf8' }} />
                </TableCell>
              </TableRow>
            ) : subscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10, borderBottom: 0, color: 'rgba(255,255,255,0.3)' }}>
                  No newsletter subscribers found matching the filters.
                </TableCell>
              </TableRow>
            ) : (
              subscribers.map((row) => (
                <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ p: 0.8, bgcolor: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', color: '#38bdf8', display: 'flex' }}>
                        <Email sx={{ fontSize: 16 }} />
                      </Box>
                      <Typography variant="body2" fontWeight={700} color="white">{row.email}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', py: 2 }}>
                    <Chip
                      label={row.source || 'Landing Page'}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', py: 2 }}>
                    {row.subscribedAt ? new Date(row.subscribedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(244,63,94,0.6)', py: 2 }}>
                    {row.unsubscribedAt ? new Date(row.unsubscribedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}>
                    <Chip
                      label={row.active ? 'ACTIVE' : 'INACTIVE'}
                      size="small"
                      sx={{
                        bgcolor: row.active ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                        color: row.active ? '#10b981' : '#f43f5e',
                        border: row.active ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(244,63,94,0.2)',
                        fontWeight: 800,
                        fontSize: '0.65rem'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1.5 }}>
                    <Tooltip title={row.active ? 'Manually Unsubscribe' : 'Resubscribe User'}>
                      <span>
                        <IconButton
                          color={row.active ? 'error' : 'success'}
                          size="small"
                          disabled={actionLoadingId === row.id}
                          onClick={() => handleToggleStatus(row)}
                          sx={{
                            border: '1px solid',
                            borderColor: row.active ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                            borderRadius: '6px',
                            p: 0.8,
                            bgcolor: row.active ? 'rgba(244,63,94,0.03)' : 'rgba(16,185,129,0.03)',
                            '&:hover': {
                              bgcolor: row.active ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)'
                            }
                          }}
                        >
                          {actionLoadingId === row.id ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : row.active ? (
                            <Block sx={{ fontSize: 16 }} />
                          ) : (
                            <Restore sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 20, 50]}
          sx={{
            color: 'rgba(255,255,255,0.6)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            '.MuiTablePagination-selectIcon': { color: 'rgba(255,255,255,0.4)' },
            '.MuiIconButton-root': {
              color: 'white',
              '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' }
            }
          }}
        />
      </TableContainer>

      {/* Manual Add Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            p: 1,
            width: '100%',
            maxWidth: '450px'
          }
        }}
      >
        <Box component="form" onSubmit={handleAddSubscriber}>
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Manually Add Subscriber</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
              Enter the email address of the user who requested a subscription. They will receive a welcome email with their unsubscribe link.
            </Typography>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              required
              disabled={adding}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#38bdf8' } } }}
              InputProps={{
                sx: {
                  color: 'white',
                  bgcolor: '#0f172a',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#38bdf8' }
                }
              }}
              sx={{ mb: 2.5 }}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="dialog-source-label" sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#38bdf8' } }}>Channel Source</InputLabel>
              <Select
                labelId="dialog-source-label"
                id="dialog-source"
                value={newSource}
                label="Channel Source"
                onChange={(e) => setNewSource(e.target.value)}
                sx={{
                  color: 'white',
                  bgcolor: '#0f172a',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
                  '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)' }
                }}
              >
                <MenuItem value="MANUAL_ADMIN">Admin Panel Manual</MenuItem>
                <MenuItem value="FOOTER">Footer Form</MenuItem>
                <MenuItem value="Landing Page">Landing Page</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={() => setAddDialogOpen(false)}
              disabled={adding}
              sx={{
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { color: 'white' }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={adding}
              sx={{
                bgcolor: '#38bdf8',
                color: '#0f172a',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': { bgcolor: '#0ea5e9' }
              }}
            >
              {adding ? <CircularProgress size={20} color="inherit" /> : 'Subscribe'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default NewsletterManager;
