# Enable required APIs
resource "google_project_service" "run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "compute" {
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "container_registry" {
  service            = "containerregistry.googleapis.com"
  disable_on_destroy = false
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "benchmark-cloud-run"
  display_name = "Benchmark Cloud Run Service Account"
  description  = "Service account for benchmark application Cloud Run services"
}

# Frontend Cloud Run Service
resource "google_cloud_run_service" "frontend" {
  name     = "benchmark-frontend"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email

      containers {
        image = var.frontend_image

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        ports {
          container_port = 80
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run]
}

# Make frontend publicly accessible
resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Backend Orchestrator
resource "google_cloud_run_service" "backend_orchestrator" {
  name     = "benchmark-backend-orchestrator"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email

      containers {
        image = var.backend_image

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        ports {
          container_port = 5000
        }

        env {
          name  = "PORT"
          value = "5000"
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "REGION"
          value = "orchestrator"
        }

        env {
          name  = "CORS_ORIGIN"
          value = var.cors_origin
        }

        env {
          name  = "ASIA_WORKER_URL"
          value = google_cloud_run_service.backend_asia.status[0].url
        }

        env {
          name  = "EUROPE_WORKER_URL"
          value = google_cloud_run_service.backend_europe.status[0].url
        }

        env {
          name  = "US_WORKER_URL"
          value = google_cloud_run_service.backend_us.status[0].url
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.run,
    google_cloud_run_service.backend_asia,
    google_cloud_run_service.backend_europe,
    google_cloud_run_service.backend_us
  ]
}

# Make backend publicly accessible
resource "google_cloud_run_service_iam_member" "backend_orchestrator_public" {
  service  = google_cloud_run_service.backend_orchestrator.name
  location = google_cloud_run_service.backend_orchestrator.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Backend Worker - Asia (Singapore)
resource "google_cloud_run_service" "backend_asia" {
  name     = "benchmark-backend-asia"
  location = "asia-southeast1"

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email

      containers {
        image = var.backend_image

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        ports {
          container_port = 5000
        }

        env {
          name  = "PORT"
          value = "5000"
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "REGION"
          value = "asia"
        }

        env {
          name  = "CORS_ORIGIN"
          value = "*"
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run]
}

# Make Asia worker accessible to orchestrator
resource "google_cloud_run_service_iam_member" "backend_asia_public" {
  service  = google_cloud_run_service.backend_asia.name
  location = google_cloud_run_service.backend_asia.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Backend Worker - Europe (Belgium)
resource "google_cloud_run_service" "backend_europe" {
  name     = "benchmark-backend-europe"
  location = "europe-west1"

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email

      containers {
        image = var.backend_image

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        ports {
          container_port = 5000
        }

        env {
          name  = "PORT"
          value = "5000"
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "REGION"
          value = "europe"
        }

        env {
          name  = "CORS_ORIGIN"
          value = "*"
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run]
}

# Make Europe worker accessible to orchestrator
resource "google_cloud_run_service_iam_member" "backend_europe_public" {
  service  = google_cloud_run_service.backend_europe.name
  location = google_cloud_run_service.backend_europe.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Backend Worker - US (Iowa)
resource "google_cloud_run_service" "backend_us" {
  name     = "benchmark-backend-us"
  location = "us-central1"

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email

      containers {
        image = var.backend_image

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        ports {
          container_port = 5000
        }

        env {
          name  = "PORT"
          value = "5000"
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "REGION"
          value = "us"
        }

        env {
          name  = "CORS_ORIGIN"
          value = "*"
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run]
}

# Make US worker accessible to orchestrator
resource "google_cloud_run_service_iam_member" "backend_us_public" {
  service  = google_cloud_run_service.backend_us.name
  location = google_cloud_run_service.backend_us.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
