import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  TextField,
  Button,
  Alert,
  Fade,
  Paper,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConstructionIcon from '@mui/icons-material/Construction';
import EmailIcon from '@mui/icons-material/Email';

const ComingSoonPage = ({ sectionName }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setTimeout(() => {
        setEmail('');
        setSubmitted(false);
      }, 4000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.04) 0%, transparent 45%),' +
          'radial-gradient(circle at 90% 80%, rgba(37, 99, 235, 0.05) 0%, transparent 45%),' +
          '#FAFBFD',
        py: { xs: 8, md: 12 },
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 4.5,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.02)',
            bgcolor: 'background.default',
            textAlign: 'center',
          }}
        >
          {/* Section Icon */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'rgba(245, 158, 11, 0.08)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3.5,
              border: '2px solid rgba(245, 158, 11, 0.15)',
            }}
          >
            <ConstructionIcon sx={{ fontSize: 32 }} />
          </Box>

          {/* Section Name */}
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 800, letterSpacing: 2, display: 'block', mb: 1 }}
          >
            {sectionName || 'VYAPARSATHI MODULE'}
          </Typography>

          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              color: 'text.primary',
              fontSize: { xs: '1.8rem', sm: '2.4rem' },
              letterSpacing: '-0.02em',
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            Under Active Development
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#64748B',
              fontWeight: 500,
              lineHeight: 1.6,
              mb: 4.5,
              maxWidth: 420,
              mx: 'auto',
            }}
          >
            We are putting the finishing touches on our new {sectionName ? `"${sectionName}"` : ''} pages. Enter your email below to receive updates and exclusive beta access.
          </Typography>

          {/* Form */}
          {submitted ? (
            <Fade in>
              <Alert severity="success" variant="filled" sx={{ mb: 4, borderRadius: 2, fontWeight: 600 }}>
                🎉 Thank you! We will notify you as soon as this goes live.
              </Alert>
            </Fade>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mb: 4 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!email.trim() || !/\S+@\S+\.\S+/.test(email)}
                  sx={{
                    px: 3,
                    py: { xs: 1.2, sm: 0 },
                    fontWeight: 800,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    minWidth: 140,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  }}
                >
                  Notify Me
                </Button>
              </Stack>
            </Box>
          )}

          {/* Back to Home Link */}
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
            }}
          >
            Back to home
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default ComingSoonPage;
