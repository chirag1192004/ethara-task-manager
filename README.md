# Ethara AI - Team Task Manager

Welcome to the Ethara AI Team Task Manager, a professional full-stack web application designed for task assignment, progress tracking, and performance analytics.

## Tech Stack
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy, Pydantic
- **Frontend**: React (Vite), Tailwind CSS, React Router
- **Authentication**: JWT Auth with Role-Based Access Control (RBAC)

## Core Features
- **Role-Based Access Control**: Differentiates between 'ADMIN' and 'MEMBER' roles.
- **Admin Verification**: Ensures that only verified admins can manage projects, enhancing system security.
- **Project & Task CRUD**: Full lifecycle management of projects and tasks with multi-assignee capabilities.
- **Dynamic Task Lifecycle**: Tasks transition through `PENDING`, `IN_PROGRESS`, `IN_REVIEW`, and `COMPLETED`.
- **Performance Analytics**: Automatically tracks and scores members based on task completion (Perfect, Delayed, Underperforming).
- **Overdue Notifications**: Highlights tasks that have lapsed their due date.

## Local Setup Instructions

### 1. Backend Setup
The backend runs on FastAPI and uses a local SQLite database by default if no `DATABASE_URL` is provided.

```bash
cd backend
python -m venv env
source env/Scripts/activate  # On Windows
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
This project is configured for deployment on Railway, utilizing PostgreSQL for the production database.
- A `Procfile` is included for automatic Railway deployment.
- The `database.py` script automatically parses Railway's `DATABASE_URL`.
- The frontend dynamically routes API requests to the `/api` reverse proxy or absolute domain based on the environment.
