import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import HeroSection from '../components/landing/HeroSection';
import FeaturesShowcaseSection from '../components/landing/FeaturesShowcaseSection';
import IndustrySolutionsSection from '../components/landing/IndustrySolutionsSection';
import MetricsSection from '../components/landing/MetricsSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import SecuritySection from '../components/landing/SecuritySection';
import PublicPricingSection from '../components/landing/PublicPricingSection';
import FAQSection from '../components/landing/FAQSection';
import ContactSection from '../components/landing/ContactSection';
import FinalCTASection from '../components/landing/FinalCTASection';

/**
 * LandingPage — Public marketing landing page.
 *
 * Section Order:
 * 1. Hero (dark, full-width)
 * 2. Features Showcase (bento-grid)
 * 3. Industry Solutions (tab pills)
 * 4. Metrics (dark, animated counters)
 * 5. Testimonials
 * 6. Security & Trust
 * 7. Pricing (public static)
 * 8. FAQ
 * 9. Final CTA (dark)
 *
 * Authenticated users are redirected to their dashboard.
 */
const LandingPage = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      // Redirect authenticated users to their home
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // Handle scroll-to-section when navigating via ?industry= query param
  // The hash may not fire because React Router manages navigation internally
  useEffect(() => {
    if (!user) {
      const industry = searchParams.get('industry');
      if (industry) {
        // Small timeout to allow page to render before scrolling
        const timer = setTimeout(() => {
          const el = document.getElementById('solutions');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 250);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, user]);

  // Don't render if redirecting
  if (user) return null;
  return (
    <>
      <HeroSection />
      <FeaturesShowcaseSection />
      <IndustrySolutionsSection />
      <MetricsSection />
      <TestimonialsSection />
      <SecuritySection />
      <PublicPricingSection />
      <FAQSection />
      <ContactSection />
      <FinalCTASection />
    </>
  );
};

export default LandingPage;
