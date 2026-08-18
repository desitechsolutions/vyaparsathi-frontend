import React, { useMemo } from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

/**
 * Password strength meter — client-side mirror of the backend
 * StrongPasswordValidator rules. Deliberately not zxcvbn: we want the FE
 * feedback to be exactly what the server enforces, so users can't be told
 * "Great!" by zxcvbn and then rejected by @StrongPassword on submit.
 *
 * Score is 0-4 (missing character class buckets). At 4 all rules pass.
 */
export function evaluatePassword(value) {
  const rules = {
    length: (value || '').length >= 8,
    upper: /[A-Z]/.test(value || ''),
    lower: /[a-z]/.test(value || ''),
    digit: /\d/.test(value || ''),
    special: /[^A-Za-z0-9\s]/.test(value || ''),
  };
  const passed = Object.values(rules).filter(Boolean).length;
  return { rules, score: Math.min(4, passed - 1 < 0 ? 0 : passed - 1) };
}

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['error', 'error', 'warning', 'info', 'success'];

export default function PasswordStrengthMeter({ value, showChecklist = true }) {
  const { rules, score } = useMemo(() => evaluatePassword(value), [value]);
  if (!value) return null;

  const pct = ((score + 1) / 5) * 100;

  return (
    <Stack spacing={1} sx={{ mt: 0.5 }}>
      <Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={COLORS[score]}
          sx={{ height: 6, borderRadius: 3 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Password strength: <strong>{LABELS[score]}</strong>
        </Typography>
      </Box>
      {showChecklist && (
        <Stack spacing={0.25}>
          <Requirement met={rules.length}>At least 8 characters</Requirement>
          <Requirement met={rules.upper}>One uppercase letter</Requirement>
          <Requirement met={rules.lower}>One lowercase letter</Requirement>
          <Requirement met={rules.digit}>One digit</Requirement>
          <Requirement met={rules.special}>One special character</Requirement>
        </Stack>
      )}
    </Stack>
  );
}

function Requirement({ met, children }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {met ? (
        <CheckCircleIcon fontSize="inherit" sx={{ fontSize: 14, color: 'success.main' }} />
      ) : (
        <RadioButtonUncheckedIcon fontSize="inherit" sx={{ fontSize: 14, color: 'text.disabled' }} />
      )}
      <Typography variant="caption" color={met ? 'text.primary' : 'text.secondary'}>
        {children}
      </Typography>
    </Stack>
  );
}
