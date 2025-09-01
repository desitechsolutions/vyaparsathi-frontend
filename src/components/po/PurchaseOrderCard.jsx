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
      size="small"
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
      borderLeft: '5px solid',
      borderColor: 'primary.main',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'scale(1.03)',
        boxShadow: 6,
      }
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" fontWeight="bold">
            PO: {po.poNumber}
          </Typography>
          {getStatusChip(po.status)}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Supplier: <strong>{supplier?.name || 'N/A'}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Order Date: {new Date(po.orderDate).toLocaleDateString()}
        </Typography>
        <Typography variant="h6" mt={1}>
          ₹{Number(po.totalAmount || 0).toFixed(2)}
        </Typography>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Tooltip title="View">
          <IconButton color="info" onClick={() => onView(po)} size="small">
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton color="secondary" onClick={() => onEdit(po)} size="small" disabled={!canEdit}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" onClick={() => onDelete(po.id)} size="small" disabled={!canDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
        {canSubmit && (
          <Tooltip title="Submit PO (cannot edit after submit)">
            <IconButton color="primary" onClick={() => onSubmit(po)} size="small">
              <SendIcon />
            </IconButton>
          </Tooltip>
        )}
        {canReceive && (
          <Tooltip title="Go to Receiving">
            <IconButton color="success" onClick={() => onGoToReceiving(po.id)} size="small">
              <CheckCircleIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default PurchaseOrderCard;