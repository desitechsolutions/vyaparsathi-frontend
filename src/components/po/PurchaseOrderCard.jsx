import React from 'react';
import { Card, CardContent, CardActions, Typography, Chip, Divider, IconButton, Tooltip, Box } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

const getStatusChip = (status) => {
  const colorMap = {
    Pending: 'warning',
    Received: 'success',
    Cancelled: 'error',
  };
  return <Chip label={status || 'Unknown'} color={colorMap[status] || 'default'} size="small" />;
};

const PurchaseOrderCard = ({ po, supplier, onView, onEdit, onDelete, onReceive }) => {
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
          <IconButton color="secondary" onClick={() => onEdit(po)} size="small" disabled={po.status !== 'Pending'}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" onClick={() => onDelete(po.id)} size="small" disabled={po.status !== 'Pending'}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
        {po.status === 'Pending' && (
          <Tooltip title="Mark as Received">
            <IconButton color="success" onClick={() => onReceive(po.id)} size="small">
              <CheckCircleIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default PurchaseOrderCard;