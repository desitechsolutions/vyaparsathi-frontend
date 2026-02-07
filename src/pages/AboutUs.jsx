import React from 'react';
import {
  Box, Container, Typography, Paper, Grid, Divider, Button, IconButton,
  Card, CardContent, Chip, Avatar, Stack, useTheme
} from '@mui/material';
import {
  BusinessCenter, Lightbulb, Email, Phone, LocationOn, 
  Code, Dns, Cloud, Engineering, VerifiedUser, 
  Smartphone, Brush, Storage, SupportAgent
} from '@mui/icons-material';

const AboutUs = () => {
  const theme = useTheme();

  const services = [
    { title: "Web Development", icon: <Code />, tags: ["React", "Spring Boot", "Next.js"], desc: "Scalable enterprise web applications." },
    { title: "Mobile Apps", icon: <Smartphone />, tags: ["Android", "Flutter", "React Native"], desc: "High-performance cross-platform apps." },
    { title: "Cloud & DevOps", icon: <Cloud />, tags: ["AWS", "Docker", "Kubernetes"], desc: "Automated CI/CD and cloud architecture." },
    { title: "UI/UX Design", icon: <Brush />, tags: ["Figma", "Material UI"], desc: "Conversion-focused, clean design systems." },
    { title: "Data Engineering", icon: <Storage />, tags: ["PostgreSQL", "MongoDB"], desc: "Reliable data architecture & migration." },
    { title: "Consulting", icon: <SupportAgent />, tags: ["Architecture", "Security"], desc: "Technology review and long-term support." },
  ];

  return (
    <Box sx={{ flexGrow: 1, py: { xs: 4, md: 8 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        
        {/* HERO SECTION */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 2 }}>
            Engineering Excellence Since 2019
          </Typography>
          <Typography variant="h2" fontWeight={900} gutterBottom sx={{ color: '#0f172a' }}>
            DesiTech <Box component="span" sx={{ color: 'primary.main' }}>Solutions</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, m: '0 auto' }}>
            A premium technology brand operated by <b>Biruma Technology Solutions Private Limited</b>. 
            Empowering Indian businesses with future-ready software.
          </Typography>
        </Box>

        {/* MISSION & VISION */}
        <Grid container spacing={4} sx={{ mb: 10 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 4, height: '100%', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <BusinessCenter sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={800} gutterBottom>Our Vision</Typography>
              <Typography variant="body1" color="text.secondary" lineHeight={1.8}>
                To become a trusted technology partner for Indian businesses by delivering scalable, 
                secure, and future-ready software solutions driven by engineering excellence.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 4, height: '100%', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Lightbulb sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={800} gutterBottom>Our Mission</Typography>
              <Typography variant="body1" color="text.secondary" lineHeight={1.8}>
                We aim to bridge the digital divide by making enterprise-grade technology accessible 
                to every shop owner and startup in India, ensuring growth through automation.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* SERVICES GRID */}
        <Typography variant="h4" fontWeight={900} textAlign="center" mb={6}>Our Expertise</Typography>
        <Grid container spacing={3} sx={{ mb: 10 }}>
          {services.map((s, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card elevation={0} sx={{ height: '100%', borderRadius: 4, border: '1px solid #e2e8f0', '&:hover': { borderColor: 'primary.main', bgcolor: '#f1f5f9' } }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'primary.light', mb: 2 }}>{s.icon}</Avatar>
                  <Typography variant="h6" fontWeight={800}>{s.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40 }}>{s.desc}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {s.tags.map(tag => <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700 }} />)}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* LEADERSHIP SECTION */}
        <Typography variant="h4" fontWeight={900} textAlign="center" mb={6}>The Leadership Team</Typography>
        <Grid container spacing={4} sx={{ mb: 10 }}>
          <Grid item xs={12} md={4}>
            <LeaderCard 
              name="Birendra Shaw" 
              role="Director – Full Stack & Backend" 
              desc="Leads backend architecture focusing on scalable enterprise systems and cloud-native platforms." 
              skills={["Java", "Microservices", "AWS"]} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <LeaderCard 
              name="Uma Shankar Pandey" 
              role="Director – DevOps & Cloud" 
              desc="Ensures reliability and secure deployments across modern cloud platforms and CI/CD pipelines." 
              skills={["Docker", "Kubernetes", "DevOps"]} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <LeaderCard 
              name="Rambabu Prajapati" 
              role="Mobile Application Lead" 
              desc="Specializes in developing high-performance Android & iOS applications with a focus on usability." 
              skills={["Android", "iOS", "Flutter"]} 
            />
          </Grid>
        </Grid>

        {/* LEGAL IDENTITY SECTION */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: '#0f172a', color: 'white', mb: 10 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>Legal Identity</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                <b>DesiTech Solutions</b> is a technology services brand operated by <b>Biruma Technology Solutions Private Limited</b>.
                <br />Incorporated in 2025 under the Companies Act, 2013.
              </Typography>
            </Box>
            <Box sx={{ textAlign: { md: 'right' } }}>
              <Chip label={`CIN: U62010HR2025PTC139151`} sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 800, mb: 1 }} />
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Regd Office: Arjun Nagar, Gurgaon, HR</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* CONTACT SECTION */}
        <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, borderRadius: 8, bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={900} mb={2}>Let's Build Something Together</Typography>
          <Typography variant="h6" mb={4} sx={{ opacity: 0.9 }}>Available for consultations, partnerships, and custom development.</Typography>
          <Grid container spacing={3} justifyContent="center">
            <ContactInfo icon={<Phone />} label="+91 9508156282" />
            <ContactInfo icon={<Email />} label="info@desitechsolutions.com" />
            <ContactInfo icon={<LocationOn />} label="Gurgaon, Haryana" />
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

const LeaderCard = ({ name, role, desc, skills }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', textAlign: 'center', p: 3, height: '100%' }}>
    <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mx: 'auto', mb: 2, fontSize: 32, fontWeight: 800 }}>{name[0]}</Avatar>
    <Typography variant="h6" fontWeight={800}>{name}</Typography>
    <Typography variant="caption" color="primary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{role}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>{desc}</Typography>
    <Stack direction="row" spacing={1} justifyContent="center">
      {skills.map(s => <Chip key={s} label={s} size="small" variant="outlined" />)}
    </Stack>
  </Card>
);

const ContactInfo = ({ icon, label }) => (
  <Grid item xs={12} sm={4}>
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>{icon}</Avatar>
      <Typography variant="body1" fontWeight={700}>{label}</Typography>
    </Stack>
  </Grid>
);

export default AboutUs;