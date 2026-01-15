#!/bin/bash

# JAMALBRICO Local MySQL Setup Script
echo "🚀 Setting up JAMALBRICO with local MySQL..."

# Create a simple MySQL service using Docker (if available)
if command -v docker &> /dev/null; then
    echo "📦 Starting MySQL container..."
    docker run --name jamalbrico-mysql \
        -e MYSQL_ROOT_PASSWORD=password123 \
        -e MYSQL_DATABASE=jamalbrico \
        -e MYSQL_USER=jamalbrico \
        -e MYSQL_PASSWORD=jamalbrico123 \
        -p 3306:3306 \
        -d mysql:8.0

    echo "⏳ Waiting for MySQL to start..."
    sleep 10

    echo "📋 Setting up database schema..."
    docker exec -i jamalbrico-mysql mysql -ujamalbrico -pjamalbrico123 jamalbrico < unified_database_schema.sql

else
    echo "⚠️  Docker not available. Using alternative setup..."
    echo "📝 Creating environment configuration..."

    # Update environment files for local development
    echo "DB_HOST=localhost" > .env.local
    echo "DB_USER=root" >> .env.local
    echo "DB_PASSWORD=" >> .env.local
    echo "DB_NAME=jamalbrico" >> .env.local
    echo "DB_PORT=3306" >> .env.local
    echo "USE_MYSQL=false" >> .env.local

    echo "✅ Environment configured for local development"
    echo "📌 Note: In production, you'll need to:"
    echo "   1. Install MySQL 8.0+"
    echo "   2. Create database 'jamalbrico'"
    echo "   3. Run the unified_database_schema.sql"
    echo "   4. Update .env with your MySQL credentials"
fi

echo "🎉 Setup complete!"
