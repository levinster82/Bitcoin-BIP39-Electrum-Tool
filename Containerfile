FROM debian:trixie

# Update package list and install essential packages + browsers + drivers
RUN apt update && apt install -y \
   sudo \
   bash-completion \
   build-essential \
   openjdk-21-jdk-headless \
   git \
   curl \
   wget \
   vim \
   nano \
   unzip \
   ca-certificates \
   gnupg \
   chromium \
   chromium-driver \
   firefox-esr \
   xvfb

# Install Node.js 22 (LTS) from NodeSource repository
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
   echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
   apt update && \
   apt install -y nodejs

# Install GeckoDriver (manual download - no Debian package available)
RUN GECKO_VERSION=$(curl -s https://api.github.com/repos/mozilla/geckodriver/releases/latest | grep '"tag_name"' | cut -d'"' -f4) && \
   echo "Detected GeckoDriver version: $GECKO_VERSION" && \
   wget -O /tmp/geckodriver.tar.gz "https://github.com/mozilla/geckodriver/releases/download/${GECKO_VERSION}/geckodriver-${GECKO_VERSION}-linux64.tar.gz" && \
   tar -xzf /tmp/geckodriver.tar.gz -C /usr/local/bin/ && \
   chmod +x /usr/local/bin/geckodriver && \
   rm /tmp/geckodriver.tar.gz

# Install testing frameworks and tools
RUN npm install -g \
   jasmine \
   selenium-webdriver

# Fix the docker-clean configuration that prevents package cache
RUN sed -i 's/^Dir::Cache::pkgcache/#Dir::Cache::pkgcache/' /etc/apt/apt.conf.d/docker-clean || true
RUN sed -i 's/^Dir::Cache::srcpkgcache/#Dir::Cache::srcpkgcache/' /etc/apt/apt.conf.d/docker-clean || true

# Create group with GID 1000 first, then user with UID 1000
# Add dev user to sudo group and configure passwordless sudo
RUN groupadd -g 1000 dev && \
    useradd -m -s /bin/bash -u 1000 -g 1000 dev && \
    usermod -aG sudo dev && \
    echo "dev ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/dev

# Set JAVA_HOME environment variable
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

# Enable bash completion for dev user and add JAVA_HOME
RUN echo "source /etc/bash_completion" >> /home/dev/.bashrc && \
    echo "export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64" >> /home/dev/.bashrc && \
    echo "export PATH=\$PATH:\$JAVA_HOME/bin" >> /home/dev/.bashrc

# Pre-create the mount point with correct ownership
RUN mkdir -p /home/dev/bip39 && chown dev:dev /home/dev/bip39

USER dev
WORKDIR /home/dev
