import React, { useState } from 'react';
import {
  Box, Container, Typography, Stack, Chip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';

const FAQSection = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState('q1');

  const faqs = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'].map(key => ({
    key,
    q: t(`landingPage.faq.${key}`),
    a: t(`landingPage.faq.a${key.replace('q', '')}`),
  }));

  return (
    <Box
      id="faq"
      sx={{ bgcolor: '#F8FAFC', py: { xs: 10, md: 14, lg: 18 } }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Chip
            label={t('landingPage.faq.sectionBadge')}
            size="small"
            sx={{
              bgcolor: 'rgba(37,99,235,0.08)',
              color: '#2563EB',
              fontWeight: 800,
              fontSize: '0.75rem',
              mb: 2.5,
              border: '1px solid rgba(37,99,235,0.15)',
            }}
          />
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              color: '#1E293B',
              fontSize: { xs: '2rem', md: '2.8rem' },
              letterSpacing: '-0.03em',
              mb: 2,
              lineHeight: 1.1,
            }}
          >
            {t('landingPage.faq.sectionTitle')}
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: '#64748B', fontWeight: 400, maxWidth: 480, mx: 'auto', lineHeight: 1.7, fontSize: '1rem' }}
          >
            {t('landingPage.faq.sectionSubtitle')}
          </Typography>
        </Box>

        {/* Accordion */}
        <Stack spacing={1.5}>
          {faqs.map((faq) => (
            <Accordion
              key={faq.key}
              expanded={expanded === faq.key}
              onChange={(_, isExpanded) => setExpanded(isExpanded ? faq.key : false)}
              elevation={0}
              sx={{
                borderRadius: '12px !important',
                border: '1px solid',
                borderColor: expanded === faq.key ? 'rgba(37,99,235,0.2)' : 'rgba(0,0,0,0.07)',
                bgcolor: expanded === faq.key ? 'rgba(37,99,235,0.02)' : '#ffffff',
                transition: 'all 0.25s',
                '&:before': { display: 'none' },
                '&:hover': { borderColor: 'rgba(37,99,235,0.2)' },
                overflow: 'hidden',
              }}
            >
              <AccordionSummary
                expandIcon={
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: expanded === faq.key ? 'primary.main' : 'rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.25s',
                      flexShrink: 0,
                    }}
                  >
                    <ExpandMoreIcon
                      sx={{
                        fontSize: 18,
                        color: expanded === faq.key ? '#fff' : '#64748B',
                        transition: 'transform 0.25s',
                        transform: expanded === faq.key ? 'rotate(180deg)' : 'none',
                      }}
                    />
                  </Box>
                }
                sx={{
                  px: 3,
                  py: 2,
                  '& .MuiAccordionSummary-content': { my: 0, mr: 2 },
                  '& .MuiAccordionSummary-expandIconWrapper': { transform: 'none !important' }
                }}
              >
                <Typography
                  variant="body1"
                  fontWeight={700}
                  sx={{ color: '#1E293B', lineHeight: 1.5 }}
                >
                  {faq.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ color: '#64748B', lineHeight: 1.8, fontWeight: 500 }}
                >
                  {faq.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>

        {/* Still have questions? */}
        <Box
          sx={{
            mt: 8,
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ color: '#F1F5F9', mb: 1 }}>
            Still have questions?
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
            Our support team typically responds within 2-4 hours.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={1}>
            <Box
              component="a"
              href="mailto:support@vyaparsathi.com"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 3,
                py: 1.2,
                borderRadius: 2.5,
                bgcolor: 'rgba(255,255,255,0.08)',
                color: '#CBD5E1',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: '1px solid rgba(255,255,255,0.12)',
                transition: '0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.14)' }
              }}
            >
              ✉️ Email Support
            </Box>
            <Box
              component="a"
              href="https://wa.me/919910007071"
              target="_blank"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 3,
                py: 1.2,
                borderRadius: 2.5,
                bgcolor: 'rgba(37,211,102,0.12)',
                color: '#6EE7B7',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: '1px solid rgba(37,211,102,0.2)',
                transition: '0.2s',
                '&:hover': { bgcolor: 'rgba(37,211,102,0.2)' }
              }}
            >
              💬 WhatsApp
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default FAQSection;
