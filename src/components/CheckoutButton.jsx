import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CheckoutButton = ({ children }) => {
  const navigate = useNavigate();

  return (
    <Button variant="contained" color="primary" onClick={() => navigate('/pricing')}>
      {children || 'Upgrade Plan'}
    </Button>
  );
};

export default CheckoutButton;