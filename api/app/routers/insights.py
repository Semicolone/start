from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.insight import Insight
from app.schemas.insight import (
    AnalyzeRequest, AnalyzeResponse,
    InsightCreateRequest, InsightResponse
)
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_insight(request: AnalyzeRequest, current_user=Depends(get_current_user)):
    # TODO: Groq API 호출하여 AI 분석
    pass


@router.post("", response_model=InsightResponse, status_code=201)
def create_insight(
    request: InsightCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    insight = Insight(
        user_email=current_user["user_email"],
        category_id=request.category_id,
        ai_source=request.ai_source,
        question_original=request.question_original,
        answer_original=request.answer_original,
        question_summary=request.question_summary,
        answer_summary=request.answer_summary,
        keywords=request.keywords,
        saved_from=request.saved_from,
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight


@router.get("/{insight_id}", response_model=InsightResponse)
def get_insight(
    insight_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    insight = db.query(Insight).filter(
        Insight.id == insight_id,
        Insight.user_email == current_user["user_email"]
    ).first()
    if not insight:
        raise HTTPException(status_code=404, detail="인사이트를 찾을 수 없습니다")
    return insight


@router.delete("/{insight_id}", response_model=MessageResponse)
def delete_insight(
    insight_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    insight = db.query(Insight).filter(
        Insight.id == insight_id,
        Insight.user_email == current_user["user_email"]
    ).first()
    if not insight:
        raise HTTPException(status_code=404, detail="인사이트를 찾을 수 없습니다")
    db.delete(insight)
    db.commit()
    return {"message": "인사이트가 삭제되었습니다"}
