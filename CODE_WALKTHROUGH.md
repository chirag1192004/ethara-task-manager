# Code Walkthrough: Ethara AI Task Manager

## Introduction
This document explains the architecture and key components of the Ethara AI Task Manager. It acts as a guide for understanding how the backend APIs interact with the React frontend.

## Database Models & Schema
The application uses SQLAlchemy to define the database schema.
- **User**: Represents team members and admins. Includes authentication credentials, role definitions, verification status, and performance tracking counters (perfect, delayed, underperforming).
- **Project**: A high-level organizational structure created by an Admin.
- **Task**: The core operational unit. Tasks are linked to a Project and can be assigned to multiple users via a many-to-many relationship association table (`task_members`).

## API & Routing (`routers.py`)
- **RBAC**: Handled via dependency injection (`get_current_user` and `require_admin`). Non-admins are strictly forbidden from executing administrative operations like creating projects or final task verification.
- **Status Progression**: Members can update their tasks to `IN_REVIEW`. Admins must finalize the task to `COMPLETED` by providing a performance review, which increments the associated user's performance metrics.

## Frontend Architecture
- **Context API (`AuthContext.jsx`)**: Manages the JWT token and user session data across the application. Protects restricted routes.
- **Dynamic Service Layer (`api.js`)**: All HTTP requests are centralized here. The service auto-injects the Bearer token and dynamically changes the base URL based on the running environment (localhost vs production domain).

## Production Database Transition
To deploy the application to a production environment like Railway, we transitioned the application to support **PostgreSQL**.

### The `database.py` Strategy
In a local environment, it's convenient to use SQLite (`sqlite:///./sql_app.db`). However, PaaS providers inject production database credentials dynamically via the `DATABASE_URL` environment variable.

Our `database.py` intercepts this variable:
```python
database_url = os.environ.get("DATABASE_URL")

if database_url:
    # Railway sometimes injects postgres:// instead of the SQLAlchemy-compliant postgresql://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    engine = create_engine(database_url)
else:
    # Fallback for local development
    database_url = "sqlite:///./sql_app.db"
    engine = create_engine(
        database_url, connect_args={"check_same_thread": False}
    )
```

By adding `psycopg2-binary` to the `requirements.txt` and defining the launch command in the `Procfile` (`web: uvicorn main:app --host 0.0.0.0 --port $PORT`), the FastAPI application is fully prepared for cloud container orchestration while preserving local development simplicity.
