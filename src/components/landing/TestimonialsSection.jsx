import React from 'react';
import {
  Box, Container, Grid, Typography, Stack, Chip, Paper, Rating
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
        bgcolor: 'background.default',
        py: { xs: 10, md: 14, lg: 18 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Chip
            label={t('landingPage.testimonials.sectionBadge')}
            size="small"
            sx={{
              bgcolor: 'rgba(245,158,11,0.1)',
              color: '#D97706',
              fontWeight: 800,
              fontSize: '0.75rem',
              mb: 2.5,
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          />
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              color: '#1E293B',
              fontSize: { xs: '2rem', md: '2.8rem', lg: '3.2rem' },
              letterSpacing: '-0.03em',
              mb: 2,
              lineHeight: 1.1,
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
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, md: 4.5 },
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid rgba(0,0,0,0.07)',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.35s',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 24px 60px rgba(0,0,0,0.1)`,
                    borderColor: `${testimonial.color}30`,
                  }
                }}
              >
                {/* Quote Icon */}
                <FormatQuoteIcon
                  sx={{
                    fontSize: 48,
                    color: `${testimonial.color}20`,
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    transform: 'rotate(180deg)',
                  }}
                />

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
                    color: 'text.primary',
                    lineHeight: 1.8,
                    fontWeight: 500,
                    fontStyle: 'italic',
                    flexGrow: 1,
                    mb: 3.5,
                    fontSize: '0.95rem',
                  }}
                >
                  "{testimonial.quote}"
                </Typography>

                {/* Author */}
                <Box
                  sx={{
                    pt: 3,
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {/* Avatar */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: testimonial.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1rem',
                      color: '#fff',
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${testimonial.color}40`,
                    }}
                  >
                    {testimonial.initials}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#1E293B' }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      {testimonial.business}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 500 }}>
                      📍 {testimonial.city}
                    </Typography>
                  </Box>
                </Box>

                {/* Bottom color bar */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: testimonial.color,
                    opacity: 0,
                    transition: 'opacity 0.35s',
                  }}
                  className="color-bar"
                />
                <style>{`.MuiPaper-root:hover .color-bar { opacity: 1; }`}</style>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Bottom trust row */}
        <Box
          sx={{
            mt: 8,
            p: 4,
            borderRadius: 4,
            border: '1px solid rgba(0,0,0,0.06)',
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 3, md: 6 },
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: '4.8/5', label: 'Average Rating', icon: '⭐' },
            { value: '10+', label: 'Happy Businesses', icon: '🏪' },
            { value: '98%', label: 'Satisfaction Rate', icon: '😊' },
          ].map((stat, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1.5}>
              <Typography sx={{ fontSize: '1.5rem' }}>{stat.icon}</Typography>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: '#1E293B', lineHeight: 1 }}>{stat.value}</Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>{stat.label}</Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default TestimonialsSection;
