import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Grid, Card, CardContent,
  Typography, Box, Stack, Avatar, Divider, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const ContactModal = ({ open, onClose }) => {
  const theme = useTheme();

  const contactChannels = [
    {
      icon: PhoneIcon,
      title: 'Phone',
      value: '+91-9910-007-071',
      action: 'tel:+919910007071',
      time: 'Mon-Sat: 10 AM - 6 PM IST'
    },
    {
      icon: WhatsAppIcon,
      title: 'WhatsApp',
      value: '+91-9910-007-071',
      action: 'https://wa.me/919910007071',
      time: '24/7 Quick Support'
    },
    {
      icon: EmailIcon,
      title: 'Email',
      value: 'support@vyaparsathi.com',
      action: 'mailto:support@vyaparsathi.com',
      time: 'Response in 2-4 hours'
    },
    {
      icon: TelegramIcon,
      title: 'Telegram',
      value: '@VyaparSathiSupport',
      action: 'https://t.me/vyaparsathisupport',
      time: '24/7 Community Support'
    }
  ];

  const departments = [
    {
      name: 'Sales & Demos',
      email: 'sales@desitechsolutions.com',
      description: 'Book product demo and pricing inquiries',
      icon: '📅'
    },
    {
      name: 'Technical Support',
      email: 'support@vyaparsathi.com',
      description: 'Bug reports and technical assistance',
      icon: '🛠️'
    },
    {
      name: 'Billing & Subscription',
      email: 'billing@vyaparsathi.com',
      description: 'Payment and subscription related queries',
      icon: '💳'
    },
    {
      name: 'Partnerships',
      email: 'partnerships@desitechsolutions.com',
      description: 'Business opportunities and collaboration',
      icon: '🤝'
    }
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
          <Typography variant="h5" fontWeight={900}>Contact Us</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>We're here to help. Get in touch with us</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={4}>
          {/* Quick Contact Channels */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={900} gutterBottom sx={{ mb: 2.5 }}>
              Quick Contact
            </Typography>
            <Stack spacing={2}>
              {contactChannels.map((channel, idx) => {
                const ChannelIcon = channel.icon;
                return (
                  <Card
                    key={idx}
                    component="a"
                    href={channel.action}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <CardContent sx={{ py: 2.5, px: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                          <ChannelIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={800}>
                              {channel.title}
                            </Typography>
                            <FiberManualRecordIcon sx={{ fontSize: 8, color: 'success.main' }} />
                          </Box>
                          <Typography variant="body2" color="primary.main" sx={{ mb: 1, fontWeight: 700 }}>
                            {channel.value}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {channel.time}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Grid>

          {/* Departments & Office */}
          <Grid item xs={12} md={6}>
            {/* Departments */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={900} gutterBottom sx={{ mb: 2.5 }}>
                Contact Our Teams
              </Typography>
              <Stack spacing={2}>
                {departments.map((dept, idx) => (
                  <Card key={idx} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <CardContent sx={{ py: 2, px: 2.5 }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body1" fontWeight={800} gutterBottom>
                          <Box component="span" sx={{ fontSize: '1.5rem', mr: 1 }}>{dept.icon}</Box>
                          {dept.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {dept.description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography 
                          variant="body2" 
                          component="a"
                          href={`mailto:${dept.email}`}
                          sx={{ 
                            color: 'primary.main', 
                            textDecoration: 'none', 
                            fontWeight: 600,
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {dept.email}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>

            {/* Office Location */}
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="h6" fontWeight={900} gutterBottom sx={{ mb: 2 }}>
                Office Location
              </Typography>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                      <LocationOnIcon sx={{ color: 'primary.main' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                        Biruma Technology Solutions Pvt. Ltd.
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 1.5 }}>
                        📍 Gurugram, Haryana<br/>
                        🇮🇳 India<br/>
                        <br/>
                        <strong>CIN:</strong> U62010HR2025PTC139151<br/>
                        <strong>GST:</strong> 06AAUPR6767R1Z2
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Support Promise */}
        <Card elevation={0} sx={{ bgcolor: 'primary.light', border: `2px solid ${theme.palette.primary.main}`, borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              <SupportAgentIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={900} sx={{ color: 'primary.dark' }}>
                Our Support Promise
              </Typography>
            </Box>
            <Typography variant="body2" color="primary.dark" sx={{ lineHeight: 1.6 }}>
              ✓ <strong>2-4 Hour Response Time</strong> • Response time for support tickets<br/>
              ✓ <strong>99.9% Uptime Guarantee</strong> • Reliable service infrastructure<br/>
              ✓ <strong>Dedicated Account Manager</strong> • For enterprise customers<br/>
              ✓ <strong>24/7 Community Support</strong> • Via WhatsApp & Telegram
            </Typography>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
