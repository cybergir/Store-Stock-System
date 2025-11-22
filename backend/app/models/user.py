from sqlalchemy import Column, String, Boolean, Enum, DateTime
from sqlalchemy.sql import func
from app.models.database import BaseModel
import enum

class UserRole(enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STAFF)
    branch = Column(String, nullable=True)  # NULL for admin, branch name for staff
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_by = Column(String, nullable=True)  # Who created this user