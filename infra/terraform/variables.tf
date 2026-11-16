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

variable "admin_ipv4_cidr" {
  description = "IPv4 público administrativo com /32 para SSH; null mantém SSH fechado."
  type        = string
  default     = null

  validation {
    condition = var.admin_ipv4_cidr == null ? true : (
      can(cidrnetmask(var.admin_ipv4_cidr)) &&
      can(regex("/32$", var.admin_ipv4_cidr))
    )
    error_message = "Informe um IPv4 válido com /32 ou null. SSH para redes amplas não é permitido."
  }
}
