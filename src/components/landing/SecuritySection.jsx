import React from 'react';
import {
  Box, Container, Grid, Typography, Stack, Chip, Paper
} from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import LockIcon from '@mui/icons-material/Lock';
import BackupIcon from '@mui/icons-material/Backup';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';

const securityCards = [
  { key: 'cloud', Icon: CloudDoneIcon, color: '#3B82F6', emoji: '☁️' },
  { key: 'encryption', Icon: LockIcon, color: '#10B981', emoji: '🔒' },
  { key: 'backup', Icon: BackupIcon, color: '#8B5CF6', emoji: '💾' },
  { key: 'sla', Icon: CheckCircleIcon, color: '#F59E0B', emoji: '⚡' },
];

const SecuritySection = () => {
  const { t } = useTranslation();

  return (
    <Box
      id="security"
      sx={{
        bgcolor: '#ffffff',
        py: { xs: 10, md: 14, lg: 18 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Chip
            label={t('landingPage.security.sectionBadge')}
            size="small"
            sx={{
              bgcolor: 'rgba(16,185,129,0.08)',
              color: '#059669',
              fontWeight: 800,
              fontSize: '0.75rem',
              mb: 2.5,
              border: '1px solid rgba(16,185,129,0.15)',
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
            {t('landingPage.security.sectionTitle')}
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
            {t('landingPage.security.sectionSubtitle')}
          </Typography>
        </Box>

        {/* Security Cards */}
        <Grid container spacing={4}>
          {securityCards.map((card) => {
            const { key, Icon, color, emoji } = card;
            return (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid rgba(0,0,0,0.07)',
                    bgcolor: '#FAFAFA',
                    textAlign: 'center',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      bgcolor: '#fff',
                      boxShadow: `0 20px 60px ${color}15`,
                      borderColor: `${color}30`,
                    }
                  }}
                >
                  {/* Emoji */}
                  <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>{emoji}</Typography>

                  {/* Icon Circle */}
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: `${color}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      border: `2px solid ${color}20`,
                    }}
                  >
                    <Icon sx={{ fontSize: 30, color }} />
                  </Box>

                  <Typography variant="h6" fontWeight={800} sx={{ color: '#1E293B', mb: 1.5 }}>
                    {t(`landingPage.security.${key}.title`)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.7, fontWeight: 500 }}>
                    {t(`landingPage.security.${key}.desc`)}
                  </Typography>

                  {/* Color tag at bottom */}
                  <Box
                    sx={{
                      mt: 3,
                      pt: 2,
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.8,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 50,
                        bgcolor: `${color}10`,
                        border: `1px solid ${color}20`,
                      }}
                    >
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
                      <Typography variant="caption" sx={{ color, fontWeight: 800, fontSize: '0.7rem' }}>
                        {key === 'sla' ? 'Enterprise SLA' : key === 'backup' ? 'Daily Auto-Backup' : key === 'encryption' ? '256-bit SSL' : 'Multi-region Cloud'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Bottom compliance banner */}
        <Box
          sx={{
            mt: 8,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ color: '#F1F5F9', mb: 0.5 }}>
              🇮🇳 Compliant with Indian Data Protection Standards
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              VyaparSathi complies with Indian IT Act, GST regulations, and standard data protection norms.
            </Typography>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {['GST Compliant', 'IT Act Compliant', 'SSL Secured', '99.9% SLA'].map((label) => (
              <Chip
                key={label}
                icon={<CheckCircleIcon sx={{ fontSize: 14, color: '#10B981 !important' }} />}
                label={label}
                size="small"
                sx={{
                  bgcolor: 'rgba(16,185,129,0.1)',
                  color: '#6EE7B7',
                  border: '1px solid rgba(16,185,129,0.2)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default SecuritySection;
