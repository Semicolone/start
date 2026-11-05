from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


class AnalyzeRequest(BaseModel):
    question: str
    answer: str
    ai_source: str


class AnalyzeResponse(BaseModel):
    question_summary: str
    answer_summary: str
    bullet_summary: List[str]
    keywords: List[str]


class InsightCreateRequest(BaseModel):
    category_name: Optional[str] = None
    ai_source: str
    question_original: str
    answer_original: str
    question_summary: Optional[str] = None
    answer_summary: Optional[str] = None
    bullet_summary: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    saved_from: Optional[str] = None


class InsightResponse(BaseModel):
    id: int
    user_email: str
    category_id: Optional[int]
    category_name: Optional[str] = None
    ai_source: str
    question_original: str
    answer_original: str
    question_summary: Optional[str]
    answer_summary: Optional[str]
    bullet_summary: Optional[List[str]]
    keywords: Optional[List[str]]
    saved_from: Optional[str]
    created_at: datetime
    updated_at: datetime
    next_review_at: Optional[datetime]

    model_config = {"from_attributes": True}


class InsightUpdateRequest(BaseModel):
    question_summary: Optional[str] = None
    answer_summary: Optional[str] = None
    bullet_summary: Optional[List[str]] = None
    keywords: Optional[List[str]] = None


class ReviewRequest(BaseModel):
    outcome: Literal["전혀기억안남", "헷갈림", "기억남"]


class ReviewResponse(BaseModel):
    next_review_at: Optional[datetime]
    current_streak: int


class InsightListResponse(BaseModel):
    insights: List[InsightResponse]
    total: int
