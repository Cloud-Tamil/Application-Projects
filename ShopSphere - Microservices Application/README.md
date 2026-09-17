# 📘 ShopSphere — Useful Commands README

A single, copy-paste reference for every useful command across the entire ShopSphere stack: Docker, Docker Compose, Kubernetes, Jenkins, ArgoCD, Terraform, Prometheus, Grafana, MongoDB, Node.js, Git, and troubleshooting.

## 📑 Table of Contents

- [Prerequisites Check](#-prerequisites-check)
- [Git Commands](#-git-commands)
- [Node.js / npm Commands](#-nodejs--npm-commands)
- [Docker Commands](#-docker-commands)
- [Docker Compose Commands](#-docker-compose-commands)
- [MongoDB Commands](#-mongodb-commands)
- [Redis Commands](#-redis-commands)
- [API Testing (curl)](#-api-testing-curl)
- [Kubernetes Commands](#-kubernetes-commands)
- [Helm Commands](#-helm-commands)
- [Jenkins Commands](#-jenkins-commands)
- [ArgoCD Commands](#-argocd-commands)
- [Terraform Commands](#-terraform-commands)
- [AWS CLI Commands](#-aws-cli-commands)
- [Prometheus Commands](#-prometheus-commands)
- [Grafana Commands](#-grafana-commands)
- [Logs & Debugging](#-logs--debugging)
- [Monitoring & Stats](#-monitoring--stats)
- [Backup & Restore](#-backup--restore)
- [Cleanup Commands](#-cleanup-commands)
- [Troubleshooting Snippets](#-troubleshooting-snippets)
- [One-Shot Boot & Verify](#-one-shot-boot--verify)
- [Ports Reference](#-ports-reference)
- [Quick Cheatsheet](#-quick-cheatsheet)

---

## ✅ Prerequisites Check

```bash
# Check every tool version at once
docker --version
docker compose version
node -v
npm -v
git --version
kubectl version --client
helm version
terraform -version
aws --version
argocd version --client
jq --version
curl --version

cp .env.example .env
```

---

## 🌳 Git Commands

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/ShopSphere-Microservices.git
cd ShopSphere-Microservices

# Status & branches
git status
git branch
git branch -a
git checkout -b feat/my-feature

# Stage, commit, push
git add .
git add <file>
git commit -m "feat: add X"
git push origin feat/my-feature
git push -u origin main

# Pull & rebase
git pull
git pull --rebase origin main

# Logs
git log --oneline --graph --decorate --all
git log -n 10

# Undo
git restore <file>
git reset --soft HEAD~1
git reset --hard HEAD~1

# Tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Stash
git stash
git stash list
git stash pop

# Remotes
git remote -v
git remote add upstream <url>
```

---

## 🟢 Node.js / npm Commands

```bash
# Install in a service
cd auth-service
npm install
npm ci                     # clean install from lockfile

# Run
npm start                  # production
npm run dev                # if configured

# Update deps
npm outdated
npm update

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Audit
npm audit
npm audit fix

# Global tools
npm install -g nodemon
npm install -g pm2

# Run with env inline
PORT=4001 MONGO_URI=mongodb://localhost:27017/authdb JWT_SECRET=devsecret npm start
```

---

## 🐳 Docker Commands

### Build

```bash
docker build -t shopsphere/api-gateway:latest   ./api-gateway
docker build -t shopsphere/auth-service:latest  ./auth-service
docker build -t shopsphere/user-service:latest  ./user-service
docker build -t shopsphere/order-service:latest ./order-service
docker build -t shopsphere/frontend:latest      ./frontend
docker build -t shopsphere/jenkins:latest       ./jenkins

# Build without cache
docker build --no-cache -t shopsphere/auth-service:latest ./auth-service

# Build with build args
docker build --build-arg NODE_ENV=production -t shopsphere/auth-service:latest ./auth-service
```

### Run

```bash
docker run -d --name test-auth -p 4001:4001 shopsphere/auth-service:latest
docker run -it --rm shopsphere/auth-service:latest sh
docker run -d -p 27017:27017 --name mongo mongo:6
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### Inspect

```bash
docker ps
docker ps -a
docker images
docker images | grep shopsphere
docker volume ls
docker network ls
docker logs <container>
docker logs -f --tail 100 <container>
docker exec -it <container> sh
docker inspect <container>
docker stats
docker top <container>
```

### Stop / Remove

```bash
docker stop <container>
docker start <container>
docker restart <container>
docker rm <container>
docker rm -f <container>
docker rmi shopsphere/auth-service:latest
docker rmi $(docker images "shopsphere/*" -q)
```

### Registry

```bash
docker login
docker tag shopsphere/auth-service:latest youruser/auth-service:latest
docker push youruser/auth-service:latest
docker pull youruser/auth-service:latest
docker logout
```

### Global cleanup

```bash
docker system df
docker system prune -f
docker system prune -a -f
docker system prune -a --volumes -f     # ⚠ destroys volumes
docker container prune -f
docker image prune -a -f
docker volume prune -f
docker network prune -f
```

---

## 🐙 Docker Compose Commands

```bash
# Start / stop
docker compose up -d
docker compose up --build -d
docker compose up -d --force-recreate
docker compose down
docker compose down -v
docker compose stop
docker compose start
docker compose restart

# Specific services
docker compose up -d mongo redis
docker compose up -d --build order-service
docker compose restart auth-service
docker compose stop user-service

# Inspect
docker compose ps
docker compose ps -a
docker compose top
docker compose config
docker compose images

# Logs
docker compose logs
docker compose logs -f
docker compose logs -f api-gateway
docker compose logs --tail=100 auth-service

# Exec
docker compose exec auth-service sh
docker compose exec mongo mongosh
docker compose exec redis redis-cli

# Scale
docker compose up -d --scale order-service=3

# Pull base images
docker compose pull
```

---

## 🗄 MongoDB Commands

```bash
# Open shell
docker compose exec mongo mongosh
# or
docker exec -it shopsphere-mongo mongosh
```

Inside `mongosh`:

```js
show dbs
use authdb
show collections
db.authusers.find().pretty()
db.authusers.countDocuments()
db.authusers.findOne({ email: "admin@shop.com" })

use userdb
db.profiles.find().pretty()

use orderdb
db.orders.find().sort({ createdAt: -1 }).pretty()

// Delete all
db.authusers.deleteMany({})

// Drop DB
db.dropDatabase()
```

### Backup & Restore

```bash
# Backup all DBs
docker exec shopsphere-mongo mongodump --out /tmp/backup
docker cp shopsphere-mongo:/tmp/backup ./backup

# Backup single DB
docker exec shopsphere-mongo mongodump --db authdb --out /tmp/auth-backup
docker cp shopsphere-mongo:/tmp/auth-backup ./auth-backup

# Restore
docker cp ./backup shopsphere-mongo:/tmp/backup
docker exec shopsphere-mongo mongorestore /tmp/backup

# Export JSON
docker exec shopsphere-mongo mongoexport --db authdb --collection authusers --out /tmp/users.json
docker cp shopsphere-mongo:/tmp/users.json ./users.json

# Import JSON
docker cp ./users.json shopsphere-mongo:/tmp/users.json
docker exec shopsphere-mongo mongoimport --db authdb --collection authusers --file /tmp/users.json
```

---

## 🔴 Redis Commands

```bash
docker compose exec redis redis-cli

# Inside redis-cli
PING
KEYS *
GET <key>
SET <key> <value>
DEL <key>
FLUSHALL
INFO
DBSIZE
```

---

## 🌐 API Testing (curl)

```bash
# Health checks
curl -s http://localhost:8080/health | jq
curl -s http://localhost:4001/health | jq
curl -s http://localhost:4002/health | jq
curl -s http://localhost:4003/health | jq

# Register admin
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@shop.com","password":"admin123","role":"admin"}' | jq

# Login and save token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shop.com","password":"admin123"}' | jq -r .token)
echo $TOKEN

# Sync profile (replace <AUTH_ID>)
curl -X POST http://localhost:8080/api/users/sync \
  -H "Content-Type: application/json" \
  -d '{"authId":"<AUTH_ID>","name":"Admin","email":"admin@shop.com","role":"admin"}' | jq

# Get my profile
curl -s http://localhost:8080/api/users/me -H "Authorization: Bearer $TOKEN" | jq

# Update my profile
curl -X PUT http://localhost:8080/api/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","bio":"DevOps","phone":"123","address":"NY"}' | jq

# Create order
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product":"Laptop","qty":1,"price":1200}],"total":1200,"address":"NY"}' | jq

# List my orders
curl -s http://localhost:8080/api/orders/my -H "Authorization: Bearer $TOKEN" | jq

# Admin: list all users
curl -s http://localhost:8080/api/users -H "Authorization: Bearer $TOKEN" | jq

# Admin: list all orders
curl -s http://localhost:8080/api/orders -H "Authorization: Bearer $TOKEN" | jq

# Admin: update order status
curl -X PUT http://localhost:8080/api/orders/<ORDER_ID>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}' | jq

# Delete order
curl -X DELETE http://localhost:8080/api/orders/<ORDER_ID> \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## ☸ Kubernetes Commands

### Cluster info

```bash
kubectl cluster-info
kubectl version
kubectl get nodes
kubectl get nodes -o wide
kubectl top nodes
kubectl describe node <node>
```

### Apply / Delete

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/ --recursive
kubectl apply -f k8s/auth-service/
kubectl delete -f k8s/ --recursive
kubectl delete namespace shopsphere
```

### Get resources

```bash
kubectl get all -n shopsphere
kubectl get pods -n shopsphere
kubectl get pods -n shopsphere -o wide
kubectl get pods -n shopsphere -w
kubectl get svc -n shopsphere
kubectl get deployments -n shopsphere
kubectl get replicasets -n shopsphere
kubectl get configmaps -n shopsphere
kubectl get secrets -n shopsphere
kubectl get events -n shopsphere --sort-by=.metadata.creationTimestamp
```

### Describe / Logs

```bash
kubectl describe pod <POD> -n shopsphere
kubectl describe svc <SVC> -n shopsphere
kubectl logs <POD> -n shopsphere
kubectl logs -f <POD> -n shopsphere
kubectl logs -f deployment/auth-service -n shopsphere
kubectl logs --tail=100 <POD> -n shopsphere
kubectl logs <POD> -n shopsphere -c <container>
```

### Exec

```bash
kubectl exec -it <POD> -n shopsphere -- sh
kubectl exec -it <POD> -n shopsphere -- printenv
kubectl exec -it <POD> -n shopsphere -- ls /app
```

### Port-forward

```bash
kubectl port-forward svc/frontend -n shopsphere 3000:80
kubectl port-forward svc/api-gateway -n shopsphere 8080:8080
kubectl port-forward svc/auth-service -n shopsphere 4001:4001
kubectl port-forward svc/user-service -n shopsphere 4002:4002
kubectl port-forward svc/order-service -n shopsphere 4003:4003
kubectl port-forward svc/mongo -n shopsphere 27017:27017
```

### Scale / Rollout

```bash
kubectl scale deployment auth-service --replicas=4 -n shopsphere
kubectl rollout status deployment/auth-service -n shopsphere
kubectl rollout restart deployment/auth-service -n shopsphere
kubectl rollout undo deployment/auth-service -n shopsphere
kubectl rollout history deployment/auth-service -n shopsphere
kubectl set image deployment/auth-service auth-service=shopsphere/auth-service:v2 -n shopsphere
```

### Debug

```bash
kubectl get pods -n shopsphere -o yaml
kubectl get pod <POD> -n shopsphere -o jsonpath='{.status.phase}'
kubectl get pod <POD> -n shopsphere -o jsonpath='{.spec.containers[*].image}'
kubectl describe pod <POD> -n shopsphere | grep -A 10 Events
kubectl top pods -n shopsphere
kubectl top nodes
```

### Copy files

```bash
kubectl cp <POD>:/app/file.txt ./file.txt -n shopsphere
kubectl cp ./file.txt <POD>:/app/ -n shopsphere
```

### Secrets & ConfigMaps

```bash
kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET=supersecretjwtkey -n shopsphere

kubectl create configmap app-config \
  --from-literal=NODE_ENV=production -n shopsphere

kubectl get secret jwt-secret -n shopsphere -o yaml
kubectl delete secret jwt-secret -n shopsphere
```

### Namespaces

```bash
kubectl get namespaces
kubectl create namespace shopsphere
kubectl delete namespace shopsphere
kubectl config set-context --current --namespace=shopsphere
```

### Minikube / Kind

```bash
minikube start --cpus=4 --memory=8192
minikube addons enable ingress
minikube stop
minikube delete
minikube dashboard
minikube ip

kind create cluster --name shopsphere
kind delete cluster --name shopsphere
kind get clusters
kind load docker-image shopsphere/auth-service:latest --name shopsphere
```

---

## ⚓ Helm Commands

```bash
helm version
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

helm search repo mongodb
helm install mongo bitnami/mongodb -n shopsphere
helm list -n shopsphere
helm status mongo -n shopsphere
helm uninstall mongo -n shopsphere
```

---

## 🧪 Jenkins Commands

```bash
# Start Jenkins
docker compose up -d jenkins
docker compose logs -f jenkins

# Get initial password
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Open
open http://localhost:8081    # macOS
start http://localhost:8081   # Windows

# Jenkins CLI
curl -O http://localhost:8081/jnlpJars/jenkins-cli.jar

java -jar jenkins-cli.jar -s http://localhost:8081/ \
  -auth admin:<API_TOKEN> list-jobs

java -jar jenkins-cli.jar -s http://localhost:8081/ \
  -auth admin:<API_TOKEN> build shopsphere-pipeline

java -jar jenkins-cli.jar -s http://localhost:8081/ \
  -auth admin:<API_TOKEN> console shopsphere-pipeline

# Restart via URL
curl -X POST http://localhost:8081/restart \
  --user admin:<API_TOKEN>

# Safe restart
curl -X POST http://localhost:8081/safeRestart \
  --user admin:<API_TOKEN>

# Reset Jenkins
docker compose down
docker volume rm shopsphere_jenkins_data
docker compose up -d jenkins
```

---

## 🚢 ArgoCD Commands

### Install / Uninstall

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl delete -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl delete namespace argocd
```

### Password & Port-forward

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

kubectl port-forward svc/argocd-server -n argocd 8082:443
```

### CLI

```bash
argocd login localhost:8082 --username admin --password <PASS> --insecure
argocd logout localhost:8082

argocd app list
argocd app get shopsphere
argocd app create shopsphere \
  --repo https://github.com/YOUR_USERNAME/ShopSphere-Microservices.git \
  --path k8s \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace shopsphere \
  --sync-policy automated --auto-prune --self-heal

argocd app sync shopsphere
argocd app sync shopsphere --prune
argocd app history shopsphere
argocd app rollback shopsphere <REVISION>
argocd app delete shopsphere
argocd app diff shopsphere
argocd app wait shopsphere
```

### Change admin password

```bash
argocd account update-password
```

---

## 🏗 Terraform Commands

```bash
cd terraform

# Init / validate / format
terraform init
terraform init -upgrade
terraform fmt -recursive
terraform validate

# Plan
terraform plan
terraform plan -out=tfplan
terraform plan -var-file=prod.tfvars

# Apply
terraform apply
terraform apply tfplan
terraform apply -auto-approve
terraform apply -var-file=prod.tfvars

# Inspect
terraform show
terraform state list
terraform state show aws_eks_cluster.shopsphere
terraform output
terraform output -raw eks_cluster_name

# Refresh / import
terraform refresh
terraform import aws_eks_cluster.shopsphere <cluster-name>

# Taint / untaint
terraform taint aws_eks_node_group.workers
terraform untaint aws_eks_node_group.workers

# Destroy
terraform destroy
terraform destroy -auto-approve
terraform destroy -target=aws_eks_node_group.workers

# Workspaces
terraform workspace list
terraform workspace new dev
terraform workspace select dev
terraform workspace show
```

---

## ☁ AWS CLI Commands

```bash
aws configure
aws sts get-caller-identity

# EKS
aws eks list-clusters
aws eks describe-cluster --name shopsphere-eks
aws eks update-kubeconfig --name shopsphere-eks --region us-east-1
aws eks list-nodegroups --cluster-name shopsphere-eks
aws eks describe-nodegroup --cluster-name shopsphere-eks --nodegroup-name shopsphere-eks-workers

# EC2
aws ec2 describe-instances --filters "Name=tag:Name,Values=shopsphere-*"
aws ec2 describe-vpcs
aws ec2 describe-subnets

# ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

aws ecr create-repository --repository-name shopsphere/auth-service
aws ecr list-images --repository-name shopsphere/auth-service

# IAM
aws iam list-roles | jq '.Roles[].RoleName'
aws iam list-attached-role-policies --role-name shopsphere-eks-cluster-role
```

---

## 📊 Prometheus Commands

```bash
# Start
docker compose up -d prometheus

# Check readiness
curl http://localhost:9090/-/ready
curl http://localhost:9090/-/healthy

# Reload config
curl -X POST http://localhost:9090/-/reload

# Query API
curl -s "http://localhost:9090/api/v1/query?query=up" | jq
curl -s "http://localhost:9090/api/v1/targets" | jq '.data.activeTargets[].labels.job'
```

Common PromQL queries:

```
up
up{job="auth-service"}
rate(http_requests_total[1m])
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
process_cpu_seconds_total
node_memory_MemAvailable_bytes
```

---

## 📈 Grafana Commands

```bash
# Start
docker compose up -d grafana

# Check readiness
curl http://localhost:3001/api/health

# Reset admin password
docker compose exec grafana \
  grafana-cli admin reset-admin-password newpassword

# List plugins
docker compose exec grafana grafana-cli plugins ls

# Restart
docker compose restart grafana

# Backup dashboards
docker compose exec grafana \
  tar czf /tmp/dashboards.tar.gz /var/lib/grafana/dashboards
docker cp shopsphere-grafana:/tmp/dashboards.tar.gz ./dashboards.tar.gz
```

---

## 📜 Logs & Debugging

```bash
# Docker logs
docker compose logs -f
docker compose logs -f api-gateway
docker logs -f --tail 200 shopsphere-auth

# Kubernetes logs
kubectl logs -f deployment/auth-service -n shopsphere
kubectl logs --previous <POD> -n shopsphere
kubectl logs <POD> -n shopsphere --since=1h

# Events
kubectl get events -n shopsphere --sort-by=.metadata.creationTimestamp

# Follow resource changes
kubectl get pods -n shopsphere -w

# Describe for errors
kubectl describe pod <POD> -n shopsphere | tail -30
```

---

## 📊 Monitoring & Stats

```bash
# Docker
docker stats
docker stats --no-stream
docker system df

# Kubernetes
kubectl top pods -n shopsphere
kubectl top nodes
kubectl describe node <NODE>

# Resource usage
kubectl get pods -n shopsphere \
  -o custom-columns=NAME:.metadata.name,CPU:.spec.containers[*].resources.requests.cpu,MEM:.spec.containers[*].resources.requests.memory
```

---

## 💾 Backup & Restore

### MongoDB

```bash
# Backup
docker exec shopsphere-mongo mongodump --out /tmp/backup
docker cp shopsphere-mongo:/tmp/backup ./backup-$(date +%F)

# Restore
docker cp ./backup-2024-01-01 shopsphere-mongo:/tmp/backup
docker exec shopsphere-mongo mongorestore /tmp/backup
```

### Kubernetes

```bash
# Backup all resources
kubectl get all -n shopsphere -o yaml > backup.yaml

# Restore
kubectl apply -f backup.yaml
```

### Terraform state

```bash
cp terraform/terraform.tfstate terraform/terraform.tfstate.backup-$(date +%F)
```

---

## 🧹 Cleanup Commands

### Docker

```bash
docker compose down
docker compose down -v
docker compose down --rmi all
docker rmi $(docker images "shopsphere/*" -q)
docker system prune -a --volumes -f
```

### Kubernetes

```bash
kubectl delete -f k8s/ --recursive
kubectl delete namespace shopsphere
```

### Terraform

```bash
cd terraform && terraform destroy -auto-approve
```

### ArgoCD

```bash
kubectl delete -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl delete namespace argocd
```

### Minikube / Kind

```bash
minikube stop && minikube delete
kind delete cluster --name shopsphere
```

### Full reset

```bash
docker compose down -v
docker system prune -a --volumes -f
docker compose up --build -d
```

---

## 🛠 Troubleshooting Snippets

**Port already in use**

```bash
lsof -i :8080                    # macOS / Linux
netstat -ano | findstr :8080     # Windows
kill -9 <PID>
```

**Container stuck restarting**

```bash
docker compose logs <svc>
docker inspect <container> | jq '.[0].State'
```

**Mongo connection refused**

```bash
docker compose up -d mongo
docker compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

**Pods in ImagePullBackOff**

```bash
kubectl describe pod <POD> -n shopsphere | grep -A 5 Events
kubectl create secret docker-registry regcred \
  --docker-username=<user> --docker-password=<pass> \
  --docker-email=<email> -n shopsphere
```

**Pods in CrashLoopBackOff**

```bash
kubectl logs <POD> -n shopsphere --previous
kubectl describe pod <POD> -n shopsphere
```

**401 Unauthorized**

```bash
# Verify JWT secret matches
docker compose exec auth-service printenv JWT_SECRET
docker compose exec user-service printenv JWT_SECRET

# Decode token
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq
```

**CORS errors**

```bash
# Verify CORS headers
curl -I -X OPTIONS http://localhost:8080/api/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

**Frontend can't reach API**

```bash
docker compose exec frontend wget -qO- http://api-gateway:8080/health
```

**Grafana dashboard missing**

```bash
docker compose restart grafana
docker compose logs -f grafana | grep -i provision
```

**Prometheus target down**

```bash
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'
```

**Jenkins initial password**

```bash
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

**EKS kubeconfig issues**

```bash
aws eks update-kubeconfig --name shopsphere-eks --region us-east-1
kubectl config current-context
kubectl config get-contexts
```

**Force rebuild everything**

```bash
docker compose down -v
docker system prune -a --volumes -f
docker compose up --build -d
```

---

## 🚀 One-Shot Boot & Verify

```bash
# Boot the stack
docker compose up --build -d

# Wait for services
sleep 30

# Verify health
for port in 8080 4001 4002 4003; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq
done

# Register admin & login
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@shop.com","password":"admin123","role":"admin"}'

# Open UI
open http://localhost:3000
```

---

## 📋 Ports Reference

| Service      | Port  | URL                          |
|--------------|-------|-------------------------------|
| Frontend     | 3000  | http://localhost:3000        |
| API Gateway  | 8080  | http://localhost:8080        |
| Auth Service | 4001  | http://localhost:4001        |
| User Service | 4002  | http://localhost:4002        |
| Order Service| 4003  | http://localhost:4003        |
| MongoDB      | 27017 | mongodb://localhost:27017    |
| Redis        | 6379  | redis://localhost:6379       |
| Jenkins      | 8081  | http://localhost:8081        |
| Prometheus   | 9090  | http://localhost:9090        |
| Grafana      | 3001  | http://localhost:3001        |
| ArgoCD       | 8082  | http://localhost:8082        |

---

## 🎯 Quick Cheatsheet

```bash
# Start everything
docker compose up --build -d

# Logs
docker compose logs -f

# Health checks
curl -s http://localhost:8080/health

# K8s deploy
kubectl apply -f k8s/ --recursive

# Terraform
cd terraform && terraform init && terraform apply -auto-approve

# ArgoCD
kubectl apply -f argocd/application.yaml

# Stop everything
docker compose down -v
```
