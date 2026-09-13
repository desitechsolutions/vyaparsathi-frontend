import React from 'react';
import { Box, Container, Typography, Stack, Button, Chip } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const FinalCTASection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        background: 'linear-gradient(145deg, #160430 0%, #0A1628 40%, #0E1240 70%, #080E1C 100%)',
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
            fontSize: { xs: '2.2rem', md: '3.2rem', lg: '3.8rem' },
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            mb: 3,
            background: 'linear-gradient(90deg, #F1F5F9 0%, #93C5FD 50%, #C084FC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
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
            startIcon={<WhatsAppIcon />}
            href="https://wa.me/919508156282"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontWeight: 700,
              fontSize: '1.05rem',
              textTransform: 'none',
              px: 5,
              py: 2,
              borderRadius: 3,
              color: '#CBD5E1',
              borderColor: 'rgba(255,255,255,0.18)',
              bgcolor: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(8px)',
              '&:hover': {
                borderColor: '#25D366',
                color: '#4ADE80',
                bgcolor: 'rgba(37,211,102,0.06)',
                transform: 'translateY(-3px)',
              },
              transition: 'all 0.25s',
            }}
          >
            {t('landingPage.finalCta.secondaryCta')}
          </Button>
        </Stack>

        {/* Fine print */}
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {t('landingPage.finalCta.note')}
        </Typography>

        {/* Trust chips row */}
        <Box
          sx={{
            mt: 8,
            pt: 5,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          {[
            { icon: '🔒', label: 'Bank-grade Security' },
            { icon: '☁️', label: '99.9% Uptime' },
            { icon: '🇮🇳', label: 'Made in India' },
            { icon: '🧾', label: 'GST Compliant' },
            { icon: '⚡', label: '30 Min Setup' },
          ].map((item, i) => (
            <Chip
              key={i}
              label={`${item.icon} ${item.label}`}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.04)',
                color: '#64748B',
                border: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 700,
                fontSize: '0.75rem',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#94A3B8' },
                transition: 'all 0.2s',
              }}
            />
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default FinalCTASection;
