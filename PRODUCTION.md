# Production Deployment Guide

## Pre-Deployment Checklist

### Environment Configuration

1. **Set Production Environment Variables**
   ```bash
   NODE_ENV=production
   DATABASE_URL=<production-postgres-url>
   REDIS_URL=<production-redis-url>
   JWT_SECRET=<strong-random-secret>
   ```

2. **Configure RPC Endpoints**
   - Use production RPC providers (Alchemy, Infura, QuickNode)
   - Set up failover RPC endpoints
   - Configure rate limits

3. **Security**
   - Generate strong JWT secret (min 32 characters)
   - Use production Vault for secrets management
   - Enable HTTPS/TLS
   - Configure CORS origins properly
   - Set up rate limiting per endpoint

4. **Monitoring**
   - Set up error tracking (Sentry, DataDog)
   - Configure logging (CloudWatch, Loggly)
   - Set up metrics (Prometheus, Grafana)
   - Configure alerts

## Deployment Options

### Option 1: Docker Compose (Recommended for small deployments)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  api-gateway:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
```

### Option 2: Kubernetes (Recommended for scale)

See `k8s/` directory for Kubernetes manifests.

### Option 3: Cloud Platform (AWS, GCP, Azure)

#### AWS (ECS/Fargate)
- Use ECS with Fargate for containerized services
- RDS for PostgreSQL
- ElastiCache for Redis
- Application Load Balancer for routing
- CloudWatch for monitoring

#### GCP (Cloud Run/GKE)
- Cloud Run for serverless containers
- Cloud SQL for PostgreSQL
- Memorystore for Redis
- Cloud Load Balancing
- Cloud Monitoring

## Database Migration

```bash
# Production migration
npm run db:generate
npm run db:migrate deploy
```

## Monitoring & Health Checks

### Health Check Endpoints

```bash
# API Gateway health
GET /health

# Detailed health check
GET /api/v1/health
```

### Metrics to Monitor

1. **API Metrics**
   - Request rate (req/sec)
   - Response time (p50, p95, p99)
   - Error rate (4xx, 5xx)
   - Endpoint-specific metrics

2. **Database Metrics**
   - Connection pool usage
   - Query performance
   - Replication lag

3. **Redis Metrics**
   - Memory usage
   - Hit rate
   - Connection count

4. **Chain Metrics**
   - RPC call success rate
   - Gas estimation accuracy
   - Transaction confirmation time

## Scaling

### Horizontal Scaling

1. **Stateless Services**
   - All services are stateless
   - Can scale horizontally behind load balancer
   - Use session affinity for Redis

2. **Database Scaling**
   - Read replicas for read-heavy operations
   - Connection pooling
   - Query optimization

3. **Caching Strategy**
   - Cache frequently accessed data
   - Use Redis for session storage
   - Cache chain data (gas prices, token info)

### Vertical Scaling

- Increase instance sizes for CPU/memory-intensive services
- Optimize database queries
- Increase Redis memory

## Security Best Practices

1. **API Security**
   - Rate limiting per endpoint
   - IP whitelisting for sensitive endpoints
   - JWT token expiration
   - Request validation

2. **Database Security**
   - Encrypted connections
   - Restricted network access
   - Regular backups
   - PII data encryption

3. **Secrets Management**
   - Use Vault or cloud secret managers
   - Rotate secrets regularly
   - Never commit secrets to git

4. **Network Security**
   - VPC isolation
   - Security groups
   - DDoS protection (CloudFlare, AWS Shield)

## Backup & Disaster Recovery

### Database Backups

```bash
# Automated daily backups
# Restore from backup
pg_restore -d database_name backup_file.dump
```

### Redis Backups

```bash
# Redis persistence (AOF enabled)
# Regular snapshot backups
```

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: < 1 hour
2. **RPO (Recovery Point Objective)**: < 15 minutes
3. **Backup retention**: 30 days
4. **Test restore procedures**: Monthly

## Performance Optimization

### API Optimization

- Enable HTTP/2
- Use compression (gzip)
- Implement caching headers
- Optimize database queries
- Use connection pooling

### Database Optimization

- Index frequently queried fields
- Partition large tables
- Use read replicas
- Optimize Prisma queries

### Caching

- Cache chain data (gas prices, token info)
- Cache user sessions
- Cache frequently accessed wallet data
- Use CDN for static assets

## Cost Optimization

1. **Right-sizing**
   - Monitor resource usage
   - Scale down when not needed
   - Use reserved instances

2. **Caching**
   - Reduce database queries
   - Reduce RPC calls
   - Use CDN

3. **Efficient Queries**
   - Optimize database queries
   - Use indexes
   - Limit data transfer

## Rollback Procedures

### Database Rollback

```bash
# Rollback last migration
npm run db:migrate rollback
```

### Service Rollback

1. Keep previous Docker images tagged
2. Use blue-green deployment
3. Monitor health after deployment
4. Rollback if errors detected

## Monitoring Setup

### Application Logs

- Centralized logging (ELK, Loki)
- Log aggregation
- Log retention (30 days)

### Error Tracking

- Sentry for error tracking
- Alert on critical errors
- Track error trends

### Metrics

- Prometheus for metrics
- Grafana for visualization
- Alerting on thresholds

## Load Testing

```bash
# Use k6, Artillery, or Locust
# Test endpoints:
# - POST /transactions/send
# - GET /wallets
# - POST /security/simulate
```

## Security Audit

- Regular security audits
- Dependency scanning
- Penetration testing
- Compliance checks (GDPR, SOC 2)

## Support & Maintenance

- 24/7 monitoring
- Incident response plan
- Regular updates (security patches)
- Performance reviews (monthly)
