Ethara AI - Team Task Manager
=============================

Welcome to the Ethara AI Team Task Manager! This is a professional full-stack web application designed for collaborative task assignment, progress tracking, and performance analytics. This project serves as a comprehensive solution comparable to simplified versions of tools like Trello or Asana.

PROJECT DESCRIPTION
-------------------
The Ethara AI Task Manager is built to help organizations efficiently manage their projects and evaluate member performance. It supports a strict Role-Based Access Control (RBAC) system distinguishing between 'ADMIN' and 'MEMBER' roles. 

Admins have full organizational oversight. They can create broad projects, dispatch granular tasks (complete with Descriptions and Priority levels) to multiple team members simultaneously, and evaluate completed tasks to build performance profiles. 

The dashboard provides top-level metrics, calculating Total Tasks, Tasks by Status, Active Members, and Overdue Tasks at a glance. Members receive a focused Kanban-style dashboard where they can instantly view their assigned tasks, identify overdue priorities, and update task statuses dynamically up to the review phase. 

The entire platform is secured via JSON Web Tokens (JWT) and utilizes a modern, responsive user interface.

TECH STACK
----------
* Backend: Python, FastAPI, PostgreSQL, SQLAlchemy (ORM), Pydantic
* Frontend: JavaScript, React (Vite), Tailwind CSS, React Router
* Authentication: JWT (JSON Web Tokens) with Passlib (Bcrypt)
* Deployment: Railway

CORE FEATURES
-------------
* User Authentication: Secure Signup/Login with password hashing.
* Role-Based Access Control: Granular permissions separating Admins and Members.
* Project Management: Create and manage projects.
* Advanced Task Management: Tasks include Title, Description, Due Date, and Priority. Assign a single task to multiple members.
* Dynamic Task Lifecycle: Tasks move through PENDING, IN_PROGRESS, IN_REVIEW, and COMPLETED.
* Comprehensive Dashboard: Real-time metric cards (Total Tasks, Tasks by Status, Overdue Tasks).
* Performance Analytics: The system automatically tracks and scores members based on task completion quality.

LOCAL SETUP INSTRUCTIONS
------------------------
1. Backend Setup:
   The backend uses a local SQLite database by default if no DATABASE_URL is provided.
   - Navigate to the backend directory: `cd backend`
   - Create a virtual environment: `python -m venv env`
   - Activate it: `env\Scripts\activate` (Windows)
   - Install dependencies: `pip install -r requirements.txt`
   - Run the server: `uvicorn main:app --reload`
   - The backend will be available at http://127.0.0.1:8000

2. Frontend Setup:
   The frontend runs on React via Vite.
   - Navigate to the frontend directory: `cd frontend`
   - Install dependencies: `npm install`
   - Run the dev server: `npm run dev`
   - The frontend will be available at http://localhost:5173

PRODUCTION DEPLOYMENT (Railway)
-------------------------------
This project is fully configured for deployment on Railway, utilizing PostgreSQL for the production database.
- A Procfile is included in the backend for automatic Railway deployment.
- The database.py script automatically parses Railway's DATABASE_URL environment variable.
- The frontend dynamically routes API requests using the VITE_API_URL environment variable.
