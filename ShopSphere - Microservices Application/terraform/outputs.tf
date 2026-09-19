output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS API endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  value     = module.eks.cluster_certificate_authority_data
  sensitive = true
}

output "region" {
  value = var.aws_region
}

output "ecr_repository_urls" {
  description = "Map of service -> ECR URL"
  value       = { for k, r in aws_ecr_repository.svc : k => r.repository_url }
}

output "configure_kubectl" {
  description = "Run this to update kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}
