import React from 'react';
import { Grid, Box, Typography, Skeleton } from '@mui/material';
import PurchaseOrderCard from './PurchaseOrderCard';

const PurchaseOrderList = ({ isLoading, orders, allSuppliers, onView, onEdit, onDelete, onReceive }) => {
  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {Array.from(new Array(6)).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {orders.map((po) => {
        const supplier = allSuppliers.find((s) => String(s.id) === String(po.supplierId));
        return (
          <Grid item xs={12} sm={6} md={4} key={po.id}>
            <PurchaseOrderCard
              po={po}
              supplier={supplier}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onReceive={onReceive}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default PurchaseOrderList;