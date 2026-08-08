import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  Chip,
  Paper,
  TextField,
  Button,
  MenuItem,
  Alert,
  Fade,
  Snackbar,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CircularProgress from '@mui/material/CircularProgress';
import { bookDemo } from '../../services/api';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessType: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await bookDemo({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.businessType,
        serviceType: 'VyaparSathi Live Demo',
        message: formData.message || 'Request for Live Demo'
      });
      // Accept status 200 or 201 as success regardless of response payload format
      if (response.status === 200 || response.status === 201 || (response.data && response.data.success)) {
        setSubmitted(true);
        setSnackbar({ open: true, message: '✨ Request received! Our team will call you within 24 hours.', severity: 'success' });
        setFormData({ name: '', email: '', phone: '', businessType: '', message: '' });
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        setSnackbar({ open: true, message: 'Something went wrong. Please try again.', severity: 'error' });
      }
    } catch (error) {
      console.error("Demo Submission Error:", error);
      setSnackbar({ open: true, message: 'Failed to submit demo request. Please try again or contact us directly.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Box
      id="contact"
      sx={{
        bgcolor: 'background.default',
        py: { xs: 10, md: 14, lg: 16 },
        borderTop: '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Chip
            icon={<SupportAgentIcon style={{ color: '#F59E0B', fontSize: 14 }} />}
            label="GET IN TOUCH"
            size="small"
            sx={{
              bgcolor: 'rgba(245,158,11,0.08)',
              color: '#D97706',
              fontWeight: 800,
              fontSize: '0.75rem',
              mb: 2.5,
              border: '1px solid rgba(245,158,11,0.15)',
              '& .MuiChip-icon': { color: '#D97706 !important' },
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
            Contact Our Sales & Support Team
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#64748B',
              fontWeight: 400,
              maxWidth: 580,
              mx: 'auto',
              lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Have questions about pricing, features, or customized setups? Reach out to us or schedule a live platform demo.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 6, lg: 8 }} alignItems="stretch">
          {/* Left Side: Contact Info & Support details */}
          <Grid item xs={12} md={6}>
            <Stack spacing={4} sx={{ height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ color: '#1E293B', mb: 3 }}>
                  Direct Channels
                </Typography>
                <Grid container spacing={2}>
                  {/* Phone Call */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: '#FFFFFF',
                        transition: '0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: 'rgba(37,99,235,0.08)',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <PhoneIcon />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                            Call Sales / Enquiry
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="#1E293B" component="a" href="tel:+919508156282" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            +91 9508156282
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="#1E293B" component="a" href="tel:+918447769695" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginTop: 4 }}>
                            +91 8447769695
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* WhatsApp Support */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: '#FFFFFF',
                        transition: '0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: 'rgba(16,185,129,0.08)',
                            color: '#10B981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <WhatsAppIcon />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                            WhatsApp Support
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="#1E293B" component="a" href="https://wa.me/919508156282" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            +91 9508156282
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="#1E293B" component="a" href="https://wa.me/918447769695" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginTop: 4 }}>
                            +91 8447769695
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Email Support */}
                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: '#FFFFFF',
                        transition: '0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: 'rgba(139,92,246,0.08)',
                            color: '#8B5CF6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <EmailIcon />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                            Email Addresses
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="#1E293B" component="a" href="mailto:support@desitechsolutions.com" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            support@desitechsolutions.com (Support)
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="#1E293B" component="a" href="mailto:sales@desitechsolutions.com" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginTop: 4 }}>
                            sales@desitechsolutions.com (Sales)
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="#1E293B" component="a" href="mailto:info@desitechsolutions.com" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginTop: 4 }}>
                            info@desitechsolutions.com (General Enquiry)
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Office Address */}
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ color: '#1E293B', mb: 2.5 }}>
                  Registered Office
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    borderRadius: 3.5,
                    border: '1px solid rgba(0,0,0,0.06)',
                    bgcolor: '#FFFFFF',
                  }}
                >
                  <Stack direction="row" spacing={2.5} alignItems="flex-start">
                    <LocationOnIcon sx={{ color: '#EF4444', mt: 0.3, fontSize: 28 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={900} color="#1E293B" gutterBottom>
                        Biruma Technology Solutions Private Limited
                      </Typography>
                      <Typography variant="body2" color="text.secondary" lineHeight={1.6} fontWeight={500}>
                        Arjun Nagar, Sector 8, Gurgaon, Haryana, 122001
                        <br />
                        CIN: U62010HR2025PTC139151
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>

              {/* Support SLA Commitments */}
              <Box sx={{ p: 3, borderRadius: 3.5, bgcolor: '#0F172A', color: '#FFFFFF' }}>
                <Typography variant="subtitle2" fontWeight={800} color="#F59E0B" sx={{ mb: 1.5 }}>
                  🛡️ Active Merchant Support
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                      9:00 AM to 9:00 PM Live Calling Support
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                      Under 2-hour SLA response for critical system issues
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                      Free basic GST and setup consultation for pro merchants
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Grid>

          {/* Right Side: Demo Request Form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, lg: 5 },
                borderRadius: 4.5,
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.04)',
                bgcolor: '#FFFFFF',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h5" fontWeight={900} sx={{ color: '#1E293B', mb: 1 }}>
                Book a Free Live Demo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                Fill out the form below, and our business specialist will call you to walk you through the custom capabilities of VyaparSathi.
              </Typography>

              {submitted && (
                <Fade in>
                  <Alert severity="success" variant="filled" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 600 }}>
                    ✨ Request received! Our team will call you within 24 hours.
                  </Alert>
                </Fade>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={3}>
                  <TextField
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading || submitted}
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />

                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading || submitted}
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />

                  <TextField
                    label="Mobile Number (10 digits)"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading || submitted}
                    inputProps={{ maxLength: 10 }}
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />

                  <TextField
                    select
                    label="Business Type / Industry"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading || submitted}
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  >
                    <MenuItem value="retail">Kirana & General Store</MenuItem>
                    <MenuItem value="wholesale">Wholesaler / Trading</MenuItem>
                    <MenuItem value="pharmacy">Medical Pharmacy</MenuItem>
                    <MenuItem value="fashion">Apparel & Footwear</MenuItem>
                    <MenuItem value="electronics">Electronics / Appliances</MenuItem>
                    <MenuItem value="distribution">Distribution / Route Sales</MenuItem>
                    <MenuItem value="other">Other Business Types</MenuItem>
                  </TextField>

                  <TextField
                    label="Briefly tell us what features you need (Optional)"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    disabled={loading || submitted}
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || submitted || !formData.name.trim() || !formData.email.trim() || formData.phone.length < 10 || !formData.businessType}
                    endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    sx={{
                      py: 1.6,
                      fontWeight: 800,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontSize: '1rem',
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                      '&:hover:not(:disabled)': {
                        background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                        boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
                        transform: 'translateY(-1.5px)',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading ? 'Submitting...' : 'Request Demo call'}
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Global Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactSection;
