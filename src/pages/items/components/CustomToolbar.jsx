import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { Button, Box, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function CustomToolbar({ onAddItemClick }) {
  const { t } = useTranslation();

  return (
    <GridToolbarContainer 
      sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'white',
        borderBottom: '1px solid #e2e8f0'
      }}
    >
      {/* Left side: View Controls */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <GridToolbarFilterButton 
          // Passing custom label from i18n
          label={t('itemsPage.toolbar.filter')}
          sx={{ fontWeight: 700, color: '#64748b', '& .MuiButton-startIcon': { mr: 0.5 } }} 
        />
        <GridToolbarColumnsButton 
          // Passing custom label from i18n
          label={t('itemsPage.toolbar.columns')}
          sx={{ fontWeight: 700, color: '#64748b' }} 
        />
        <GridToolbarDensitySelector 
          // Passing custom label from i18n
          label={t('itemsPage.toolbar.density')}
          sx={{ fontWeight: 700, color: '#64748b' }} 
        />
      </Box>

      {/* Right side: Search and Actions */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <GridToolbarQuickFilter
          variant="outlined"
          size="small"
          placeholder={t('itemsPage.searchPlaceholder')}
          debounceMs={300}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 2,
              bgcolor: '#f8fafc',
              fontSize: '0.875rem',
              width: { xs: '150px', sm: '250px' },
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
            }
          }}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddItemClick}
          sx={{ 
            borderRadius: 2, 
            px: 2, 
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }
          }}
        >
          {t('itemsPage.addItem')}
        </Button>
      </Box>
    </GridToolbarContainer>
  );
}