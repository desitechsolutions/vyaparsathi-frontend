import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar, Toolbar, Box, Button, IconButton, Typography, Stack, Divider,
  Container, Drawer, List, ListItem, ListItemButton, ListItemText,
  Accordion, AccordionSummary, AccordionDetails, Chip, useMediaQuery, useTheme,
  Paper, Popper, Grow, ClickAwayListener, MenuList, MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CloudIcon from '@mui/icons-material/Cloud';
import StoreIcon from '@mui/icons-material/Store';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import GroceryIcon from '@mui/icons-material/LocalGroceryStore';
import DevicesIcon from '@mui/icons-material/Devices';
import StyleIcon from '@mui/icons-material/Style';
import ConstructionIcon from '@mui/icons-material/Construction';
import ArticleIcon from '@mui/icons-material/Article';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import ApiIcon from '@mui/icons-material/Api';
import CircleIcon from '@mui/icons-material/Circle';
import InfoIcon from '@mui/icons-material/Info';
import GroupsIcon from '@mui/icons-material/Groups';
import WorkIcon from '@mui/icons-material/Work';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── Navigate to a landing-page section anchor from any route ─────────────
// If already on '/', just smooth-scroll. Otherwise navigate to '/#<id>'.
const useNavAnchor = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (sectionId) => {
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Navigate to landing page then scroll after render
      navigate(`/#${sectionId}`);
    }
  };
};

// ─── Dropdown menu configs ──────────────────────────────────────────────────
const useMenuConfig = (t) => ({
  features: {
    title: t('enterpriseHeader.features'),
    section: 'features',
    columns: [
      {
        heading: 'Core Modules',
        items: [
          { icon: InventoryIcon, label: t('enterpriseHeader.featuresMenu.inventory'), desc: 'Stock tracking & alerts', section: 'features' },
          { icon: ReceiptLongIcon, label: t('enterpriseHeader.featuresMenu.billing'), desc: 'GST invoices & POS', section: 'features' },
          { icon: ShoppingCartIcon, label: t('enterpriseHeader.featuresMenu.purchase'), desc: 'PO & supplier mgmt', section: 'features' },
          { icon: PeopleIcon, label: t('enterpriseHeader.featuresMenu.customer'), desc: 'Dues & CRM', section: 'features' },
        ]
      },
      {
        heading: 'Advanced Tools',
        items: [
          { icon: BadgeIcon, label: t('enterpriseHeader.featuresMenu.staff'), desc: 'Payroll & attendance', section: 'features' },
          { icon: BarChartIcon, label: t('enterpriseHeader.featuresMenu.reports'), desc: 'Business intelligence', section: 'features' },
          { icon: AccountBalanceIcon, label: t('enterpriseHeader.featuresMenu.gst'), desc: 'GSTR filing data', section: 'features' },
          { icon: CloudIcon, label: t('enterpriseHeader.featuresMenu.backup'), desc: 'Auto daily backups', section: 'features' },
        ]
      }
    ]
  },
  solutions: {
    title: t('enterpriseHeader.solutions'),
    columns: [
      {
        heading: 'Business Types',
        items: [
          { icon: StoreIcon, label: 'Retail Shop', desc: 'Kirana & general stores', href: '/?industry=retail#solutions' },
          { icon: WarehouseIcon, label: 'Wholesale Business', desc: 'Bulk & trading', href: '/?industry=wholesale#solutions' },
          { icon: LocalShippingIcon, label: 'Distribution Business', desc: 'Route & delivery mgmt', href: '/?industry=distribution#solutions' },
          { icon: GroceryIcon, label: 'Multi-Store Business', desc: 'Fast-moving goods', href: '/?industry=grocery#solutions' },
        ]
      },
      {
        heading: 'Specializations',
        items: [
          { icon: DevicesIcon, label: 'Growing SMEs', desc: 'Electronics & retail', href: '/?industry=electronics#solutions' },
          { icon: StyleIcon, label: 'Fashion & Apparel', desc: 'Size, color variants', href: '/?industry=fashion#solutions' },
          { icon: ConstructionIcon, label: 'Hardware & Building', desc: 'Unit pricing & billing', href: '/?industry=hardware#solutions' },
        ]
      }
    ]
  },
  resources: {
    title: t('enterpriseHeader.resources'),
    columns: [
      {
        heading: 'Documentation',
        items: [
          { icon: ArticleIcon, label: 'Documentation', desc: 'Setup & user guides', href: '/docs' },
          { icon: ApiIcon, label: 'API Reference', desc: 'Developer reference', href: '/docs/api' },
          { icon: PlayCircleOutlineIcon, label: 'User Guides', desc: 'Step-by-step walkthroughs', href: '/docs' },
        ]
      },
      {
        heading: 'Support',
        items: [
          { icon: HelpOutlineIcon, label: 'Help Center', desc: 'Get in touch with our team', href: '/#contact' },
          { icon: RssFeedIcon, label: 'Tutorials', desc: 'Video & written tutorials', href: '/docs' },
          { icon: CircleIcon, label: 'FAQ', desc: 'Frequently asked questions', href: '/#faq' },
        ]
      }
    ]
  },
  company: {
    title: t('enterpriseHeader.company'),
    columns: [
      {
        heading: 'About Us',
        items: [
          { icon: InfoIcon, label: 'About VyaparSathi', desc: 'Our story & mission', href: 'https://www.desitechsolutions.com/products', external: true },
          { icon: GroupsIcon, label: 'Our Team', desc: 'Meet the people behind VyaparSathi', href: 'https://www.desitechsolutions.com/about', external: true },
          { icon: WorkIcon, label: 'Careers', desc: 'Join our growing team', href: 'https://www.desitechsolutions.com/careers', external: true },
        ]
      },
      {
        heading: 'Connect',
        items: [
          { icon: HandshakeIcon, label: 'Partnership Programs', desc: 'Grow together with us', href: 'https://www.desitechsolutions.com/about', external: true },
          { icon: ContactMailIcon, label: 'Contact Us', desc: 'Get in touch', href: '/#contact' },
        ]
      }
    ]
  }
});

// ─── Mega Dropdown Component ────────────────────────────────────────────────
const MegaDropdown = ({ menuKey, config, anchorRef, open, onClose, onNavAnchor, onMouseEnter, onMouseLeave }) => {
  const menu = config[menuKey];
  const navigate = useNavigate();
  if (!menu) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorRef.current}
      placement="bottom-start"
      transition
      disablePortal
      style={{ zIndex: 1300 }}
      modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
    >
      {({ TransitionProps }) => (
        <Grow {...TransitionProps} style={{ transformOrigin: 'top left' }}>
          <Paper
            elevation={0}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            sx={{
              minWidth: 520,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'rgba(0,0,0,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              mt: 0.5
            }}
          >
            <ClickAwayListener onClickAway={onClose}>
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  {menu.columns.map((col, ci) => (
                    <Box key={ci} sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color: 'text.disabled',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          display: 'block',
                          mb: 1.5,
                          px: 1
                        }}
                      >
                        {col.heading}
                      </Typography>
                      <Stack spacing={0.5}>
                        {col.items.map((item, ii) => {
                          const Icon = item.icon;
                          return (
                            <Box
                              key={ii}
                              component="button"
                              onClick={() => {
                                onClose();
                                if (item.href && item.href !== '#') {
                                  if (item.external || item.href.startsWith('http')) {
                                    window.open(item.href, '_blank', 'noopener,noreferrer');
                                  } else if (item.href.startsWith('/#')) {
                                    onNavAnchor(item.href.replace('/#', ''));
                                  } else if (item.href.includes('?industry=')) {
                                    // Navigate to landing with industry query param then scroll
                                    const url = new URL(item.href, window.location.origin);
                                    const industry = url.searchParams.get('industry');
                                    const hash = url.hash.replace('#', '');
                                    navigate(item.href.split('#')[0]);
                                    setTimeout(() => {
                                      const el = document.getElementById(hash || 'solutions');
                                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 200);
                                  } else {
                                    navigate(item.href);
                                  }
                                } else if (item.section) {
                                  onNavAnchor(item.section);
                                }
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.5,
                                p: 1.2,
                                borderRadius: 2,
                                textDecoration: 'none',
                                color: 'inherit',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.15s',
                                '&:hover': {
                                  bgcolor: 'rgba(37,99,235,0.04)',
                                  '& .icon-wrap': { bgcolor: 'primary.main', color: '#fff' },
                                  '& .label': { color: 'primary.main' }
                                }
                              }}
                            >
                              <Box
                                className="icon-wrap"
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 2,
                                  bgcolor: 'rgba(37,99,235,0.08)',
                                  color: 'primary.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  transition: 'all 0.15s'
                                }}
                              >
                                <Icon sx={{ fontSize: 18 }} />
                              </Box>
                              <Box>
                                <Typography
                                  className="label"
                                  variant="body2"
                                  sx={{ fontWeight: 700, color: '#1E293B', transition: 'color 0.15s' }}
                                >
                                  {item.label}
                                  {item.statusDot && (
                                    <Box
                                      component="span"
                                      sx={{
                                        display: 'inline-block',
                                        width: 7,
                                        height: 7,
                                        borderRadius: '50%',
                                        bgcolor: '#10B981',
                                        ml: 1,
                                        boxShadow: '0 0 6px #10B98180',
                                        verticalAlign: 'middle'
                                      }}
                                    />
                                  )}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  {item.desc}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  ))}
                </Box>
                {/* Footer CTA bar */}
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    ✅ All features available in 14-day free trial
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.78rem' }}
                    onClick={() => { onClose(); }}
                    component="a"
                    href="/login"
                  >
                    Start Free
                  </Button>
                </Box>
              </Box>
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  );
};

// ─── Main Header Component ──────────────────────────────────────────────────
const EnterpriseHeader = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const anchorRefs = {
    features: useRef(null),
    solutions: useRef(null),
    resources: useRef(null),
    company: useRef(null),
  };
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (key) => {
    if (isMobile) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveMenu(key);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const menuConfig = useMenuConfig(t);
  const navItems = ['features', 'solutions', 'resources', 'company'];
  const navAnchor = useNavAnchor();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setActiveMenu(null); setDrawerOpen(false); }, [location]);

  // After navigating to '/#<section>', perform scroll once landing page renders
  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      const sectionId = location.hash.replace('#', '');
      // Small timeout to allow the page to render before scrolling
      const timer = setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleMenuToggle = (key) => {
    setActiveMenu(prev => (prev === key ? null : key));
  };

  const handleNavAnchor = (sectionId) => {
    setActiveMenu(null);
    setDrawerOpen(false);
    navAnchor(sectionId);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: scrolled
            ? 'rgba(255,255,255,0.97)'
            : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
          color: '#0F172A',
          transition: 'all 0.3s ease',
          zIndex: 1200,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, lg: 4 } }}>
          <Toolbar
            disableGutters
            sx={{ height: { xs: 64, lg: 72 }, justifyContent: 'space-between', gap: 2 }}
          >
            {/* ── Logo ── */}
            <Box
              component="a"
              href="/"
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
            >
              <Box sx={{ height: { xs: 38, lg: 44 }, display: 'flex', alignItems: 'center' }}>
                <img
                  src="/desitechsolution.png"
                  alt="VyaparSathi"
                  style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
                />
              </Box>
            </Box>

            {/* ── Company Branding (Desktop Only) ── */}
            <Box
              sx={{
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center',
                gap: 2,
                ml: 0.5,
                flexShrink: 0,
              }}
            >
              <Divider orientation="vertical" flexItem sx={{ height: 32, my: 'auto', borderColor: 'rgba(0,0,0,0.12)' }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: '#94A3B8',
                    fontWeight: 600,
                    fontSize: '0.68rem',
                    letterSpacing: '0.3px',
                    lineHeight: 1.2,
                  }}
                >
                  Empowering Businesses Through Digital Innovation
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: '#64748B',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    lineHeight: 1.3,
                    mt: 0.2,
                  }}
                >
                  Biruma Technology Solutions Pvt. Ltd.
                </Typography>
              </Box>
            </Box>

            {/* ── Desktop Navigation ── */}
            {!isMobile && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, justifyContent: 'center' }}>
                {navItems.map((key) => (
                  <Box
                    key={key}
                    ref={anchorRefs[key]}
                    onMouseEnter={() => handleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Button
                      endIcon={
                        <KeyboardArrowDownIcon
                          sx={{
                            fontSize: '1rem !important',
                            transition: 'transform 0.2s',
                            transform: activeMenu === key ? 'rotate(180deg)' : 'none',
                          }}
                        />
                      }
                      onClick={() => handleMenuToggle(key)}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        textTransform: 'none',
                        color: activeMenu === key ? 'primary.main' : '#334155',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: 'primary.main' },
                        transition: 'all 0.2s',
                      }}
                    >
                      {menuConfig[key]?.title}
                    </Button>
                  </Box>
                ))}
                <Button
                  onClick={() => handleNavAnchor('pricing')}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    textTransform: 'none',
                    color: '#334155',
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: 'primary.main' },
                  }}
                >
                  {t('enterpriseHeader.pricing')}
                </Button>
              </Stack>
            )}

            {/* ── Right Actions ── */}
            <Stack direction="row" spacing={{ xs: 0.5, lg: 1 }} alignItems="center" sx={{ flexShrink: 0 }}>
              {/* Language Toggle */}
              <Button
                onClick={toggleLanguage}
                size="small"
                sx={{
                  minWidth: 40,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: '#64748B',
                  textTransform: 'none',
                  px: 1,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: 'primary.main' }
                }}
              >
                {i18n.language === 'en' ? 'हिन्दी' : 'EN'}
              </Button>

              {!isMobile && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto', mx: 0.5 }} />
                  <Button
                    onClick={() => navigate('/login')}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      textTransform: 'none',
                      color: '#334155',
                      px: 2,
                      '&:hover': { color: 'primary.main', bgcolor: 'rgba(0,0,0,0.04)' }
                    }}
                  >
                    {t('enterpriseHeader.login')}
                  </Button>
                </>
              )}

              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                endIcon={<ArrowForwardIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '0.78rem', lg: '0.88rem' },
                  textTransform: 'none',
                  px: { xs: 1.5, lg: 2.5 },
                  py: 1,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                    boxShadow: '0 6px 20px rgba(37,99,235,0.45)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s'
                }}
              >
                {t('enterpriseHeader.startFree')}
              </Button>

              {/* Mobile Hamburger */}
              {isMobile && (
                <IconButton
                  onClick={() => setDrawerOpen(true)}
                  sx={{ color: '#334155', ml: 0.5 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Stack>
          </Toolbar>
        </Container>

        {/* ── Desktop Dropdowns ── */}
        {!isMobile && navItems.map((key) => (
          <MegaDropdown
            key={key}
            menuKey={key}
            config={menuConfig}
            anchorRef={anchorRefs[key]}
            open={activeMenu === key}
            onClose={() => setActiveMenu(null)}
            onNavAnchor={handleNavAnchor}
            onMouseEnter={() => handleMouseEnter(key)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: '85vw',
            maxWidth: 380,
            borderLeft: 'none',
            borderRadius: '16px 0 0 16px',
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Drawer Header */}
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="subtitle1" fontWeight={900} sx={{
              background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              VyaparSathi
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Nav */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
            {navItems.map((key) => {
              const menu = menuConfig[key];
              return (
                <Accordion key={key} elevation={0} disableGutters sx={{ '&:before': { display: 'none' }, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                    sx={{ px: 2.5, py: 1.5, minHeight: 'unset', '& .MuiAccordionSummary-content': { my: 0 } }}
                  >
                    <Typography variant="body2" fontWeight={700} color="#1E293B">
                      {menu?.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, pb: 1 }}>
                    {menu?.columns.map((col, ci) => (
                      <Box key={ci} sx={{ px: 2.5, pb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
                          {col.heading}
                        </Typography>
                        {col.items.map((item, ii) => {
                          const Icon = item.icon;
                          return (
                            <ListItem key={ii} disablePadding>
                              <ListItemButton
                                onClick={(e) => {
                                  e.preventDefault();
                                  setDrawerOpen(false);
                                  if (item.href && item.href !== '#') {
                                    if (item.external || item.href.startsWith('http')) {
                                      window.open(item.href, '_blank', 'noopener,noreferrer');
                                    } else if (item.href.startsWith('/#')) {
                                      handleNavAnchor(item.href.replace('/#', ''));
                                    } else if (item.href.includes('?industry=')) {
                                      const url = new URL(item.href, window.location.origin);
                                      const hash = url.hash.replace('#', '');
                                      navigate(item.href.split('#')[0]);
                                      setTimeout(() => {
                                        const el = document.getElementById(hash || 'solutions');
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }, 200);
                                    } else {
                                      navigate(item.href);
                                    }
                                  } else if (item.section) {
                                    handleNavAnchor(item.section);
                                  }
                                }}
                                sx={{ py: 0.8, px: 1, borderRadius: 1.5 }}
                              >
                                <Icon sx={{ fontSize: 18, color: 'primary.main', mr: 1.5 }} />
                                <ListItemText
                                  primary={item.label}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: '#334155' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              );
            })}
            {/* Pricing direct link */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavAnchor('pricing')}
                sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
              >
                <ListItemText
                  primary={t('enterpriseHeader.pricing')}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 700, color: '#1E293B' }}
                />
              </ListItemButton>
            </ListItem>
          </Box>

          {/* Drawer Footer */}
          <Box sx={{ p: 2.5, borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => { navigate('/login'); setDrawerOpen(false); }}
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, py: 1.2 }}
            >
              {t('enterpriseHeader.login')}
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => { navigate('/login'); setDrawerOpen(false); }}
              endIcon={<ArrowForwardIcon />}
              sx={{
                fontWeight: 800,
                textTransform: 'none',
                borderRadius: 2,
                py: 1.2,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              }}
            >
              {t('enterpriseHeader.startFree')}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                onClick={toggleLanguage}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748B', textTransform: 'none' }}
              >
                {i18n.language === 'en' ? '🇮🇳 हिन्दी में बदलें' : '🇬🇧 Switch to English'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default EnterpriseHeader;
