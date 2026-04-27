# 🚀 Quick Start - Arabic Inventory Management with Docker

## One-Command Setup

```bash
./docker-start.sh
```

That's it! This will:
- ✅ Create environment file if missing
- ✅ Start PostgreSQL database with Arabic data
- ✅ Launch the inventory management application
- ✅ Show you the access URL and credentials

## Access Your Application

**URL**: http://localhost:5000

**Login Credentials**:
- Admin: `admin` / `admin123`
- Seller: `seller` / `seller123`

## What You Get

### 🏪 Complete Arabic Inventory System
- Vehicle management with Arabic interface
- Manufacturer logos and branding
- Print functionality for reports
- Real-time statistics dashboard

### 🗃️ PostgreSQL Database
- Automatic setup with sample data
- Persistent storage (data survives restarts)
- Arabic content pre-loaded

### 🤖 AI Features
- Voice assistant (requires OpenAI API key)
- OCR for chassis number extraction
- Intelligent vehicle data processing

## Customization

### Add OpenAI API Key (Optional)
Edit `.env` file and add:
```
OPENAI_API_KEY=your_key_here
```

### Change Ports (If Needed)
Edit `docker-compose.yml`:
```yaml
ports:
  - "3000:5000"  # App on port 3000 instead of 5000
  - "5433:5432"  # Database on port 5433 instead of 5432
```

## Management Commands

```bash
# View logs
docker-compose logs

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Reset everything
docker-compose down -v && docker-compose up --build
```

## Troubleshooting

**Port already in use?**
- Change ports in docker-compose.yml
- Or stop conflicting services

**App won't start?**
- Check logs: `docker-compose logs app`
- Rebuild: `docker-compose build --no-cache`

**Database issues?**
- Check logs: `docker-compose logs postgres`
- Reset: `docker-compose down -v && docker-compose up`

## Next Steps

1. **Login** and explore the inventory system
2. **Add your vehicles** through the Arabic interface
3. **Customize branding** in appearance settings
4. **Set up backups** for production use

## Support

For detailed documentation, see:
- `README-DOCKER.md` - Complete user guide
- `docker-deployment-guide.md` - Technical details
- `DOCKER_SETUP.md` - Advanced configuration