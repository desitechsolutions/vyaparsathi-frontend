import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Popover,
  Box,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import { styled, keyframes } from '@mui/system';
import { useAuthContext } from '../context/AuthContext';

// 1. Define keyframes for a slightly more pronounced fade-in and scale animation
const fadeInScaleUp = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

// 2. Keyframes for a subtle rotate effect on the close icon
const rotateOnHover = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(90deg);
  }
`;

// 3. Create a styled component for the main popover content
const StyledPopoverContent = styled(Box)(({ theme }) => ({
  minWidth: 280,
  maxWidth: 320,
  background: 'linear-gradient(135deg, #1f4068 0%, #162447 100%)',
  color: '#fff',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  animation: `${fadeInScaleUp} 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
  position: 'relative',
}));

// 4. Create a styled icon button with a hover animation
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: 8,
  top: 8,
  color: 'rgba(255, 255, 255, 0.7)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    animation: `${rotateOnHover} 0.2s forwards`,
  },
}));

// Main UserProfile component
const UserProfile = ({ anchorEl, open, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // --- FIX IS HERE ---
  // Construct the display name, prioritizing first and last name.
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  // Fallback to username (sub) if full name is not available
  const displayName = fullName || user?.sub || 'User';
  
  const userRole = user?.role || 'Staff';
  const RoleIcon = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'owner' ? StarIcon : PersonIcon;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          borderRadius: 2,
        },
      }}
    >
      <StyledPopoverContent>
        <StyledIconButton
          aria-label="close"
          onClick={onClose}
        >
          <CloseIcon />
        </StyledIconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <RoleIcon sx={{ mr: 1, color: '#ffb74d' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {getGreeting()}, {displayName}!
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.2)' }} />
        
        <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
          {t('userProfilePage.role')}: {userRole}
        </Typography>
        <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8, mt: 0.5 }}>
          Your dedication makes a difference.
        </Typography>
      </StyledPopoverContent>
    </Popover>
  );
};

export default UserProfile;