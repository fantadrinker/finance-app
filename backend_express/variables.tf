variable "vpc_info" {
  type = object({
    subnet_ids = list(string)
    vpc_id = string
  })
  sensitive = true
}

variable "image_url" {
  type = string
}

variable "docker_port" {
  type = number
}