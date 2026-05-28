from sqlalchemy import Column, String
from app.database import Base

class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True)
    password = Column(String, nullable=False)
    username = Column(String, nullable=True)