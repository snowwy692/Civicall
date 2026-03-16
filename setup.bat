@echo off
echo ========================================
echo    Civicall Setup Script (Windows)
echo ========================================
echo.

echo [1/4] Setting up Backend...
cd backend

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo Running database migrations...
python manage.py makemigrations
python manage.py migrate

echo.
echo [2/4] Setting up Frontend...
cd ..\frontend

echo Installing Node.js dependencies...
npm install

echo.
echo [3/4] Creating .env file...
cd ..\backend
if not exist .env (
    echo SECRET_KEY=django-insecure-your-secret-key-here > .env
    echo DEBUG=True >> .env
    echo ALLOWED_HOSTS=localhost,127.0.0.1 >> .env
    echo GEMINI_API_KEY=AIzaSyDe7oObZRdPlEQ-9I0r5DAAsz5ZDqwpxR8 >> .env
    echo CORS_ALLOWED_ORIGINS=http://localhost:3000 >> .env
    echo Created .env file with default settings
) else (
    echo .env file already exists
)

echo.
echo [4/4] Setup Complete!
echo.
echo To start the application:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   venv\Scripts\activate
echo   python manage.py runserver 8000
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm start
echo.
echo Access the application at:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8000
echo   Admin Panel: http://localhost:8000/admin
echo.
echo Optional: Create a superuser for admin access:
echo   cd backend
echo   venv\Scripts\activate
echo   python manage.py createsuperuser
echo.
pause 