import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Grid, Box, Chip, Card, CardContent, CardHeader
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const COMPONENT_TYPES = ['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION'];
const CALCULATION_TYPES = ['FLAT_AMOUNT', 'PERCENTAGE_OF_BASIC', 'PERCENTAGE_OF_GROSS', 'FORMULA'];
const PREDEFINED_COMPONENTS = [
  { name: 'Basic Salary', code: 'BASIC', type: 'EARNING', calculationType: 'FLAT_AMOUNT', isStatutory: false },
  { name: 'HRA', code: 'HRA', type: 'EARNING', calculationType: 'PERCENTAGE_OF_BASIC', isStatutory: false },
  { name: 'Dearness Allowance', code: 'DA', type: 'EARNING', calculationType: 'PERCENTAGE_OF_BASIC', isStatutory: false },
  { name: 'Conveyance', code: 'CONVEYANCE', type: 'EARNING', calculationType: 'FLAT_AMOUNT', isStatutory: false },
  { name: 'Special Allowance', code: 'SPECIAL_ALLOW', type: 'EARNING', calculationType: 'FLAT_AMOUNT', isStatutory: false },
  { name: 'Employee PF', code: 'EPF_EE', type: 'DEDUCTION', calculationType: 'PERCENTAGE_OF_BASIC', isStatutory: true },
  { name: 'Employee ESI', code: 'ESI_EE', type: 'DEDUCTION', calculationType: 'PERCENTAGE_OF_GROSS', isStatutory: true },
  { name: 'Professional Tax', code: 'PT', type: 'DEDUCTION', calculationType: 'FLAT_AMOUNT', isStatutory: true },
  { name: 'Income Tax', code: 'TDS', type: 'DEDUCTION', calculationType: 'FLAT_AMOUNT', isStatutory: true },
  { name: 'Employer PF', code: 'EPF_ER', type: 'EMPLOYER_CONTRIBUTION', calculationType: 'PERCENTAGE_OF_BASIC', isStatutory: true },
  { name: 'Employer ESI', code: 'ESI_ER', type: 'EMPLOYER_CONTRIBUTION', calculationType: 'PERCENTAGE_OF_GROSS', isStatutory: true },
];

export default function SalaryStructureBuilder({ open, onClose, onSubmit }) {
  const [structureName, setStructureName] = useState('');
  const [structureCode, setStructureCode] = useState('');
  const [description, setDescription] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [components, setComponents] = useState([]);
  const [newComponent, setNewComponent] = useState({
    name: '',
    code: '',
    type: 'EARNING',
    calculationType: 'FLAT_AMOUNT',
    value: '0',
    isTaxable: true,
    affectsPF: true,
    affectsESI: true,
  });

  const addComponent = () => {
    if (!newComponent.name || !newComponent.code) {
      alert('Component name and code are required');
      return;
    }

    setComponents([...components, { ...newComponent, orderSequence: components.length }]);
    setNewComponent({
      name: '',
      code: '',
      type: 'EARNING',
      calculationType: 'FLAT_AMOUNT',
      value: '0',
      isTaxable: true,
      affectsPF: true,
      affectsESI: true,
    });
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const addPredefinedComponent = (component) => {
    const alreadyExists = components.find(c => c.code === component.code);
    if (alreadyExists) {
      alert(`${component.name} is already added`);
      return;
    }

    setComponents([
      ...components,
      {
        componentName: component.name,
        componentCode: component.code,
        componentType: component.type,
        calculationType: component.calculationType,
        calculationValue: 0,
        isTaxable: component.type !== 'EMPLOYER_CONTRIBUTION',
        affectsPF: component.code.includes('BASIC') || component.code.includes('DA'),
        affectsESI: component.code.includes('GROSS'),
        isStatutory: component.isStatutory,
        isActive: true,
        orderSequence: components.length,
      }
    ]);
  };

  const handleSubmit = () => {
    if (!structureName || !structureCode) {
      alert('Structure name and code are required');
      return;
    }

    if (components.length === 0) {
      alert('Add at least one component');
      return;
    }

    const payload = {
      structureName,
      structureCode,
      description,
      effectiveFrom,
      isActive: true,
      components: components.map((c, idx) => ({
        ...c,
        orderSequence: idx,
      })),
    };

    onSubmit(payload);
  };

  const totalEarnings = components
    .filter(c => c.componentType === 'EARNING' || c.componentType === 'componentType' === 'EARNING')
    .length;
  const totalDeductions = components
    .filter(c => (c.componentType === 'DEDUCTION' || c.type === 'DEDUCTION'))
    .length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create Salary Structure</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Structure Name"
              value={structureName}
              onChange={(e) => setStructureName(e.target.value)}
              placeholder="e.g., Grade A Full-Time"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Structure Code"
              value={structureCode}
              onChange={(e) => setStructureCode(e.target.value.toUpperCase())}
              placeholder="e.g., GRADE_A_FT"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Effective From"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </Grid>
        </Grid>

        {/* Predefined Components */}
        <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
          <CardHeader
            title="Quick Add: Predefined Components"
            subheader="Click to add common salary components"
          />
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {PREDEFINED_COMPONENTS.map(comp => (
                <Chip
                  key={comp.code}
                  label={comp.name}
                  onClick={() => addPredefinedComponent(comp)}
                  clickable
                  variant="outlined"
                  size="small"
                  color={comp.type === 'EARNING' ? 'success' : 'error'}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Add Custom Component */}
        <Card sx={{ mb: 3, border: '1px dashed #ccc' }}>
          <CardHeader title="Add Custom Component" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Component Name"
                  value={newComponent.name}
                  onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Component Code"
                  value={newComponent.code}
                  onChange={(e) => setNewComponent({ ...newComponent, code: e.target.value.toUpperCase() })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Type"
                  value={newComponent.type}
                  onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value })}
                >
                  {COMPONENT_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Calculation Type"
                  value={newComponent.calculationType}
                  onChange={(e) => setNewComponent({ ...newComponent, calculationType: e.target.value })}
                >
                  {CALCULATION_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Value (% or Amount)"
                  type="number"
                  value={newComponent.value}
                  onChange={(e) => setNewComponent({ ...newComponent, value: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addComponent}
                  fullWidth
                >
                  Add Component
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Components List */}
        {components.length > 0 && (
          <>
            <h3>Selected Components ({totalEarnings} Earnings, {totalDeductions} Deductions)</h3>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Component</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Calculation</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {components.map((comp, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{comp.componentName || comp.name}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={comp.componentType || comp.type}
                          color={comp.componentType === 'EARNING' || comp.type === 'EARNING' ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{comp.calculationType || comp.calculationType}</TableCell>
                      <TableCell>{comp.calculationValue || comp.value}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeComponent(idx)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Create Structure
        </Button>
      </DialogActions>
    </Dialog>
  );
}