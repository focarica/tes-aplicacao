variable "aws_region" {
  description = "Região permitida na conta AWS do projeto."
  type        = string
  default     = "us-east-1"
  nullable    = false
}

variable "project_name" {
  description = "Prefixo dos nomes e tag Project dos recursos."
  type        = string
  default     = "tes"
  nullable    = false

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,31}$", var.project_name))
    error_message = "Use de 3 a 32 caracteres: letras minúsculas, números e hífen, começando com uma letra."
  }
}

variable "availability_zone" {
  description = "Zona da sub-rede; null permite que a AWS selecione uma na região."
  type        = string
  default     = null
}
