aws_region         = "us-east-1"
cluster_name       = "shopsphere-eks"
kubernetes_version = "1.34"
vpc_cidr           = "10.0.0.0/16"
node_instance_type = "t3.medium"
node_desired_size  = 2
node_min_size      = 1
node_max_size      = 4
