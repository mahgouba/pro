#!/bin/bash

# Simple Docker Start Script for Inventory Management System

echo "🚀 Starting Arabic Inventory Management System with Docker..."

# Check if .env exists, create from template if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key"
    echo "   Example: OPENAI_API_KEY=sk-your-key-here"
    echo ""
    read -p "Press Enter to continue with default database settings..."
fi

# Stop existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null

# Start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 15

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ System is running successfully!"
    echo ""
    echo "🌐 Access your application:"
    echo "   URL: http://localhost:5000"
    echo ""
    echo "🔐 Login credentials:"
    echo "   Admin: admin / admin123"
    echo "   Seller: seller / seller123"
    echo ""
    echo "📊 Database access (optional):"
    echo "   Host: localhost:5432"
    echo "   Database: inventory_db"
    echo "   User: postgres"
    echo "   Password: password123"
    echo ""
    echo "💡 Useful commands:"
    echo "   View logs: docker-compose logs"
    echo "   Stop: docker-compose down"
    echo "   Restart: docker-compose restart"
    echo ""
else
    echo "❌ Failed to start services. Check logs:"
    echo "   docker-compose logs"
fi