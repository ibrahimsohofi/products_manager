#!/bin/bash

# JAMALBRICO Full-Stack Startup Script
# This script starts both frontend and backend servers

echo "🚀 Starting JAMALBRICO Full-Stack Application..."
echo "📦 Frontend: React + Vite (port 5173)"
echo "🔧 Backend: Express + Mock Database (port 3001)"
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    bun install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && bun install && cd ..
fi

# Start both servers
echo "🎯 Starting both servers..."
bun run start
