#!/bin/bash

# Automatic database setup script for Ona UI
# Usage: ./scripts/setup-database.sh

set -e

echo "🚀 Setting up Ona UI database"
echo "============================="

# Colors for messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display colored messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if PostgreSQL is installed
check_postgresql() {
    log_info "Checking PostgreSQL..."

    if command -v psql &> /dev/null; then
        log_success "PostgreSQL is installed"
        psql --version
    else
        log_error "PostgreSQL is not installed"
        echo ""
        echo "Required installation:"
        echo "  macOS: brew install postgresql"
        echo "  Ubuntu: sudo apt install postgresql postgresql-contrib"
        echo "  Windows: https://www.postgresql.org/download/windows/"
        exit 1
    fi
}

# Check if PostgreSQL is running
check_postgresql_running() {
    log_info "Checking PostgreSQL service..."

    if pg_isready -h localhost -p 5432 &> /dev/null; then
        log_success "PostgreSQL is running"
    else
        log_warning "PostgreSQL is not running"
        echo ""
        echo "Starting the service:"
        echo "  macOS: brew services start postgresql"
        echo "  Linux: sudo systemctl start postgresql"
        echo ""
        read -p "Would you like me to try starting PostgreSQL? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                brew services start postgresql
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sudo systemctl start postgresql
            fi
            sleep 2
            if pg_isready -h localhost -p 5432 &> /dev/null; then
                log_success "PostgreSQL started successfully"
            else
                log_error "Unable to start PostgreSQL"
                exit 1
            fi
        else
            log_error "PostgreSQL must be running to continue"
            exit 1
        fi
    fi
}

# Create postgres user if necessary
create_postgres_user() {
    log_info "Checking postgres user..."

    if psql -U postgres -c '\q' 2>/dev/null; then
        log_success "Postgres user exists"
    else
        log_warning "Postgres user does not exist"

        # Try to create the user
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS with Homebrew
            createuser -s postgres 2>/dev/null || true
            psql -d postgres -c "ALTER USER postgres PASSWORD 'postgres';" 2>/dev/null || true
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            sudo -u postgres createuser --superuser postgres 2>/dev/null || true
            sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" 2>/dev/null || true
        fi

        if psql -U postgres -c '\q' 2>/dev/null; then
            log_success "Postgres user created"
        else
            log_error "Unable to create postgres user"
            echo "Create the user manually with:"
            echo "  sudo -u postgres createuser --superuser postgres"
            echo "  sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'postgres';\""
            exit 1
        fi
    fi
}

# Create the database
create_database() {
    log_info "Creating ona-ui-dev database..."

    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw ona-ui-dev; then
        log_warning "Database ona-ui-dev already exists"
        read -p "Would you like to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            dropdb -U postgres ona-ui-dev
            log_success "Database dropped"
        else
            log_info "Keeping existing database"
            return
        fi
    fi

    createdb -U postgres ona-ui-dev
    log_success "Database ona-ui-dev created"
}

# Create the tables
create_tables() {
    log_info "Creating tables..."

    if [ -f "database/setup_local_db.sql" ]; then
        psql -U postgres -d ona-ui-dev -f database/setup_local_db.sql
        log_success "Tables created successfully"
    else
        log_error "File database/setup_local_db.sql not found"
        exit 1
    fi
}

# Configure the .env file
configure_env() {
    log_info "Configuring .env file..."

    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success ".env file created from .env.example"
        else
            log_error ".env.example file not found"
            exit 1
        fi
    else
        log_warning ".env file already exists"
    fi

    # Update the DATABASE_URL
    if grep -q "DATABASE_URL=" .env; then
        sed -i.bak 's|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/ona-ui-dev|' .env
        log_success "DATABASE_URL updated in .env"
    else
        echo "DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/ona-ui-dev" >> .env
        log_success "DATABASE_URL added to .env"
    fi
}

# Test the connection
test_connection() {
    log_info "Testing database connection..."

    if psql -U postgres -d ona-ui-dev -c "SELECT 'Connection successful!' as message;" > /dev/null 2>&1; then
        log_success "Database connection successful"
    else
        log_error "Unable to connect to database"
        exit 1
    fi
}

# Compile and run the seeders
run_seeders() {
    log_info "Building the project..."

    if yarn build; then
        log_success "Build successful"
    else
        log_error "Build error"
        exit 1
    fi

    log_info "Running seeders..."

    if yarn run seed; then
        log_success "Seeders executed successfully"
    else
        log_error "Error running seeders"
        exit 1
    fi
}

# Main function
main() {
    echo ""
    log_info "Starting configuration..."
    echo ""

    check_postgresql
    check_postgresql_running
    create_postgres_user
    create_database
    create_tables
    configure_env
    test_connection

    echo ""
    log_success "Database configuration completed!"
    echo ""

    read -p "Would you like to build and run the seeders now? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        log_info "You can run the seeders later with: yarn run seed"
    else
        echo ""
        run_seeders
    fi

    echo ""
    log_success "🎉 Configuration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Start the server: yarn dev"
    echo "  2. Test the API: curl http://localhost:3333/api/health"
    echo "  3. View documentation: apps/backend/database/README.md"
    echo ""
}

# Exécuter le script principal
main "$@"