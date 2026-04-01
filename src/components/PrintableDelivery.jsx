import React from 'react';
import { Box, Typography, Divider, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const PrintableDelivery = React.forwardRef((props, ref) => {
  const { delivery } = props;
  const { t } = useTranslation();

  return (
    <Box component="div" ref={ref} sx={{ p: 4, color: 'black', minHeight: 200, bgcolor: 'white' }}>
      {delivery ? (
        <>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('printableDelivery.title')}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {t('printableDelivery.orderNumber')} {delivery.invoiceNumber || delivery.saleId}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {t('printableDelivery.customerDetails')}:
              </Typography>
              <Typography sx={{ fontWeight: 500 }}>
                {delivery.customerName || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                {delivery.deliveryAddress}
              </Typography>
              <Typography variant="body2">
                {delivery.customerPhone}
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                ID:
              </Typography>
              <Typography variant="body2">{delivery.deliveryId}</Typography>
              
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
                {t('printableDelivery.date')}:
              </Typography>
              <Typography variant="body2">
                {dayjs(delivery.createdAt).format('DD MMM YYYY')}
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              <b>{t('printableDelivery.deliveryCharge')}:</b> ₹{delivery.deliveryCharge || 0} 
              {delivery.deliveryPaidBy && ` (Paid by ${delivery.deliveryPaidBy})`}
            </Typography>
            
            {delivery.deliveryNotes && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <b>Notes:</b> {delivery.deliveryNotes}
              </Typography>
            )}
            
            {delivery.deliveryPerson && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <b>{t('printableDelivery.agentDetails')}:</b> {delivery.deliveryPerson.name} ({delivery.deliveryPerson.phone})
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid #eee' }}>
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 1 }}>
                  Received By:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 1 }}>
                  Date / Time:
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 4, color: 'gray' }}>
            {t('printableDelivery.footer')}
          </Typography>
        </>
      ) : (
        <Typography variant="h6" color="gray" textAlign="center">
          {t('deliveryPage.tableNoResults')}
        </Typography>
      )}
    </Box>
  );
});

export default PrintableDelivery;