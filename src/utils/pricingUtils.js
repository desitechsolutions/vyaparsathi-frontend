// Single source of pricing-derivation logic shared by every surface that renders
// a plan price (Landing page, Pricing page, checkout). Plan data itself always
// comes from the backend (`GET /api/pricing/active`) — this file only derives
// display values (per-month rate, GST-inclusive total) from that data so the
// same plan never renders a different number in two places.

export const GST_RATE = 0.18;

export const TIER_I18N_KEY = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
};

/**
 * Mirrors the backend's PricingPlanConfig.resolveEffectivePrice(): a promo price
 * only applies while `now` falls inside [promoStartsAt, promoEndsAt). Kept as the
 * single frontend implementation of this window check so every pricing surface
 * (landing section, pricing page, billing page, admin panel) agrees on whether a
 * promo is live right now — matching what Razorpay is actually charging.
 */
export const isPromoActive = (plan, billingCycle, now = new Date()) => {
  const promoPrice = billingCycle === 'yearly' ? plan?.promoPriceYearly : plan?.promoPriceMonthly;
  if (promoPrice == null) return false;
  if (plan.promoStartsAt && now < new Date(plan.promoStartsAt)) return false;
  if (plan.promoEndsAt && now >= new Date(plan.promoEndsAt)) return false;
  return true;
};

/**
 * Derives display pricing for a plan + billing cycle.
 * @param {object} plan - PricingPlanDTO shape: { tier, monthlyPrice, yearlyPrice, ... }
 * @param {'monthly'|'yearly'} billingCycle
 */
export const computePlanPricing = (plan, billingCycle) => {
  const monthlyPrice = Number(plan?.monthlyPrice) || 0;
  const yearlyPrice = Number(plan?.yearlyPrice) || 0;
  const isEnterprise = plan?.tier === 'ENTERPRISE';
  const isFree = plan?.tier === 'FREE';

  // Enterprise plans are "Contact Sales" — no fixed price, even if the row has 0s.
  const isCustomPricing = isEnterprise && monthlyPrice === 0 && yearlyPrice === 0;

  const promoActive = !isCustomPricing && isPromoActive(plan, billingCycle);
  const effectiveMonthlyPrice = promoActive && plan?.promoPriceMonthly != null
    ? Number(plan.promoPriceMonthly)
    : monthlyPrice;
  const effectiveYearlyPrice = promoActive && plan?.promoPriceYearly != null
    ? Number(plan.promoPriceYearly)
    : yearlyPrice;

  const pricePerMonth = billingCycle === 'monthly'
    ? effectiveMonthlyPrice
    : Math.round(effectiveYearlyPrice / 12);

  const basePricePerMonth = billingCycle === 'monthly'
    ? monthlyPrice
    : Math.round(yearlyPrice / 12);

  const billingTotal = billingCycle === 'yearly' ? effectiveYearlyPrice : effectiveMonthlyPrice;
  const gstTotal = Math.round(billingTotal * (1 + GST_RATE));

  return {
    pricePerMonth,
    billingTotal,
    gstTotal,
    isFree,
    isCustomPricing,
    isPromoActive: promoActive,
    promoLabel: promoActive ? (plan?.promoLabel || null) : null,
    basePricePerMonth,
  };
};
