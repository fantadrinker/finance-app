
provider "aws" {
  region = "us-east-1"
}

data "aws_vpc" "existing" {
  id = var.vpc_info.vpc_id
}


resource "aws_security_group" "ecs_sg" {
  vpc_id = data.aws_vpc.existing.id
  name   = "ecs_sg"

  ingress {
    from_port   = var.docker_port
    to_port     = var.docker_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_cluster" "ecs_cluster" {
  name = "finance-app-tf-ecs"
}

resource "aws_ecs_task_definition" "finance_app" {
  family                   = "finance-app-tf"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  memory                   = 512
  cpu                      = 256

  # todo: refactor
  execution_role_arn = "arn:aws:iam::962861289619:role/test-ecs-role-1"

  container_definitions = jsonencode([
    {
      name      = "finance-app-ecs-backend"
      # image     = "docker.io/fredtsui/app_test_1:latest"
      image     = var.image_url
      cpu       = 256
      memory    = 512
      essential = true
      portMappings = [
        {
          containerPort = 3123
          hostPort      = 3123
          protocol      = "tcp"
        }
      ]
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }
}

resource "aws_ecs_service" "finance_app_service" {
  name            = "finance-app-tf-service"
  cluster         = aws_ecs_cluster.ecs_cluster.arn
  task_definition = aws_ecs_task_definition.finance_app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.vpc_info.subnet_ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }
}

output "service_name" {
  value = aws_ecs_service.finance_app_service.name
}

output "cluster_name" {
  value = aws_ecs_cluster.ecs_cluster.name
}

output "task_id" {
  value = aws_ecs_task_definition.finance_app.id
}