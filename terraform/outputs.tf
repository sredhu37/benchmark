output "frontend_url" {
  description = "Frontend URL"
  value       = google_cloud_run_service.frontend.status[0].url
}

output "backend_orchestrator_url" {
  description = "Backend Orchestrator URL"
  value       = google_cloud_run_service.backend_orchestrator.status[0].url
}

output "backend_asia_url" {
  description = "Asia Worker URL"
  value       = google_cloud_run_service.backend_asia.status[0].url
}

output "backend_europe_url" {
  description = "Europe Worker URL"
  value       = google_cloud_run_service.backend_europe.status[0].url
}

output "backend_us_url" {
  description = "US Worker URL"
  value       = google_cloud_run_service.backend_us.status[0].url
}

output "service_account_email" {
  description = "Service Account Email"
  value       = google_service_account.cloud_run.email
}
