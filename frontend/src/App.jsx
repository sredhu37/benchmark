import { useState } from 'react';
import { Container, Box, Typography, Alert, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import BenchmarkForm from './components/BenchmarkForm';
import ResultsTable from './components/ResultsTable';
import LoadingSpinner from './components/LoadingSpinner';
import { startBenchmark, pollForResults } from './services/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleBenchmarkSubmit = async (urls, duration) => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      // Start benchmark
      const { jobId } = await startBenchmark(urls, duration);
      console.log('Benchmark started:', jobId);

      // Poll for results
      const data = await pollForResults(jobId);
      console.log('Benchmark completed:', data);

      setResults(data.results);
    } catch (err) {
      console.error('Benchmark error:', err);
      setError(err.message || 'Failed to run benchmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            🌍 Performance Benchmark Tool
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
            Compare website performance across multiple regions
          </Typography>

          <BenchmarkForm onSubmit={handleBenchmarkSubmit} loading={loading} />

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {loading && <LoadingSpinner />}

          {!loading && results && <ResultsTable results={results} />}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
