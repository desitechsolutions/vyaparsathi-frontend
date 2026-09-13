import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Card,
  CardContent,
} from '@mui/material';

const BudgetProgressBar = ({
  label,
  spent,
  budget,
  currency = '₹',
}) => {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = spent > budget;

  const getColor = () => {
    if (isOverBudget) return '#f44336';
    if (percentage >= 80) return '#ff9800';
    return '#4caf50';
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary">
            {label}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2">
              {currency}{spent?.toLocaleString()} / {currency}{budget?.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: getColor() }}>
              {percentage.toFixed(0)}%
              {isOverBudget && ' (OVER)'}
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: getColor(),
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default BudgetProgressBar;
