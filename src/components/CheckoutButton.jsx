import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';

const CheckoutButton = ({ children, ...props }) => {
  const navigate = useNavigate();
  const { isPremium, subscription } = useSubscription();

  const isOnTrial = subscription?.status === 'TRIAL';
  const premium = isPremium();

  // Determine the default text based on status
  const getDefaultText = () => {
    if (isOnTrial) return 'View Trial Status';
    if (premium) return 'Manage Subscription';
    return 'Upgrade Plan';
  };

  return (
    <Button 
      variant="contained" 
      color="primary" 
      onClick={() => navigate('/pricing')}
      {...props} // Allows you to pass extra MUI props like 'fullWidth' or 'size'
      sx={{ 
        fontWeight: 800, 
        textTransform: 'none', 
        borderRadius: '10px',
        ...props.sx 
      }}
    >
      {children || getDefaultText()}
    </Button>
  );
};

export default CheckoutButton;