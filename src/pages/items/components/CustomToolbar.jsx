import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid';
import { Box } from '@mui/material';

/**
 * Grid-native toolbar that only exposes the built-in view controls
 * (columns / filter / density). Search + Add live on the parent page
 * toolbar so this row stays compact and doesn't duplicate affordances.
 */
export default function CustomToolbar() {
  const { t } = useTranslation();

  return (
    <GridToolbarContainer
      sx={{
        px: 1.5, py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <GridToolbarFilterButton
        label={t('itemsPage.toolbar.filter')}
        sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}
      />
      <GridToolbarColumnsButton
        label={t('itemsPage.toolbar.columns')}
        sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}
      />
      <GridToolbarDensitySelector
        label={t('itemsPage.toolbar.density')}
        sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}
      />
      <Box sx={{ flex: 1 }} />
    </GridToolbarContainer>
  );
}
