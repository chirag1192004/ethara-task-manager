from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from database import get_db
import models
import schemas
from auth import SECRET_KEY, ALGORITHM

router = APIRouter(tags=["Projects & Tasks"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == int(user_id_str)).first()
    if user is None:
        raise credentials_exception

    return user


def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can perform this action",
        )
    return current_user


@router.post("/projects", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    new_project = models.Project(
        title=project_data.title,
        description=project_data.description,
        admin_id=current_user.id,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.get("/projects", response_model=list[schemas.ProjectOut])
def get_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == models.RoleEnum.ADMIN:
        return db.query(models.Project).all()

    projects_with_my_tasks = (
        db.query(models.Project)
        .join(models.Task, models.Task.project_id == models.Project.id)
        .filter(models.Task.assigned_to == current_user.id)
        .distinct()
        .all()
    )
    return projects_with_my_tasks


@router.post("/projects/{project_id}/tasks", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: int,
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    assignee = db.query(models.User).filter(models.User.id == task_data.assigned_to).first()
    if not assignee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found")

    new_task = models.Task(
        title=task_data.title,
        due_date=task_data.due_date,
        project_id=project_id,
        assigned_to=task_data.assigned_to,
        status=models.TaskStatus.PENDING,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.patch("/tasks/{task_id}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_id: int,
    status_update: schemas.TaskUpdateStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if current_user.role == models.RoleEnum.MEMBER and task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update the status of tasks assigned to you",
        )

    task.status = status_update.status
    db.commit()
    db.refresh(task)
    return task
