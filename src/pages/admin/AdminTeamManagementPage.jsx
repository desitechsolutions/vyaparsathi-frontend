import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Stack, Chip, Alert, CircularProgress,
  IconButton, Tooltip
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShieldIcon from '@mui/icons-material/Shield';
import superAdminApi from '../../services/superAdminApi';

export default function AdminTeamManagementPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('TECH_ADMIN');
  const [actionLoading, setActionLoading] = useState(false);

  // Generated Link Display Modal
  const [generatedResult, setGeneratedResult] = useState(null);

  const loadPendingInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superAdminApi.getPendingInvitations();
      setInvitations(res || []);
    } catch (err) {
      console.error("Failed to load invitations:", err);
      setError("Failed to fetch pending admin invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingInvitations();
  }, []);

  const handleCreateInvitation = async () => {
    if (!email.trim()) return;
    setActionLoading(true);
    try {
      const res = await superAdminApi.createAdminInvitation(email, role);
      setGeneratedResult(res);
      setModalOpen(false);
      setEmail('');
      loadPendingInvitations();
    } catch (err) {
      console.error("Failed to create invitation:", err);
      alert(err.response?.data?.message || "Failed to create invitation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await superAdminApi.revokeInvitation(id);
      loadPendingInvitations();
    } catch (err) {
      console.error("Revoke error:", err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Invitation token copied to clipboard!");
  };

  return (
    <Box sx={{ p: 3, color: 'text.primary' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ShieldIcon sx={{ fontSize: 36, color: 'primary.main' }} /> Platform Admin Team
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Invite and manage platform operators and RBAC assignments
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<GroupAddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none', px: 3 }}
        >
          Invite Admin Operator
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Pending Invitations Table */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          Active Single-Use Pending Invitations ({invitations.length})
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>INVITED EMAIL</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>ROLE ASSIGNED</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>EXPIRES AT</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No pending invitations. Click "Invite Admin Operator" to issue a single-use token.
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ fontWeight: 700 }}>{row.email}</TableCell>
                    <TableCell>
                      <Chip label={row.role} color="primary" size="small" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={row.status} color="warning" size="small" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {new Date(row.expiresAt).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="error" size="small" onClick={() => handleRevoke(row.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Invite Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Invite Platform Admin Operator</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Email Address"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@desitechsolutions.com"
            />
            <TextField
              select
              label="Platform Role"
              fullWidth
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="TECH_ADMIN">TECH_ADMIN (Technical Operations)</MenuItem>
              <MenuItem value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Master)</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!email.trim() || actionLoading}
            onClick={handleCreateInvitation}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Generate Single-Use Invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generated Token Result Modal */}
      {generatedResult && (
        <Dialog open={Boolean(generatedResult)} onClose={() => setGeneratedResult(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 900, color: 'success.main' }}>
            Single-Use Invitation Generated!
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Share this secure registration link with <strong>{generatedResult.email}</strong>. It expires in 48 hours and can only be used once.
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>ACCEPTANCE URL:</Typography>
              <Typography variant="body2" fontFamily="monospace" fontWeight={800} sx={{ wordBreak: 'break-all', mt: 0.5 }}>
                {`${window.location.origin}/accept-invite?token=${generatedResult.invitationToken}`}
              </Typography>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button
              startIcon={<ContentCopyIcon />}
              variant="contained"
              onClick={() => copyToClipboard(`${window.location.origin}/accept-invite?token=${generatedResult.invitationToken}`)}
            >
              Copy Invitation URL
            </Button>
            <Button onClick={() => setGeneratedResult(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
