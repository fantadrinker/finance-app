
provider "aws" {
  region = "us-east-1"
}

data "aws_vpc" "existing" {
  id = var.vpc_info.vpc_id
}


resource "aws_security_group" "ecs_sg" {
  vpc_id = data.aws_vpc.existing.id
  name   = "ecs_sg"


  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "ecs_sg_rule" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  security_group_id = aws_security_group.ecs_sg.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_ecs_cluster" "ecs_cluster" {
  name = "finance-app-tf-ecs"
}

resource "aws_cloudwatch_log_group" "ecs-finance-app" {
  name = "/ecs/finance-app-tf-ecs-logs"
}

resource "aws_ecs_task_definition" "finance_app" {
  family                   = "finance-app-tf-rd"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  memory                   = 2048
  cpu                      = 1024

  # todo: refactor
  execution_role_arn = "arn:aws:iam::962861289619:role/test-ecs-role-1"

  container_definitions = jsonencode([
    {
      name      = "finance-app-tf-backend"
      command   = ["node app.js"]
      entryPoint = ["node", "app.js"]
      workingDirectory = "/app"
      # image     = "docker.io/fredtsui/app_test_1:latest"
      image     = var.image_url
      essential = true
      portMappings = [
        {
          appProtocol = "http"
          containerPort = 3123
          hostPort      = 3123
          protocol      = "tcp"
        }
      ]

      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = "/ecs/finance-app-tf-ecs-logs"
          "awslogs-region" = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }
}

resource "aws_alb_target_group" "finance_app_alb_target_group" {
  name_prefix = "FinApp"
  port = 3123
  target_type = "ip"
  protocol = "HTTP"
  vpc_id = data.aws_vpc.existing.id

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_ecs_service" "finance_app_service" {
  name            = "finance-app-tf-service"
  cluster         = aws_ecs_cluster.ecs_cluster.arn
  task_definition = aws_ecs_task_definition.finance_app.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  health_check_grace_period_seconds = 60
  force_new_deployment = true
  wait_for_steady_state = true

  triggers = {
    redeployment = plantimestamp()
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.finance_app_alb_target_group.arn
    container_name   = "finance-app-tf-backend"
    container_port   = 3123
  }
  network_configuration {
    subnets          = var.vpc_info.private_subnet_ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }
}

locals {
  load_balancers = aws_ecs_service.finance_app_service.load_balancer
}

resource "aws_alb" "finance_app_alb" {
  name            = "finance-app-tf-alb"
  internal        = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.ecs_sg.id]
  subnets         = var.vpc_info.public_subnet_ids
}

resource "aws_alb_listener" "finance_app_alb_listener" {
  load_balancer_arn = aws_alb.finance_app_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.finance_app_alb_target_group.arn
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

output "lb_url" {
  value = [for lb in local.load_balancers : lb.target_group_arn]
}