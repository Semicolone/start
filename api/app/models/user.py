from sqlalchemy import Column, String, Boolean
from app.database import Base

class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True)
    password = Column(String, nullable=False)
    username = Column(String, nullable=True)
    push_token = Column(String, nullable=True)
    reminder_enabled = Column(Boolean, nullable=False, default=True)