import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Grid, Card, CardContent,
  Typography, Box, Stack, Avatar, Divider, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PublicIcon from '@mui/icons-material/Public';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const AboutModal = ({ open, onClose }) => {
  const values = [
    {
      icon: VerifiedUserIcon,
      title: 'Transparency',
      description: 'Honest pricing and clear audits for peace of mind'
    },
    {
      icon: AutoAwesomeIcon,
      title: 'Innovation',
      description: 'AI-driven features and continuous improvement'
    },
    {
      icon: PublicIcon,
      title: 'Accessibility',
      description: 'Enterprise-grade tech for every business size'
    },
    {
      icon: EmojiEventsIcon,
      title: 'Excellence',
      description: 'Proven track record with 1000+ happy customers'
    }
  ];

  const stats = [
    { label: 'Shops Empowered', value: '1,200+' },
    { label: 'Uptime', value: '99.9%' },
    { label: 'Years Active', value: '5+' },
    { label: 'Support Rating', value: '4.9/5' }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ pb: 0, pt: 3, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={900}>About Us</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Meet the team behind VyaparSathi</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            {/* Company Info */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}>
                  <BusinessCenterIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    DesiTech Solutions
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    By Biruma Technology Solutions Pvt. Ltd.
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
                We are a premium Indian technology brand dedicated to empowering SMEs with world-class software solutions. Our mission is to bridge the digital divide and make enterprise-grade technology accessible to every business owner.
              </Typography>
              <Chip 
                label="CIN: U62010HR2025PTC139151" 
                size="small" 
                variant="outlined" 
                icon={<VerifiedUserIcon />}
              />
            </Box>

            {/* Mission & Vision */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                      <LightbulbIcon sx={{ fontSize: 24, color: 'primary.main', mt: 0.5, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                          Our Vision
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          To become the trusted technology partner for Indian businesses by delivering scalable, secure, and future-ready software solutions driven by engineering excellence.
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 24, color: 'secondary.main', mt: 0.5, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                          Our Mission
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          We aim to bridge the digital divide by making enterprise-grade technology accessible to every shop owner and startup in India, ensuring growth through automation.
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={6}>
            {/* Stats */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                By The Numbers
              </Typography>
              <Grid container spacing={2}>
                {stats.map((stat, idx) => (
                  <Grid item xs={6} key={idx}>
                    <Card 
                      elevation={0} 
                      sx={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 2,
                        textAlign: 'center',
                        p: 2,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(59, 130, 246, 0.1)',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <Typography variant="h5" fontWeight={900} sx={{ color: 'primary.main', mb: 0.5 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {stat.label}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Core Values */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                Core Values
              </Typography>
              <Stack spacing={2}>
                {values.map((value, idx) => {
                  const Icon = value.icon;
                  return (
                    <Card key={idx} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <CardContent sx={{ py: 2, px: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                            <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                              {value.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                              {value.description}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Team Section */}
        <Box>
          <Typography variant="h6" fontWeight={900} gutterBottom sx={{ mb: 2.5 }}>
            Meet Our Founders
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'primary.main',
                      mx: 'auto',
                      mb: 2,
                      fontSize: '2rem'
                    }}
                  >
                    BS
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Birendra Shaw
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Technical Expert & Co-Founder
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    10+ years in software architecture and enterprise systems design. Leads technical innovation at DesiTech.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'secondary.main',
                      mx: 'auto',
                      mb: 2,
                      fontSize: '2rem'
                    }}
                  >
                    UP
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Uma Shankar Pandey
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Cloud Lead & Co-Founder
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Cloud infrastructure specialist and marketing strategist. Drives growth and partnerships.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AboutModal;
