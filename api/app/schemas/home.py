from pydantic import BaseModel
from typing import List
from app.schemas.insight import InsightResponse


class CategoryStat(BaseModel):
    name: str
    count: int
    percent: float


class AiToolStat(BaseModel):
    name: str
    count: int
    percent: float


class HomeResponse(BaseModel):
    greeting: str
    total_insights: int
    recent_insights: List[InsightResponse]
    active_days: int
    ai_tool_count: int
    category_distribution: List[CategoryStat]
    ai_tool_distribution: List[AiToolStat]
