import React from 'react';
import { Box, Typography, Divider, Grid } from '@mui/material';
import dayjs from 'dayjs';

const PrintableDelivery = React.forwardRef((props, ref) => {
  const { delivery } = props;

  return (
    <Box component="div" ref={ref} sx={{ p: 4 , color: 'black', minHeight: 200 }}>
      {delivery ? (
        <>
          <Typography variant="h5" gutterBottom>
            Delivery Slip
          </Typography>
          <Typography variant="h6" gutterBottom>
            Order #{delivery.invoiceNumber}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Delivery To:</Typography>
              <Typography>{delivery.customerName || 'N/A'}</Typography>
              <Typography>{delivery.deliveryAddress}</Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Delivery ID:</Typography>
              <Typography>{delivery.deliveryId}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>Date:</Typography>
              <Typography>{dayjs(delivery.createdAt).format('DD MMM YYYY')}</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography><b>Charge:</b> ₹{delivery.deliveryCharge || 0} (Paid by {delivery.deliveryPaidBy})</Typography>
          {delivery.deliveryNotes && <Typography><b>Notes:</b> {delivery.deliveryNotes}</Typography>}
          {delivery.deliveryPerson && (
            <Typography sx={{ mt: 1 }}>
              <b>Assigned To:</b> {delivery.deliveryPerson.name} ({delivery.deliveryPerson.phone})
            </Typography>
          )}
          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #ccc' }}>
            <Typography>Received By: _________________________</Typography>
            <Typography sx={{ mt: 2 }}>Date / Time: _________________________</Typography>
          </Box>
        </>
      ) : (
        <Typography variant="h6" color="gray">No delivery selected.</Typography>
      )}
    </Box>
  );
});

export default PrintableDelivery;