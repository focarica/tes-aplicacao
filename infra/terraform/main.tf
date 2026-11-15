terraform {
  required_version = ">= 1.7.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "Terraform"
    }
  }
}

locals {
  vpc_cidr    = "10.0.0.0/16"
  subnet_cidr = cidrsubnet(local.vpc_cidr, 8, 1) # 10.0.1.0/24
}

resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_subnet" "web" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = false # O IP público será definido na etapa da EC2.

  tags = { Name = "${var.project_name}-subnet-public" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-igw" }
}

resource "aws_route_table" "web" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-rt-public" }
}

resource "aws_route" "internet" {
  route_table_id         = aws_route_table.web.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "web" {
  subnet_id      = aws_subnet.web.id
  route_table_id = aws_route_table.web.id
}

resource "aws_security_group" "web" {
  name        = "${var.project_name}-sg-web"
  description = "HTTP/HTTPS for TES; optional SSH from one administrative IPv4"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.project_name}-sg-web" }
}

resource "aws_vpc_security_group_ingress_rule" "web" {
  for_each = { http = 80, https = 443 }

  security_group_id = aws_security_group.web.id
  description       = each.key == "http" ? "HTTP redirect and ACME" : "HTTPS website"
  ip_protocol       = "tcp"
  from_port         = each.value
  to_port           = each.value
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  count = var.admin_ipv4_cidr == null ? 0 : 1

  security_group_id = aws_security_group.web.id
  description       = "SSH administrative IPv4 only"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.admin_ipv4_cidr
}

# Saída para instalar dependências e acessar serviços como Cognito.
resource "aws_vpc_security_group_egress_rule" "outbound" {
  security_group_id = aws_security_group.web.id
  description       = "Outbound access for dependencies and AWS services"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}
