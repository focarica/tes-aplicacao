output "aws_region" {
  description = "Região onde os recursos foram criados."
  value       = var.aws_region
}

output "vpc_id" {
  description = "VPC para o servidor da aplicação."
  value       = aws_vpc.main.id
}

output "subnet_id" {
  description = "Sub-rede pública para a EC2; definir IP público na criação da instância."
  value       = aws_subnet.web.id
}

output "internet_gateway_id" {
  description = "Gateway de Internet da VPC."
  value       = aws_internet_gateway.main.id
}
