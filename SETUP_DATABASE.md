# Database Setup Commands

## Step 1: Start Docker Desktop
Make sure Docker Desktop is running on Windows.

## Step 2: Start Docker Containers
```powershell
docker-compose -f docker-compose.dev.yml up -d
```

Wait a few seconds for PostgreSQL to fully start.

## Step 3: Create Database (Choose one method)

### Method 1: Using Prisma (Recommended - Creates DB automatically)
```powershell
# This will create the database and all tables automatically
npm run db:push
```

### Method 2: Manual Database Creation
If Method 1 doesn't work, create the database manually:

```powershell
# Connect to PostgreSQL as postgres user
docker exec -it lykos-postgres psql -U postgres

# Then run these SQL commands:
CREATE DATABASE lykos_dev;
CREATE USER lykos WITH PASSWORD 'devpassword';
GRANT ALL PRIVILEGES ON DATABASE lykos_dev TO lykos;
\q
```

### Method 3: Using psql directly
```powershell
# Create database
docker exec -it lykos-postgres psql -U postgres -c "CREATE DATABASE lykos_dev;"

# Create user (if not exists)
docker exec -it lykos-postgres psql -U postgres -c "CREATE USER lykos WITH PASSWORD 'devpassword';"

# Grant privileges
docker exec -it lykos-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE lykos_dev TO lykos;"
```

## Step 4: Run Migrations
After database is created:

```powershell
# Generate Prisma client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# OR use migrations (creates migration files)
npm run db:migrate
```

## Verify Database Connection
```powershell
# Test connection
docker exec -it lykos-postgres psql -U lykos -d lykos_dev -c "SELECT version();"
```

## Troubleshooting

### If authentication fails:
The database might already exist. Try connecting as postgres user first:

```powershell
docker exec -it lykos-postgres psql -U postgres -c "\l"
```

This lists all databases. If `lykos_dev` exists, you might need to reset it:

```powershell
# Drop and recreate
docker exec -it lykos-postgres psql -U postgres -c "DROP DATABASE IF EXISTS lykos_dev;"
docker exec -it lykos-postgres psql -U postgres -c "CREATE DATABASE lykos_dev OWNER lykos;"
```

### If Docker containers aren't running:
```powershell
# Check status
docker-compose -f docker-compose.dev.yml ps

# Start containers
docker-compose -f docker-compose.dev.yml up -d

# Check logs
docker-compose -f docker-compose.dev.yml logs postgres
```
