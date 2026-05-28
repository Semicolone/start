from pydantic import BaseModel
from typing import List
from app.schemas.insight import InsightResponse


class HomeResponse(BaseModel):
    greeting: str
    total_insights: int
    recent_insights: List[InsightResponse]
