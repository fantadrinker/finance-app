variable "vpc_info" {
  type = object({
    public_subnet_ids = list(string)
    private_subnet_ids = list(string)
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