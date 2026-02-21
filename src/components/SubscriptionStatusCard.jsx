import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SubscriptionStatusCard = () => {
  const { getStatus, isPremium, subscription } = useSubscription();
  const navigate = useNavigate();
  
  const premium = isPremium();
  const status = getStatus(); 
  const currentTier = subscription?.tier;
  const daysLeft = subscription?.daysRemaining;

  const goldenStyle = {
    background: 'linear-gradient(90deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
    backgroundSize: '200% auto',
    animation: `${shimmer} 5s linear infinite`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 800,
  };

  return (
    <Box 
      onClick={() => navigate('/pricing')}
      sx={{ 
        display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer',
        borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.02)',
        '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
      }}
    >
      <WorkspacePremiumIcon sx={{ 
        color: (premium || status === 'PENDING' || status === 'TRIAL') ? '#bf953f' : 'text.disabled', 
        fontSize: 18, mr: 1 
      }} />
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" sx={(premium || status === 'TRIAL') ? goldenStyle : { fontWeight: 700, color: 'text.secondary' }}>
          {/* PRIORITY LOGIC: We check TRIAL before checking the general Premium tier name */}
          {status === 'PENDING' ? 'VERIFYING...' : 
           status === 'TRIAL' ? 'TRIAL PLAN' : 
           premium ? `${currentTier} PLAN` : 'FREE PLAN'}
        </Typography>
        
        {/* Sub-text logic for secondary information */}
        {(premium || status === 'PENDING' || status === 'TRIAL') && (
          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: 'text.secondary', mt: -0.5 }}>
            {status === 'TRIAL' ? `${daysLeft} days trial left` : 
             status === 'PENDING' ? `Verifying ${currentTier} Payment` : 
             `${daysLeft} days remaining`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SubscriptionStatusCard;