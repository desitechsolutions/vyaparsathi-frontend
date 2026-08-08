import React from 'react';
import { Card, CardContent, CardActions, Typography, Chip, Divider, IconButton, Tooltip, Box } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon
} from '@mui/icons-material';

const getStatusChip = (status) => {
  // Normalize status for display and color mapping
  const normalized = (status || '').toUpperCase();
  const colorMap = {
    DRAFT: 'default',
    SUBMITTED: 'primary',
    PENDING: 'warning',
    'IN_PROGRESS': 'info',
    'PARTIALLY_RECEIVED': 'info',
    RECEIVED: 'success',
    CANCELLED: 'error',
  };
  // Display label
  const labelMap = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    PARTIALLY_RECEIVED: 'Partially Received',
    RECEIVED: 'Received',
    CANCELLED: 'Cancelled',
  };
  return (
    <Chip
      label={labelMap[normalized] || status || 'Unknown'}
      color={colorMap[normalized] || 'default'}
      variant={normalized === 'DRAFT' ? 'outlined' : 'filled'}
      size="small"
      sx={{ fontWeight: 800, fontSize: '0.75rem' }}
    />
  );
};

const PurchaseOrderCard = ({ po, supplier, onView, onEdit, onDelete, onGoToReceiving, onSubmit }) => {
  // Only allow edit/delete for DRAFT
  const canEdit = po.status === 'DRAFT';
  const canDelete = po.status === 'DRAFT';
  // Only allow submit for DRAFT
  const canSubmit = po.status === 'DRAFT';
  // Only allow receiving for SUBMITTED or PARTIALLY_RECEIVED
  const canReceive = po.status === 'SUBMITTED' || po.status === 'PARTIALLY_RECEIVED';

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRadius: 3,
      borderLeft: '5px solid',
      borderColor: 'primary.main',
      borderTop: '1px solid',
      borderRight: '1px solid',
      borderBottom: '1px solid',
      borderTopColor: 'divider',
      borderRightColor: 'divider',
      borderBottomColor: 'divider',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.08)',
      }
    }}>
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            PO: {po.poNumber}
          </Typography>
          {getStatusChip(po.status)}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Supplier: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{supplier?.name || 'N/A'}</Box>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Order Date: {new Date(po.orderDate).toLocaleDateString()}
        </Typography>
        <Typography variant="h6" mt={1.5} color="text.primary" fontWeight={800}>
          ₹{Number(po.totalAmount || 0).toFixed(2)}
        </Typography>
      </CardContent>
      <Divider sx={{ borderColor: 'divider' }} />
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 1, gap: 0.5 }}>
        <Tooltip title="View">
          <IconButton color="info" onClick={() => onView(po)} size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton color="secondary" onClick={() => onEdit(po)} size="small" disabled={!canEdit} sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" onClick={() => onDelete(po.id)} size="small" disabled={!canDelete} sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {canSubmit && (
          <Tooltip title="Submit PO (cannot edit after submit)">
            <IconButton color="primary" onClick={() => onSubmit(po)} size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              <SendIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {canReceive && (
          <Tooltip title="Go to Receiving">
            <IconButton color="success" onClick={() => onGoToReceiving(po.id)} size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default PurchaseOrderCard;