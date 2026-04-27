#!/bin/bash

# Simple Docker run script without database
set -e

echo "🚀 تشغيل نظام إدارة المخزون (بدون قاعدة بيانات)"
echo "================================================"

# Build the image
echo "🔨 بناء الصورة..."
docker build -t inventory-app .

# Stop existing container
echo "⏹️  إيقاف الحاوية الموجودة..."
docker stop inventory-simple 2>/dev/null || true
docker rm inventory-simple 2>/dev/null || true

# Run the container
echo "🚀 تشغيل الحاوية..."
docker run -d \
  --name inventory-simple \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -v $(pwd)/uploads:/app/uploads \
  inventory-app

# Wait for service to be ready
echo "⏳ انتظار تشغيل الخدمة..."
sleep 5

# Check if container is running
if docker ps | grep -q "inventory-simple"; then
    echo "✅ تم تشغيل النظام بنجاح!"
    echo ""
    echo "🌐 الرابط: http://localhost:5000"
    echo ""
    echo "📋 لعرض السجلات:"
    echo "   docker logs -f inventory-simple"
    echo ""
    echo "⏹️  لإيقاف النظام:"
    echo "   docker stop inventory-simple"
else
    echo "❌ خطأ في تشغيل النظام. يرجى التحقق من السجلات:"
    echo "   docker logs inventory-simple"
fi