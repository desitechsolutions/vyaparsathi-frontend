import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Stack, Alert, Grid,
  CircularProgress, Snackbar, Typography, Chip, MenuItem, Divider, LinearProgress
} from '@mui/material';
import { Save as SaveIcon, Check as CheckIcon } from '@mui/icons-material';
import * as api from '../../services/api';

const FINANCIAL_YEAR = '2025-26';

export default function TaxDeclaration() {
  const [declaration, setDeclaration] = useState({
    financialYear: FINANCIAL_YEAR,
    taxRegime: 'NEW_REGIME',
    section80C: { lifeInsurance: 0, ppf: 0, elss: 0, homeLoanPrincipal: 0, tuitionFees: 0, nsc: 0 },
    section80D: { selfAndFamily: 0, parents: 0 },
    section80CCD: { nps: 0 },
    housingLoan: { interestPaid: 0 },
    hra: { monthlyRent: 0, metroCity: false },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDeclaration();
  }, []);

  const fetchDeclaration = async () => {
    try {
      setLoading(true);
      const data = await api.getTaxDeclaration(FINANCIAL_YEAR);
      if (data) setDeclaration(prev => ({ ...prev, ...data }));
    } catch (err) {
      // No existing declaration — start fresh
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    if (section) {
      setDeclaration(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: Number(value) || 0 }
      }));
    } else {
      setDeclaration(prev => ({ ...prev, [field]: value }));
    }
  };

  const calc80C = () => {
    const s = declaration.section80C;
    return Math.min(
      Object.values(s).reduce((sum, v) => sum + (Number(v) || 0), 0),
      150000
    );
  };

  const calc80D = () => {
    const s = declaration.section80D;
    return Object.values(s).reduce((sum, v) => sum + (Number(v) || 0), 0);
  };

  const calcNPS = () => Math.min(Number(declaration.section80CCD?.nps) || 0, 50000);

  const totalDeductions = calc80C() + calc80D() + calcNPS() + (Number(declaration.housingLoan?.interestPaid) || 0);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await api.submitTaxDeclaration(declaration);
      setSaved(true);
      setToast({ open: true, message: 'Tax declaration submitted successfully!', severity: 'success' });
    } catch (err) {
      setToast({
        open: true,
        message: err.response?.data?.message || 'Failed to submit declaration',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Tax Declaration — FY {FINANCIAL_YEAR}</Typography>
        {saved && <Chip label="Submitted" color="success" icon={<CheckIcon />} />}
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        Declare your investments to optimize your tax liability. Used for TDS computation and Form 16 generation.
      </Alert>

      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>

      <Grid container spacing={3}>
        {/* Tax Regime */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Tax Regime</Typography>
              <TextField
                select fullWidth label="Select Regime"
                value={declaration.taxRegime}
                onChange={(e) => handleChange(null, 'taxRegime', e.target.value)}
              >
                <MenuItem value="NEW_REGIME">New Regime (Lower rates, no deductions)</MenuItem>
                <MenuItem value="OLD_REGIME">Old Regime (Higher rates, with deductions)</MenuItem>
              </TextField>
              {declaration.taxRegime === 'NEW_REGIME' && (
                <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                  Under New Regime, Section 80C/80D deductions are not applicable. Standard deduction of ₹75,000 applies.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Section 80C */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Section 80C</Typography>
                <Chip label={`Claimed: ₹${calc80C().toLocaleString('en-IN')}`} size="small"
                  color={calc80C() >= 150000 ? 'success' : 'default'} />
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Max: ₹1,50,000 per year
              </Typography>
              <Stack spacing={2}>
                {[
                  ['lifeInsurance', 'Life Insurance Premium'],
                  ['ppf', 'PPF Contribution'],
                  ['elss', 'ELSS Mutual Fund'],
                  ['homeLoanPrincipal', 'Home Loan Principal'],
                  ['tuitionFees', 'Tuition Fees'],
                  ['nsc', 'National Savings Certificate'],
                ].map(([field, label]) => (
                  <TextField key={field} label={label} type="number" size="small" fullWidth
                    value={declaration.section80C[field] || ''}
                    onChange={(e) => handleChange('section80C', field, e.target.value)}
                    disabled={declaration.taxRegime === 'NEW_REGIME'}
                    InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>₹</span> }}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Section 80D */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Section 80D — Medical Insurance</Typography>
                <Chip label={`₹${calc80D().toLocaleString('en-IN')}`} size="small" />
              </Stack>
              <Stack spacing={2}>
                <TextField label="Self & Family Premium" type="number" size="small" fullWidth
                  value={declaration.section80D.selfAndFamily || ''}
                  onChange={(e) => handleChange('section80D', 'selfAndFamily', e.target.value)}
                  disabled={declaration.taxRegime === 'NEW_REGIME'}
                  InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>₹</span> }}
                  helperText="Max ₹25,000"
                />
                <TextField label="Parents Premium" type="number" size="small" fullWidth
                  value={declaration.section80D.parents || ''}
                  onChange={(e) => handleChange('section80D', 'parents', e.target.value)}
                  disabled={declaration.taxRegime === 'NEW_REGIME'}
                  InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>₹</span> }}
                  helperText="Max ₹50,000 if senior citizen"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Section 80CCD + HRA + Housing Loan */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Other Deductions</Typography>
              <Stack spacing={2}>
                <TextField label="NPS Contribution (80CCD(1B))" type="number" size="small" fullWidth
                  value={declaration.section80CCD.nps || ''}
                  onChange={(e) => handleChange('section80CCD', 'nps', e.target.value)}
                  disabled={declaration.taxRegime === 'NEW_REGIME'}
                  InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>₹</span> }}
                  helperText="Additional max ₹50,000"
                />
                <TextField label="Home Loan Interest Paid (Sec 24)" type="number" size="small" fullWidth
                  value={declaration.housingLoan.interestPaid || ''}
                  onChange={(e) => handleChange('housingLoan', 'interestPaid', e.target.value)}
                  InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>₹</span> }}
                  helperText="Max ₹2,00,000 for self-occupied"
                />
                <TextField label="Monthly Rent Paid (HRA)" type="number" size="small" fullWidth
                  value={declaration.hra.monthlyRent || ''}
                  onChange={(e) => handleChange('hra', 'monthlyRent', e.target.value)}
                  InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>₹</span> }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Declared Deductions</Typography>
              <Stack direction="row" spacing={4} flexWrap="wrap">
                <Stack>
                  <Typography variant="caption" color="text.secondary">80C</Typography>
                  <Typography variant="h6">₹{calc80C().toLocaleString('en-IN')}</Typography>
                </Stack>
                <Stack>
                  <Typography variant="caption" color="text.secondary">80D</Typography>
                  <Typography variant="h6">₹{calc80D().toLocaleString('en-IN')}</Typography>
                </Stack>
                <Stack>
                  <Typography variant="caption" color="text.secondary">NPS</Typography>
                  <Typography variant="h6">₹{calcNPS().toLocaleString('en-IN')}</Typography>
                </Stack>
                <Stack>
                  <Typography variant="caption" color="text.secondary">Home Loan Interest</Typography>
                  <Typography variant="h6">₹{(Number(declaration.housingLoan?.interestPaid) || 0).toLocaleString('en-IN')}</Typography>
                </Stack>
                <Divider orientation="vertical" flexItem />
                <Stack>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="h5" fontWeight={700} color="success.dark">
                    ₹{totalDeductions.toLocaleString('en-IN')}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSubmit} disabled={saving}>
            {saved ? 'Update Declaration' : 'Submit Tax Declaration'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
