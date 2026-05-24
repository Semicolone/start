from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AnalyzeRequest(BaseModel):
    question: str
    answer: str
    ai_source: str


class AnalyzeResponse(BaseModel):
    question_summary: str
    answer_summary: str
    keywords: List[str]


class InsightCreateRequest(BaseModel):
    category_id: Optional[int] = None
    ai_source: str
    question_original: str
    answer_original: str
    question_summary: Optional[str] = None
    answer_summary: Optional[str] = None
    keywords: Optional[List[str]] = None
    saved_from: Optional[str] = None


class InsightResponse(BaseModel):
    id: int
    user_email: str
    category_id: Optional[int]
    ai_source: str
    question_original: str
    answer_original: str
    question_summary: Optional[str]
    answer_summary: Optional[str]
    keywords: Optional[List[str]]
    saved_from: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InsightListResponse(BaseModel):
    insights: List[InsightResponse]
    total: int
