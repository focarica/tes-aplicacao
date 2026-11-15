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
