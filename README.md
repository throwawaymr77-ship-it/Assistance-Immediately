# Assistance Immediately - IT Service Management Ticketing System

A comprehensive, ServiceNow-inspired IT service management (ITSM) ticketing system built with Django and React, powered by PostgreSQL.

## Features

### Core Ticketing
- **Incident Management** - Report and track IT incidents
- **Service Requests** - Handle user requests for services
- **Problem Management** - Track root causes and recurring issues
- **Change Requests** - Manage infrastructure changes with approval workflows
- **Task Management** - Assign and track individual tasks

### Ticket Features
- Auto-generated ticket numbers (INC-XXXX, REQ-XXXX, etc.)
- Priority levels: Critical, High, Medium, Low
- Impact and urgency tracking
- Assignment to technicians and groups
- Status workflow: New → In Progress → On Hold → Resolved → Closed
- Comments (public and internal notes)
- File attachments
- SLA tracking with breach alerts
- Due date management

### Knowledge Base
- Create and publish help articles
- Search functionality
- View tracking and helpfulness ratings
- Draft/review/publish workflow

### Asset Management
- Track hardware, software, licenses, and network equipment
- Asset lifecycle management
- Assignment tracking
- Status monitoring

### Administration
- User management with role-based access (Admin, Manager, Technician, End User)
- SLA policy configuration
- Audit logging for all system changes
- Reports and analytics
- Dashboard with real-time statistics

### API
- RESTful API with full CRUD operations
- API documentation via Swagger/OpenAPI
- Token-based authentication
- Filtering, searching, and pagination

## Tech Stack

- **Backend**: Django 5.0, Django REST Framework
- **Frontend**: React 18, React Router, React Query
- **Database**: PostgreSQL
- **Styling**: Custom CSS with modern design system
- **Icons**: Lucide React
- **Charts**: Recharts

## Project Structure

```
assistance-immediately/
├── backend/                    # Django backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── ticketing/              # Django project settings
│       ├── settings.py
│       ├── urls.py
│       └── api/                # Main API app
│           ├── models.py       # Database models
│           ├── serializers.py  # API serializers
│           ├── views.py        # API views/viewsets
│           ├── urls.py         # API routes
│           └── admin.py        # Django admin config
│
├── frontend/                   # React frontend
│   ├── package.json
│   └── src/
│       ├── App.js              # Main app with routes
│       ├── api.js              # API client
│       ├── index.css           # Global styles
│       └── pages/              # Page components
│           ├── Login.js
│           ├── Dashboard.js
│           ├── TicketList.js
│           ├── TicketDetail.js
│           ├── TicketForm.js
│           ├── KnowledgeBase.js
│           ├── KnowledgeBaseDetail.js
│           ├── Assets.js
│           ├── ChangeRequests.js
│           ├── Users.js
│           ├── SLAManagement.js
│           ├── AuditLogs.js
│           └── Reports.js
│
├── init-db.sh                  # Database initialization script
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- pip and npm

### Quick Start

1. **Run the initialization script:**

```bash
chmod +x init-db.sh
./init-db.sh
```

This script will:
- Create the PostgreSQL database and user
- Set up the Python virtual environment
- Install backend dependencies
- Run database migrations
- Create default users and seed data
- Install frontend dependencies

2. **Start the backend server:**

```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

3. **Start the frontend dev server (in a new terminal):**

```bash
cd frontend
npm start
```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/api/docs/
   - Admin Panel: http://localhost:8000/admin/

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@assistancenow.com | admin123 |
| Technician | tech@assistancenow.com | tech123 |
| End User | user@assistancenow.com | user123 |

### Manual Setup

If you prefer to set up manually:

1. **Create PostgreSQL database:**

```bash
sudo -u postgres psql
CREATE USER ticketing_user WITH PASSWORD 'ticketing_pass';
CREATE DATABASE ticketing_db OWNER ticketing_user;
GRANT ALL PRIVILEGES ON DATABASE ticketing_db TO ticketing_user;
\q
```

2. **Set up backend:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

3. **Set up frontend:**

```bash
cd frontend
npm install
npm start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tickets/` | GET, POST | List/create tickets |
| `/api/tickets/{id}/` | GET, PUT, PATCH, DELETE | Ticket CRUD |
| `/api/tickets/{id}/assign/` | POST | Assign ticket to user |
| `/api/tickets/{id}/resolve/` | POST | Resolve ticket |
| `/api/tickets/{id}/close/` | POST | Close ticket |
| `/api/tickets/dashboard/` | GET | Dashboard statistics |
| `/api/users/` | GET, POST | User management |
| `/api/users/technicians/` | GET | List technicians |
| `/api/categories/` | GET, POST | Category management |
| `/api/comments/` | GET, POST | Comment management |
| `/api/knowledge-base/` | GET, POST | KB articles |
| `/api/assets/` | GET, POST | Asset management |
| `/api/change-requests/` | GET, POST | Change requests |
| `/api/sla-policies/` | GET, POST | SLA policies |
| `/api/audit-logs/` | GET | System audit logs |
| `/api/dashboard/stats/` | GET | Analytics stats |

## Configuration

### Backend (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=ticketing_db
DB_USER=ticketing_user
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend

Create `.env` in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## User Roles

### Admin
- Full system access
- User management (create, edit, delete, role changes)
- SLA policy management
- Audit log viewing
- Can manage all tickets and settings

### Manager
- User management
- Approve/reject change requests
- Create knowledge base articles
- View all tickets and reports

### Technician
- View and manage assigned tickets
- Resolve and close tickets
- Add comments (public and internal)
- Reassign tickets
- Create tickets

### End User
- Create new tickets
- View own tickets
- Add comments to tickets
- Browse knowledge base
- View published articles

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate

# Create a new app
python manage.py startapp myapp

# Make migrations after model changes
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Generate API schema
python manage.py spectacular --file schema.yml
```

### Frontend Development

```bash
cd frontend

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Adding New Features

1. **New API endpoint:**
   - Add model in `backend/api/models.py`
   - Add serializer in `backend/api/serializers.py`
   - Add viewset in `backend/api/views.py`
   - Register route in `backend/api/urls.py`

2. **New frontend page:**
   - Create component in `frontend/src/pages/`
   - Add route in `frontend/src/App.js`
   - Add API functions in `frontend/src/api.js`
   - Add navigation item in sidebar

3. **New database migration:**
   - Modify model in `backend/api/models.py`
   - Run `python manage.py makemigrations`
   - Run `python manage.py migrate`

## Production Deployment

### Backend

```bash
# Set DEBUG to False
DEBUG=False

# Set proper SECRET_KEY
SECRET_KEY=your-production-secret-key

# Configure allowed hosts
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Use gunicorn
pip install gunicorn
gunicorn ticketing.wsgi:application --bind 0.0.0.0:8000
```

### Frontend

```bash
# Build production bundle
npm run build

# Serve with nginx
sudo cp -r build/* /var/www/html/
```

### Database Backups

```bash
# Backup
pg_dump ticketing_db > backup_$(date +%Y%m%d).sql

# Restore
psql ticketing_db < backup_20240101.sql
```

## License

This project is open source and available under the MIT License.

## Support

For issues and feature requests, please create an issue in the repository.
