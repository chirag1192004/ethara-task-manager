# Ethara AI - Team Task Manager

Welcome to the Ethara AI Team Task Manager, a professional full-stack web application designed for collaborative task assignment, progress tracking, and performance analytics. This project serves as a comprehensive solution comparable to simplified versions of tools like Trello or Asana.

## Tech Stack
- **Backend**: Python, FastAPI, PostgreSQL, SQLAlchemy (ORM), Pydantic
- **Frontend**: JavaScript, React (Vite), Tailwind CSS, React Router
- **Authentication**: Secure JWT (JSON Web Tokens) Auth with Role-Based Access Control (RBAC)
- **Deployment**: Live on Railway

## Core Features
- **User Authentication**: Secure Signup/Login with password hashing (Bcrypt).
- **Role-Based Access Control**: Strict permissions distinguishing between 'ADMIN' and 'MEMBER' roles.
- **Project Management**: Admins can create overarching projects and deploy team members by assigning tasks.
- **Advanced Task Management**: Full CRUD for tasks including Title, Description, Due Date, and Priority (Low/Medium/High). Supports multiple assignees per task.
- **Dynamic Task Lifecycle**: Tasks transition safely through `PENDING`, `IN_PROGRESS`, `IN_REVIEW`, and `COMPLETED`.
- **Comprehensive Dashboard**: Real-time metric cards showing Total Tasks, Tasks by Status, Active Members, and Overdue Tasks.
- **Performance Analytics**: Automatically tracks and scores members based on task completion quality (Perfect, Delayed, Underperforming).

## Local Setup Instructions

### 1. Backend Setup
The backend uses a local SQLite database by default if no `DATABASE_URL` environment variable is provided.

```bash
cd backend
python -m venv env
source env/Scripts/activate  # On Windows: env\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
*The backend will be available at http://127.0.0.1:8000*

### 2. Frontend Setup
The frontend runs on React via Vite.

```bash
cd frontend
npm install
npm run dev
```
*The frontend will be available at http://localhost:5173*

## Production Deployment (Railway)
This project is fully configured for deployment on Railway, utilizing PostgreSQL for the production database.
- A `Procfile` is included for automatic Railway backend deployment.
- The `database.py` script automatically parses Railway's `DATABASE_URL`.
- The frontend dynamically routes API requests using the `VITE_API_URL` environment variable, falling back to localhost during local development.
