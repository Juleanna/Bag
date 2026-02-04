#!/usr/bin/env bash

# Production deployment script for BugTracker

set -e

echo "🚀 Starting BugTracker Production Deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"

# Build images
echo -e "${YELLOW}📦 Building Docker images...${NC}"
docker-compose build

# Start services
echo -e "${YELLOW}🔧 Starting services...${NC}"
docker-compose up -d

# Wait for database
echo -e "${YELLOW}⏳ Waiting for database...${NC}"
for i in {1..30}; do
    if docker-compose exec -T db psql -U bugtracker -d bugtracker -c "SELECT 1" &>/dev/null; then
        echo -e "${GREEN}✓ Database is ready${NC}"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 1
done

# Run migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
docker-compose exec -T web python manage.py migrate

# Collect static files
echo -e "${YELLOW}📁 Collecting static files...${NC}"
docker-compose exec -T web python manage.py collectstatic --noinput

# Create superuser (optional)
echo -e "${YELLOW}👤 Create superuser? (y/n)${NC}"
read -r response
if [[ "$response" == "y" ]]; then
    docker-compose exec web python manage.py createsuperuser
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Services:"
echo "  - Web: http://localhost"
echo "  - Admin: http://localhost/admin"
echo "  - API: http://localhost/api"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f web"
echo "  - Shell: docker-compose exec web python manage.py shell"
echo "  - Stop: docker-compose down"
