import React from 'react';
import {
  Box, Container, Grid, Typography, Link as MuiLink, Stack, Divider,
  IconButton, useTheme, useMediaQuery, Paper
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';

const PublicFooter = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const footerLinks = [
    {
      title: t('publicFooter.product') || 'Product',
      links: [
        { label: t('publicFooter.features') || 'Features', href: '#features' },
        { label: t('publicFooter.pricing') || 'Pricing', href: '/pricing' },
        { label: t('publicFooter.security') || 'Security', href: '#security' },
        { label: t('publicFooter.roadmap') || 'Roadmap', href: '#roadmap' }
      ]
    },
    {
      title: t('publicFooter.company') || 'Company',
      links: [
        { label: t('publicFooter.about') || 'About', href: '/about' },
        { label: t('publicFooter.blog') || 'Blog', href: '#blog' },
        { label: t('publicFooter.careers') || 'Careers', href: '#careers' },
        { label: t('publicFooter.contact') || 'Contact', href: '#contact' }
      ]
    },
    {
      title: t('publicFooter.legal') || 'Legal',
      links: [
        { label: t('publicFooter.privacy') || 'Privacy Policy', href: '#privacy' },
        { label: t('publicFooter.terms') || 'Terms of Service', href: '#terms' },
        { label: t('publicFooter.cookies') || 'Cookie Policy', href: '#cookies' }
      ]
    },
    {
      title: t('publicFooter.resources') || 'Resources',
      links: [
        { label: t('publicFooter.documentation') || 'Documentation', href: '#docs' },
        { label: t('publicFooter.help') || 'Help Center', href: '#help' },
        { label: t('publicFooter.api') || 'API Reference', href: '#api' },
        { label: t('publicFooter.status') || 'Status Page', href: '#status' }
      ]
    }
  ];

  const socialIcons = [
    { icon: WhatsAppIcon, label: 'WhatsApp', href: 'https://wa.me/919910007071' },
    { icon: EmailIcon, label: 'Email', href: 'mailto:support@vyaparsathi.com' },
    { icon: FacebookIcon, label: 'Facebook', href: '#facebook' },
    { icon: TwitterIcon, label: 'Twitter', href: '#twitter' },
    { icon: LinkedInIcon, label: 'LinkedIn', href: '#linkedin' },
    { icon: InstagramIcon, label: 'Instagram', href: '#instagram' }
  ];

  return (
    <Box 
      component="footer"
      sx={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderTop: `1px solid ${theme.palette.divider}`,
        py: { xs: 6, md: 10 },
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Grid container spacing={{ xs: 4, md: 6 }} sx={{ mb: 6 }}>
          
          {/* Brand Section */}
          <Grid item xs={12} sm={6} md={4}>
            <Stack spacing={2}>
              <Box>
                <Typography 
                  variant="h6" 
                  fontWeight={900}
                  sx={{
                    background: 'linear-gradient(90deg, #FFD600, #FF6B00)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  VyaparSathi
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('publicFooter.tagline') || 'Your Business, Our Responsibility'}
                </Typography>
              </Box>
              
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                {t('publicFooter.description') || 'Empowering Indian businesses with enterprise-grade retail management software.'}
              </Typography>

              {/* Contact Info */}
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <MuiLink href="tel:+919910007071" underline="none" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>
                    +91-9910-007-071
                  </MuiLink>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <MuiLink href="mailto:support@vyaparsathi.com" underline="none" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>
                    support@vyaparsathi.com
                  </MuiLink>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('publicFooter.location') || 'Gurugram, Haryana, India'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Grid>

          {/* Footer Links - Only show on desktop */}
          {!isMobile && footerLinks.map((section, idx) => (
            <Grid item xs={12} sm={6} md={2} key={idx}>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ color: 'text.primary' }}>
                {section.title}
              </Typography>
              <Stack spacing={1}>
                {section.links.map((link, linkIdx) => (
                  <MuiLink
                    key={linkIdx}
                    href={link.href}
                    underline="none"
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      transition: 'color 0.2s',
                      '&:hover': {
                        color: 'primary.main',
                      }
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Bottom Section */}
        <Grid container spacing={3} alignItems="center">
          
          {/* Left: Copyright & Legal */}
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {t('publicFooter.companyInfo') || 'Biruma Technology Solutions Pvt. Ltd.'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                CIN: U62010HR2025PTC139151 • GST: 06AAUPR6767R1Z2
              </Typography>
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} {t('appName') || 'VyaparSathi'}. {t('publicFooter.allRightsReserved') || 'All rights reserved.'}
              </Typography>
            </Stack>
          </Grid>

          {/* Right: Social Icons */}
          <Grid item xs={12} md={6}>
            <Stack 
              direction="row" 
              spacing={2} 
              justifyContent={{ xs: 'center', md: 'flex-end' }}
              alignItems="center"
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {t('publicFooter.followUs') || 'Follow Us'}
              </Typography>
              {socialIcons.map((social, idx) => {
                const Icon = social.icon;
                return (
                  <IconButton
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    title={social.label}
                    sx={{
                      color: 'text.secondary',
                      transition: 'all 0.3s',
                      '&:hover': {
                        color: 'primary.main',
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    <Icon fontSize="small" />
                  </IconButton>
                );
              })}
            </Stack>
          </Grid>

        </Grid>

        {/* Additional Info Banner */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 2.5,
            borderRadius: 3,
            bgcolor: 'primary.light',
            border: `1px solid ${theme.palette.primary.main}20`,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="primary.dark" fontWeight={600}>
            ✓ {t('publicFooter.securePayments') || 'Secure Payments'} • 
            📱 {t('publicFooter.mobileOptimized') || 'Mobile Optimized'} • 
            🇮🇳 {t('publicFooter.madeInIndia') || 'Made in India'} • 
            ⚡ {t('publicFooter.highSpeed') || 'High Speed'}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicFooter;
