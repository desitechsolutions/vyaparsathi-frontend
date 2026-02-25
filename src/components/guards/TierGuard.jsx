import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../context/SubscriptionContext';
import { Box, CircularProgress } from '@mui/material';

const TierGuard = ({ children, requiredTier }) => {
  const { hasAccess, loading } = useSubscription();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAccess(requiredTier)) {
    return <Navigate to="/pricing" state={{ from: location, upgradeTo: requiredTier }} replace />;
  }

  return children;
};

export default TierGuard;