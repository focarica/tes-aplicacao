# Todos os cenários usam provedor simulado: não acessam a conta AWS.
mock_provider "aws" {}

variables {
  aws_region        = "us-east-1"
  project_name      = "tes-testes"
  availability_zone = null
  admin_ipv4_cidr   = null
}

run "rede_e_acesso_web" {
  # Apply simulado para resolver os IDs e verificar as ligações entre recursos.
  command = apply

  assert {
    condition     = aws_vpc.main.cidr_block == "10.0.0.0/16" && aws_subnet.web.cidr_block == "10.0.1.0/24"
    error_message = "A sub-rede deve ocupar o bloco previsto dentro da VPC."
  }

  assert {
    condition     = aws_route.internet.destination_cidr_block == "0.0.0.0/0" && !aws_subnet.web.map_public_ip_on_launch
    error_message = "A rede precisa da rota pública, deixando o IP da EC2 para a etapa do servidor."
  }

  assert {
    condition = (
      aws_subnet.web.vpc_id == aws_vpc.main.id &&
      aws_route_table.web.vpc_id == aws_vpc.main.id &&
      aws_internet_gateway.main.vpc_id == aws_vpc.main.id &&
      aws_security_group.web.vpc_id == aws_vpc.main.id
    )
    error_message = "Sub-rede, tabela, gateway e grupo de segurança devem pertencer à mesma VPC."
  }

  assert {
    condition = (
      aws_route_table_association.web.subnet_id == aws_subnet.web.id &&
      aws_route_table_association.web.route_table_id == aws_route_table.web.id &&
      aws_route.internet.route_table_id == aws_route_table.web.id &&
      aws_route.internet.gateway_id == aws_internet_gateway.main.id
    )
    error_message = "A sub-rede deve usar a tabela cuja rota aponta para o gateway da VPC."
  }

  assert {
    condition     = toset([for rule in aws_vpc_security_group_ingress_rule.web : rule.from_port]) == toset([80, 443])
    error_message = "As regras web devem conter exatamente as portas 80 e 443."
  }

  assert {
    condition = length(aws_vpc_security_group_ingress_rule.ssh) == 0 && alltrue([
      for rule in aws_vpc_security_group_ingress_rule.web :
      rule.from_port == rule.to_port && rule.ip_protocol == "tcp" &&
      rule.cidr_ipv4 == "0.0.0.0/0" && rule.security_group_id == aws_security_group.web.id
    ]) && length(aws_vpc_security_group_ingress_rule.web) == 2
    error_message = "Por padrão, apenas HTTP e HTTPS devem ter regras de entrada."
  }
}

run "ssh_restrito" {
  command = plan
  variables {
    admin_ipv4_cidr = "203.0.113.25/32"
  }

  assert {
    condition = length(aws_vpc_security_group_ingress_rule.ssh) == 1 && (
      aws_vpc_security_group_ingress_rule.ssh[0].cidr_ipv4 == "203.0.113.25/32" &&
      aws_vpc_security_group_ingress_rule.ssh[0].from_port == 22 &&
      aws_vpc_security_group_ingress_rule.ssh[0].to_port == 22 &&
      aws_vpc_security_group_ingress_rule.ssh[0].ip_protocol == "tcp" &&
      aws_vpc_security_group_ingress_rule.ssh[0].security_group_id == aws_security_group.web.id
    )
    error_message = "SSH deve permitir somente o endereço administrativo informado."
  }
}

run "recusar_ssh_publico" {
  command = plan
  variables {
    admin_ipv4_cidr = "0.0.0.0/0"
  }
  expect_failures = [var.admin_ipv4_cidr]
}

run "recusar_ssh_em_rede" {
  command = plan
  variables {
    admin_ipv4_cidr = "203.0.113.0/24"
  }
  expect_failures = [var.admin_ipv4_cidr]
}

run "recusar_ip_invalido" {
  command = plan
  variables {
    admin_ipv4_cidr = "999.1.1.1/32"
  }
  expect_failures = [var.admin_ipv4_cidr]
}

run "recusar_ipv6_para_ssh" {
  command = plan
  variables {
    admin_ipv4_cidr = "::1/32"
  }
  expect_failures = [var.admin_ipv4_cidr]
}
