# Docker Setup for Inventory Management System

This guide shows you how to run the inventory management system using Docker and PostgreSQL.

## Prerequisites

1. Install Docker and Docker Compose on your system
2. Make sure you have an OpenAI API key

## Quick Start

1. **Clone or navigate to the project directory**
   ```bash
   cd /path/to/your/inventory-app
   ```

2. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```bash
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```
   Replace `your_openai_api_key_here` with your actual OpenAI API key.

3. **Build and start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Open your browser and go to: http://localhost:5000
   - Use these login credentials:
     - Admin: username `admin`, password `admin123`
     - Seller: username `seller`, password `seller123`

## Services

### PostgreSQL Database
- **Container**: `inventory_postgres`
- **Port**: 5432
- **Database**: `inventory_db`
- **Username**: `postgres`
- **Password**: `password123`
- **Data Storage**: Persistent volume `postgres_data`

### Application
- **Container**: `inventory_app`
- **Port**: 5000
- **Environment**: Production
- **Features**: 
  - Arabic inventory management interface
  - Voice assistant with OpenAI integration
  - Real-time database operations
  - File upload support

## Database Setup

The application automatically:
1. Creates database tables using Drizzle ORM
2. Seeds the database with sample data
3. Creates default admin and seller users

## Useful Commands

### Start services in background
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs postgres
```

### Rebuild application
```bash
docker-compose build app
docker-compose up app
```

### Access database directly
```bash
docker-compose exec postgres psql -U postgres -d inventory_db
```

### Reset database
```bash
docker-compose down -v
docker-compose up --build
```

## Troubleshooting

### Port Conflicts
If port 5000 or 5432 is already in use, modify the ports in `docker-compose.yml`:
```yaml
ports:
  - "3000:5000"  # Change external port to 3000
```

### Database Connection Issues
1. Wait for PostgreSQL to be ready (check with `docker-compose logs postgres`)
2. Ensure environment variables are correctly set
3. Verify the DATABASE_URL format in docker-compose.yml

### OpenAI API Issues
1. Verify your API key is correct in the `.env` file
2. Check your OpenAI account has sufficient credits
3. Ensure the API key has proper permissions

## Production Deployment

For production deployment:

1. **Change default passwords** in `docker-compose.yml`
2. **Set strong secrets** for database and session management
3. **Configure reverse proxy** (nginx/traefik) for SSL termination
4. **Set up backups** for the PostgreSQL volume
5. **Monitor resource usage** and scale as needed

## File Structure

```
.
├── Dockerfile              # Application container definition
├── docker-compose.yml      # Multi-service orchestration
├── .dockerignore           # Files to exclude from Docker build
├── DOCKER_SETUP.md         # This setup guide
├── package.json            # Node.js dependencies and scripts
├── server/                 # Backend API code
├── client/                 # Frontend React application
├── shared/                 # Shared types and schemas
└── .env                    # Environment variables (create this)
```

## Support

If you encounter any issues:
1. Check the logs with `docker-compose logs`
2. Ensure all required environment variables are set
3. Verify Docker and Docker Compose are properly installed
4. Make sure ports 5000 and 5432 are available