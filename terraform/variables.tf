variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "Default GCP region"
  type        = string
  default     = "us-central1"
}

variable "frontend_image" {
  description = "Frontend Docker image URL"
  type        = string
}

variable "backend_image" {
  description = "Backend Docker image URL"
  type        = string
}

variable "cors_origin" {
  description = "CORS origin for backend"
  type        = string
  default     = "*"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}
