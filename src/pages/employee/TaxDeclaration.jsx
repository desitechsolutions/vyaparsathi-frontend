import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Stack, Alert, Grid
} from '@mui/material';

export default function TaxDeclaration() {
  const [declaration, setDeclaration] = useState({
    financialYear: '2024-25',
    taxRegime: 'NEW_REGIME',
    lifeInsurance: 0,
    medicalInsurance: 0,
    educationExpenses: 0,
  });

  const handleChange = (field, value) => {
    setDeclaration({ ...declaration, [field]: value });
  };

  const calculateTotal = () => {
    return (parseInt(declaration.lifeInsurance || 0) + parseInt(declaration.medicalInsurance || 0) + 
            parseInt(declaration.educationExpenses || 0));
  };

  return (
    <Box>
      <h1>Tax Declaration (Section 80C/80D)</h1>
      <Alert severity="info" sx={{ mb: 3 }}>
        Declare your investments to optimize your tax liability. Used for Form 16 generation.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <h4>Section 80C Deductions (Max ₹1,50,000)</h4>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Life Insurance Premium"
                  type="number"
                  value={declaration.lifeInsurance}
                  onChange={(e) => handleChange('lifeInsurance', e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Medical Insurance"
                  type="number"
                  value={declaration.medicalInsurance}
                  onChange={(e) => handleChange('medicalInsurance', e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Education Expenses"
                  type="number"
                  value={declaration.educationExpenses}
                  onChange={(e) => handleChange('educationExpenses', e.target.value)}
                  fullWidth
                  size="small"
                />
                <div style={{ backgroundColor: '#e8f5e9', padding: '12px', borderRadius: '4px' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>Total 80C: ₹{calculateTotal().toLocaleString()}</p>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <h4>Configuration</h4>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Financial Year"
                  value={declaration.financialYear}
                  fullWidth
                  size="small"
                  disabled
                />
                <TextField
                  label="Tax Regime"
                  select
                  value={declaration.taxRegime}
                  onChange={(e) => handleChange('taxRegime', e.target.value)}
                  fullWidth
                  size="small"
                  SelectProps={{ native: true }}
                >
                  <option>NEW_REGIME</option>
                  <option>OLD_REGIME</option>
                </TextField>
                <Alert severity="info" sx={{ mt: 2 }}>
                  New Regime: Lower tax slabs but no deductions. Old Regime: ₹50k deduction + Section 80C.
                </Alert>
                <Button variant="contained" fullWidth>Submit Declaration</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
