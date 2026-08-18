import React from 'react';
import { Box, Paper, Stack, Typography, Chip, Avatar, Button, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

/**
 * Reusable "This module is being built" page for compliance features
 * the sidebar advertises but which aren't shipped yet (GSTR filing,
 * GSTR-2B reconciliation, E-Way/E-Invoice hub, Period Lock, Cancelled
 * Documents register).
 *
 * Kept intentionally simple — it explains what the feature will do,
 * what's already in place under the hood, and offers a route back to
 * the module the user came from. Better UX than a 404 or a blank page.
 */
export default function ComingSoonPage({
  eyebrow = 'Compliance',
  title,
  description,
  bullets = [],
  tier = 'ENTERPRISE',
  fallbackPath = '/dashboard',
}) {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, textTransform: 'none' }}
      >
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, textAlign: 'center' }}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
          <ConstructionIcon fontSize="large" />
        </Avatar>
        <Stack spacing={1} alignItems="center">
          <Typography variant="overline" color="text.secondary" fontWeight={700}>
            {eyebrow}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620, mt: 1 }}>
            {description}
          </Typography>
          <Chip
            label={`Available on the ${tier === 'ENTERPRISE' ? 'Enterprise' : tier === 'PRO' ? 'Pro' : tier} plan`}
            color="primary"
            variant="outlined"
            sx={{ mt: 2, fontWeight: 700 }}
          />
        </Stack>

        {bullets.length > 0 && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ display: 'block', textAlign: 'left', mb: 1 }}>
              What's coming
            </Typography>
            <List dense sx={{ textAlign: 'left' }}>
              {bullets.map((b, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {b.done ? (
                      <CheckCircleOutlineIcon fontSize="small" color="success" />
                    ) : (
                      <RadioButtonUncheckedIcon fontSize="small" color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={b.label}
                    secondary={b.hint}
                    primaryTypographyProps={{ fontWeight: b.done ? 700 : 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        <Divider sx={{ my: 4 }} />

        <Button
          variant="contained"
          onClick={() => navigate(fallbackPath)}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          Take me back
        </Button>
      </Paper>
    </Box>
  );
}
