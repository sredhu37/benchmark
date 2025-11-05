# Multi-Region Website Performance Benchmarking Application

## Project Overview
A full-stack web application that benchmarks and compares the availability and latency performance of a target website against up to 4 competitors across multiple geographic regions (Asia, Europe, US).

## Purpose
This application is designed for quick demonstrations (1-2 minute setup) to showcase performance benchmarking capabilities during technical interviews or client presentations.

## Architecture

### High-Level Design
```
                              User Browser
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   React Frontend         │
                    │   (Cloud Run - Global)   │
                    │   Port 3000 / HTTPS      │
                    └────────────┬─────────────┘
                                 │
                                 │ POST /api/benchmark
                                 │ {urls: [...], duration: 30}
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  Backend Orchestrator    │
                    │  (Cloud Run - Primary)   │
                    │  Port 5000 / HTTPS       │
                    │  - Receives requests     │
                    │  - Distributes to workers│
                    │  - Aggregates results    │
                    └────────────┬─────────────┘
                                 │
                   ┌─────────────┼─────────────┐
                   │             │             │
                   ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Asia Worker  │ │Europe Worker │ │  US Worker   │
        │ Cloud Run    │ │ Cloud Run    │ │ Cloud Run    │
        │ Singapore    │ │ Belgium      │ │ Iowa         │
        │ (asia-se1)   │ │ (europe-w1)  │ │ (us-cent1)   │
        └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
               │                │                │
               │ Parallel GET   │ Parallel GET   │ Parallel GET
               │ requests to    │ requests to    │ requests to
               │ all URLs       │ all URLs       │ all URLs
               │                │                │
               └────────────────┼────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Target & Competitors │
                    │  - target.com         │
                    │  - competitor1.com    │
                    │  - competitor2.com    │
                    │  - competitor3.com    │
                    │  - competitor4.com    │
                    └───────────────────────┘
```

### Architecture Components Explained

#### 1. **Frontend (React SPA)**
- **Purpose**: User interface for inputting URLs and displaying results
- **Location**: Single Cloud Run deployment (any region, or global CDN)
- **Responsibilities**:
  - Render input form for up to 5 URLs
  - Validate URL formats client-side
  - Send benchmark requests to Backend Orchestrator
  - Poll for results and display in table format
  - Export results as CSV/JSON

#### 2. **Backend Orchestrator (Main API Server)**
- **Purpose**: Coordinate benchmark jobs across all regions
- **Location**: Single Cloud Run deployment (us-central1 recommended)
- **Responsibilities**:
  - Receive benchmark requests from frontend
  - Generate unique job IDs
  - **Fan-out**: Call all 3 regional workers in parallel
  - **Aggregate**: Collect results from all workers
  - Calculate and format final metrics
  - Store job state (in-memory for demo, or Cloud Storage/Firestore)
- **Endpoints**:
  - `POST /api/benchmark` - Start new benchmark
  - `GET /api/benchmark/:jobId` - Get results
  - `GET /api/health` - Health check

#### 3. **Regional Workers (3 Instances)**
- **Purpose**: Execute actual HTTP benchmarks from specific geographic locations
- **Deployment Strategy**: Same Docker image, different GCP regions
- **Instances**:
  - **Asia Worker**: `asia-southeast1` (Singapore)
  - **Europe Worker**: `europe-west1` (Belgium)  
  - **US Worker**: `us-central1` (Iowa)
- **How They Work**:
  ```javascript
  // Each worker receives: { urls: [...], duration: 30, region: "asia" }
  async function runBenchmark(urls, duration, region) {
    const startTime = Date.now();
    const results = [];
    
    // Run for specified duration (e.g., 30 seconds)
    while (Date.now() - startTime < duration * 1000) {
      // Test ALL URLs concurrently in each iteration
      const promises = urls.map(url => testURL(url));
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      await sleep(100); // Small delay between batches
    }
    
    // Calculate metrics: availability, p99, p95, p50, avg
    return calculateMetrics(results, region);
  }
  ```

#### 4. **Why This Architecture Works**

**Geographic Distribution**: Each worker is physically located in a different continent, ensuring:
- Realistic network latency measurements
- Different routing paths to target websites
- Detection of CDN effectiveness
- Region-specific performance bottlenecks

**Parallel Execution**: All 3 workers run simultaneously:
```
Time 0s  ─────────────────────────────────────> Time 30s
Asia:     [====== Running Benchmark ======]
Europe:   [====== Running Benchmark ======]
US:       [====== Running Benchmark ======]
                                          └─> Results returned
```
Total time: ~30 seconds (not 90 seconds!)

**Load Distribution**: Each worker independently sends requests:
- No single point of failure
- Scales with Cloud Run auto-scaling
- Each region tests independently

### Request Flow (Detailed)

```
1. User submits form with 3 URLs (target + 2 competitors)
   │
   ▼
2. Frontend POSTs to Backend Orchestrator
   POST /api/benchmark
   {
     "urls": ["https://target.com", "https://comp1.com", "https://comp2.com"],
     "duration": 30,
     "regions": ["asia", "europe", "us"]
   }
   │
   ▼
3. Orchestrator generates jobId = "abc-123-def"
   Stores job status = "running"
   │
   ▼
4. Orchestrator calls all 3 regional workers IN PARALLEL:
   │
   ├─> POST https://asia-worker.run.app/internal/benchmark
   │   { urls: [...], duration: 30, region: "asia" }
   │
   ├─> POST https://europe-worker.run.app/internal/benchmark
   │   { urls: [...], duration: 30, region: "europe" }
   │
   └─> POST https://us-worker.run.app/internal/benchmark
       { urls: [...], duration: 30, region: "us" }
   │
   ▼
5. Each worker independently:
   - Sends GET requests to all 3 URLs repeatedly for 30s
   - Measures response time for each request
   - Tracks success/failure
   - After 30s, calculates metrics (availability, p99, p95, p50, avg)
   - Returns results to Orchestrator
   │
   ▼
6. Orchestrator waits for all 3 workers (using Promise.all)
   Receives 9 results total (3 URLs × 3 regions)
   │
   ▼
7. Orchestrator aggregates and stores results:
   {
     "jobId": "abc-123-def",
     "status": "completed",
     "results": [
       { url: "target.com", region: "asia", availability: 99.5, p99: 180 },
       { url: "target.com", region: "europe", availability: 100, p99: 95 },
       { url: "target.com", region: "us", availability: 100, p99: 45 },
       { url: "comp1.com", region: "asia", availability: 98.0, p99: 220 },
       { url: "comp1.com", region: "europe", availability: 99.0, p99: 120 },
       { url: "comp1.com", region: "us", availability: 99.5, p99: 60 },
       // ... 3 more for comp2.com
     ]
   }
   │
   ▼
8. Frontend polls GET /api/benchmark/abc-123-def
   Receives results and displays in table
```

### Data Flow Example

**Input:**
```javascript
{
  "urls": ["https://example.com", "https://competitor.com"],
  "duration": 10,
  "regions": ["asia", "europe", "us"]
}
```

**Asia Worker Output (after 10 seconds):**
```javascript
[
  {
    "url": "https://example.com",
    "region": "asia",
    "availability": 100,
    "p99Latency": 145,
    "p95Latency": 130,
    "p50Latency": 110,
    "avgResponseTime": 115,
    "totalRequests": 95,
    "successfulRequests": 95,
    "failedRequests": 0
  },
  {
    "url": "https://competitor.com",
    "region": "asia",
    "availability": 98.9,
    "p99Latency": 220,
    "totalRequests": 95,
    "successfulRequests": 94
  }
]
```

**Europe Worker Output:** (similar structure, different latencies)  
**US Worker Output:** (similar structure, different latencies)

**Final Aggregated Response:** 6 results (2 URLs × 3 regions)

## Technology Stack

### Frontend
- **Framework**: React 18+
- **UI Library**: Material-UI (MUI) or TailwindCSS
- **HTTP Client**: Axios
- **State Management**: React Hooks (useState, useEffect)
- **Build Tool**: Vite or Create React App

### Backend
- **Runtime**: Node.js 18+ with Express.js
- **HTTP Client**: Axios or node-fetch for making requests
- **CORS**: cors middleware
- **Regional Testing**: Multiple workers or serverless functions in different regions
- **Performance Metrics**: Calculate p99 latency and availability percentage

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Cloud Provider**: Google Cloud Platform (GCP)
- **Compute**: Cloud Run (serverless containers)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

### Testing
- **Backend Tests**: Jest with Supertest
- **Frontend Tests**: Jest with React Testing Library
- **Coverage**: Minimum 70% code coverage

## Functional Requirements

### Core Features
1. **URL Input Interface**
   - Accept 1-5 URLs (1 target + up to 4 competitors)
   - Validate URL format
   - Label the first URL as "Target" and others as "Competitor 1-4"

2. **Benchmark Execution**
   - Send GET requests to each URL from 3 regions: Asia, Europe, US
   - Run tests for configurable duration (default: 10-30 seconds)
   - Measure response times for each request
   - Track successful vs failed requests

3. **Metrics Calculation**
   - **Availability**: (Successful Requests / Total Requests) × 100%
   - **P99 Latency**: 99th percentile of response times
   - Calculate metrics per region for each URL

4. **Results Display**
   - Table format with columns: Website | Region | Availability | P99 Latency
   - Color coding: Green (good), Yellow (moderate), Red (poor)
   - Export results as CSV or JSON

## API Endpoints

### Backend REST API

#### POST /api/benchmark
Initiates a benchmark test
```json
Request:
{
  "urls": ["https://example.com", "https://competitor1.com"],
  "duration": 30,
  "regions": ["asia", "europe", "us"]
}

Response:
{
  "jobId": "uuid-v4",
  "status": "running"
}
```

#### GET /api/benchmark/:jobId
Retrieves benchmark results
```json
Response:
{
  "jobId": "uuid-v4",
  "status": "completed",
  "results": [
    {
      "url": "https://example.com",
      "region": "us",
      "availability": 99.5,
      "p99Latency": 250,
      "totalRequests": 1000,
      "successfulRequests": 995
    }
  ]
}
```

#### GET /api/health
Health check endpoint
```json
Response:
{
  "status": "healthy",
  "timestamp": "2025-11-05T12:00:00Z"
}
```

## Data Models

### BenchmarkJob
```typescript
interface BenchmarkJob {
  id: string;
  urls: string[];
  regions: Region[];
  duration: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  results: BenchmarkResult[];
}
```

### BenchmarkResult
```typescript
interface BenchmarkResult {
  url: string;
  region: Region;
  availability: number;
  p99Latency: number;
  p50Latency: number;
  p95Latency: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
}

type Region = 'asia' | 'europe' | 'us';
```

## Implementation Strategy

### Backend Orchestrator Implementation

The orchestrator is the main backend service that coordinates all benchmark operations:

```javascript
// src/controllers/benchmarkController.js

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Regional worker URLs (configured via environment variables)
const REGIONAL_WORKERS = {
  asia: process.env.ASIA_WORKER_URL,
  europe: process.env.EUROPE_WORKER_URL,
  us: process.env.US_WORKER_URL
};

// In-memory storage (replace with Redis/Firestore for production)
const jobs = new Map();

async function startBenchmark(req, res) {
  const { urls, duration = 30, regions = ['asia', 'europe', 'us'] } = req.body;
  
  // Validate inputs
  if (!urls || urls.length === 0 || urls.length > 5) {
    return res.status(400).json({ error: 'Provide 1-5 URLs' });
  }
  
  const jobId = uuidv4();
  jobs.set(jobId, { status: 'running', results: [] });
  
  // Don't await - return immediately
  runBenchmarkAsync(jobId, urls, duration, regions);
  
  res.json({ jobId, status: 'running' });
}

async function runBenchmarkAsync(jobId, urls, duration, regions) {
  try {
    // Call all regional workers in parallel
    const promises = regions.map(region => 
      callRegionalWorker(region, urls, duration)
    );
    
    const results = await Promise.all(promises);
    
    // Flatten results from all regions
    const allResults = results.flat();
    
    jobs.set(jobId, { status: 'completed', results: allResults });
  } catch (error) {
    jobs.set(jobId, { status: 'failed', error: error.message });
  }
}

async function callRegionalWorker(region, urls, duration) {
  const workerUrl = REGIONAL_WORKERS[region];
  
  const response = await axios.post(`${workerUrl}/internal/benchmark`, {
    urls,
    duration,
    region
  }, {
    timeout: (duration + 10) * 1000 // Add buffer
  });
  
  return response.data.results;
}

async function getResults(req, res) {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
}
```

### Regional Worker Implementation

Each regional worker runs the same code but in different GCP regions:

```javascript
// src/services/benchmarkService.js

const axios = require('axios');

async function executeBenchmark(urls, duration, region) {
  const startTime = Date.now();
  const results = [];
  
  console.log(`[${region}] Starting benchmark for ${urls.length} URLs`);
  
  // Run for specified duration
  while (Date.now() - startTime < duration * 1000) {
    // Test all URLs concurrently
    const promises = urls.map(url => testURL(url));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // Small delay to avoid overwhelming targets
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`[${region}] Completed ${results.length} total requests`);
  
  // Calculate metrics for each URL
  return calculateMetricsPerURL(results, region);
}

async function testURL(url) {
  const startTime = Date.now();
  
  try {
    await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Benchmark-Tool/1.0' }
    });
    
    return {
      url,
      latency: Date.now() - startTime,
      success: true,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      url,
      latency: null,
      success: false,
      timestamp: new Date(),
      error: error.message
    };
  }
}

function calculateMetricsPerURL(results, region) {
  // Group by URL
  const byURL = {};
  results.forEach(r => {
    if (!byURL[r.url]) byURL[r.url] = [];
    byURL[r.url].push(r);
  });
  
  // Calculate metrics for each URL
  return Object.entries(byURL).map(([url, urlResults]) => {
    const successful = urlResults.filter(r => r.success);
    const latencies = successful.map(r => r.latency).sort((a, b) => a - b);
    
    return {
      url,
      region,
      availability: (successful.length / urlResults.length) * 100,
      p99Latency: percentile(latencies, 0.99),
      p95Latency: percentile(latencies, 0.95),
      p50Latency: percentile(latencies, 0.50),
      avgResponseTime: average(latencies),
      totalRequests: urlResults.length,
      successfulRequests: successful.length,
      failedRequests: urlResults.length - successful.length
    };
  });
}

function percentile(sortedArray, p) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil(sortedArray.length * p) - 1;
  return sortedArray[Math.max(0, index)];
}

function average(array) {
  if (array.length === 0) return 0;
  return array.reduce((a, b) => a + b, 0) / array.length;
}
```

### Frontend Implementation

The React frontend provides the UI and polls for results:

```javascript
// src/components/BenchmarkForm.jsx

import { useState } from 'react';
import axios from 'axios';

function BenchmarkForm({ onResults }) {
  const [urls, setUrls] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(30);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validUrls = urls.filter(u => u.trim());
    
    if (validUrls.length === 0) {
      alert('Enter at least one URL');
      return;
    }
    
    setLoading(true);
    
    try {
      // Start benchmark
      const { data } = await axios.post('/api/benchmark', {
        urls: validUrls,
        duration,
        regions: ['asia', 'europe', 'us']
      });
      
      // Poll for results
      const results = await pollForResults(data.jobId);
      onResults(results);
    } catch (error) {
      alert('Benchmark failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const pollForResults = async (jobId) => {
    const maxAttempts = 60;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const { data } = await axios.get(`/api/benchmark/${jobId}`);
      
      if (data.status === 'completed') {
        return data.results;
      }
      
      if (data.status === 'failed') {
        throw new Error('Benchmark failed');
      }
      
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
    
    throw new Error('Timeout waiting for results');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Enter URLs to Benchmark</h2>
      {urls.map((url, i) => (
        <input
          key={i}
          type="url"
          placeholder={i === 0 ? 'Target URL' : `Competitor ${i} URL`}
          value={url}
          onChange={(e) => {
            const newUrls = [...urls];
            newUrls[i] = e.target.value;
            setUrls(newUrls);
          }}
        />
      ))}
      
      <label>
        Duration (seconds):
        <input
          type="number"
          min="10"
          max="60"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </label>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Running...' : 'Start Benchmark'}
      </button>
    </form>
  );
}
```

### Local Development Setup

For local development, simulate regional workers with different ports:

```javascript
// In local mode, all "workers" run on same machine but different ports
// docker-compose.yml will map:
// - backend-orchestrator: localhost:5000
// - asia-worker: localhost:5001
// - europe-worker: localhost:5002
// - us-worker: localhost:5003

// Set environment variables:
ASIA_WORKER_URL=http://localhost:5001
EUROPE_WORKER_URL=http://localhost:5002
US_WORKER_URL=http://localhost:5003
```

### Production Deployment Strategy

In production on GCP:
1. **Build single Docker image** for backend (used by orchestrator and all workers)
2. **Deploy orchestrator** to `us-central1`
3. **Deploy same image to 3 regions** as workers with different `REGION` env var
4. **Configure orchestrator** with worker URLs:
   ```
   ASIA_WORKER_URL=https://benchmark-worker-asia-xyz.run.app
   EUROPE_WORKER_URL=https://benchmark-worker-europe-xyz.run.app
   US_WORKER_URL=https://benchmark-worker-us-xyz.run.app
   ```

## Docker Configuration

### Multi-Container Setup
- **Frontend Container**: Nginx serving React build
- **Backend Container**: Node.js Express server
- **Docker Compose**: Orchestrates both containers for local development

### Dockerfile Best Practices
- Multi-stage builds to reduce image size
- Non-root user for security
- Layer caching optimization
- Health checks
- Environment variable configuration

## GCP Deployment Architecture

### Infrastructure Components
1. **Cloud Run Services**
   - Frontend service (public)
   - Backend service (public with API key)
   - Auto-scaling enabled

2. **Regional Workers**
   - Deploy backend instances in multiple GCP regions:
     - asia-southeast1 (Singapore)
     - europe-west1 (Belgium)
     - us-central1 (Iowa)

3. **Networking**
   - Cloud Load Balancer for traffic distribution
   - Cloud CDN for frontend assets
   - VPC for internal communication

4. **Monitoring**
   - Cloud Logging
   - Cloud Monitoring
   - Error Reporting

## Terraform Infrastructure

### Directory Structure
```
terraform/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── backend.tf           # Remote state configuration
├── modules/
│   ├── cloud-run/       # Cloud Run service module
│   ├── networking/      # VPC and networking
│   └── monitoring/      # Logging and monitoring
```

### Key Resources
- `google_cloud_run_service` - Frontend and backend services
- `google_cloud_run_service_iam_member` - Public access policies
- `google_project_service` - Enable required APIs
- `google_service_account` - Service accounts for Cloud Run

## CI/CD Pipeline

### GitHub Actions Workflows

#### PR Workflow (.github/workflows/pr.yml)
Triggers on: Pull Request
```yaml
Steps:
1. Checkout code
2. Setup Node.js
3. Install dependencies (frontend & backend)
4. Run linters (ESLint)
5. Run unit tests
6. Run integration tests
7. Build Docker images
8. Report test coverage
```

#### Deploy Workflow (.github/workflows/deploy.yml)
Triggers on: Push to main branch
```yaml
Steps:
1. Checkout code
2. Authenticate with GCP
3. Build Docker images
4. Push to Google Container Registry (GCR)
5. Apply Terraform changes
6. Deploy to Cloud Run
7. Run smoke tests
8. Notify deployment status
```

### Secrets Required
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `GCP_SA_KEY` - Service Account JSON key
- `TERRAFORM_STATE_BUCKET` - GCS bucket for Terraform state

## Testing Strategy

### Unit Tests
- **Backend**: Test individual functions, request handlers, metric calculations
- **Frontend**: Test React components, hooks, utility functions
- **Coverage Goal**: 80%+

### Test Files Structure
```
backend/
├── src/
│   ├── controllers/
│   │   ├── benchmarkController.js
│   │   └── benchmarkController.test.js
│   ├── services/
│   │   ├── benchmarkService.js
│   │   └── benchmarkService.test.js
│   └── utils/
│       ├── metrics.js
│       └── metrics.test.js

frontend/
└── src/
    ├── components/
    │   ├── BenchmarkForm.jsx
    │   ├── BenchmarkForm.test.jsx
    │   ├── ResultsTable.jsx
    │   └── ResultsTable.test.jsx
    └── utils/
        ├── formatters.js
        └── formatters.test.js
```

### Key Test Scenarios
1. URL validation (valid/invalid formats)
2. Benchmark execution with mock responses
3. P99 latency calculation accuracy
4. Availability percentage calculation
5. Error handling for unreachable URLs
6. Concurrent request handling

## Performance Metrics Calculation

### P99 Latency Algorithm
```javascript
function calculateP99(latencies) {
  const sorted = latencies.sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.99) - 1;
  return sorted[index];
}
```

### Availability Calculation
```javascript
function calculateAvailability(successful, total) {
  return (successful / total) * 100;
}
```

## Local Development Setup

### Prerequisites
- Node.js 18+
- Docker Desktop
- GCP Account (for deployment)
- Terraform 1.5+

### Quick Start Commands
```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Run locally
docker-compose up

# Run tests
npm test

# Build for production
npm run build
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Performance Benchmark
```

### Backend (.env)
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
REQUEST_TIMEOUT=10000
MAX_URLS=5
DEFAULT_DURATION=30
```

## Security Considerations

1. **Input Validation**: Sanitize all user-provided URLs
2. **Rate Limiting**: Implement rate limiting on API endpoints
3. **CORS**: Configure proper CORS policies
4. **Secrets Management**: Use GCP Secret Manager for sensitive data
5. **HTTPS Only**: Enforce HTTPS in production
6. **Authentication**: Optional API key authentication for backend

## Performance Optimizations

1. **Frontend**
   - Lazy loading of components
   - Memoization of expensive calculations
   - Debouncing of user inputs

2. **Backend**
   - Connection pooling for HTTP clients
   - Concurrent request execution
   - Response caching for repeated benchmarks

3. **Infrastructure**
   - CDN for static assets
   - Auto-scaling based on load
   - Regional deployment for low latency

## Monitoring and Observability

### Key Metrics to Track
- API response times
- Error rates
- Request throughput
- Container resource usage (CPU, Memory)
- Benchmark job completion time

### Logging Standards
- Use structured logging (JSON format)
- Include request IDs for tracing
- Log levels: ERROR, WARN, INFO, DEBUG

## Demo Script (1-2 Minutes)

1. **Open Application** (10 seconds)
   - Navigate to deployed URL
   - Show clean, intuitive interface

2. **Input URLs** (20 seconds)
   - Enter target URL (e.g., your website)
   - Add 2-3 competitor URLs
   - Click "Start Benchmark"

3. **Show Real-time Progress** (30 seconds)
   - Loading spinner or progress bar
   - Display "Running benchmarks..."

4. **Review Results** (30 seconds)
   - Table with color-coded metrics
   - Highlight best/worst performers
   - Explain availability and p99 latency

5. **Export Data** (10 seconds)
   - Click "Export CSV"
   - Show downloaded file

## Project File Structure

```
benchmark/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BenchmarkForm.jsx
│   │   │   ├── ResultsTable.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── benchmarkController.js
│   │   ├── services/
│   │   │   ├── benchmarkService.js
│   │   │   └── workerService.js
│   │   ├── utils/
│   │   │   ├── metrics.js
│   │   │   └── validator.js
│   │   ├── routes/
│   │   │   └── benchmark.js
│   │   └── server.js
│   ├── Dockerfile
│   ├── package.json
│   └── jest.config.js
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── backend.tf
├── .github/
│   └── workflows/
│       ├── pr.yml
│       └── deploy.yml
├── docker-compose.yml
├── README.md
├── AGENTS.md
└── LICENSE
```

## Code Style and Best Practices

### JavaScript/Node.js
- Use ES6+ features (async/await, arrow functions, destructuring)
- Follow Airbnb JavaScript Style Guide
- Use ESLint and Prettier for code formatting
- Write descriptive function and variable names

### React
- Functional components with hooks
- Props validation with PropTypes
- Component composition over inheritance
- Custom hooks for shared logic

### API Design
- RESTful conventions
- Consistent error responses
- API versioning (v1)
- OpenAPI/Swagger documentation

### Git Workflow
- Feature branch workflow
- Meaningful commit messages (conventional commits)
- Pull request reviews required
- Squash and merge to main

## Troubleshooting Guide

### Common Issues

1. **CORS Errors**
   - Verify CORS_ORIGIN environment variable
   - Check frontend API URL configuration

2. **Slow Benchmarks**
   - Increase REQUEST_TIMEOUT
   - Check network connectivity
   - Verify target URLs are accessible

3. **Docker Build Failures**
   - Clear Docker cache: `docker system prune`
   - Check Dockerfile syntax
   - Verify base image availability

4. **Terraform Apply Errors**
   - Check GCP API enablement
   - Verify service account permissions
   - Review Terraform state lock

## Future Enhancements

- WebSocket support for real-time results streaming
- Historical benchmark data storage (Cloud SQL)
- Advanced filtering and sorting of results
- Custom regions selection
- POST request benchmarking
- Authentication headers support
- Detailed waterfall charts
- Scheduled recurring benchmarks
- Email notifications for benchmark completion
- Multi-user support with authentication

## References and Documentation

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [GCP Cloud Run](https://cloud.google.com/run/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Success Criteria

### Development Phase
- ✅ All unit tests passing (80%+ coverage)
- ✅ Clean linter output (zero errors)
- ✅ Docker builds successfully
- ✅ Local development environment running smoothly

### Deployment Phase
- ✅ Terraform applies without errors
- ✅ Application accessible via public URL
- ✅ All regions responding correctly
- ✅ CI/CD pipeline executing successfully

### Demo Phase
- ✅ Complete demo in under 2 minutes
- ✅ Results displayed accurately
- ✅ UI is responsive and intuitive
- ✅ No errors during demonstration

---

## Notes for GitHub Copilot

This application prioritizes:
- **Speed of setup**: Quick local development and deployment
- **Simplicity**: Clear, maintainable code over complex abstractions
- **Reliability**: Robust error handling and testing
- **Scalability**: Cloud-native architecture with auto-scaling
- **Developer Experience**: Comprehensive documentation and tooling

When generating code:
- Follow the architectural patterns defined above
- Use the specified technology stack
- Include error handling and input validation
- Write tests alongside implementation code
- Add inline comments for complex logic
- Consider performance implications
- Ensure cross-region compatibility
