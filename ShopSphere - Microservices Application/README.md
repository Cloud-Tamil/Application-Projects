# ShopSphere - Microservices Application

## DevOps deployment notes

This project uses GitHub, Jenkins, Docker, Trivy, Amazon ECR, Kubernetes/EKS and Argo CD.

### Jenkins credentials

Configure these Jenkins credentials before running the pipeline:

- `aws-jenkins-creds` — AWS access key/secret with permission to authenticate to ECR, push images and read the EKS cluster.
- `github-token` — GitHub username/token with permission to push the ShopSphere manifest changes to `Cloud-Tamil/Application-Projects`.

The pipeline builds five images, runs Trivy filesystem and image scans for HIGH/CRITICAL findings, pushes immutable build-number tags to ECR, updates the Kubernetes image references, commits the manifest change with `[skip ci]`, and applies the manifests to Kubernetes. The Argo CD application watches the same `main` branch and `k8s` path.

### AWS / EKS prerequisites

1. Run Terraform from the `terraform` directory.
2. Configure AWS credentials locally before `terraform init` / `terraform apply`.
3. Run `aws eks update-kubeconfig --name shopsphere-eks --region us-east-1` after the cluster is created.
4. Install the AWS Load Balancer Controller in the EKS cluster before applying `k8s/ingress.yaml`.
5. Install Metrics Server before using the HPAs in `k8s/hpa.yaml`.
6. Install Argo CD and apply `argocd/application.yaml`.
7. Replace the placeholder value in `k8s/secrets.yaml` with a real secret in the cluster; do not commit real credentials.

### Local Docker Compose

Copy `.env.example` to `.env`, replace the placeholder secrets, then run:

```bash
docker compose up -d --build
```

The frontend is exposed on port 3000 and the API gateway on port 8080 by default.

### Kubernetes validation

```bash
kubectl apply -f k8s/ --recursive
kubectl get pods -n shopsphere
kubectl get svc -n shopsphere
kubectl get ingress -n shopsphere
kubectl get hpa -n shopsphere
kubectl rollout status deployment/api-gateway -n shopsphere
```

### Important security notes

- Do not commit `.env` files, AWS credentials, GitHub tokens, or production secrets.
- ECR repositories are configured as immutable and scan images on push.
- Kubernetes application containers run as non-root users where supported by the base image.
- Health probes, resource requests/limits, HPAs and PodDisruptionBudgets are included for the application workloads.
