#!/bin/bash

# Inventory Management System - Docker Setup Script

echo "🚀 Setting up Inventory Management System with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file..."
    echo "Please enter your OpenAI API key (required for voice assistant):"
    read -r OPENAI_KEY
    echo "OPENAI_API_KEY=$OPENAI_KEY" > .env
    echo "✅ .env file created successfully"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "🎉 Setup complete! Your inventory management system is running."
    echo ""
    echo "📱 Access your application:"
    echo "   🌐 Web interface: http://localhost:5000"
    echo ""
    echo "🔐 Login credentials:"
    echo "   👨‍💼 Admin: username 'admin', password 'admin123'"
    echo "   👩‍💼 Seller: username 'seller', password 'seller123'"
    echo ""
    echo "🗄️  Database access:"
    echo "   📊 PostgreSQL: localhost:5432"
    echo "   🏷️  Database: inventory_db"
    echo "   👤 Username: postgres"
    echo "   🔑 Password: password123"
    echo ""
    echo "💡 Useful commands:"
    echo "   📋 View logs: docker-compose logs"
    echo "   🛑 Stop services: docker-compose down"
    echo "   🔄 Restart: docker-compose restart"
    echo ""
else
    echo "❌ Services failed to start. Check the logs with: docker-compose logs"
    exit 1
fi