#!/bin/bash

set -e

echo "============================================="
echo "  Assistance Immediately - Database Initialization Script"
echo "============================================="
echo ""

DB_NAME="ticketing_db"
DB_USER="ticketing_user"
DB_PASSWORD="ticketing_pass"
DB_HOST="localhost"
DB_PORT="5432"

echo "Checking for PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "ERROR: PostgreSQL client (psql) is not installed."
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-client"
    echo "  macOS: brew install postgresql"
    echo "  CentOS/RHEL: sudo yum install postgresql-server postgresql"
    exit 1
fi

echo "PostgreSQL found!"
echo ""

echo "Setting up PostgreSQL database..."
echo ""

echo "1. Creating database user..."
sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
echo "   User '${DB_USER}' created or already exists."

echo "2. Creating database..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
echo "   Database '${DB_NAME}' created or already exists."

echo "3. Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
echo "   Privileges granted."

echo ""
echo "Database setup complete!"
echo ""

echo "============================================="
echo "  Backend Setup"
echo "============================================="
echo ""

cd "$(dirname "$0")/backend" || exit 1

echo "4. Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "   Virtual environment created."
else
    echo "   Virtual environment already exists."
fi

echo "5. Activating virtual environment..."
source venv/bin/activate

echo "6. Installing dependencies..."
pip install -q -r requirements.txt
echo "   Dependencies installed."

echo "7. Creating .env file..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
SECRET_KEY=django-insecure-change-this-in-production-$(openssl rand -hex 32)
DEBUG=True
ALLOWED_HOSTS=*

DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@assistancenow.local
EOF
    echo "   .env file created."
else
    echo "   .env file already exists."
fi

echo "8. Running database migrations..."
python manage.py migrate --noinput
echo "   Migrations applied."

echo "9. Creating default admin user..."
python manage.py shell << 'PYTHON_SCRIPT'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@assistancenow.com').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@assistancenow.com',
        password='admin123',
        first_name='System',
        last_name='Administrator',
        role='admin'
    )
    print("   Admin user created: admin@assistancenow.com / admin123")

if not User.objects.filter(email='tech@assistancenow.com').exists():
    User.objects.create_user(
        username='technician',
        email='tech@assistancenow.com',
        password='tech123',
        first_name='John',
        last_name='Technician',
        role='technician',
        department='IT'
    )
    print("   Technician user created: tech@assistancenow.com / tech123")

if not User.objects.filter(email='user@assistancenow.com').exists():
    User.objects.create_user(
        username='enduser',
        email='user@assistancenow.com',
        password='user123',
        first_name='Jane',
        last_name='User',
        role='end_user',
        department='HR'
    )
    print("   End user created: user@assistancenow.com / user123")
else:
    print("   End user already exists.")
PYTHON_SCRIPT

echo ""
echo "10. Creating default categories..."
python manage.py shell << 'PYTHON_SCRIPT'
from api.models import Category, SLAPolicy

if not Category.objects.exists():
    categories = [
        {'name': 'Hardware', 'icon': 'cpu'},
        {'name': 'Software', 'icon': 'code'},
        {'name': 'Network', 'icon': 'wifi'},
        {'name': 'Email', 'icon': 'mail'},
        {'name': 'Access', 'icon': 'key'},
        {'name': 'Printer', 'icon': 'printer'},
        {'name': 'Database', 'icon': 'database'},
        {'name': 'Security', 'icon': 'shield'},
    ]
    for cat in categories:
        Category.objects.create(**cat)
    print(f"   Created {len(categories)} categories.")
else:
    print("   Categories already exist.")

if not SLAPolicy.objects.exists():
    sla_policies = [
        {'name': 'Critical Incident SLA', 'priority': '1', 'response_time_hours': 1, 'resolution_time_hours': 4},
        {'name': 'High Priority SLA', 'priority': '2', 'response_time_hours': 2, 'resolution_time_hours': 8},
        {'name': 'Medium Priority SLA', 'priority': '3', 'response_time_hours': 4, 'resolution_time_hours': 24},
        {'name': 'Low Priority SLA', 'priority': '4', 'response_time_hours': 8, 'resolution_time_hours': 72},
    ]
    for policy in sla_policies:
        SLAPolicy.objects.create(**policy, description=f"SLA for {policy['name'].lower()} tickets")
    print(f"   Created {len(sla_policies)} SLA policies.")
else:
    print("   SLA policies already exist.")
PYTHON_SCRIPT

echo ""
echo "============================================="
echo "  Frontend Setup"
echo "============================================="
echo ""

cd ../frontend || exit 1

echo "11. Installing frontend dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "   Frontend dependencies installed."
else
    echo "   Frontend dependencies already installed."
fi

echo ""
echo "============================================="
echo "  Setup Complete!"
echo "============================================="
echo ""
echo "To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && source venv/bin/activate"
echo "    python manage.py runserver"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm start"
echo ""
echo "Default login credentials:"
echo "  Admin:     admin@assistancenow.com / admin123"
echo "  Technician: tech@assistancenow.com / tech123"
echo "  End User:  user@assistancenow.com / user123"
echo ""
echo "API Documentation: http://localhost:8000/api/docs/"
echo "Admin Panel: http://localhost:8000/admin/"
echo ""
