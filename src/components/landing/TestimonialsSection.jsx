import React from 'react';
import {
  Box, Container, Grid, Typography, Stack, Chip, Rating
} from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useTranslation } from 'react-i18next';

const avatarColors = ['#3B82F6', '#10B981', '#F59E0B'];
const avatarInitials = ['RG', 'SS', 'VP'];

const TestimonialsSection = () => {
  const { t } = useTranslation();

  const testimonials = ['t1', 't2', 't3'].map((key, idx) => ({
    key,
    name: t(`landingPage.testimonials.${key}.name`),
    business: t(`landingPage.testimonials.${key}.business`),
    city: t(`landingPage.testimonials.${key}.city`),
    quote: t(`landingPage.testimonials.${key}.quote`),
    color: avatarColors[idx],
    initials: avatarInitials[idx],
    rating: 5,
  }));

  return (
    <Box
      sx={{
        background: 'linear-gradient(160deg, #0A1628 0%, #0D1D35 60%, #080F1E 100%)',
        py: { xs: 10, md: 14, lg: 18 },
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
      {/* Amber glow */}
      <Box sx={{ position: 'absolute', top: '20%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)', filter: 'blur(70px)', pointerEvents: 'none' }} />
      {/* Purple glow */}
      <Box sx={{ position: 'absolute', bottom: '10%', right: '-5%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 }, position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Chip
            label={t('landingPage.testimonials.sectionBadge')}
            size="small"
            sx={{
              bgcolor: 'rgba(245,158,11,0.1)',
              color: '#FCD34D',
              fontWeight: 800,
              fontSize: '0.75rem',
              mb: 2.5,
              border: '1px solid rgba(245,158,11,0.22)',
            }}
          />
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              fontSize: { xs: '2rem', md: '2.8rem', lg: '3.2rem' },
              letterSpacing: '-0.03em',
              mb: 2,
              lineHeight: 1.1,
              color: '#F1F5F9',
            }}
          >
            {t('landingPage.testimonials.sectionTitle')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#64748B',
              fontWeight: 400,
              maxWidth: 520,
              mx: 'auto',
              lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            {t('landingPage.testimonials.sectionSubtitle')}
          </Typography>
        </Box>

        {/* Testimonial Cards */}
        <Grid container spacing={4}>
          {testimonials.map((testimonial, idx) => (
            <Grid item xs={12} md={4} key={testimonial.key}>
              <Box
                sx={{
                  p: { xs: 3.5, md: 4 },
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.07)',
                  bgcolor: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.35s',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    bgcolor: 'rgba(255,255,255,0.07)',
                    borderColor: `${testimonial.color}35`,
                    boxShadow: `0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px ${testimonial.color}20`,
                  }
                }}
              >
                {/* Large decorative quote mark */}
                <FormatQuoteIcon
                  sx={{
                    fontSize: 64,
                    color: testimonial.color,
                    opacity: 0.12,
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    transform: 'rotate(180deg)',
                  }}
                />

                {/* Top accent bar */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${testimonial.color}, transparent)`, borderRadius: '4px 4px 0 0' }} />

                {/* Rating */}
                <Rating
                  value={testimonial.rating}
                  readOnly
                  size="small"
                  sx={{ mb: 2.5, '& .MuiRating-iconFilled': { color: '#F59E0B' } }}
                />

                {/* Quote */}
                <Typography
                  variant="body1"
                  sx={{
                    color: '#CBD5E1',
                    lineHeight: 1.85,
                    fontWeight: 500,
                    fontStyle: 'italic',
                    flexGrow: 1,
                    mb: 3,
                    fontSize: '0.95rem',
                  }}
                >
                  "{testimonial.quote}"
                </Typography>

                {/* Author */}
                <Box
                  sx={{
                    pt: 2.5,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {/* Avatar with gradient ring */}
                  <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${testimonial.color}, ${testimonial.color}88)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        color: '#fff',
                        boxShadow: `0 4px 14px ${testimonial.color}40`,
                      }}
                    >
                      {testimonial.initials}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#F1F5F9' }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      {testimonial.business}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                      📍 {testimonial.city}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Bottom trust row */}
        <Box
          sx={{
            mt: 8,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.07)',
            bgcolor: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 3, md: 6 },
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: '4.8/5', label: 'Average Rating', icon: '⭐', color: '#F59E0B' },
            { value: '500+', label: 'Happy Businesses', icon: '🏪', color: '#10B981' },
            { value: '98%', label: 'Satisfaction Rate', icon: '😊', color: '#60A5FA' },
          ].map((stat, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1.5}>
              <Typography sx={{ fontSize: '1.4rem' }}>{stat.icon}</Typography>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: stat.color, lineHeight: 1 }}>{stat.value}</Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>{stat.label}</Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Container>

      {/* Bottom fade to next section */}
      <Box sx={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, transparent, #F8FAFC)', pointerEvents: 'none' }} />
    </Box>
  );
};

export default TestimonialsSection;
