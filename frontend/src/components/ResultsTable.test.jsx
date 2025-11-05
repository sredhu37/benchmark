import { render, screen } from '@testing-library/react';
import ResultsTable from './ResultsTable';

describe('ResultsTable', () => {
  const mockResults = [
    {
      url: 'https://example.com',
      region: 'us',
      availability: 99.5,
      p99Latency: 150,
      p95Latency: 130,
      p50Latency: 100,
      avgResponseTime: 110,
      totalRequests: 100,
      successfulRequests: 99,
      failedRequests: 1,
    },
    {
      url: 'https://example.com',
      region: 'asia',
      availability: 98.0,
      p99Latency: 250,
      p95Latency: 220,
      p50Latency: 180,
      avgResponseTime: 190,
      totalRequests: 100,
      successfulRequests: 98,
      failedRequests: 2,
    },
  ];

  it('should render nothing when no results', () => {
    const { container } = render(<ResultsTable results={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render results table with data', () => {
    render(<ResultsTable results={mockResults} />);
    
    expect(screen.getByText('Benchmark Results')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('ASIA')).toBeInTheDocument();
  });

  it('should display availability and latency metrics', () => {
    render(<ResultsTable results={mockResults} />);
    
    expect(screen.getByText('99.50%')).toBeInTheDocument();
    expect(screen.getByText('98.00%')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByText('250ms')).toBeInTheDocument();
  });

  it('should have export buttons', () => {
    render(<ResultsTable results={mockResults} />);
    
    expect(screen.getByRole('button', { name: /CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /JSON/i })).toBeInTheDocument();
  });
});
