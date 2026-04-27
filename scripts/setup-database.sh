#!/bin/bash

# Database setup script for Replit migration

echo "Setting up PostgreSQL database..."

# Clean up any existing postgres processes
pkill -f postgres 2>/dev/null || true

# Create database directory
mkdir -p /tmp/postgres
rm -rf /tmp/postgres/*

# Initialize PostgreSQL database
initdb -D /tmp/postgres -A trust

# Configure PostgreSQL for Replit environment
mkdir -p /tmp/postgres-socket
echo "listen_addresses = '*'" >> /tmp/postgres/postgresql.conf
echo "unix_socket_directories = '/tmp/postgres-socket'" >> /tmp/postgres/postgresql.conf
echo "port = 5432" >> /tmp/postgres/postgresql.conf

# Start PostgreSQL
pg_ctl -D /tmp/postgres -l /tmp/postgres.log start

# Wait for PostgreSQL to start
sleep 5

# Create database
createdb -h localhost -p 5432 inventory_db 2>/dev/null || createdb -h /tmp/postgres-socket -p 5432 inventory_db

# Set DATABASE_URL environment variable
echo 'DATABASE_URL="postgresql://runner@localhost:5432/inventory_db"' > .env

echo "Database setup complete!"