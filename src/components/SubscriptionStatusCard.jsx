import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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
  const isExpired = status === 'EXPIRED';

  const goldenStyle = {
    background: 'linear-gradient(90deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
    backgroundSize: '200% auto',
    animation: `${shimmer} 5s linear infinite`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 800,
  };

  const expiredStyle = {
    color: '#d32f2f', // Material UI error color
    fontWeight: 800,
    textTransform: 'uppercase'
  };

  return (
    <Box 
      onClick={() => navigate('/pricing')}
      sx={{ 
        display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer',
        borderBottom: '1px solid', borderColor: 'divider', 
        bgcolor: isExpired ? 'rgba(211, 47, 47, 0.05)' : 'rgba(0,0,0,0.02)',
        '&:hover': { bgcolor: isExpired ? 'rgba(211, 47, 47, 0.1)' : 'rgba(0,0,0,0.05)' },
        transition: 'background-color 0.3s ease'
      }}
    >
      {isExpired ? (
        <ErrorOutlineIcon sx={{ color: '#d32f2f', fontSize: 18, mr: 1 }} />
      ) : (
        <WorkspacePremiumIcon sx={{ 
          color: (premium || status === 'PENDING' || status === 'TRIAL') ? '#bf953f' : 'text.disabled', 
          fontSize: 18, mr: 1 
        }} />
      )}
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" sx={isExpired ? expiredStyle : (premium || status === 'TRIAL') ? goldenStyle : { fontWeight: 700, color: 'text.secondary' }}>
          {status === 'PENDING' ? 'VERIFYING...' : 
           status === 'TRIAL' ? 'TRIAL PLAN' : 
           isExpired ? 'PLAN EXPIRED' :
           premium ? `${currentTier} PLAN` : 'FREE PLAN'}
        </Typography>
        
        {/* Sub-text logic for secondary information */}
        {(premium || status === 'PENDING' || status === 'TRIAL' || isExpired) && (
          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: isExpired ? '#d32f2f' : 'text.secondary', mt: -0.5, fontWeight: isExpired ? 600 : 400 }}>
            {status === 'TRIAL' ? `${daysLeft} days trial left` : 
             status === 'PENDING' ? `Verifying ${currentTier} Payment` : 
             isExpired ? 'Renew to unlock features' :
             `${daysLeft} days remaining`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SubscriptionStatusCard;