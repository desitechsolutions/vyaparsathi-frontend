import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../context/ShopContext';

const HeaderBrand = ({ onShopSwitcherOpen, hideBrandName = false }) => {
  const { t } = useTranslation();
  const { shop, shopLoading } = useShop();

  const shopDisplayName = shop?.name || 'Shop';

  return (
    <Tooltip title={shopDisplayName} placement="bottom">
      <Box
        onClick={onShopSwitcherOpen}
        role="button"
        tabIndex={0}
        aria-label={`${t('appName')} - ${shopDisplayName}. Click to switch shop.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onShopSwitcherOpen();
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          transition: 'opacity 200ms',
          '&:hover': { opacity: 0.85 },
          '&:focus': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            borderRadius: 1,
          },
          minWidth: 'fit-content',
        }}
      >
        <TrendingUpOutlinedIcon sx={{ fontSize: { xs: 28, sm: 35 }, color: 'white', flexShrink: 0 }} />

        {!hideBrandName && (
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 900,
                fontSize: '1.4rem',
                color: 'white',
                lineHeight: 1,
              }}
            >
              {t('appName')}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              title={shopDisplayName}
              sx={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: 0.5,
                maxWidth: '150px',
              }}
            >
              {shopLoading ? 'Loading...' : shopDisplayName}
            </Typography>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default HeaderBrand;
