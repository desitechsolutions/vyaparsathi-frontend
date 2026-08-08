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
        border: '1px solid',
        borderColor: 'warning.main',
        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
        overflow: 'hidden',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'warning.main' }} />}
        sx={{ px: 3, py: 0.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.2), 
            p: 1, 
            borderRadius: 2, 
            display: 'flex',
            color: 'warning.main'
          }}>
            <WarningAmberIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary">
              {t('itemsPage.awaitingVariants.title')}
            </Typography>
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: -0.5, fontWeight: 600 }}>
              {t('itemsPage.awaitingVariants.description')}
            </Typography>
          </Box>
          <Chip
            label={`${itemsWithoutVariants.length} ${t('itemsPage.title', 'Items')}`}
            color="warning"
            sx={{ 
              ml: 1, 
              fontWeight: 900,
              height: 24,
              fontSize: '0.75rem'
            }}
          />
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0, bgcolor: 'background.paper' }}>
        <Divider sx={{ borderColor: 'warning.light' }} />
        <List dense disablePadding>
          {itemsWithoutVariants.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem
                sx={{ 
                  px: 3, 
                  py: 2,
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.04)' }
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
                      bgcolor: 'warning.dark',
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
                <Divider component="li" sx={{ borderColor: 'divider' }} />
              )}
            </React.Fragment>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}