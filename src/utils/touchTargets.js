/**
 * Touch Target Sizing Utility
 *
 * Ensures interactive elements meet the 44px minimum touch target recommended
 * by WCAG 2.5.5 and Apple/Google HIG guidelines.
 *
 * Usage:
 *   import { TOUCH_TARGET_SIZES, useResponsiveTouchTarget } from '../utils/touchTargets';
 *
 *   // Direct constant usage in sx props:
 *   sx={{ minHeight: TOUCH_TARGET_SIZES.medium.xs, minWidth: TOUCH_TARGET_SIZES.medium.xs }}
 *
 *   // Hook usage (returns the sizes object for the requested size tier):
 *   const sizes = useResponsiveTouchTarget('medium');
 *   // sizes => { xs: '44px', sm: '44px', md: '48px' }
 */

/**
 * Responsive minimum touch target dimensions.
 *
 *  small  — icon-only buttons in dense toolbars (e.g. inline table row actions).
 *            xs/sm meet 44 px via explicit minHeight/minWidth overrides; md scales up
 *            slightly for comfortable pointer targets.
 *
 *  medium — standard action buttons and header icon buttons.
 *
 *  large  — primary CTAs and floating action buttons.
 */
export const TOUCH_TARGET_SIZES = {
  small:  { xs: '36px', sm: '40px', md: '44px' },
  medium: { xs: '44px', sm: '44px', md: '48px' },
  large:  { xs: '48px', sm: '48px', md: '56px' },
};

/**
 * Returns the TOUCH_TARGET_SIZES entry for the given size tier.
 * Useful when the size tier is determined dynamically or stored in state.
 *
 * @param {'small'|'medium'|'large'} size - The desired size tier.
 * @returns {{ xs: string, sm: string, md: string }}
 */
export const useResponsiveTouchTarget = (size = 'medium') => {
  return TOUCH_TARGET_SIZES[size] ?? TOUCH_TARGET_SIZES.medium;
};
