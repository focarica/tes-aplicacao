output "aws_region" {
  description = "Região onde os recursos foram criados."
  value       = var.aws_region
}

output "vpc_id" {
  description = "VPC para o servidor da aplicação."
  value       = aws_vpc.main.id
}
