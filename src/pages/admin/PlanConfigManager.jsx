import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, Button, Stack, 
  CircularProgress, TextField, Switch,
  FormControlLabel, Chip, InputAdornment, Zoom, Snackbar, Alert, IconButton, Paper, MenuItem
} from '@mui/material';
import { 
  Save as SaveIcon, 
  AutoAwesome as MagicIcon,
  Refresh as RefreshIcon,
  ShoppingCart as SalesIcon,
  Inventory as ItemsIcon,
  Group as PeopleIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import { 
  fetchActivePricingPlans, 
  updatePlanConfig, 
  fetchPlanDetailsByTier 
} from '../../services/api';

// Tiers matching your Backend Enum
const TIER_OPTIONS = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE', 'CUSTOM'];

const PlanConfigManager = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); 
  const [refreshing, setRefreshing] = useState(null);
  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });
  
  // State for creating a new plan
  const [isAdding, setIsAdding] = useState(false);
  const [newPlan, setNewPlan] = useState({
    tier: '',
    displayName: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxSalesPerMonth: 0,
    maxItems: 0,
    maxStaffUsers: 0,
    features: [],
    isActive: true,
    isPopular: false
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await fetchActivePricingPlans();
      setPlans(data);
    } catch (err) {
      setNotify({ open: true, message: 'Error loading plans', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const refreshSingleTier = async (tier) => {
    setRefreshing(tier);
    try {
      const updatedPlan = await fetchPlanDetailsByTier(tier);
      setPlans(prev => {
        const exists = prev.find(p => p.tier === tier);
        if (exists) return prev.map(p => p.tier === tier ? updatedPlan : p);
        return [...prev, updatedPlan];
      });
      setNotify({ open: true, message: `${tier} updated`, severity: 'info' });
    } catch (err) {
      setNotify({ open: true, message: 'Refresh failed', severity: 'error' });
    } finally {
      setRefreshing(null);
    }
  };

  const handleUpdateField = (tier, field, value) => {
    setPlans(prev => prev.map(p => p.tier === tier ? { ...p, [field]: value } : p));
  };

  const handleFeatureAdd = (tier, feature, isNew = false) => {
    if (!feature.trim()) return;
    if (isNew) {
        setNewPlan(prev => ({ ...prev, features: [...prev.features, feature] }));
        return;
    }
    setPlans(prev => prev.map(p => 
      p.tier === tier ? { ...p, features: [...(p.features || []), feature] } : p
    ));
  };

  const handleFeatureRemove = (tier, index, isNew = false) => {
    if (isNew) {
        setNewPlan(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
        return;
    }
    setPlans(prev => prev.map(p => 
      p.tier === tier ? { ...p, features: p.features.filter((_, i) => i !== index) } : p
    ));
  };

  const onSave = async (plan, isNewRequest = false) => {
    setSaving(plan.tier);
    try {
      await updatePlanConfig(plan);
      setNotify({ open: true, message: `${plan.displayName} saved!`, severity: 'success' });
      if (isNewRequest) {
        setIsAdding(false);
        setNewPlan({ tier: '', displayName: '', monthlyPrice: 0, yearlyPrice: 0, maxSalesPerMonth: 0, maxItems: 0, maxStaffUsers: 0, features: [], isActive: true, isPopular: false });
      }
      refreshSingleTier(plan.tier);
    } catch (err) {
      setNotify({ open: true, message: 'Save failed.', severity: 'error' });
    } finally {
      setSaving(null);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress sx={{ color: '#ef4444' }} thickness={5} />
    </Box>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: 'white' }}>
            Plan Master Control
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            Configure live pricing and system limits for the VyaparSathi ecosystem
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <Button 
            startIcon={<AddIcon />} 
            onClick={() => setIsAdding(true)}
            sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 800, '&:hover': { bgcolor: '#0ea5e9'} }}
            variant="contained"
            >
            Add Plan
            </Button>
            <Button 
            startIcon={<RefreshIcon />} 
            onClick={loadPlans}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
            variant="outlined"
            >
            Reload All
            </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* NEW PLAN FORM CARD */}
        {isAdding && (
            <Grid item xs={12} lg={4}>
                <Zoom in={true}>
                    <Card sx={{ bgcolor: '#0f172a', color: 'white', borderRadius: 5, border: '2px dashed #38bdf8' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="h6" sx={{ color: '#38bdf8', fontWeight: 900 }}>NEW PLAN</Typography>
                                    <IconButton onClick={() => setIsAdding(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                                </Stack>
                                <TextField
                                    select label="Tier Type" fullWidth
                                    value={newPlan.tier}
                                    onChange={(e) => setNewPlan({...newPlan, tier: e.target.value})}
                                    sx={{ '& label': { color: '#38bdf8' }, '& .MuiInputBase-root': { color: 'white' } }}
                                >
                                    {TIER_OPTIONS.filter(t => !plans.some(p => p.tier === t)).map(opt => (
                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label="Display Name" fullWidth
                                    value={newPlan.displayName}
                                    onChange={(e) => setNewPlan({...newPlan, displayName: e.target.value})}
                                    sx={{ '& label': { color: 'white' }, '& input': { color: 'white' } }}
                                />
                                <Button 
                                    variant="contained" fullWidth 
                                    onClick={() => onSave(newPlan, true)}
                                    disabled={!newPlan.tier || !newPlan.displayName}
                                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 900 }}
                                >
                                    INITIALIZE PLAN
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Zoom>
            </Grid>
        )}

        {plans.map((plan) => (
          <Grid item xs={12} lg={4} key={plan.tier}>
            <Zoom in={true}>
              <Card sx={{ 
                bgcolor: '#1e293b', color: 'white', borderRadius: 5, 
                border: plan.isPopular ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                position: 'relative', overflow: 'visible'
              }}>
                {plan.isPopular && (
                  <Chip 
                    icon={<MagicIcon style={{ color: '#1e293b', fontSize: '1rem' }} />}
                    label="MOST POPULAR" 
                    sx={{ position: 'absolute', top: -14, left: 24, bgcolor: '#fbbf24', fontWeight: 900, color: '#1e293b' }} 
                  />
                )}
                
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="overline" sx={{ color: '#38bdf8', fontWeight: 900 }}>
                          {plan.tier}
                        </Typography>
                        <TextField
                          fullWidth
                          variant="standard"
                          value={plan.displayName || ''}
                          onChange={(e) => handleUpdateField(plan.tier, 'displayName', e.target.value)}
                          sx={{ input: { color: 'white', fontSize: '1.75rem', fontWeight: 900 } }}
                        />
                      </Box>
                      <IconButton 
                        onClick={() => refreshSingleTier(plan.tier)} 
                        disabled={refreshing === plan.tier}
                        sx={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {refreshing === plan.tier ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
                      </IconButton>
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Monthly Price"
                          type="number"
                          fullWidth
                          value={plan.monthlyPrice || 0}
                          onChange={(e) => handleUpdateField(plan.tier, 'monthlyPrice', parseFloat(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: '#4ade80' }}>₹</InputAdornment> }}
                          sx={{ '& label': { color: 'rgba(255,255,255,0.5)' }, '& input': { color: 'white' } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Yearly Price"
                          type="number"
                          fullWidth
                          value={plan.yearlyPrice || 0}
                          onChange={(e) => handleUpdateField(plan.tier, 'yearlyPrice', parseFloat(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: '#fbbf24' }}>₹</InputAdornment> }}
                          sx={{ '& label': { color: 'rgba(255,255,255,0.5)' }, '& input': { color: 'white' } }}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', p: 2, borderRadius: 3, border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 900, mb: 1, display: 'block', letterSpacing: 1 }}>
                        SYSTEM CONSTRAINTS
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Max Sales / Month"
                          size="small"
                          type="number"
                          value={plan.maxSalesPerMonth || 0}
                          onChange={(e) => handleUpdateField(plan.tier, 'maxSalesPerMonth', parseInt(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start"><SalesIcon sx={{ color: '#818cf8', fontSize: 18 }} /></InputAdornment> }}
                          sx={{ '& label': { color: 'rgba(255,255,255,0.4)' }, '& input': { color: 'white' } }}
                        />
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Max Items"
                            size="small"
                            type="number"
                            value={plan.maxItems || 0}
                            onChange={(e) => handleUpdateField(plan.tier, 'maxItems', parseInt(e.target.value))}
                            InputProps={{ startAdornment: <InputAdornment position="start"><ItemsIcon sx={{ color: '#f472b6', fontSize: 18 }} /></InputAdornment> }}
                            sx={{ '& label': { color: 'rgba(255,255,255,0.4)' }, '& input': { color: 'white' } }}
                          />
                          <TextField
                            label="Max Staff"
                            size="small"
                            type="number"
                            value={plan.maxStaffUsers || 0}
                            onChange={(e) => handleUpdateField(plan.tier, 'maxStaffUsers', parseInt(e.target.value))}
                            InputProps={{ startAdornment: <InputAdornment position="start"><PeopleIcon sx={{ color: '#2dd4bf', fontSize: 18 }} /></InputAdornment> }}
                            sx={{ '& label': { color: 'rgba(255,255,255,0.4)' }, '& input': { color: 'white' } }}
                          />
                        </Stack>
                      </Stack>
                    </Box>

                    <Paper sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 3 }}>
                      <Stack direction="row" justifyContent="space-around">
                        <FormControlLabel
                          control={<Switch size="small" checked={plan.isPopular || false} onChange={(e) => handleUpdateField(plan.tier, 'isPopular', e.target.checked)} color="warning" />}
                          label={<Typography variant="caption" fontWeight={700}>POPULAR</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch size="small" checked={plan.isActive || false} onChange={(e) => handleUpdateField(plan.tier, 'isActive', e.target.checked)} color="success" />}
                          label={<Typography variant="caption" fontWeight={700}>ACTIVE</Typography>}
                        />
                      </Stack>
                    </Paper>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, color: '#38bdf8' }}>Features List</Typography>
                      <TextField
                        placeholder="Add feature..."
                        fullWidth size="small"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleFeatureAdd(plan.tier, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, '& input': { color: 'white' } }}
                      />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 60 }}>
                        {plan.features?.map((f, i) => (
                          <Chip 
                            key={i} label={f} onDelete={() => handleFeatureRemove(plan.tier, i)}
                            sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 600 }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Button
                      fullWidth variant="contained"
                      disabled={saving === plan.tier}
                      onClick={() => onSave(plan)}
                      startIcon={saving === plan.tier ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      sx={{ 
                        py: 1.5, borderRadius: 3, fontWeight: 900,
                        bgcolor: '#4ade80', color: '#064e3b',
                        '&:hover': { bgcolor: '#22c55e' }
                      }}
                    >
                      {saving === plan.tier ? "SAVING..." : "UPDATE PLAN"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      <Snackbar 
        open={notify.open} autoHideDuration={3000} 
        onClose={() => setNotify({ ...notify, open: false })}
      >
        <Alert severity={notify.severity} sx={{ borderRadius: 3, fontWeight: 700 }}>{notify.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PlanConfigManager;