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

# --- ADMIN VERIFICATION ---

@router.get("/admin/pending", response_model=list[schemas.UserOut])
def get_pending_users(db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    return db.query(models.User).filter(models.User.is_verified == False).all()

@router.patch("/admin/verify/{user_id}", response_model=schemas.UserOut)
def verify_admin(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.commit()
    db.refresh(user)
    return user

# --- PROJECTS ---

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

    # Members only see projects they have tasks in
    projects_with_my_tasks = (
        db.query(models.Project)
        .join(models.Task, models.Task.project_id == models.Project.id)
        .filter(models.Task.assignees.any(models.User.id == current_user.id))
        .distinct()
        .all()
    )
    return projects_with_my_tasks

# --- TASKS ---

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

    new_task = models.Task(
        title=task_data.title,
        due_date=task_data.due_date,
        project_id=project_id,
        status=models.TaskStatus.PENDING,
    )
    
    for user_id in task_data.assignee_ids:
        assignee = db.query(models.User).filter(models.User.id == user_id).first()
        if assignee:
            new_task.assignees.append(assignee)

    if not new_task.assignees:
        raise HTTPException(status_code=400, detail="Must provide at least one valid user ID")

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.patch("/tasks/{task_id}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_id: int,
    status_update: schemas.TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if current_user.role == models.RoleEnum.MEMBER:
        if not any(u.id == current_user.id for u in task.assignees):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update tasks assigned to you",
            )
        if status_update.status == models.TaskStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Members cannot mark tasks COMPLETED directly. Use IN_REVIEW.",
            )

    task.status = status_update.status
    db.commit()
    db.refresh(task)
    return task

@router.post("/tasks/{task_id}/review", response_model=schemas.TaskOut)
def review_task(
    task_id: int,
    review_data: schemas.TaskReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    if task.status != models.TaskStatus.IN_REVIEW:
        raise HTTPException(status_code=400, detail="Task is not IN_REVIEW")
        
    task.status = models.TaskStatus.COMPLETED
    
    # Apply performance metrics to all assignees of this task
    for user in task.assignees:
        if review_data.performance == "perfect":
            user.perfect_tasks += 1
        elif review_data.performance == "delayed":
            user.delayed_tasks += 1
        elif review_data.performance == "underperforming":
            user.underperforming_tasks += 1

    db.commit()
    db.refresh(task)
    return task

@router.get("/users", response_model=list[schemas.UserOut])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    return db.query(models.User).all()

@router.get("/users/me", response_model=schemas.UserOut)
def get_user_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return current_user

@router.get("/tasks/me", response_model=list[schemas.TaskOut])
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Task).filter(models.Task.assignees.any(models.User.id == current_user.id)).all()
