import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text, Boolean, Table
from sqlalchemy.orm import relationship
from database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    IN_REVIEW = "IN_REVIEW"
    COMPLETED = "COMPLETED"

# Many-to-Many association table for Tasks and Users (Members)
task_members = Table(
    'task_members', Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id', ondelete="CASCADE")),
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE"))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.MEMBER)
    is_verified = Column(Boolean, default=True) # First admin is auto-verified, subsequent admins need approval
    
    # Performance Tracking
    perfect_tasks = Column(Integer, default=0)
    delayed_tasks = Column(Integer, default=0)
    underperforming_tasks = Column(Integer, default=0)

    # Relationships
    projects = relationship("Project", back_populates="admin")
    tasks = relationship("Task", secondary=task_members, back_populates="assignees")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    admin_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    admin = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    priority = Column(String, default="Medium")
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    due_date = Column(DateTime)
    project_id = Column(Integer, ForeignKey("projects.id"))

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignees = relationship("User", secondary=task_members, back_populates="tasks")