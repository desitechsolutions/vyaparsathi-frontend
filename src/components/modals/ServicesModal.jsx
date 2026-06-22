import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Grid, Card, CardContent,
  Typography, Box, Stack, Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import BrushIcon from '@mui/icons-material/Brush';
import StorageIcon from '@mui/icons-material/Storage';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const ServicesModal = ({ open, onClose }) => {
  const services = [
    {
      title: 'Web Development',
      icon: CodeIcon,
      color: '#3b82f6',
      description: 'Scalable enterprise web applications',
      highlights: ['React & Next.js', 'Spring Boot Backend', 'Real-time APIs', 'Responsive Design'],
      usecases: ['ERP Systems', 'Dashboards', 'Admin Panels', 'Web Stores']
    },
    {
      title: 'Mobile Development',
      icon: SmartphoneIcon,
      color: '#10b981',
      description: 'High-performance cross-platform apps',
      highlights: ['React Native', 'Flutter', 'iOS & Android', 'Offline Support'],
      usecases: ['Field Teams', 'Customer Apps', 'Sales Apps', 'Tracking Apps']
    },
    {
      title: 'Cloud & DevOps',
      icon: CloudQueueIcon,
      color: '#f59e0b',
      description: 'Automated CI/CD and infrastructure',
      highlights: ['AWS & Azure', 'Docker & Kubernetes', 'Auto-scaling', 'Security'],
      usecases: ['Cloud Migration', 'Infrastructure Setup', 'Performance Optimization', 'Disaster Recovery']
    },
    {
      title: 'UI/UX Design',
      icon: BrushIcon,
      color: '#ec4899',
      description: 'Conversion-focused design systems',
      highlights: ['Figma Design', 'Component Library', 'User Research', 'Prototyping'],
      usecases: ['Product Design', 'Redesigns', 'Design Systems', 'User Testing']
    },
    {
      title: 'Data Engineering',
      icon: StorageIcon,
      color: '#8b5cf6',
      description: 'Reliable data architecture & migration',
      highlights: ['PostgreSQL', 'MongoDB', 'Data Migration', 'ETL Pipelines'],
      usecases: ['Database Design', 'Data Migration', 'Analytics Setup', 'Backup Solutions']
    },
    {
      title: 'Technical Support',
      icon: ContactSupportIcon,
      color: '#06b6d4',
      description: '24/7 dedicated technical assistance',
      highlights: ['Architecture Review', 'Performance Tuning', 'Bug Fixes', 'Training'],
      usecases: ['Technical Consultation', 'Code Reviews', 'Optimization', 'Team Training']
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
          <Typography variant="h5" fontWeight={900}>Our Services</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Comprehensive technology solutions for your business</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {services.map((service, idx) => {
            const ServiceIcon = service.icon;
            return (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s',
                    border: '1px solid #e2e8f0',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                      borderColor: service.color
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Icon */}
                    <Avatar 
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: service.color + '15',
                        mb: 2
                      }}
                    >
                      <ServiceIcon sx={{ fontSize: 36, color: service.color }} />
                    </Avatar>

                    {/* Title & Description */}
                    <Typography variant="h6" fontWeight={800} gutterBottom>
                      {service.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                      {service.description}
                    </Typography>

                    {/* Highlights */}
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        TECHNOLOGIES
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {service.highlights.map((h, i) => (
                          <Box
                            key={i}
                            sx={{
                              display: 'inline-block',
                              px: 1.5,
                              py: 0.5,
                              bgcolor: service.color + '10',
                              border: `1px solid ${service.color}30`,
                              borderRadius: 1,
                              mb: 0.5
                            }}
                          >
                            <Typography variant="caption" fontWeight={600} sx={{ color: service.color }}>
                              {h}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>

                    {/* Use Cases */}
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        USE CASES
                      </Typography>
                      <Stack spacing={0.75}>
                        {service.usecases.map((uc, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 16, color: service.color }} />
                            <Typography variant="caption" fontWeight={600}>
                              {uc}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ServicesModal;
