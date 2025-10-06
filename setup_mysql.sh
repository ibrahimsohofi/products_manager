#!/bin/bash

# JAMALBRICO MySQL Setup Script
# This script helps set up MySQL for the jamalbrico project

echo "🏪 JAMALBRICO - MySQL Database Setup"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}💡 $1${NC}"
}

# Check if MySQL is installed
check_mysql() {
    if command -v mysql >/dev/null 2>&1; then
        print_status "MySQL client found"
        mysql --version
        return 0
    else
        print_error "MySQL client not found"
        return 1
    fi
}

# Install MySQL (Ubuntu/Debian)
install_mysql_ubuntu() {
    print_info "Installing MySQL on Ubuntu/Debian..."

    # Update package list
    sudo apt update

    # Install MySQL server
    sudo apt install -y mysql-server

    # Start MySQL service
    sudo systemctl start mysql
    sudo systemctl enable mysql

    print_status "MySQL installed and started"
}

# Install MySQL (macOS)
install_mysql_macos() {
    print_info "Installing MySQL on macOS..."

    if command -v brew >/dev/null 2>&1; then
        brew install mysql
        brew services start mysql
        print_status "MySQL installed via Homebrew"
    else
        print_error "Homebrew not found. Please install Homebrew or download MySQL from https://dev.mysql.com/downloads/mysql/"
        return 1
    fi
}

# Setup database and user
setup_database() {
    print_info "Setting up jamalbrico database..."

    # Check if we can connect to MySQL
    if mysql -u root -e "SELECT 1;" >/dev/null 2>&1; then
        print_status "Connected to MySQL as root (no password)"
        MYSQL_CMD="mysql -u root"
    else
        print_warning "Root user requires password. You'll be prompted to enter it."
        MYSQL_CMD="mysql -u root -p"
    fi

    # Create database and user
    $MYSQL_CMD <<EOF
-- Create database
CREATE DATABASE IF NOT EXISTS jamalbrico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user (optional but recommended)
CREATE USER IF NOT EXISTS 'jamalbrico_user'@'localhost' IDENTIFIED BY 'jamalbrico_pass';
GRANT ALL PRIVILEGES ON jamalbrico.* TO 'jamalbrico_user'@'localhost';
FLUSH PRIVILEGES;

-- Show databases
SHOW DATABASES;
EOF

    if [ $? -eq 0 ]; then
        print_status "Database 'jamalbrico' created successfully"
        print_info "You can use either:"
        print_info "  - root user (current setup)"
        print_info "  - dedicated user: jamalbrico_user / jamalbrico_pass"
    else
        print_error "Failed to create database"
        return 1
    fi
}

# Update environment file
update_env() {
    print_info "Updating environment configuration..."

    cd "$(dirname "$0")/jamalbrico/server"

    if [ ! -f .env ]; then
        print_error ".env file not found in jamalbrico/server/"
        return 1
    fi

    # Ask user which MySQL user to use
    echo
    echo "Which MySQL user would you like to use?"
    echo "1) root (default, current setup)"
    echo "2) jamalbrico_user (dedicated user)"
    read -p "Enter choice (1-2): " choice

    case $choice in
        2)
            print_info "Updating .env for dedicated user..."
            sed -i 's/DB_USER=root/DB_USER=jamalbrico_user/' .env
            sed -i 's/DB_PASSWORD=/DB_PASSWORD=jamalbrico_pass/' .env
            ;;
        *)
            print_info "Keeping root user configuration"
            ;;
    esac

    print_status "Environment file updated"
    echo
    print_info "Current database configuration:"
    grep "DB_" .env
}

# Test connection
test_connection() {
    print_info "Testing database connection..."

    cd "$(dirname "$0")/jamalbrico/server"

    # Load environment variables
    export $(grep -v '^#' .env | xargs)

    # Test connection
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;" >/dev/null 2>&1; then
        print_status "Database connection successful!"
    else
        print_error "Database connection failed. Please check your configuration."
        return 1
    fi
}

# Import sample data
import_sample_data() {
    print_info "Would you like to import the complete database schema with sample data?"
    read -p "Enter y/n: " import_choice

    if [ "$import_choice" = "y" ] || [ "$import_choice" = "Y" ]; then
        cd "$(dirname "$0")"

        if [ -f "jamalbrico/database/jamalbrico_mysql_complete.sql" ]; then
            # Load environment variables
            export $(grep -v '^#' jamalbrico/server/.env | xargs)

            print_info "Importing database schema and sample data..."
            mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < jamalbrico/database/jamalbrico_mysql_complete.sql

            if [ $? -eq 0 ]; then
                print_status "Database schema and sample data imported successfully!"
            else
                print_error "Failed to import database schema"
                return 1
            fi
        else
            print_warning "SQL file not found, tables will be created automatically when server starts"
        fi
    else
        print_info "Skipping sample data import. Tables will be created automatically."
    fi
}

# Main setup flow
main() {
    echo
    print_info "Starting MySQL setup for JAMALBRICO..."
    echo

    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        print_warning "Unsupported OS: $OSTYPE"
        OS="unknown"
    fi

    # Step 1: Check if MySQL is installed
    if ! check_mysql; then
        print_info "MySQL not found. Would you like to install it?"
        read -p "Install MySQL? (y/n): " install_choice

        if [ "$install_choice" = "y" ] || [ "$install_choice" = "Y" ]; then
            case $OS in
                linux)
                    install_mysql_ubuntu
                    ;;
                macos)
                    install_mysql_macos
                    ;;
                *)
                    print_error "Automatic installation not supported on this OS"
                    print_info "Please install MySQL manually from: https://dev.mysql.com/downloads/"
                    exit 1
                    ;;
            esac
        else
            print_error "MySQL is required for this application"
            exit 1
        fi
    fi

    # Step 2: Setup database
    setup_database

    # Step 3: Update environment file
    update_env

    # Step 4: Import sample data
    import_sample_data

    # Step 5: Test connection
    test_connection

    echo
    print_status "MySQL setup completed successfully!"
    echo
    print_info "Next steps:"
    echo "  1. cd jamalbrico/server && bun install"
    echo "  2. bun start (to start the backend)"
    echo "  3. cd ../.. && cd jamalbrico && bun install"
    echo "  4. bun run dev (to start the frontend)"
    echo
    print_info "The application will be available at:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend API: http://localhost:3001"
    echo
}

# Run main function
main
