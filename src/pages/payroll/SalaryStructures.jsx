import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Skeleton, Stack, Alert, Snackbar, Chip, Typography, TextField, Divider, IconButton,
  Collapse, Paper, LinearProgress, Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { fetchSalaryStructures, createSalaryStructure, updateSalaryStructure, addComponentToStructure } from '../../services/api';

const COMPONENT_TYPES = ['BASIC', 'HRA', 'ALLOWANCE', 'BONUS', 'REIMBURSEMENT', 'PF', 'ESIC', 'PT', 'TDS', 'LOAN_EMI', 'ADVANCE'];
const CALC_TYPES = ['FIXED', 'PERCENTAGE_OF_BASIC', 'PERCENTAGE_OF_GROSS', 'PERCENTAGE_OF_CTC'];

function StructureFormDialog({ open, onClose, onSubmit, initial = null }) {
  const [form, setForm] = useState({ structureName: '', structureCode: '', description: '', isActive: true, ...initial });
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{initial ? 'Edit Structure' : 'Create Salary Structure'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Structure Name" value={form.structureName} onChange={set('structureName')} fullWidth required />
          <TextField label="Structure Code" value={form.structureCode} onChange={set('structureCode')} fullWidth required
            helperText="Short code used in reports e.g. MGR-L2" />
          <TextField label="Description" value={form.description || ''} onChange={set('description')} fullWidth multiline rows={2} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(form)}
          disabled={!form.structureName || !form.structureCode}>
          {initial ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ComponentFormDialog({ open, onClose, onSubmit, structureName }) {
  const [form, setForm] = useState({ componentName: '', componentCode: '', componentType: 'BASIC', calculationType: 'FIXED', amount: '', percentage: '', isTaxable: false, isEmployeeContribution: false, isEmployerContribution: false });
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Component to "{structureName}"</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Component Name" value={form.componentName} onChange={set('componentName')} fullWidth required />
          <TextField label="Component Code" value={form.componentCode} onChange={set('componentCode')} fullWidth required />
          <TextField label="Component Type" select value={form.componentType} onChange={set('componentType')} fullWidth SelectProps={{ native: true }}>
            {COMPONENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </TextField>
          <TextField label="Calculation Type" select value={form.calculationType} onChange={set('calculationType')} fullWidth SelectProps={{ native: true }}>
            {CALC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </TextField>
          {form.calculationType === 'FIXED' && (
            <TextField label="Amount (₹)" type="number" value={form.amount} onChange={set('amount')} fullWidth />
          )}
          {form.calculationType !== 'FIXED' && (
            <TextField label="Percentage (%)" type="number" value={form.percentage} onChange={set('percentage')} fullWidth />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(form)}
          disabled={!form.componentName || !form.componentCode}>
          Add Component
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StructureCard({ structure, onEdit, onAddComponent }) {
  const [expanded, setExpanded] = useState(false);
  const components = structure.components || [];
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>{structure.structureName}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{structure.structureCode}</Typography>
          </Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {structure.isActive
              ? <Chip size="small" label="Active" color="success" icon={<ActiveIcon sx={{ fontSize: 14 }} />} />
              : <Chip size="small" label="Inactive" color="default" icon={<InactiveIcon sx={{ fontSize: 14 }} />} />
            }
            <Tooltip title="Edit structure">
              <IconButton size="small" onClick={() => onEdit(structure)}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {structure.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>{structure.description}</Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Chip size="small" label={`${components.length} Component${components.length !== 1 ? 's' : ''}`} variant="outlined" />
        </Stack>

        {components.length > 0 && (
          <>
            <Button
              size="small"
              onClick={() => setExpanded(e => !e)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mt: 1.5, pl: 0, fontSize: '0.75rem' }}
            >
              {expanded ? 'Hide' : 'View'} Components
            </Button>
            <Collapse in={expanded}>
              <Paper variant="outlined" sx={{ mt: 1, borderRadius: 1.5 }}>
                {components.map((comp, idx) => (
                  <Box key={comp.id || idx}>
                    {idx > 0 && <Divider />}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.5, py: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{comp.componentName}</Typography>
                        <Typography variant="caption" color="text.secondary">{comp.componentType} · {comp.calculationType?.replace(/_/g, ' ')}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>
                        {comp.calculationType === 'FIXED'
                          ? `₹${Number(comp.amount || 0).toLocaleString('en-IN')}`
                          : `${comp.percentage}%`
                        }
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Paper>
            </Collapse>
          </>
        )}
      </CardContent>
      <CardActions sx={{ px: 2, pb: 1.5 }}>
        <Button size="small" startIcon={<AddIcon />} onClick={() => onAddComponent(structure)} variant="outlined">
          Add Component
        </Button>
      </CardActions>
    </Card>
  );
}

export default function SalaryStructures() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openBuilder, setOpenBuilder] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [compDialog, setCompDialog] = useState({ open: false, structure: null });

  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  const loadStructures = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSalaryStructures(0, 50);
      setStructures(data.content || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load structures', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStructures(); }, [loadStructures]);

  const handleCreateStructure = async (formData) => {
    try {
      if (editTarget) {
        await updateSalaryStructure(editTarget.id, formData);
        showToast('Salary structure updated successfully');
      } else {
        await createSalaryStructure(formData);
        showToast('Salary structure created successfully');
      }
      setOpenBuilder(false);
      setEditTarget(null);
      loadStructures();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save structure', 'error');
    }
  };

  const handleAddComponent = async (componentData) => {
    try {
      await addComponentToStructure(compDialog.structure.id, componentData);
      showToast('Component added successfully');
      setCompDialog({ open: false, structure: null });
      loadStructures();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add component', 'error');
    }
  };

  const openEdit = (structure) => {
    setEditTarget(structure);
    setOpenBuilder(true);
  };

  if (loading && structures.length === 0) {
    return (
      <Box>
        <Skeleton height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3].map(i => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton height={200} sx={{ borderRadius: 2 }} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Salary Structures</Typography>
          <Typography variant="body2" color="text.secondary">Define CTC components, earn/deduct types and calculation rules</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditTarget(null); setOpenBuilder(true); }}>
          Create Structure
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Empty state */}
      {structures.length === 0 && !loading && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No salary structures created yet. Click "Create Structure" to get started.
        </Alert>
      )}

      {/* Structure cards */}
      <Grid container spacing={2}>
        {structures.map(structure => (
          <Grid item xs={12} sm={6} md={4} key={structure.id}>
            <StructureCard
              structure={structure}
              onEdit={openEdit}
              onAddComponent={(s) => setCompDialog({ open: true, structure: s })}
            />
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      {openBuilder && (
        <StructureFormDialog
          open={openBuilder}
          onClose={() => { setOpenBuilder(false); setEditTarget(null); }}
          onSubmit={handleCreateStructure}
          initial={editTarget}
        />
      )}

      {/* Add Component Dialog */}
      {compDialog.open && (
        <ComponentFormDialog
          open={compDialog.open}
          onClose={() => setCompDialog({ open: false, structure: null })}
          onSubmit={handleAddComponent}
          structureName={compDialog.structure?.structureName}
        />
      )}

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}