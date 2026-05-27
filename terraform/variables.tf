variable "vercel_api_token" {
  description = "Vercel API トークン"
  type        = string
  sensitive   = true
}

variable "neon_api_key" {
  description = "Neon API キー"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub リポジトリ名 (例: username/ai-chat-app)"
  type        = string
}

variable "project_name" {
  description = "プロジェクト名"
  type        = string
  default     = "ai-chat-app"
}
