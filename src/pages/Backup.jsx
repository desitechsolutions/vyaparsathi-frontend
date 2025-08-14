import React from 'react';
import { Button, Typography } from '@mui/material';
import { exportBackup } from '../services/api';

const Backup = () => {
  const handleExport = async () => {
    try {
      const res = await exportBackup();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/octet-stream' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'backup.enc.zip';
      a.click();
    } catch (err) {
      console.error('Backup export error:', err);
    }
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>Backup & Export</Typography>
      <Button variant="contained" color="primary" onClick={handleExport}>Export Backup</Button>
    </div>
  );
};

export default Backup;