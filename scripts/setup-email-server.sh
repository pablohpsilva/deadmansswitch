#!/bin/bash

# Self-hosted Email Server Setup Script
# This script helps you set up a complete email server using docker-mailserver

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Dead Man's Switch - Email Server Setup${NC}"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Get domain from user
echo -e "${YELLOW}📝 Please provide your domain information:${NC}"
read -p "Enter your domain (e.g., deadmansswitch.com): " DOMAIN
read -p "Enter your email subdomain (e.g., mail): " MAIL_SUBDOMAIN
MAIL_DOMAIN="${MAIL_SUBDOMAIN}.${DOMAIN}"

# Get email credentials
echo -e "${YELLOW}📧 Configure your email account:${NC}"
read -p "Enter email username (e.g., noreply): " EMAIL_USER
read -s -p "Enter email password: " EMAIL_PASSWORD
echo

# Create necessary directories
echo -e "${GREEN}📁 Creating email server directories...${NC}"
mkdir -p docker-data/dms/{mail-data,mail-state,mail-logs,config}
mkdir -p docker-data/roundcube/{www,config,db}

# Create environment file for email
echo -e "${GREEN}📝 Creating email environment configuration...${NC}"
cat > .env.email << EOF
# Email Server Configuration
DOMAIN=${DOMAIN}
MAIL_DOMAIN=${MAIL_DOMAIN}

# SMTP Configuration for your app
SMTP_HOST=${MAIL_DOMAIN}
SMTP_PORT=587
SMTP_USER=${EMAIL_USER}@${DOMAIN}
SMTP_PASSWORD=${EMAIL_PASSWORD}
SMTP_SECURE=false
FROM_EMAIL=${EMAIL_USER}@${DOMAIN}

# Roundcube Database
ROUNDCUBE_DB_PASSWORD=$(openssl rand -base64 32)
EOF

echo -e "${GREEN}✅ Environment file created: .env.email${NC}"

# Create the first email account
echo -e "${GREEN}📧 Creating email account...${NC}"
mkdir -p docker-data/dms/config
echo "${EMAIL_USER}@${DOMAIN}|$(openssl passwd -1 ${EMAIL_PASSWORD})" > docker-data/dms/config/postfix-accounts.cf

# Start the email server
echo -e "${GREEN}🚀 Starting email server...${NC}"
docker-compose -f docker-compose.email.yml --env-file .env.email up -d

# Wait for the server to start
echo -e "${YELLOW}⏳ Waiting for email server to initialize...${NC}"
sleep 30

# Generate DKIM keys
echo -e "${GREEN}🔐 Generating DKIM keys...${NC}"
docker exec mailserver setup config dkim

# Show DKIM public key
echo -e "${GREEN}📋 Your DKIM public key (add this to your DNS):${NC}"
docker exec mailserver cat /tmp/docker-mailserver/opendkim/keys/${DOMAIN}/mail.txt

echo
echo -e "${GREEN}🎉 Email server setup complete!${NC}"
echo
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Add these DNS records to your domain:"
echo "   - MX: ${DOMAIN} -> ${MAIL_DOMAIN} (priority 10)"
echo "   - A: ${MAIL_DOMAIN} -> $(curl -s ifconfig.me)"
echo "   - TXT (SPF): v=spf1 mx ~all"
echo "   - TXT (DMARC): v=DMARC1; p=quarantine; rua=mailto:admin@${DOMAIN}"
echo "   - DKIM: (shown above)"
echo
echo "2. Update your app's .env file with the contents of .env.email"
echo
echo "3. Access Roundcube webmail at: http://localhost:8080"
echo
echo "4. Test your email setup by sending a test email from your app"
echo
echo -e "${GREEN}📧 Your email server is ready at: ${MAIL_DOMAIN}${NC}"
