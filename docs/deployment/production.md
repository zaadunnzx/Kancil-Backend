# Production Deployment Guide

Complete guide for deploying Kancil AI Backend to production environment.

## 🚀 Deployment Options

### Option 1: Traditional Server (Ubuntu/CentOS)
### Option 2: Docker Container
### Option 3: Cloud Platforms (AWS, GCP, Azure)
### Option 4: Platform as a Service (Heroku, Railway)

## 🛠️ Pre-Deployment Checklist

### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 50GB+ SSD
- **Network**: Static IP with domain name

### Software Dependencies
- **Node.js**: v16.x or higher
- **PostgreSQL**: v12.x or higher
- **PM2**: Process manager
- **Nginx**: Reverse proxy
- **SSL Certificate**: Let's Encrypt or commercial

## 📦 Traditional Server Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx

# Install Git
sudo apt install git
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE kancil_ai_prod;
CREATE USER kancil_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE kancil_ai_prod TO kancil_user;
ALTER USER kancil_user CREATEDB;
\q
```

### 3. Application Deployment

```bash
# Create app directory
sudo mkdir -p /var/www/kancil-backend
sudo chown $USER:$USER /var/www/kancil-backend

# Clone repository
cd /var/www/kancil-backend
git clone <your-repo-url> .

# Install dependencies
npm ci --production

# Create production environment file
cp .env.example .env.production
```

### 4. Environment Configuration

```bash
# Edit production environment
sudo nano .env.production
```

```env
# Production Environment Variables
NODE_ENV=production
PORT=5001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kancil_ai_prod
DB_USER=kancil_user
DB_PASSWORD=secure_password_here

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_32_chars_minimum
JWT_EXPIRES_IN=7d

# Google OAuth (Production)
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# URLs
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com

# File Upload
MAX_FILE_SIZE=100MB
UPLOAD_PATH=/var/www/kancil-backend/uploads

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Logging
LOG_LEVEL=error
LOG_FILE=/var/log/kancil-backend/app.log
```

### 5. Database Migration

```bash
# Set environment
export NODE_ENV=production

# Run database setup
npm run db:setup

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed:production
```

### 6. PM2 Process Manager

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'kancil-backend',
    script: 'server.js',
    cwd: '/var/www/kancil-backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    env_file: '.env.production',
    error_file: '/var/log/kancil-backend/err.log',
    out_file: '/var/log/kancil-backend/out.log',
    log_file: '/var/log/kancil-backend/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

```bash
# Create log directory
sudo mkdir -p /var/log/kancil-backend
sudo chown $USER:$USER /var/log/kancil-backend

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 7. Nginx Configuration

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/kancil-backend
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # CORS Headers
    add_header Access-Control-Allow-Origin "https://app.yourdomain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health Check
    location /health {
        proxy_pass http://127.0.0.1:5001/api/health;
        proxy_set_header Host $host;
    }

    # Static Files (Uploads)
    location /uploads/ {
        alias /var/www/kancil-backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Security for uploads
        location ~* \.(php|asp|aspx|jsp)$ {
            deny all;
        }
    }

    # Rate Limiting
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Rate limiting configuration
http {
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kancil-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 8. SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 Docker Deployment

### 1. Dockerfile

```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Create uploads directory
RUN mkdir -p uploads && chown nodejs:nodejs uploads

USER nodejs

EXPOSE 5001

CMD ["node", "server.js"]
```

### 2. Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: kancil_ai_prod
      POSTGRES_USER: kancil_user
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/sites-enabled:/etc/nginx/sites-enabled
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  uploads:
  logs:
```

### 3. Deploy with Docker

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Update application
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps app
```

## ☁️ Cloud Platform Deployment

### AWS EC2 with RDS

```bash
# Launch EC2 instance (t3.medium recommended)
# Setup RDS PostgreSQL instance
# Configure Security Groups
# Follow traditional server setup with cloud-specific configurations
```

### Heroku Deployment

```json
// package.json
{
  "engines": {
    "node": "18.x"
  },
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "npm run build"
  }
}
```

```bash
# Heroku CLI commands
heroku create kancil-backend-prod
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_here
git push heroku main
```

## 📊 Monitoring & Maintenance

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# Check application status
pm2 status

# View logs
pm2 logs kancil-backend

# Restart application
pm2 restart kancil-backend

# Reload without downtime
pm2 reload kancil-backend
```

### 2. Database Monitoring

```sql
-- Check database connections
SELECT * FROM pg_stat_activity WHERE datname = 'kancil_ai_prod';

-- Check database size
SELECT pg_size_pretty(pg_database_size('kancil_ai_prod'));

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 3. System Monitoring

```bash
# System resources
htop
df -h
free -h

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/log/kancil-backend/combined.log
```

### 4. Backup Strategy

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/backups/kancil-backend"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="kancil_ai_prod"

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U kancil_user $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/kancil-backend/uploads

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

```bash
# Add to crontab
0 2 * * * /path/to/backup_script.sh
```

## 🔒 Security Hardening

### 1. Server Security

```bash
# Firewall configuration
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban
```

### 2. Application Security

```javascript
// Add security middleware
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## 🚀 Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_subcourses_course_id ON subcourses(course_id);
CREATE INDEX idx_progress_student_id ON student_sub_course_progress(enrollment_student_id);
```

### 2. Application Optimization

```javascript
// Enable gzip compression
const compression = require('compression');
app.use(compression());

// Cache static files
app.use('/uploads', express.static('uploads', {
  maxAge: '30d',
  etag: true
}));
```

## ✅ Deployment Checklist

### Pre-Deployment:
- [ ] Environment variables configured
- [ ] Database setup completed
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Backup strategy implemented

### Post-Deployment:
- [ ] Health checks passing
- [ ] All endpoints tested
- [ ] Monitoring configured
- [ ] Logs accessible
- [ ] Performance optimized
- [ ] Security hardened

### Regular Maintenance:
- [ ] Monitor application performance
- [ ] Check database performance
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Test backup restoration

## 📞 Support & Troubleshooting

### Common Issues:

#### 502 Bad Gateway
```bash
# Check if application is running
pm2 status
# Check application logs
pm2 logs kancil-backend
# Restart application
pm2 restart kancil-backend
```

#### Database Connection Errors
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# Test database connection
psql -h localhost -U kancil_user -d kancil_ai_prod
```

#### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew
# Test certificate
sudo certbot certificates
```

Your production deployment is now ready! 🚀