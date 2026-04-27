#!/bin/bash

# Add sample inventory data for testing reservation system
curl -X POST http://localhost:5000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "manufacturer": "مرسيدس",
    "category": "S-Class",
    "trimLevel": "S500",
    "engineCapacity": "4.0L V8",
    "year": "2023",
    "exteriorColor": "أسود",
    "interiorColor": "بيج",
    "status": "متوفر",
    "importType": "شخصي",
    "location": "الرياض",
    "chassisNumber": "WDD2220311A123456",
    "price": "450000"
  }'

curl -X POST http://localhost:5000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "manufacturer": "بي ام دبليو",
    "category": "7 Series",
    "trimLevel": "750Li",
    "engineCapacity": "4.4L V8",
    "year": "2022",
    "exteriorColor": "أبيض",
    "interiorColor": "أسود",
    "status": "متوفر",
    "importType": "تجاري",
    "location": "جدة",
    "chassisNumber": "WBAHF8110NCF123789",
    "price": "380000"
  }'

curl -X POST http://localhost:5000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "manufacturer": "لكزس",
    "category": "LX",
    "trimLevel": "LX600",
    "engineCapacity": "3.5L V6",
    "year": "2024",
    "exteriorColor": "رمادي",
    "interiorColor": "بني",
    "status": "في الطريق",
    "importType": "شخصي",
    "location": "الدمام",
    "chassisNumber": "JTJHY7AX1P4123456",
    "price": "525000"
  }'

echo "Sample data added successfully!"