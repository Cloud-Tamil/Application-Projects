output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.shopsphere.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster API server"
  value       = aws_eks_cluster.shopsphere.endpoint
}

output "eks_cluster_certificate_authority" {
  description = "Base64-encoded certificate authority data"
  value       = aws_eks_cluster.shopsphere.certificate_authority[0].data
  sensitive   = true
}

output "vpc_id" {
  description = "ID of the ShopSphere VPC"
  value       = aws_vpc.shopsphere.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs for internet-facing load balancers"
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs used by EKS worker nodes"
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "ecr_repository_urls" {
  description = "ECR repository URLs for ShopSphere services"
  value       = { for name, repo in aws_ecr_repository.shopsphere : name => repo.repository_url }
}

output "kubeconfig_command" {
  description = "Command to configure kubectl for the EKS cluster"
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.shopsphere.name} --region ${var.aws_region}"
}
