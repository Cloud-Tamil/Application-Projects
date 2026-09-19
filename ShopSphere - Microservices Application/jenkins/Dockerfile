FROM jenkins/jenkins:lts-jdk17

USER root

# System deps + Docker CLI + kubectl + helm + terraform + trivy
RUN apt-get update && apt-get install -y --no-install-recommends \
      apt-transport-https ca-certificates curl gnupg lsb-release \
      git jq unzip python3 python3-pip && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && apt-get install -y docker-ce-cli && \
    # kubectl
    curl -fsSL https://dl.k8s.io/release/v1.29.0/bin/linux/amd64/kubectl -o /usr/local/bin/kubectl && chmod +x /usr/local/bin/kubectl && \
    # helm
    curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash && \
    # terraform
    curl -fsSL https://releases.hashicorp.com/terraform/1.7.5/terraform_1.7.5_linux_amd64.zip -o /tmp/tf.zip && \
      unzip /tmp/tf.zip -d /usr/local/bin && rm /tmp/tf.zip && \
    # trivy
    curl -fsSL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin && \
    rm -rf /var/lib/apt/lists/*

# Node (for building JS apps)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest

USER jenkins
RUN jenkins-plugin-cli --plugins \
    workflow-aggregator git docker-workflow kubernetes credentials-binding \
    blueocean pipeline-stage-view timestamper ws-cleanup github
