#!/bin/bash

# Docker build and run script for Inventory Management System
set -e

echo "🚀 بناء وتشغيل نظام إدارة المخزون"
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ خطأ: Docker غير قيد التشغيل. يرجى تشغيل Docker أولاً"
    exit 1
fi

# Stop existing containers
echo "⏹️  إيقاف الحاويات الموجودة..."
docker-compose down 2>/dev/null || true
docker stop inventory_app inventory_postgres 2>/dev/null || true
docker rm inventory_app inventory_postgres 2>/dev/null || true

# Build and start services
echo "🔨 بناء الصورة..."
docker-compose build --no-cache

echo "🚀 تشغيل الخدمات..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ انتظار تشغيل الخدمات..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ تم تشغيل النظام بنجاح!"
    echo ""
    echo "🌐 الرابط: http://localhost:5000"
    echo "🗄️  قاعدة البيانات: localhost:5432"
    echo ""
    echo "📋 لعرض السجلات:"
    echo "   docker-compose logs -f app"
    echo ""
    echo "⏹️  لإيقاف النظام:"
    echo "   docker-compose down"
else
    echo "❌ خطأ في تشغيل النظام. يرجى التحقق من السجلات:"
    echo "   docker-compose logs"
fi