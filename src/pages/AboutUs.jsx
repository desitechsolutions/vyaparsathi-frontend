import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Avatar,
} from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { useTranslation } from 'react-i18next';
import GroupIcon from '@mui/icons-material/Group';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CodeIcon from '@mui/icons-material/Code';
import DnsIcon from '@mui/icons-material/Dns';
import CloudIcon from '@mui/icons-material/Cloud';
import EngineeringIcon from '@mui/icons-material/Engineering';

const AboutUs = () => {
const { t } = useTranslation();
  return (
    <Box
      sx={{
        flexGrow: 1,
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 4 },
        bgcolor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 4,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            },
          }}
        >
          {/* Main Title Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 'bold', color: 'primary.main' }}
            >
              About VyaparSathi
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Your trusted partner in business growth.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Our Mission & Vision Section */}
          <Grid container spacing={4} alignItems="center" sx={{ mb: 6 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 0 } }}>
                <BusinessCenterIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Our Mission
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, mt: 2 }}>
                  Our mission is to empower small and medium-sized businesses in rural and semi-urban areas by simplifying their daily operations. We believe that technology should be a tool for empowerment, not a barrier. VyaparSathi is designed to make business management, from inventory to sales, accessible and easy for everyone.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <LightbulbIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Our Vision
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, mt: 2 }}>
                  We envision a future where every shop owner, regardless of their location or technical expertise, can manage their business efficiently and accurately. By providing an intuitive, offline-first application, we aim to bridge the digital divide and contribute to the economic prosperity of local communities.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Our Founder & Team Section */}
          <Card elevation={0} sx={{ p: { xs: 2, md: 4 }, mb: 6, bgcolor: '#fafafa', borderRadius: 3 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', m: '0 auto', mb: 2 }}>
                  <EngineeringIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Our Founder
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Birendra Shaw
                </Typography>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  Our team is led by **Birendra Shaw**, a Technical Specialist at IBM with extensive experience in developing applications for small to medium-scale businesses. With a strong foundation in **Java Spring Boot, Microservices, Kafka, AWS, React.js, and Angular.js**, Birendra brings a wealth of knowledge to ensure our solutions are robust, scalable, and tailored to real-world business needs.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Chip icon={<CodeIcon />} label="Java Spring Boot" color="primary" />
                  <Chip icon={<DnsIcon />} label="Microservices" color="primary" />
                  <Chip icon={<CloudIcon />} label="AWS" color="primary" />
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
                We are a dedicated team of **10+ developers**, including specialists in Android and iOS mobile app development and a cloud architect, ensuring we can provide comprehensive services to all business domains. Whether your needs are in **banking, finance, insurance, or retail**, our diverse expertise allows us to deliver high-quality, customized software solutions.
              </Typography>
            </Box>
          </Card>

          <Divider sx={{ my: 4 }} />

          {/* Contact Us Section */}
          <Card elevation={0} sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fafafa', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', color: 'primary.main' }}
                >
                  Contact Us
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Let's discuss how we can help your business grow.
                </Typography>
              </Box>
              <Grid container spacing={2} justifyContent="center" alignItems="center">
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <IconButton color="primary" sx={{ mb: 1 }} href="tel:9508156282">
                    <PhoneIcon sx={{ fontSize: 30 }} />
                  </IconButton>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Phone
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    9508156282
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <IconButton color="primary" sx={{ mb: 1 }} href="mailto:techie.birendra@gmail.com">
                    <EmailIcon sx={{ fontSize: 30 }} />
                  </IconButton>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Email
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    techie.birendra@gmail.com
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <IconButton color="primary" sx={{ mb: 1 }} href="https://maps.google.com/?q=Sector-62, Noida" target="_blank">
                    <LocationOnIcon sx={{ fontSize: 30 }} />
                  </IconButton>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sector-62, Noida
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Paper>
      </Container>
    </Box>
  );
};

export default AboutUs;
