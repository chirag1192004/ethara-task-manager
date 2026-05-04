from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from models import RoleEnum, TaskStatus

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.MEMBER

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: RoleEnum

    class Config:
        from_attributes = True

# --- TASK SCHEMAS ---
class TaskCreate(BaseModel):
    title: str
    due_date: datetime
    assigned_to: int

class TaskUpdateStatus(BaseModel):
    status: TaskStatus

class TaskOut(BaseModel):
    id: int
    title: str
    status: TaskStatus
    due_date: datetime
    project_id: int
    assigned_to: int

    class Config:
        from_attributes = True

# --- PROJECT SCHEMAS ---
class ProjectCreate(BaseModel):
    title: str
    description: str

class ProjectOut(BaseModel):
    id: int
    title: str
    description: str
    admin_id: int
    tasks: List[TaskOut] = []

    class Config:
        from_attributes = True