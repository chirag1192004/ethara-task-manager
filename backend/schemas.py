from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from models import RoleEnum, TaskStatus

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_verified: bool
    perfect_tasks: int
    delayed_tasks: int
    underperforming_tasks: int

    class Config:
        orm_mode = True

# --- TASK SCHEMAS ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "Medium"
    due_date: datetime

class TaskCreate(TaskBase):
    assignee_ids: List[int]

class TaskOut(TaskBase):
    id: int
    status: TaskStatus
    project_id: int
    assignees: List[UserOut]

    class Config:
        orm_mode = True

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskReview(BaseModel):
    performance: str # "perfect", "delayed", or "underperforming"

# --- PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    admin_id: int
    tasks: List[TaskOut] = []

    class Config:
        orm_mode = True