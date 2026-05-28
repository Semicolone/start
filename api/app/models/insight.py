from sqlalchemy import Column, Integer, String, Text, JSON, DateTime
from datetime import datetime
from app.database import Base


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(100), nullable=False)
    category_id = Column(Integer, nullable=True)  # TODO: FK to categories.id (A 작업 완료 후 추가)
    ai_source = Column(String(20), nullable=False)
    question_original = Column(Text, nullable=False)
    answer_original = Column(Text, nullable=False)
    question_summary = Column(Text, nullable=True)
    answer_summary = Column(Text, nullable=True)
    keywords = Column(JSON, nullable=True)
    saved_from = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
