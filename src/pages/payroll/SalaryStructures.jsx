import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, CardActions, Dialog,
  Grid, Skeleton, Stack, Alert, Snackbar, Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { fetchSalaryStructures, createSalaryStructure } from '../../services/api';
import SalaryStructureBuilder from './components/SalaryStructureBuilder';

export default function SalaryStructures() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openBuilder, setOpenBuilder] = useState(false);

  const loadStructures = async () => {
    try {
      setLoading(true);
      const data = await fetchSalaryStructures(0, 50);
      setStructures(data.content || []);
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to load structures',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructures();
  }, []);

  const handleCreateStructure = async (structureData) => {
    try {
      await createSalaryStructure(structureData);
      setToast({ open: true, message: 'Salary structure created successfully', severity: 'success' });
      setOpenBuilder(false);
      loadStructures();
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to create structure',
        severity: 'error'
      });
    }
  };

  if (loading && structures.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} height={200} sx={{ mb: 2, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <h2>Salary Structures</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenBuilder(true)}
        >
          Create Structure
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {structures.map(structure => (
          <Grid item xs={12} sm={6} md={4} key={structure.id}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <h3>{structure.structureName}</h3>
                <p style={{ color: '#999', marginBottom: '12px' }}>
                  Code: <strong>{structure.structureCode}</strong>
                </p>
                {structure.description && (
                  <p style={{ fontSize: '14px', marginBottom: '12px' }}>
                    {structure.description}
                  </p>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Chip
                    size="small"
                    label={`${structure.components?.length || 0} Components`}
                    variant="outlined"
                  />
                  {structure.isActive && (
                    <Chip size="small" label="Active" color="success" />
                  )}
                </Stack>
              </CardContent>
              <CardActions>
                <Button size="small">View Details</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {structures.length === 0 && (
        <Alert severity="info">
          No salary structures created yet. Click "Create Structure" to get started.
        </Alert>
      )}

      {/* Salary Structure Builder Dialog */}
      {openBuilder && (
        <SalaryStructureBuilder
          open={openBuilder}
          onClose={() => setOpenBuilder(false)}
          onSubmit={handleCreateStructure}
        />
      )}

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}