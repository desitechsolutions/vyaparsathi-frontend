import React from 'react';
import { Box, Container, Typography, Stack, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PhoneIcon from '@mui/icons-material/Phone';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const FinalCTASection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 40%, #1A1040 100%)',
        py: { xs: 12, md: 18 },
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Glow blobs */}
      <Box sx={{ position: 'absolute', top: '10%', left: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      {/* Dot grid */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, px: { xs: 3, md: 4 } }}>
        {/* Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.8,
            borderRadius: 50,
            bgcolor: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.25)',
            mb: 4,
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />
          <Typography variant="caption" fontWeight={800} sx={{ color: '#FCD34D', letterSpacing: 0.5 }}>
            🚀 14-Day Free Trial Available
          </Typography>
        </Box>

        {/* Headline */}
        <Typography
          variant="h2"
          fontWeight={900}
          sx={{
            color: '#F1F5F9',
            fontSize: { xs: '2.2rem', md: '3.2rem', lg: '3.8rem' },
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            mb: 3,
          }}
        >
          {t('landingPage.finalCta.headline')}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: '#94A3B8',
            fontWeight: 400,
            maxWidth: 520,
            mx: 'auto',
            lineHeight: 1.7,
            fontSize: { xs: '1rem', md: '1.15rem' },
            mb: 6,
          }}
        >
          {t('landingPage.finalCta.subheadline')}
        </Typography>

        {/* CTA Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} justifyContent="center" sx={{ mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/login')}
            sx={{
              fontWeight: 800,
              fontSize: '1.05rem',
              textTransform: 'none',
              px: 5,
              py: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              color: '#1E293B',
              boxShadow: '0 10px 40px rgba(245,158,11,0.45)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FBBF24 0%, #FB923C 100%)',
                boxShadow: '0 14px 50px rgba(245,158,11,0.55)',
                transform: 'translateY(-3px)',
              },
              transition: 'all 0.25s',
            }}
          >
            {t('landingPage.finalCta.primaryCta')}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<PhoneIcon />}
            href="https://wa.me/919508156282"
            target="_blank"
            sx={{
              fontWeight: 700,
              fontSize: '1.05rem',
              textTransform: 'none',
              px: 5,
              py: 2,
              borderRadius: 3,
              color: '#CBD5E1',
              borderColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.4)',
                bgcolor: 'rgba(255,255,255,0.06)',
                transform: 'translateY(-3px)',
              },
              transition: 'all 0.25s',
            }}
          >
            {t('landingPage.finalCta.secondaryCta')}
          </Button>
        </Stack>

        {/* Fine print */}
        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
          {t('landingPage.finalCta.note')}
        </Typography>

        {/* Trust logos row */}
        <Box
          sx={{
            mt: 8,
            pt: 6,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 3, md: 6 },
            flexWrap: 'wrap',
          }}
        >
          {[
            { icon: '🔒', label: 'Bank-grade Security' },
            { icon: '☁️', label: '99.9% Uptime SLA' },
            { icon: '🇮🇳', label: 'Made in India' },
            { icon: '🧾', label: 'GST Compliant' },
            { icon: '⚡', label: '30 Min Setup' },
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1.2rem' }}>{item.icon}</Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default FinalCTASection;
