#!/bin/bash

# Generate SSL certificates for PostgreSQL
# This script creates self-signed certificates for development/testing
# For production, use certificates from a trusted CA

CERT_DIR="./ssl-certs"
DAYS=365

echo "Creating SSL certificates directory..."
mkdir -p $CERT_DIR

echo "Generating CA private key..."
openssl genpkey -algorithm RSA -out $CERT_DIR/ca.key -pkcs8

echo "Generating CA certificate..."
openssl req -new -x509 -key $CERT_DIR/ca.key -days $DAYS -out $CERT_DIR/ca.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=PostgreSQL-CA"

echo "Generating server private key..."
openssl genpkey -algorithm RSA -out $CERT_DIR/server.key -pkcs8

echo "Generating server certificate signing request..."
openssl req -new -key $CERT_DIR/server.key -out $CERT_DIR/server.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=postgres"

echo "Generating server certificate..."
openssl x509 -req -in $CERT_DIR/server.csr -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key \
  -CAcreateserial -out $CERT_DIR/server.crt -days $DAYS

echo "Setting proper permissions..."
chmod 600 $CERT_DIR/server.key $CERT_DIR/ca.key
chmod 644 $CERT_DIR/server.crt $CERT_DIR/ca.crt

echo "Cleaning up..."
rm $CERT_DIR/server.csr $CERT_DIR/ca.srl

echo "SSL certificates generated successfully in $CERT_DIR/"
echo ""
echo "Files created:"
echo "  - $CERT_DIR/ca.crt (CA certificate)"
echo "  - $CERT_DIR/ca.key (CA private key)"
echo "  - $CERT_DIR/server.crt (Server certificate)"
echo "  - $CERT_DIR/server.key (Server private key)"
echo ""
echo "For production, replace these self-signed certificates with certificates from a trusted CA."
