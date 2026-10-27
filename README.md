# Multi-Region Website Performance Benchmark

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/sredhu37)
[![Buy me a coffee on Ko-fi](https://img.shields.io/badge/Buy%20me%20a%20coffee-Ko--fi-FF5E5B?logo=kofi&logoColor=white)](https://ko-fi.com/sunnyredhu)

A full-stack application that benchmarks website performance across **Asia, Europe, and US** regions. Compare up to 5 URLs and measure availability, P99/P95/P50 latency in real-time.

**Perfect for 1-2 minute demos during interviews!**

## Quick Start

```bash
# 1. Setup
./setup.sh

# 2. Start all services
docker-compose up --build

# 3. Open browser
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

Or use Makefile:
```bash
make setup && make up
```

## Features

- Compare 1-5 URLs across 3 regions (Asia, Europe, US)
- Metrics: Availability %, P99/P95/P50 latency, Avg response time
- Real-time progress with Material-UI interface
- Export results as CSV/JSON
- Cloud-native with auto-scaling on GCP

## Architecture

**Tech Stack:** React + Node.js + Express + Docker + Terraform + GCP Cloud Run

```
Frontend → Orchestrator → [Asia Worker | Europe Worker | US Worker]
```

See [AGENTS.md](./AGENTS.md) for detailed architecture.

## Project Structure

```
benchmark/
├── frontend/          # React + Material-UI
├── backend/           # Node.js + Express
├── terraform/         # GCP Cloud Run infrastructure
├── .github/workflows/ # CI/CD pipelines
└── docker-compose.yml # Local development
```

## Testing

```bash
cd backend && npm test
cd frontend && npm test

# With coverage
npm test -- --coverage
```

## Deploy to GCP

### Prerequisites
- GCP account with billing enabled
- Docker installed
- Terraform 1.5+

### Steps

1. **Build & Push Images**
   ```bash
   export GCP_PROJECT_ID="your-project-id"
   
   docker build -t gcr.io/$GCP_PROJECT_ID/benchmark-backend:latest ./backend
   docker push gcr.io/$GCP_PROJECT_ID/benchmark-backend:latest
   
   docker build -t gcr.io/$GCP_PROJECT_ID/benchmark-frontend:latest ./frontend
   docker push gcr.io/$GCP_PROJECT_ID/benchmark-frontend:latest
   ```

2. **Deploy with Terraform**
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your project details
   
   terraform init
   terraform apply
   ```

3. **Get URLs**
   ```bash
   terraform output frontend_url
   terraform output backend_orchestrator_url
   ```

### Auto-Deploy via GitHub Actions
Configure secrets (`GCP_PROJECT_ID`, `GCP_SA_KEY`) and push to main:
```bash
git push origin main
```

## API Endpoints

### `POST /api/benchmark`
Start benchmark
```json
{
  "urls": ["https://example.com", "https://competitor.com"],
  "duration": 30,
  "regions": ["asia", "europe", "us"]
}
```

### `GET /api/benchmark/:jobId`
Get results
```json
{
  "jobId": "uuid",
  "status": "completed",
  "results": [...]
}
```

### `GET /api/health`
Health check

## Demo Script (1-2 min)

1. Open http://localhost:3000
2. Enter URLs: `google.com`, `bing.com`, `duckduckgo.com`
3. Click "Start Benchmark" → Wait 30s
4. View color-coded metrics table
5. Export as CSV/JSON

## 🛠️ Development

```bash
make setup        # Initial setup
make up           # Start services
make test         # Run tests
make logs         # View logs
make down         # Stop services

# Manual
cd backend && npm run dev     # Port 5000
cd frontend && npm run dev    # Port 3000
```

## Security

- Input validation on all endpoints
- CORS properly configured
- Non-root users in containers
- Security headers in Nginx
- HTTPS enforced in production

## License

Apache License - see [LICENSE](LICENSE)

---

**Built with:** React • Node.js • Express • Material-UI • Docker • Terraform • GCP Cloud Run
