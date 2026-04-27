# 🚗 Arabic Inventory Management System - Docker Setup

A complete inventory management system with Arabic interface, PostgreSQL database, and Docker deployment.

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)
```bash
./docker-start.sh
```

### Option 2: Manual Setup
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit environment variables (add your OpenAI API key)
nano .env

# 3. Start with Docker Compose
docker-compose up --build -d
```

## 📋 System Requirements

- Docker Engine 20.0+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

## 🏗️ What Gets Deployed

### Services
- **PostgreSQL Database** (port 5432)
- **Arabic Inventory App** (port 5000)

### Features
- ✅ Complete Arabic interface (RTL layout)
- ✅ Vehicle inventory management
- ✅ Quotation system with PDF export
- ✅ Voice assistant (OpenAI integration)
- ✅ Company branding and logos
- ✅ Print functionality
- ✅ Real-time statistics and reporting

## 🗃️ Database Features

- **Automatic seeding** with sample data
- **Persistent storage** with Docker volumes
- **Arabic content** pre-loaded
- **Default users** created automatically

## 🔧 Management Commands

```bash
# View all logs
docker-compose logs

# View app logs only
docker-compose logs app

# View database logs
docker-compose logs postgres

# Restart application
docker-compose restart app

# Stop all services
docker-compose down

# Reset everything (removes data!)
docker-compose down -v
docker-compose up --build
```

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Seller | seller | seller123 |

## 🌐 Access URLs

- **Application**: http://localhost:5000
- **Database**: localhost:5432 (use any PostgreSQL client)

## 📂 Project Structure

```
inventory-system/
├── client/           # React frontend (Arabic UI)
├── server/           # Express backend API
├── shared/           # Common types and schemas
├── public/           # Static files and logos
├── docker-compose.yml # Service definitions
├── Dockerfile        # Application container
├── .env.example      # Environment template
└── docker-start.sh   # Quick start script
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql://postgres:password123@postgres:5432/inventory_db

# OpenAI (for voice assistant)
OPENAI_API_KEY=your_key_here

# Application
NODE_ENV=production
PORT=5000
```

### Docker Compose Services
- **postgres**: PostgreSQL 15 with persistent data
- **app**: Node.js application with all dependencies

## 🔍 Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
sudo lsof -i :5000
sudo lsof -i :5432

# Change ports in docker-compose.yml if needed
```

### Database Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# Connect to database
docker-compose exec postgres psql -U postgres -d inventory_db

# View database tables
docker-compose exec postgres psql -U postgres -d inventory_db -c "\dt"
```

### Application Issues
```bash
# Check application health
curl http://localhost:5000/api/inventory/stats

# Rebuild application
docker-compose build app --no-cache
docker-compose up app -d
```

## 📦 Backup & Restore

### Backup Database
```bash
docker-compose exec postgres pg_dump -U postgres inventory_db > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U postgres inventory_db < backup.sql
```

### Backup Files
```bash
# Backup uploaded files
tar -czf uploads_backup.tar.gz uploads/
```

## 🚀 Production Deployment

### Security Updates
1. Change database password in `docker-compose.yml`
2. Set strong `SESSION_SECRET` in `.env`
3. Use environment-specific OpenAI API keys
4. Enable firewall rules for ports 5000, 5432

### Performance
1. Increase container resources if needed
2. Monitor with `docker stats`
3. Set up log rotation
4. Configure backup schedules

## 📞 Support

### Common Solutions
- **App won't start**: Check logs with `docker-compose logs app`
- **Database connection failed**: Verify PostgreSQL is running `docker-compose ps`
- **Login doesn't work**: Database might not be seeded, restart services
- **Voice assistant not working**: Check OpenAI API key in `.env`

### Health Checks
```bash
# Check all services
docker-compose ps

# Test application
curl http://localhost:5000

# Test database
docker-compose exec postgres psql -U postgres -c "SELECT version();"
```

## ✅ Success Indicators

When everything works correctly:
- ✅ http://localhost:5000 shows Arabic login page
- ✅ Login with admin/admin123 succeeds
- ✅ Inventory page displays sample vehicles
- ✅ All CRUD operations work (add/edit/delete)
- ✅ Print functionality works
- ✅ Company logo appears throughout interface
- ✅ Database contains Arabic sample data

## 🎯 Next Steps

After successful deployment:
1. **Customize branding** in appearance settings
2. **Add your vehicle inventory**
3. **Configure company information**
4. **Set up regular database backups**
5. **Train users** on the Arabic interface