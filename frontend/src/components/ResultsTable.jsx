import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
  Button,
  ButtonGroup,
} from '@mui/material';
import { Download, FileDownload } from '@mui/icons-material';
import {
  formatLatency,
  formatAvailability,
  getAvailabilityColor,
  getLatencyColor,
  exportToCSV,
  exportToJSON,
} from '../utils/formatters';

function ResultsTable({ results }) {
  if (!results || results.length === 0) {
    return null;
  }

  // Group results by URL
  const groupedByURL = results.reduce((acc, result) => {
    if (!acc[result.url]) {
      acc[result.url] = [];
    }
    acc[result.url].push(result);
    return acc;
  }, {});

  const handleExportCSV = () => {
    exportToCSV(results);
  };

  const handleExportJSON = () => {
    exportToJSON(results);
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Benchmark Results
        </Typography>
        <ButtonGroup variant="outlined" size="small">
          <Button startIcon={<Download />} onClick={handleExportCSV}>
            CSV
          </Button>
          <Button startIcon={<FileDownload />} onClick={handleExportJSON}>
            JSON
          </Button>
        </ButtonGroup>
      </Box>

      {Object.entries(groupedByURL).map(([url, urlResults], index) => (
        <Box key={url} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {index === 0 ? '🎯 Target: ' : `🏁 Competitor ${index}: `}
            <Typography component="span" variant="body2" color="text.secondary">
              {url}
            </Typography>
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Region</TableCell>
                  <TableCell>Availability</TableCell>
                  <TableCell>P99 Latency</TableCell>
                  <TableCell>P95 Latency</TableCell>
                  <TableCell>P50 Latency</TableCell>
                  <TableCell>Avg Response</TableCell>
                  <TableCell align="right">Requests</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {urlResults.map((result) => (
                  <TableRow key={`${result.url}-${result.region}`}>
                    <TableCell>
                      <Chip
                        label={result.region.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatAvailability(result.availability)}
                        color={getAvailabilityColor(result.availability)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatLatency(result.p99Latency)}
                        color={getLatencyColor(result.p99Latency)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatLatency(result.p95Latency)}</TableCell>
                    <TableCell>{formatLatency(result.p50Latency)}</TableCell>
                    <TableCell>{formatLatency(result.avgResponseTime)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="caption">
                        {result.successfulRequests}/{result.totalRequests}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Paper>
  );
}

export default ResultsTable;
