import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Box, Container, Grid, Typography, Stack, useMediaQuery, useTheme,
  Paper, Fade, Chip, CircularProgress 
} from '@mui/material';
import PublicHeader from './PublicHeader';
import { useTranslation } from 'react-i18next';

const PublicLayout = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      background: 'radial-gradient(circle at 0% 0%, rgba(255, 214, 0, 0.06) 0%, transparent 60%), ' +
                  'radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.06) 0%, transparent 60%), ' +
                  '#f9fafb',
    }}>
      <PublicHeader />

      <Container 
        maxWidth="lg" 
        sx={{ 
          flexGrow: 1, 
          pt: { xs: 10, md: 12 },
          pb: { xs: 6, md: 8 },
          display: 'flex', 
          alignItems: 'flex-start',
          minHeight: 'auto'
        }}
      >
        <Grid container spacing={6} alignItems="center" justifyContent="center">
          
          {/* Left Greeting */}
          <Grid item xs={12} md={7} order={{ xs: 2, md: 1 }} sx={{ display: isMobile ? 'block' : 'block' }}>
            <Fade in timeout={800}>
              <Stack spacing={4} sx={{ pt: 2, textAlign: isMobile ? 'center' : 'left', alignItems: isMobile ? 'center' : 'flex-start' }}>
                <Stack direction="row" alignItems="center" spacing={2.5}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontSize: { xs: '3rem', md: '3.8rem', lg: '4rem' },
                      animation: 'wave 2.5s infinite ease-in-out',
                      transformOrigin: 'bottom left',
                      lineHeight: 1,
                    }}
                  >
                    🙏
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 800, 
                      color: 'primary.main', 
                      letterSpacing: 3, 
                      textTransform: 'uppercase' 
                    }}
                  >
                    {t('publicLayout.namaste')}
                  </Typography>
                </Stack>

                <Typography 
                  variant="h2" 
                  fontWeight={900} 
                  sx={{ 
                    color: '#0f172a', 
                    lineHeight: 1.05, 
                    fontSize: { xs: '2.5rem', md: '3.6rem', lg: '4rem' },
                    letterSpacing: '-0.5px'
                  }}
                >
                  {t('publicLayout.welcomeTo')} <br />
                  <Box 
                    component="span" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #FFD600, #FFAA00, #FF6B00)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    VyaparSathi
                  </Box>
                </Typography>

                <Typography 
                  variant="h6" 
                  color="text.secondary" 
                  sx={{ 
                    fontWeight: 500, 
                    maxWidth: 580, 
                    lineHeight: 1.7,
                    fontSize: '1.15rem'
                  }}
                >
                  {t('publicLayout.builtForEveryIndian')}
                </Typography>

                {/* Trust Stats */}
                <Grid container spacing={2} sx={{ mt: 2, justifyContent: isMobile ? 'center' : 'flex-start' }}>
                  {[
                    { icon: '🏪', label: t('publicLayout.businesses'), value: '1,200+' },
                    { icon: '⚡', label: t('publicLayout.uptime'), value: '99.9%' },
                    { icon: '🇮🇳', label: t('publicLayout.madeIn'), value: t('publicLayout.bharat') }
                  ].map((stat, i) => (
                    <Grid item xs={4} key={i}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 3, 
                          bgcolor: 'rgba(255,255,255,0.6)', 
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.4)',
                          textAlign: 'center',
                          transition: 'all 0.3s',
                          '&:hover': { transform: 'translateY(-6px)', bgcolor: '#ffffff' }
                        }}
                      >
                        <Typography sx={{ fontSize: '2rem', mb: 1 }}>{stat.icon}</Typography>
                        <Typography variant="h6" fontWeight={800} color="#0f172a">
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {stat.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b98180' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {t('publicLayout.allSystemsOperational')} • {t('publicLayout.proudlyBuiltInIndia')}
                  </Typography>
                </Box>
              </Stack>
            </Fade>
          </Grid>

          {/* Right side: Outlet */}
          <Grid item xs={12} md={5} order={{ xs: 1, md: 2 }}>
            <Fade in timeout={800}>
              <Box sx={{ 
                maxWidth: 460, 
                mx: 'auto',
                width: '100%',
                position: 'relative',
              }}>
                <Paper 
                  elevation={8}
                  sx={{ 
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Suspense fallback={
                    <Box sx={{ 
                      py: 5,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <CircularProgress size={40} thickness={4} />
                    </Box>
                  }>
                    <Outlet />
                  </Suspense>
                </Paper>
              </Box>
            </Fade>
          </Grid>

        </Grid>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 5, 
          textAlign: 'center', 
          borderTop: '1px solid rgba(0,0,0,0.06)', 
          bgcolor: 'white',
          mt: 'auto'
        }}
      >
        <Stack spacing={1}>
          <Typography variant="body1" fontWeight={700} color="text.primary">
            {t('publicLayout.companyName')} <Box component="span" sx={{ mx: 1.5, color: 'divider' }}>•</Box> 
            {t('publicLayout.birumaTechnology')}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            CIN: U62010HR2025PTC139151 <Box component="span" sx={{ mx: 1 }}>•</Box> 
            {t('publicLayout.madeWithLoveInIndia')}
          </Typography>

          <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
            © {new Date().getFullYear()} {t('appName')} — {t('publicLayout.allRightsReserved')}
          </Typography>
        </Stack>
      </Box>

      {/* Wave Animation */}
      <style>
        {`
          @keyframes wave {
            0% { transform: rotate(0deg); }
            10% { transform: rotate(14deg); }
            20% { transform: rotate(-8deg); }
            30% { transform: rotate(14deg); }
            40% { transform: rotate(-4deg); }
            50% { transform: rotate(10deg); }
            60% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default PublicLayout;