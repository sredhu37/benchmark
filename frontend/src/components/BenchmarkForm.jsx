import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Slider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

const MAX_URLS = 5;
const MIN_DURATION = 10;
const MAX_DURATION = 60;
const DEFAULT_DURATION = 30;

function BenchmarkForm({ onSubmit, loading }) {
  const [urls, setUrls] = useState(Array(MAX_URLS).fill(''));
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [error, setError] = useState('');

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Filter out empty URLs
    const validUrls = urls.filter((url) => url.trim() !== '');

    if (validUrls.length === 0) {
      setError('Please enter at least one URL');
      return;
    }

    // Validate URLs
    const invalidUrls = validUrls.filter((url) => {
      try {
        const urlObj = new URL(url);
        return urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:';
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      setError('Please enter valid HTTP/HTTPS URLs');
      return;
    }

    onSubmit(validUrls, duration);
  };

  const getUrlLabel = (index) => {
    if (index === 0) return 'Target URL';
    return `Competitor ${index} URL`;
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Website Performance Benchmark
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter up to 5 URLs to compare their availability and latency across Asia, Europe, and US regions
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          {urls.map((url, index) => (
            <TextField
              key={index}
              fullWidth
              label={getUrlLabel(index)}
              placeholder={index === 0 ? 'https://example.com' : `https://competitor${index}.com`}
              value={url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
              margin="normal"
              disabled={loading}
              required={index === 0}
            />
          ))}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>
            Duration: {duration} seconds
          </Typography>
          <Slider
            value={duration}
            onChange={(e, value) => setDuration(value)}
            min={MIN_DURATION}
            max={MAX_DURATION}
            step={5}
            marks
            valueLabelDisplay="auto"
            disabled={loading}
          />
          <Typography variant="caption" color="text.secondary">
            Longer duration provides more accurate results
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
        >
          {loading ? 'Running Benchmark...' : 'Start Benchmark'}
        </Button>
      </form>
    </Paper>
  );
}

export default BenchmarkForm;
