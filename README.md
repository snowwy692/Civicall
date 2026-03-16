# Civicall - Community-Centric Grievance & Engagement Platform

A comprehensive web-based platform for structured communication, issue resolution, and engagement within residential or institutional communities.

## 🚀 Features

### Core Modules
- **User Management**: Role-based access (Manager/Member) with profile management
- **Communities**: Public/private communities with approval workflows
- **Complaints System**: Submit, track, and manage grievances with categories and priorities
- **Notice Board**: Admin-only announcements with rich content support
- **Events**: Community event management with RSVP functionality
- **Vehicle Registration**: Vehicle tracking and management
- **Polls**: Community decision-making with voting and results
- **AI Integration**: Gemini API for grammar suggestions and text enhancement

### Technical Features
- **Modern UI/UX**: Responsive design with Tailwind CSS
- **Real-time Updates**: React Query for efficient data fetching
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Authentication**: JWT-based secure authentication
- **File Upload**: Image support for complaints and notices
- **Search & Filtering**: Advanced filtering across all modules

## 🛠 Tech Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **React Router DOM** - Navigation
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Django** - Web framework
- **Django REST Framework** - API framework
- **JWT Authentication** - Security
- **CORS Headers** - Cross-origin support
- **Django Filters** - Advanced filtering
- **Pillow** - Image processing
- **Google Gemini AI** - AI text enhancement

### Database
- **SQLite** - Development database (easily switchable to PostgreSQL/MySQL)

## 📦 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd Civicall
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start backend server
python manage.py runserver 8000
```

### 3. Frontend Setup
```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

## 🔧 Environment Variables

Create `.env` file in the backend directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (optional - uses SQLite by default)
DATABASE_URL=sqlite:///db.sqlite3

# Gemini AI API
GEMINI_API_KEY=AIzaSyDe7oObZRdPlEQ-9I0r5DAAsz5ZDqwpxR8

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token

### User Profiles
- `GET /api/profiles/me/` - Get current user profile
- `GET /api/profiles/` - List all profiles
- `PUT /api/profiles/{id}/` - Update profile

### Communities
- `GET /api/communities/` - List communities
- `POST /api/communities/` - Create community
- `GET /api/communities/{id}/` - Get community details
- `PUT /api/communities/{id}/` - Update community
- `DELETE /api/communities/{id}/` - Delete community

### Community Memberships
- `GET /api/memberships/` - List memberships
- `POST /api/memberships/` - Join community
- `PUT /api/memberships/{id}/` - Update membership
- `DELETE /api/memberships/{id}/` - Leave community

### Complaints
- `GET /api/complaints/` - List complaints
- `POST /api/complaints/` - Create complaint
- `GET /api/complaints/{id}/` - Get complaint details
- `PUT /api/complaints/{id}/` - Update complaint
- `DELETE /api/complaints/{id}/` - Delete complaint

### Notices
- `GET /api/notices/` - List notices
- `POST /api/notices/` - Create notice
- `GET /api/notices/{id}/` - Get notice details
- `PUT /api/notices/{id}/` - Update notice
- `DELETE /api/notices/{id}/` - Delete notice

### Events
- `GET /api/events/` - List events
- `POST /api/events/` - Create event
- `GET /api/events/{id}/` - Get event details
- `PUT /api/events/{id}/` - Update event
- `DELETE /api/events/{id}/` - Delete event

### Vehicles
- `GET /api/vehicles/` - List vehicles
- `POST /api/vehicles/` - Register vehicle
- `GET /api/vehicles/{id}/` - Get vehicle details
- `PUT /api/vehicles/{id}/` - Update vehicle
- `DELETE /api/vehicles/{id}/` - Delete vehicle

### Polls
- `GET /api/polls/` - List polls
- `POST /api/polls/` - Create poll
- `GET /api/polls/{id}/` - Get poll details
- `PUT /api/polls/{id}/` - Update poll
- `DELETE /api/polls/{id}/` - Delete poll
- `POST /api/polls/{id}/vote/` - Vote on poll

## 🎯 User Roles & Permissions

### Manager (Admin)
- Create and manage communities
- Approve/reject membership requests
- Manage complaint categories
- Create and edit notices
- Organize events
- Create polls
- View analytics and reports
- Enable/disable features per community

### Member
- Browse and join communities
- Submit complaints and track status
- View notices and announcements
- RSVP to events
- Register vehicles
- Vote in polls
- Update profile information

## 🔍 Troubleshooting

### Common Issues

#### 1. ModuleNotFoundError: No module named 'django'
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

#### 2. Pillow Installation Issues
```bash
# Update pip first
pip install --upgrade pip
# Install Pillow with binary
pip install Pillow --only-binary=all
```

#### 3. Router Conflict Error
- Ensure only one `BrowserRouter` exists (in `index.js`)
- Remove duplicate Router components

#### 4. API Connection Issues
- Verify backend server is running on port 8000
- Check CORS settings in Django
- Ensure frontend is running on port 3000

#### 5. Database Migration Issues
```bash
python manage.py makemigrations
python manage.py migrate
```

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reloading
2. **Debug Mode**: Django debug mode is enabled for development
3. **Error Boundaries**: React error boundaries catch and display errors gracefully
4. **Console Logging**: Check browser console for frontend errors
5. **Django Admin**: Use admin panel for data management

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   - Set `DEBUG=False`
   - Configure production database
   - Set secure `SECRET_KEY`
   - Configure `ALLOWED_HOSTS`

2. **Static Files**
   ```bash
   python manage.py collectstatic
   ```

3. **Database**
   - Use PostgreSQL or MySQL for production
   - Run migrations
   - Create production superuser

4. **Web Server**
   - Use Gunicorn or uWSGI
   - Configure Nginx as reverse proxy
   - Set up SSL certificates

## 📊 Project Structure

```
Civicall/
├── backend/
│   ├── civicall/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── communities/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
├── logo/
│   └── civicall-logo.png
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request


## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review API documentation
- Create an issue in the repository

---

**Civicall** - Building stronger communities through technology! 🏘️✨ 
