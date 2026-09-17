# ShopSphere – Microservices Application

ShopSphere is an end-to-end Cloud/DevOps learning project using Node.js microservices, Docker, Kubernetes/EKS, AWS ECR, Jenkins, Trivy, Argo CD, Terraform, Prometheus and Grafana.

## Architecture

```text
Developer
   |
   v
Git / GitHub
   |
   v
Jenkins
   |-- source validation
   |-- frontend build
   |-- Trivy filesystem scan
   |-- Docker build
   |-- Trivy image scan
   |-- push immutable images to ECR
   `-- update Kubernetes image tags in Git
             |
             v
          Argo CD
             |
             v
          Amazon EKS
       +-----+-----------------------------+
       |                                   |
   ALB Ingress                         Private nodes
       |                                   |
   +---+---+                       +-------+-------+
   |       |                       |       |       |
Frontend API Gateway            Auth    User    Order
                                     \   |      /
                                      \  |     /
                                       MongoDB

Prometheus -> Grafana
```

## Repository layout

```text
ShopSphere - Microservices Application/
├── api-gateway/
├── auth-service/
├── user-service/
├── order-service/
├── frontend/
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── ingress.yaml
│   ├── network-policy.yaml
│   ├── api-gateway/
│   ├── auth-service/
│   ├── user-service/
│   ├── order-service/
│   ├── frontend/
│   └── mongo/
├── argocd/application.yaml
├── terraform/
├── jenkins/
├── monitoring/
├── scripts/bootstrap-k8s-secret.sh
├── docker-compose.yml
├── Jenkinsfile
├── .env.example
└── .gitignore
```

## Local development

1. Copy `.env.example` to `.env`.
2. Set a random `JWT_SECRET` of at least 32 characters and a strong Grafana password.
3. Start the application:

```bash
docker compose up -d --build
```

4. Check containers:

```bash
docker compose ps
```

5. Open the frontend at `http://localhost:3000`.

Useful local endpoints:

```text
Frontend:     http://localhost:3000
API Gateway:  http://localhost:8080
Auth:         http://localhost:4001/health
User:         http://localhost:4002/health
Order:        http://localhost:4003/health
Prometheus:   http://localhost:9090
Grafana:      http://localhost:3001
Jenkins:      http://localhost:8081
```

## Kubernetes / EKS deployment

Terraform creates:

- VPC with public and private subnets across two AZs
- Internet Gateway
- NAT Gateway
- EKS control plane
- Private EKS worker nodes
- ECR repositories
- Immutable ECR image tags
- ECR scan-on-push
- ECR lifecycle policy

Run Terraform:

```bash
cd terraform
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

Configure kubectl:

```bash
aws eks update-kubeconfig --name shopsphere-eks --region us-east-1
kubectl get nodes
```

### Kubernetes secret

The real JWT secret is intentionally not committed to Git.

Run:

```bash
chmod +x scripts/bootstrap-k8s-secret.sh
./scripts/bootstrap-k8s-secret.sh
```

Or create it directly:

```bash
kubectl -n shopsphere create secret generic shopsphere-secrets \
  --from-literal=JWT_SECRET='your-32-plus-character-secret'
```

### AWS Load Balancer Controller

The `k8s/ingress.yaml` expects the AWS Load Balancer Controller with an `alb` IngressClass. Install and configure the controller for the EKS cluster before applying the ingress.

### Argo CD

Install Argo CD in the cluster, then apply:

```bash
kubectl apply -f argocd/application.yaml
```

Argo CD watches:

```text
https://github.com/Cloud-Tamil/Application-Projects.git
path: ShopSphere - Microservices Application/k8s
targetRevision: main
```

Jenkins does not directly deploy application manifests. Jenkins changes image tags in Git; Argo CD reconciles the cluster. This keeps the deployment path GitOps-based.

## CI/CD flow

```text
GitHub push
   |
   v
Jenkins checkout
   |
   +--> Node.js syntax validation
   +--> Frontend build
   +--> Trivy filesystem + secret scan
   |
   v
Docker build
   |
   v
Trivy HIGH/CRITICAL image scan
   |
   v
AWS ECR push
   |
   v
Update k8s deployment image tags
   |
   v
Git commit + push [skip ci]
   |
   v
Argo CD detects Git change
   |
   v
Rolling deployment on EKS
```

### Jenkins credentials

Create these Jenkins credentials before running the pipeline:

- `aws-jenkins-creds`: AWS access for ECR and `sts:GetCallerIdentity`
- `github-token`: GitHub token with permission to push the repository

The Jenkins agent also needs Docker CLI access to the Docker daemon and the tools used by the pipeline.

## Container security

Backend containers:

- Node.js 20 Alpine
- production dependencies only
- non-root `node` user
- health checks
- minimal runtime configuration

Frontend container:

- multi-stage Node build
- unprivileged Nginx image
- listens on port 8080
- non-root Kubernetes security context

## Kubernetes security and reliability

The manifests include:

- namespace isolation
- ConfigMap for non-secret runtime configuration
- Kubernetes Secret reference for JWT secret
- readiness, liveness and startup probes
- CPU/memory requests and limits
- rolling updates
- PodDisruptionBudgets
- HorizontalPodAutoscalers
- NetworkPolicies
- non-root containers
- dropped Linux capabilities
- RuntimeDefault seccomp profile
- ClusterIP services
- ALB Ingress

## Important security rule

Never commit:

- `.env`
- real JWT secrets
- cloud access keys
- database passwords
- GitHub tokens
- Jenkins credentials

Use Kubernetes Secrets, AWS Secrets Manager, or another approved secret-management system for production credentials.

## Validation commands

Local:

```bash
docker compose config
docker compose ps
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health
curl http://localhost:8080/health
```

Kubernetes:

```bash
kubectl -n shopsphere get all
kubectl -n shopsphere get ingress
kubectl -n shopsphere get hpa
kubectl -n shopsphere get pdb
kubectl -n shopsphere get networkpolicy
kubectl -n shopsphere rollout status deployment/auth-service
kubectl -n shopsphere rollout status deployment/user-service
kubectl -n shopsphere rollout status deployment/order-service
kubectl -n shopsphere rollout status deployment/api-gateway
kubectl -n shopsphere rollout status deployment/frontend
```

## Troubleshooting

### Pods cannot pull ECR images

Check node IAM permissions:

```bash
kubectl get nodes
aws ecr describe-repositories --region us-east-1
```

The EKS node role created by Terraform receives `AmazonEC2ContainerRegistryReadOnly`.

### Pods fail because of JWT_SECRET

Create the namespace secret before the first application sync:

```bash
./scripts/bootstrap-k8s-secret.sh
```

### HPA shows unknown metrics

Install Metrics Server in the EKS cluster and verify:

```bash
kubectl top pods -n shopsphere
kubectl top nodes
```

### ALB is not created

Verify the AWS Load Balancer Controller, its IAM permissions, the `alb` IngressClass and the public subnet tags.

## Production evolution

For a production deployment, replace the in-cluster MongoDB deployment with Amazon DocumentDB or a managed database strategy, move Redis to ElastiCache, use AWS Secrets Manager/External Secrets, enable TLS on the ALB, add centralized logs/traces, and use separate GitOps overlays for dev/staging/prod.
