from sqlalchemy import Column, String, Boolean, Integer, Date
from app.database import Base

class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True)
    password = Column(String, nullable=False)
    username = Column(String, nullable=True)
    push_token = Column(String, nullable=True)
    reminder_enabled = Column(Boolean, nullable=False, default=True)
    current_streak = Column(Integer, nullable=False, default=0)
    last_review_date = Column(Date, nullable=True)
    reviewed_today_count = Column(Integer, nullable=False, default=0)