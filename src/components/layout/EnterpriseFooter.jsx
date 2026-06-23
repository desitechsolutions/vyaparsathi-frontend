import React, { useState } from 'react';
import {
  Box, Container, Grid, Typography, Stack, Divider,
  Link as MuiLink, IconButton, TextField, Button, Chip, CircularProgress
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockIcon from '@mui/icons-material/Lock';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import FlagIcon from '@mui/icons-material/Flag';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTranslation } from 'react-i18next';
import { subscribeNewsletter } from '../../services/api';
import { toast } from 'react-toastify';

const EnterpriseFooter = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await subscribeNewsletter(email, 'FOOTER');
      if (response.message && (response.message.toLowerCase().includes('already') || response.message.toLowerCase().includes('duplicate'))) {
        toast.info(response.message);
      } else {
        toast.success(response.message || 'Subscribed successfully!');
      }
      setSubscribed(true);
    } catch (err) {
      console.error('Subscription error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to subscribe. Please try again.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const footerSections = [
    {
      title: t('enterpriseFooter.product'),
      links: [
        { label: t('enterpriseFooter.links.features'), href: '/#features' },
        { label: t('enterpriseFooter.links.pricing'), href: '/pricing' },
        { label: t('enterpriseFooter.links.security'), href: '/#security' },
        { label: t('enterpriseFooter.links.roadmap'), href: '#' },
      ]
    },
    {
      title: t('enterpriseFooter.solutions'),
      links: [
        { label: t('enterpriseFooter.links.retail'), href: '/#solutions' },
        { label: t('enterpriseFooter.links.wholesale'), href: '/#solutions' },
        { label: t('enterpriseFooter.links.grocery'), href: '/#solutions' },
        { label: t('enterpriseFooter.links.distribution'), href: '/#solutions' },
      ]
    },
    {
      title: t('enterpriseFooter.resources'),
      links: [
        { label: t('enterpriseFooter.links.docs'), href: '#' },
        { label: t('enterpriseFooter.links.helpCenter'), href: '#' },
        { label: t('enterpriseFooter.links.blog'), href: '#' },
        { label: t('enterpriseFooter.links.apiRef'), href: '#' },
      ]
    },
    {
      title: t('enterpriseFooter.company'),
      links: [
        { label: t('enterpriseFooter.links.about'), href: '#' },
        { label: t('enterpriseFooter.links.team'), href: '#' },
        { label: t('enterpriseFooter.links.careers'), href: '#' },
        { label: t('enterpriseFooter.links.contact'), href: '#' },
      ]
    },
  ];

  const socialLinks = [
    { icon: WhatsAppIcon, href: 'https://wa.me/919508156282', label: 'WhatsApp', color: '#25D366' },
    { icon: FacebookIcon, href: 'https://www.facebook.com/profile.php?id=100069144071939', label: 'Facebook', color: '#1877F2' },
    { icon: TwitterIcon, href: '#', label: 'Twitter', color: '#1DA1F2' },
    { icon: LinkedInIcon, href: 'https://www.linkedin.com/company/desitech-solutions/', label: 'LinkedIn', color: '#0A66C2' },
    { icon: InstagramIcon, href: '#', label: 'Instagram', color: '#E4405F' },
  ];

  const trustBadges = [
    { icon: LockIcon, label: t('enterpriseFooter.trust.secure') },
    { icon: SmartphoneIcon, label: t('enterpriseFooter.trust.mobile') },
    { icon: FlagIcon, label: t('enterpriseFooter.trust.india') },
    { icon: VerifiedIcon, label: t('enterpriseFooter.trust.gst') },
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
        color: '#E2E8F0',
        pt: { xs: 8, md: 12 },
        pb: { xs: 4, md: 6 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 } }}>

        {/* ── Top: Brand + Links + Newsletter ── */}
        <Grid container spacing={{ xs: 5, md: 6 }} sx={{ mb: 8 }}>

          {/* Brand Column */}
          <Grid item xs={12} md={4} lg={3}>
            <Stack spacing={3}>
              {/* Logo + Name */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ height: 40 }}>
                    <img
                      src="/desitechsolution.png"
                      alt="VyaparSathi"
                      style={{ height: '100%', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={900} sx={{
                      background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1,
                    }}>
                      VyaparSathi
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                      Business ERP Platform
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7, maxWidth: 300 }}>
                  {t('enterpriseFooter.description')}
                </Typography>
              </Box>

              {/* Contact Details */}
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: '#60A5FA', flexShrink: 0 }} />
                    <MuiLink href="tel:+919508156282" underline="none" sx={{ color: '#CBD5E1', fontSize: '0.85rem', fontWeight: 600, '&:hover': { color: '#60A5FA' } }}>
                      +91-9508-156-282
                    </MuiLink>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 3.5 }}>
                    <MuiLink href="tel:+918447769695" underline="none" sx={{ color: '#CBD5E1', fontSize: '0.85rem', fontWeight: 600, '&:hover': { color: '#60A5FA' } }}>
                      +91-8447-769-695
                    </MuiLink>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <EmailIcon sx={{ fontSize: 16, color: '#60A5FA', flexShrink: 0 }} />
                  <MuiLink href="mailto:support@desitechsolutions.com" underline="none" sx={{ color: '#CBD5E1', fontSize: '0.85rem', fontWeight: 600, '&:hover': { color: '#60A5FA' } }}>
                    support@desitechsolutions.com
                  </MuiLink>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <LocationOnIcon sx={{ fontSize: 16, color: '#60A5FA', flexShrink: 0, mt: 0.3 }} />
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                    Gurugram, Haryana, India
                  </Typography>
                </Box>
              </Stack>

              {/* Social Icons */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                  {t('enterpriseFooter.followUs')}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {socialLinks.map((social, idx) => {
                    const Icon = social.icon;
                    return (
                      <IconButton
                        key={idx}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        aria-label={social.label}
                        sx={{
                          color: '#64748B',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 1.5,
                          width: 34,
                          height: 34,
                          transition: 'all 0.25s',
                          '&:hover': {
                            color: social.color,
                            borderColor: social.color,
                            bgcolor: `${social.color}15`,
                            transform: 'translateY(-3px)',
                          }
                        }}
                      >
                        <Icon sx={{ fontSize: 16 }} />
                      </IconButton>
                    );
                  })}
                </Stack>
              </Box>
            </Stack>
          </Grid>

          {/* Link Columns */}
          {footerSections.map((section, idx) => (
            <Grid item xs={6} sm={3} md={2} key={idx}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}
              >
                {section.title}
              </Typography>
              <Stack spacing={1.2}>
                {section.links.map((link, li) => (
                  <MuiLink
                    key={li}
                    href={link.href}
                    underline="none"
                    sx={{
                      color: '#64748B',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      transition: 'color 0.2s',
                      '&:hover': { color: '#F59E0B' }
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Stack>
            </Grid>
          ))}

          {/* Newsletter Column */}
          <Grid item xs={12} md={12} lg={3}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.08)',
                bgcolor: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#F1F5F9', mb: 0.5 }}>
                {t('enterpriseFooter.newsletter.label')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                Product updates, tips & business growth insights.
              </Typography>
              {!subscribed ? (
                <Box component="form" onSubmit={handleSubscribe}>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    required
                    disabled={loading}
                    placeholder={t('enterpriseFooter.newsletter.placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.07)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#F59E0B' },
                        '& input': { color: '#F1F5F9', fontSize: '0.85rem' },
                        '& input::placeholder': { color: '#64748B' },
                      }
                    }}
                  />
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
                    sx={{
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: 2,
                      bgcolor: '#F59E0B',
                      color: '#1E293B',
                      '&:hover': { bgcolor: '#FBBF24' }
                    }}
                  >
                    {loading ? 'Subscribing...' : t('enterpriseFooter.newsletter.cta')}
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>✅</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#10B981' }}>
                    Subscribed! Thanks.
                  </Typography>
                </Box>
              )}

              {/* WhatsApp CTA */}
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Button
                  fullWidth
                  href="https://wa.me/919508156282"
                  target="_blank"
                  startIcon={<WhatsAppIcon />}
                  sx={{
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '0.82rem',
                    color: '#25D366',
                    borderRadius: 2,
                    border: '1px solid rgba(37, 211, 102, 0.25)',
                    '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.08)', borderColor: '#25D366' }
                  }}
                >
                  Chat on WhatsApp
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 4 }} />

        {/* ── Trust Badges ── */}
        <Stack
          direction={{ xs: 'row', md: 'row' }}
          flexWrap="wrap"
          gap={1.5}
          justifyContent="center"
          sx={{ mb: 4 }}
        >
          {trustBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <Chip
                key={idx}
                icon={<Icon sx={{ fontSize: 15, color: '#10B981 !important' }} />}
                label={badge.label}
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.08)',
                  color: '#6EE7B7',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 28,
                }}
              />
            );
          })}
        </Stack>

        {/* ── Bottom Bar ── */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack spacing={0.5}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#CBD5E1' }}>
                Biruma Technology Solutions Pvt. Ltd.
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569' }}>
                {t('enterpriseFooter.cin')} &nbsp;•&nbsp; {t('enterpriseFooter.gstNo')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569' }}>
                {t('enterpriseFooter.copyright', { year: new Date().getFullYear() })} &nbsp;•&nbsp; {t('enterpriseFooter.allRightsReserved')}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack
              direction="row"
              spacing={2}
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              flexWrap="wrap"
              gap={1}
            >
              {[
                { label: t('enterpriseFooter.links.privacy'), href: 'https://www.desitechsolutions.com/privacy-policy' },
                { label: t('enterpriseFooter.links.terms'), href: 'https://www.desitechsolutions.com/terms-of-service' },
                { label: t('enterpriseFooter.links.cookies'), href: '#' },
              ].map((link, idx) => (
                <MuiLink
                  key={idx}
                  href={link.href}
                  underline="none"
                  sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, '&:hover': { color: '#94A3B8' } }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>
        </Grid>

        {/* Made in India Banner */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
            🇮🇳 Made with ❤️ in India by Biruma Technology Solutions • {t('enterpriseFooter.madeInIndia')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default EnterpriseFooter;
