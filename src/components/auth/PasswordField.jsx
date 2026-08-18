import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';

/**
 * Password TextField with a show/hide toggle.
 *
 * Drop-in replacement for MUI's <TextField type="password" …>. Preserves any
 * extra InputProps the caller supplies (start adornment, etc.).
 */
const PasswordField = React.forwardRef(function PasswordField(props, ref) {
  const {
    value,
    onChange,
    label = 'Password',
    autoComplete = 'current-password',
    InputProps = {},
    showStartIcon = true,
    ...rest
  } = props;

  const [visible, setVisible] = useState(false);

  const startAdornment = showStartIcon && (
    InputProps.startAdornment ?? <VpnKeyOutlinedIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
  );

  return (
    <TextField
      {...rest}
      inputRef={ref}
      label={label}
      value={value}
      onChange={onChange}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      InputProps={{
        ...InputProps,
        startAdornment,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              edge="end"
              size="small"
              tabIndex={-1}
            >
              {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
});

export default PasswordField;
