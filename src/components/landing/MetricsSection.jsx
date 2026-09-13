import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

// ─── Animated Counter ────────────────────────────────────────────────────────
const AnimatedCounter = ({ target, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  // Extract numeric part and suffix
  const numericStr = target.replace(/[^0-9.]/g, '');
  const numeric = parseFloat(numericStr);
  const prefix = target.startsWith('₹') ? '₹' : '';
  const suffix = target.replace(/[₹0-9.]/g, '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          let start = 0;
          const increment = numeric / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= numeric) {
              setCount(numeric);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [numeric, duration]);

  const formatCount = (n) => {
    if (numericStr.includes('.')) return n.toFixed(1);
    return Math.floor(n).toLocaleString('en-IN');
  };

  return (
    <span ref={ref}>
      {prefix}{formatCount(count)}{suffix}
    </span>
  );
};

// ─── Metrics Section ─────────────────────────────────────────────────────────
const MetricsSection = () => {
  const { t } = useTranslation();

  const metrics = [
    { key: 'businesses', color: '#60A5FA' },
    { key: 'transactions', color: '#34D399' },
    { key: 'uptime', color: '#FBBF24' },
    { key: 'languages', color: '#F472B6' },
  ];

  return (
    <Box
      sx={{
        background: '#060D1B',
        py: { xs: 10, md: 14 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.9) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 }, position: 'relative', zIndex: 1 }}>
        {/* Title */}
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            textAlign: 'center',
            fontSize: { xs: '1.8rem', md: '2.5rem' },
            letterSpacing: '-0.02em',
            mb: { xs: 6, md: 10 },
          }}
        >
          <Box component="span" sx={{ color: '#F1F5F9' }}>
            {t('landingPage.metrics.sectionTitle').split(' ').slice(0, -2).join(' ')}{' '}
          </Box>
          <Box component="span" sx={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t('landingPage.metrics.sectionTitle').split(' ').slice(-2).join(' ')}
          </Box>
        </Typography>

        {/* Metric Cards */}
        <Grid container spacing={3}>
          {metrics.map((metric, idx) => {
            const data = t(`landingPage.metrics.${metric.key}`, { returnObjects: true });
            return (
              <Grid item xs={6} md={3} key={idx}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: { xs: 3, md: 5 },
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.07)',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.06)',
                      borderColor: `${metric.color}40`,
                      transform: 'translateY(-6px)',
                      boxShadow: `0 20px 60px ${metric.color}15`,
                    }
                  }}
                >
                  {/* Accent line */}
                  <Box sx={{ width: 40, height: 3, bgcolor: metric.color, borderRadius: 2, mx: 'auto', mb: 3 }} />

                  <Typography
                    variant="h2"
                    fontWeight={900}
                    sx={{
                      color: metric.color,
                      fontSize: { xs: '2rem', md: '3rem' },
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      mb: 1.5,
                    }}
                  >
                    <AnimatedCounter target={typeof data === 'object' ? data.value : ''} />
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: '#94A3B8', fontWeight: 600, fontSize: { xs: '0.85rem', md: '1rem' } }}
                  >
                    {typeof data === 'object' ? data.label : ''}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default MetricsSection;
