import React from 'react';
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
// Keeping the user's AuthContext import as requested
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
  // Apply a more prominent shadow for an 'elevated' look
  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  // Apply the custom animation
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
  // Use the provided context hook to get the user object
  const { user } = useAuthContext();

  // Determine the greeting based on the time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Keep the user name logic as it is
  const displayName = user?.name || user?.username || user?.sub || 'User';
  // Attempt to get the user's role from the context, defaulting to 'Staff'
  const userRole = user?.role || 'Staff';
  
  // Choose an icon based on the user's role
  const RoleIcon = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'owner' ? StarIcon : PersonIcon;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom', // Anchoring to the bottom of the click element
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top', // Popover animates from the top
        horizontal: 'right',
      }}
      // Enhanced PaperProps for a cleaner look
      PaperProps={{
        sx: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          borderRadius: 2,
        },
      }}
    >
      <StyledPopoverContent>
        {/* Close button with new styled component and animation */}
        <StyledIconButton
          aria-label="close"
          onClick={onClose}
        >
          <CloseIcon />
        </StyledIconButton>
        
        {/* Main greeting content */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <RoleIcon sx={{ mr: 1, color: '#ffb74d' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {getGreeting()}, {displayName}!
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.2)' }} />
        
        <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
          Role: {userRole}
        </Typography>
        <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8, mt: 0.5 }}>
          Your dedication makes a difference.
        </Typography>
      </StyledPopoverContent>
    </Popover>
  );
};

export default UserProfile;
