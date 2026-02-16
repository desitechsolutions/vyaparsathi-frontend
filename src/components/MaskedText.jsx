import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

const MaskedText = ({ value, children }) => {
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  if (isPremium()) return children || <span>{value}</span>;

  return (
    <Tooltip title="Upgrade to Pro to unlock this data">
      <Box 
        onClick={() => navigate('/pricing')}
        sx={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
      >
        <Typography sx={{ filter: 'blur(4px)', userSelect: 'none', color: 'text.secondary' }}>
          {value || 'Hidden Data'}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default MaskedText;