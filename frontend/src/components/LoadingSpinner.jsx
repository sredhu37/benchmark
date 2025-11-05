import { Box, CircularProgress, Typography, Paper } from '@mui/material';

function LoadingSpinner({ message = 'Running benchmark...' }) {
  return (
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6">{message}</Typography>
        <Typography variant="body2" color="text.secondary">
          Testing URLs from Asia, Europe, and US regions
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This may take 30-60 seconds...
        </Typography>
      </Box>
    </Paper>
  );
}

export default LoadingSpinner;
