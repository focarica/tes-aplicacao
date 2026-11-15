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

output "security_group_id" {
  description = "Grupo de segurança a associar à EC2."
  value       = aws_security_group.web.id
}

output "internet_gateway_id" {
  description = "Gateway de Internet da VPC."
  value       = aws_internet_gateway.main.id
}

output "route_table_id" {
  description = "Tabela associada à sub-rede web."
  value       = aws_route_table.web.id
}
