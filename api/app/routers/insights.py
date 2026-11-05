from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.dependencies import get_current_user
from app.models.insight import Insight
from app.models.user import User
from app.routers.categories import Category
from app.schemas.insight import (
    AnalyzeRequest, AnalyzeResponse,
    InsightCreateRequest, InsightUpdateRequest, InsightResponse,
    InsightListResponse,
    ReviewRequest, ReviewResponse
)
from app.schemas.common import MessageResponse
from app.utils import kst_today, compute_next_review_at

router = APIRouter(prefix="/api/insights", tags=["insights"])

INITIAL_REVIEW_DAYS = 3
REVIEW_INTERVALS = {
    "전혀기억안남": 1,
    "헷갈림": 2,
    "기억남": None,
}


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_insight(request: AnalyzeRequest, current_user=Depends(get_current_user)):
    from app.services.ai import analyze_with_groq
    result = analyze_with_groq(request.question, request.answer)
    return AnalyzeResponse(
        question_summary=result["question_summary"],
        answer_summary=result["answer_summary"],
        bullet_summary=result["bullet_summary"],
        keywords=result["keywords"],
    )


@router.post("", response_model=InsightResponse, status_code=201)
def create_insight(
    request: InsightCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    category_id = None
    if request.category_name:
        category = db.query(Category).filter(
            Category.name == request.category_name,
            Category.user_email == current_user["user_email"]
        ).first()
        if not category:
            category = Category(name=request.category_name, user_email=current_user["user_email"])
            db.add(category)
            db.flush()
        category_id = category.id

    insight = Insight(
        user_email=current_user["user_email"],
        category_id=category_id,
        ai_source=request.ai_source,
        question_original=request.question_original,
        answer_original=request.answer_original,
        question_summary=request.question_summary,
        answer_summary=request.answer_summary,
        bullet_summary=request.bullet_summary,
        keywords=request.keywords,
        saved_from=request.saved_from,
        next_review_at=compute_next_review_at(datetime.utcnow(), INITIAL_REVIEW_DAYS),
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight


@router.get("", response_model=InsightListResponse)
def list_insights(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    insights = db.query(Insight).filter(
        Insight.user_email == current_user["user_email"]
    ).order_by(Insight.created_at.desc()).all()

    items = []
    for insight in insights:
        category_name = None
        if insight.category_id:
            category = db.query(Category).filter(Category.id == insight.category_id).first()
            if category:
                category_name = category.name
        insight_data = InsightResponse.model_validate(insight)
        insight_data.category_name = category_name
        items.append(insight_data)

    return InsightListResponse(insights=items, total=len(items))


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


@router.patch("/{insight_id}", response_model=InsightResponse)
def update_insight(
    insight_id: int,
    request: InsightUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    insight = db.query(Insight).filter(
        Insight.id == insight_id,
        Insight.user_email == current_user["user_email"]
    ).first()
    if not insight:
        raise HTTPException(status_code=404, detail="인사이트를 찾을 수 없습니다")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(insight, field, value)

    db.commit()
    db.refresh(insight)
    return insight


@router.post("/{insight_id}/review", response_model=ReviewResponse)
def review_insight(
    insight_id: int,
    request: ReviewRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    insight = db.query(Insight).filter(
        Insight.id == insight_id,
        Insight.user_email == current_user["user_email"]
    ).first()
    if not insight:
        raise HTTPException(status_code=404, detail="인사이트를 찾을 수 없습니다")

    interval_days = REVIEW_INTERVALS[request.outcome]
    insight.next_review_at = (
        compute_next_review_at(datetime.utcnow(), interval_days) if interval_days is not None else None
    )
    insight.reminded_at = None

    user = db.query(User).filter(User.email == current_user["user_email"]).first()
    today = kst_today()
    if user.last_review_date == today:
        user.reviewed_today_count += 1
    else:
        if user.last_review_date == today - timedelta(days=1):
            user.current_streak += 1
        else:
            user.current_streak = 1
        user.reviewed_today_count = 1
        user.last_review_date = today

    db.commit()

    return ReviewResponse(
        next_review_at=insight.next_review_at,
        current_streak=user.current_streak,
    )


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
