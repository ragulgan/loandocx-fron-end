# LoanDocX Deployment Guide

## Prerequisites
- AWS/GCP account with Docker support
- MySQL 8.0 instance
- Node.js 18+ environment

## 1. Environment Setup
Create a `.env` file in the project root:
```env
DB_HOST=your-rds-endpoint
DB_USER=admin
DB_PASS=yourpassword
DB_NAME=loandocx_db
JWT_SECRET=production_secret_key_8822
PORT=3000
```

## 2. Database Initialization
Run the provided `db-schema.sql` script on your MySQL instance to create all tables and relationships.

## 3. Docker Deployment
Use the following `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
  frontend:
    build: ./frontend
    ports:
      - "80:80"
```

## 4. Scaling
For high availability, deploy the backend as an ECS Service (AWS) or GKE Deployment (GCP) with an Application Load Balancer.
Ensure S3/GCS is used for document storage instead of local storage.