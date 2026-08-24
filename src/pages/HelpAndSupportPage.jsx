import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Card, CardContent, Button, Stack,
  Accordion, AccordionSummary, AccordionDetails, Chip, Avatar, Divider,
  Link, useTheme, TextField, Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Forum as ForumIcon,
  School as SchoolIcon,
  BugReport as BugReportIcon,
  FolderOpen as DocumentsIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HelpAndSupportPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(0);

  const faqs = [
    {
      question: 'How do I create a new sale?',
      answer: 'Navigate to Sales → Create New Sale. Fill in customer details, add items from inventory, and click Save. Your sale will be recorded with a unique invoice number.',
    },
    {
      question: 'How do I manage inventory?',
      answer: 'Go to Inventory → Products. You can add new products, update stock levels, set reorder limits, and configure low-stock alerts. Enable alerts in Settings to get notified when stock runs low.',
    },
    {
      question: 'Can I export reports?',
      answer: 'Yes! All reports have an Export button (usually top-right). You can export as PDF or Excel. Reports are typically filtered by date range - select your period before exporting.',
    },
    {
      question: 'How do I set up multiple staff accounts?',
      answer: 'Navigate to Settings → Staff & Roles. Click Add Staff Member, enter their email, assign a role (Owner/Admin/Cashier), and send the invitation. They will receive an email to set their password.',
    },
    {
      question: 'Is my data secure?',
      answer: 'We use bank-grade encryption for all data. All communications are HTTPS-encrypted. Enable Two-Factor Authentication (2FA) in your Security settings for additional protection.',
    },
    {
      question: 'How do I enable GST in invoices?',
      answer: 'Go to Settings → Business Settings → Invoicing. Enter your GST number, select GST percentage, and enable GST on invoices. All future invoices will automatically include GST calculations.',
    },
  ];

  const supportChannels = [
    {
      title: 'Email Support',
      icon: <EmailIcon />,
      description: 'Detailed support for complex issues',
      contact: 'support@desitechsolutions.com',
      responseTime: '24-48 hours',
    },
    {
      title: 'Phone Support',
      icon: <PhoneIcon />,
      description: 'Direct support during business hours',
      contact: '+91 9508156282',
      responseTime: 'Immediate',
    },
    {
      title: 'Community Forum',
      icon: <ForumIcon />,
      description: 'Connect with other users',
      contact: 'Visit our community',
      responseTime: 'Variable',
    },
    {
      title: 'Report an Issue',
      icon: <BugReportIcon />,
      description: 'Report bugs or technical problems',
      contact: 'support@desitechsolutions.com',
      responseTime: 'Priority',
    },
  ];

  const resources = [
    {
      title: 'User Guide',
      description: 'Complete walkthrough of all features',
      icon: <SchoolIcon />,
      link: '#',
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides for common tasks',
      icon: <DocumentsIcon />,
      link: '#',
    },
    {
      title: 'Knowledge Base',
      description: 'Searchable database of articles and tips',
      icon: <HelpIcon />,
      link: '#',
    },
    {
      title: 'API Documentation',
      description: 'For developers: API reference and integration guides',
      icon: <DocumentsIcon />,
      link: '#',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, py: { xs: 3, md: 6 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        </Stack>

        {/* Hero */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 2,
            }}
          >
            <HelpIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            Help & Support
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            We're here to help. Find answers to common questions or reach out to our support team.
          </Typography>
        </Box>

        {/* Support Channels */}
        <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
          Get in Touch
        </Typography>
        <Grid container spacing={2} sx={{ mb: 8 }}>
          {supportChannels.map((channel, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 200ms',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {channel.icon}
                </Avatar>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {channel.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {channel.description}
                </Typography>
                <Chip label={channel.contact} size="small" variant="outlined" sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {channel.responseTime}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 6 }} />

        {/* FAQ Section */}
        <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
          Frequently Asked Questions
        </Typography>
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          {faqs.map((faq, idx) => (
            <Accordion
              key={idx}
              expanded={expandedFaq === idx}
              onChange={() => setExpandedFaq(expandedFaq === idx ? -1 : idx)}
              sx={{
                '&:first-of-type': { borderTopLeftRadius: 2, borderTopRightRadius: 2 },
                '&:last-of-type': { borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
                '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ bgcolor: 'action.hover' }}>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>

        <Divider sx={{ my: 6 }} />

        {/* Resources */}
        <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
          Learning Resources
        </Typography>
        <Grid container spacing={2} sx={{ mb: 8 }}>
          {resources.map((res, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 200ms',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: theme.shadows[4],
                  },
                  cursor: 'pointer',
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'secondary.light',
                      color: 'secondary.main',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {res.icon}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    {res.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {res.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Contact Form - Optional */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Didn't find an answer?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Send us a message and we'll get back to you as soon as possible.
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Subject"
              placeholder="What can we help you with?"
              size="small"
            />
            <TextField
              fullWidth
              label="Message"
              placeholder="Describe your issue or question..."
              multiline
              rows={4}
              size="small"
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined">Cancel</Button>
              <Button variant="contained">Send Message</Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default HelpAndSupportPage;
