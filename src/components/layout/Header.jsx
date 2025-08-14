import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../utils/auth';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          VyaparSathi
        </Typography>
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;