import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * BrandMark — single source of truth for the VyaparSathi identity block
 * (logo + gradient wordmark + optional tagline).
 *
 * Used by EnterpriseHeader (marketing chrome), OnboardingLayout (post-signup
 * wizard shell) and AuthLayout (login split-screen + mobile logo). Anywhere
 * we render "VyaparSathi + logo" together, we render this — so a brand tweak
 * lands in one place instead of three.
 *
 * Design contract:
 *   - The gradient (`#F59E0B → #EF4444`) and the logo asset are the identity;
 *     they don't change per surface. Everything else (sizing, tagline, dark
 *     mode) is a prop.
 *   - Wrapped as a link by default (to home) so it doubles as a "back to home"
 *     affordance. Pass `href={null}` to render as a static block.
 *
 * Sizing tiers pick logo height + wordmark font-size together so both scale
 * in lock-step:
 *   - "sm"  — 28px logo · subtitle1 wordmark (chrome + compact bars)
 *   - "md"  — 36px logo · h6 wordmark (default; onboarding, mobile splash)
 *   - "lg"  — 44px logo · h5 wordmark (auth left panel, hero placements)
 *
 * The `variant` prop switches tagline color for dark surfaces (auth left
 * panel gradient). Wordmark stays gradient in both — the gradient reads
 * well on light and dark backgrounds.
 */
const SIZE_TIERS = {
  sm: { logoHeight: 28, wordmarkVariant: 'subtitle1', taglineFontSize: '0.65rem' },
  md: { logoHeight: 36, wordmarkVariant: 'h6',       taglineFontSize: '0.7rem' },
  lg: { logoHeight: 44, wordmarkVariant: 'h5',       taglineFontSize: '0.75rem' },
};

const BrandMark = ({
  size = 'md',
  variant = 'default',      // 'default' (light bg) | 'dark' (dark bg)
  showWordmark = true,       // false = logo image only (used by marketing header)
  showTagline = true,
  tagline = 'Business ERP Platform',
  href = '/',
  sx,
  logoSrc = '/desitechsolution.png',
  logoAlt = 'VyaparSathi',
  wordmark = 'VyaparSathi',
}) => {
  const tier = SIZE_TIERS[size] || SIZE_TIERS.md;
  const isDark = variant === 'dark';

  const inner = (
    <>
      <img
        src={logoSrc}
        alt={logoAlt}
        style={{ height: tier.logoHeight, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
      />
      {showWordmark && (
        <Box>
          <Typography
            variant={tier.wordmarkVariant}
            sx={{
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.25px',
              background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {wordmark}
          </Typography>
          {showTagline && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.25,
                fontSize: tier.taglineFontSize,
                fontWeight: 600,
                color: isDark ? 'rgba(255,255,255,0.65)' : 'text.secondary',
              }}
            >
              {tagline}
            </Typography>
          )}
        </Box>
      )}
    </>
  );

  const wrapperSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1.5,
    textDecoration: 'none',
    color: 'inherit',
    ...sx,
  };

  if (!href) {
    return <Box sx={wrapperSx}>{inner}</Box>;
  }

  return (
    <Box component={RouterLink} to={href} sx={wrapperSx} aria-label={wordmark}>
      {inner}
    </Box>
  );
};

export default BrandMark;
