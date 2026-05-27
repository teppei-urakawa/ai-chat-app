terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.6"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "neon" {
  api_key = var.neon_api_key
}

# Neon プロジェクト（PostgreSQL）
resource "neon_project" "main" {
  name      = var.project_name
  region_id = "aws-ap-northeast-1"
}

# Vercel プロジェクト
resource "vercel_project" "main" {
  name      = var.project_name
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }
}

# Vercel 環境変数
resource "vercel_project_environment_variable" "database_url" {
  project_id = vercel_project.main.id
  key        = "DATABASE_URL"
  value      = neon_project.main.connection_uri
  target     = ["production", "preview"]
}

output "vercel_project_id" {
  value = vercel_project.main.id
}

output "neon_project_id" {
  value = neon_project.main.id
}

output "neon_connection_uri" {
  value     = neon_project.main.connection_uri
  sensitive = true
}
