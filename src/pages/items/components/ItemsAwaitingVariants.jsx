import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Box,
  alpha
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function ItemsAwaitingVariants({
  itemsWithoutVariants,
  handleManageItem,
}) {
  const { t } = useTranslation();

  if (!itemsWithoutVariants?.length) {
    return null;
  }

  return (
    <Accordion 
      elevation={0}
      sx={{ 
        mb: 4, 
        borderRadius: '16px !important', 
        border: '1px solid #fde68a',
        bgcolor: '#fffbeb', // Soft amber warning background
        overflow: 'hidden',
        '&:before': { display: 'none' }, // Removes default MUI accordion line
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: '#b45309' }} />}
        sx={{ px: 3, py: 0.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            bgcolor: '#fef3c7', 
            p: 1, 
            borderRadius: 2, 
            display: 'flex',
            color: '#b45309'
          }}>
            <WarningAmberIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="#92400e">
              {t('itemsPage.awaitingVariants.title')}
            </Typography>
            <Typography variant="caption" color="#b45309" sx={{ display: 'block', mt: -0.5 }}>
              {t('itemsPage.awaitingVariants.description')}
            </Typography>
          </Box>
          <Chip
            label={`${itemsWithoutVariants.length} ${t('itemsPage.title', 'Items')}`}
            sx={{ 
              ml: 1, 
              bgcolor: '#f59e0b', 
              color: 'white', 
              fontWeight: 900,
              height: 24,
              fontSize: '0.75rem'
            }}
          />
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
        <Divider sx={{ borderColor: '#fde68a' }} />
        <List dense disablePadding>
          {itemsWithoutVariants.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem
                sx={{ 
                  px: 3, 
                  py: 2,
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: '#fffbf0' }
                }}
                secondaryAction={
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleManageItem(item.id)}
                    sx={{ 
                      borderRadius: 2, 
                      fontWeight: 700, 
                      textTransform: 'none',
                      bgcolor: '#92400e',
                      '&:hover': { bgcolor: '#78350f' }
                    }}
                  >
                    {t('itemsPage.actions.manage', 'Complete Setup')}
                  </Button>
                }
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                      {item.name}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={item.categoryName || t('itemsPage.notAvailable', 'N/A')} 
                        size="small" 
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        {t('itemsPage.awaitingVariants.brand')}: <strong>{item.brandName || 'N/A'}</strong>
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              {index < itemsWithoutVariants.length - 1 && (
                <Divider component="li" sx={{ borderColor: '#f1f5f9' }} />
              )}
            </React.Fragment>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}