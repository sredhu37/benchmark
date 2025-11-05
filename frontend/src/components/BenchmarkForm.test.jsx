import { render, screen, fireEvent } from '@testing-library/react';
import BenchmarkForm from './BenchmarkForm';

describe('BenchmarkForm', () => {
  it('should render form elements', () => {
    render(<BenchmarkForm onSubmit={() => {}} loading={false} />);
    
    expect(screen.getByText('Website Performance Benchmark')).toBeInTheDocument();
    expect(screen.getByLabelText('Target URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Benchmark/i })).toBeInTheDocument();
  });

  it('should show error for empty form submission', () => {
    render(<BenchmarkForm onSubmit={() => {}} loading={false} />);
    
    const submitButton = screen.getByRole('button', { name: /Start Benchmark/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Please enter at least one URL')).toBeInTheDocument();
  });

  it('should disable form when loading', () => {
    render(<BenchmarkForm onSubmit={() => {}} loading={true} />);
    
    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('should call onSubmit with valid URLs', () => {
    const mockSubmit = jest.fn();
    render(<BenchmarkForm onSubmit={mockSubmit} loading={false} />);
    
    const targetInput = screen.getByLabelText('Target URL');
    fireEvent.change(targetInput, { target: { value: 'https://example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /Start Benchmark/i });
    fireEvent.click(submitButton);
    
    expect(mockSubmit).toHaveBeenCalledWith(['https://example.com'], 30);
  });
});
