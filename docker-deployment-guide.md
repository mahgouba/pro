# Docker Deployment Guide - Arabic Inventory Management System

## Quick Deployment (Recommended)

### Option 1: Automatic Setup Script
```bash
./run-docker.sh
```
This script will:
- Check if Docker is installed
- Create environment file if missing
- Build and start all services
- Show you the access URLs and credentials

### Option 2: Manual Setup

1. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key
   nano .env
   ```

2. **Start services**
   ```bash
   docker-compose up --build -d
   ```

3. **Access the application**
   - URL: http://localhost:5000
   - Admin: `admin` / `admin123`
   - Seller: `seller` / `seller123`

## What Gets Deployed

### 🐘 PostgreSQL Database
- **Container**: `inventory_postgres`
- **Port**: 5432
- **Database**: `inventory_db`
- **Data**: Persistent storage with automatic backups
- **Auto-seeding**: Sample inventory data included

### 🚗 Arabic Inventory App
- **Container**: `inventory_app`
- **Port**: 5000
- **Features**:
  - Complete Arabic interface (RTL)
  - Vehicle inventory management
  - Quotation system with PDF export
  - Voice assistant with OpenAI
  - Company logo and branding
  - Print functionality
  - Real-time statistics

## Database Features

### Automatic Setup
- ✅ Database tables created automatically
- ✅ Sample data seeded (cars, manufacturers, users)
- ✅ Default admin accounts created
- ✅ Arabic content and proper RTL layout

### Data Persistence
- ✅ PostgreSQL volume mounted for data persistence
- ✅ Database survives container restarts
- ✅ Backup-ready configuration

## Management Commands

### View Application Logs
```bash
# All services
docker-compose logs

# Application only
docker-compose logs app

# Database only
docker-compose logs postgres
```

### Database Management
```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d inventory_db

# Backup database
docker-compose exec postgres pg_dump -U postgres inventory_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres inventory_db < backup.sql
```

### Application Management
```bash
# Restart application only
docker-compose restart app

# Rebuild application
docker-compose build app
docker-compose up app -d

# Stop all services
docker-compose down

# Stop and remove data (caution!)
docker-compose down -v
```

## File Organization

```
inventory-management/
├── 📁 client/                 # React frontend
│   ├── src/
│   │   ├── pages/            # Arabic UI pages
│   │   ├── components/       # Reusable components
│   │   └── assets/           # Images and fonts
│   └── index.html
├── 📁 server/                 # Express backend
│   ├── routes/               # API endpoints
│   ├── storage.ts            # Database operations
│   └── index.ts              # Server entry point
├── 📁 shared/                 # Common types
│   └── schema.ts             # Database schema
├── 📁 public/                 # Static files
│   ├── logos/                # Manufacturer logos
│   └── copmany logo.svg      # Company logo
├── 🐳 docker-compose.yml      # Service orchestration
├── 🐳 Dockerfile             # App container
├── 📝 package.json           # Dependencies
├── ⚙️ .env                   # Environment variables
└── 🚀 run-docker.sh          # Quick setup script
```

## Production Deployment Tips

### Security
1. **Change default passwords** in docker-compose.yml
2. **Use strong OpenAI API key** with proper limits
3. **Set secure SESSION_SECRET** in .env
4. **Enable firewall** for ports 5000 and 5432

### Performance
1. **Scale containers** if needed:
   ```bash
   docker-compose up --scale app=3
   ```
2. **Monitor resources**:
   ```bash
   docker stats
   ```
3. **Set up log rotation** for production

### Backup Strategy
1. **Automatic database backups**:
   ```bash
   # Add to crontab
   0 2 * * * docker-compose exec postgres pg_dump -U postgres inventory_db > /backups/inventory_$(date +%Y%m%d).sql
   ```

2. **File uploads backup**:
   ```bash
   # Backup uploads directory
   tar -czf uploads_backup.tar.gz uploads/
   ```

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Check what's using the port
sudo lsof -i :5000
sudo lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

**Database Connection Failed**
```bash
# Check database is ready
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

**Application Won't Start**
```bash
# Check application logs
docker-compose logs app

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

**OpenAI API Issues**
- Verify API key in .env file
- Check OpenAI account credits
- Test API key: https://platform.openai.com/account/usage

### Health Checks
```bash
# Check all services status
docker-compose ps

# Check specific service health
docker-compose exec app curl http://localhost:5000/api/inventory/stats
```

## Support

If you need help:
1. Check logs: `docker-compose logs`
2. Verify environment variables in `.env`
3. Ensure Docker and Docker Compose are updated
4. Test with: `curl http://localhost:5000`

## Success Indicators

When everything is working:
- ✅ http://localhost:5000 loads the Arabic login page
- ✅ Login with admin/admin123 works
- ✅ Inventory page shows sample cars
- ✅ Database contains seeded data
- ✅ All features work (add/edit/delete vehicles)
- ✅ Print functionality works
- ✅ Company logo appears in interface