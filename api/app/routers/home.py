from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app.database import get_db
from app.dependencies import get_current_user
from app.models.insight import Insight
from app.models.user import User
from app.routers.categories import Category
from app.schemas.home import HomeResponse, CategoryStat, AiToolStat
from app.schemas.insight import InsightListResponse, InsightResponse

router = APIRouter(prefix="/api/home", tags=["home"])


@router.get("", response_model=HomeResponse)
def get_home(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_email = current_user["user_email"]
    user = db.query(User).filter(User.email == user_email).first()
    display_name = user.username if user and user.username else user_email

    now = datetime.utcnow()

    total = db.query(Insight).filter(Insight.user_email == user_email).count()

    recent_raw = db.query(Insight).filter(
        Insight.user_email == user_email
    ).order_by(Insight.created_at.desc()).limit(3).all()

    recent = []
    for insight in recent_raw:
        category_name = None
        if insight.category_id:
            category = db.query(Category).filter(Category.id == insight.category_id).first()
            if category:
                category_name = category.name
        insight_data = InsightResponse.model_validate(insight)
        insight_data.category_name = category_name
        recent.append(insight_data)

    active_days = db.query(
        func.count(func.distinct(func.date(Insight.created_at)))
    ).filter(
        Insight.user_email == user_email,
        extract('month', Insight.created_at) == now.month,
        extract('year', Insight.created_at) == now.year
    ).scalar() or 0

    ai_tool_count = db.query(
        func.count(func.distinct(Insight.ai_source))
    ).filter(Insight.user_email == user_email).scalar() or 0

    cat_rows = db.query(
        Category.name,
        func.count(Insight.id).label('count')
    ).join(Insight, Insight.category_id == Category.id).filter(
        Insight.user_email == user_email
    ).group_by(Category.name).all()

    cat_total = sum(row.count for row in cat_rows)
    category_distribution = [
        CategoryStat(
            name=row.name,
            count=row.count,
            percent=round(row.count / cat_total * 100, 1) if cat_total else 0
        )
        for row in cat_rows
    ]

    ai_rows = db.query(
        Insight.ai_source,
        func.count(Insight.id).label('count')
    ).filter(Insight.user_email == user_email).group_by(Insight.ai_source).all()

    ai_total = sum(row.count for row in ai_rows)
    ai_tool_distribution = [
        AiToolStat(
            name=row.ai_source,
            count=row.count,
            percent=round(row.count / ai_total * 100, 1) if ai_total else 0
        )
        for row in ai_rows
    ]

    return HomeResponse(
        greeting=f"{display_name}님, 오늘도 인사이트를 쌓아보세요!",
        total_insights=total,
        recent_insights=recent,
        active_days=active_days,
        ai_tool_count=ai_tool_count,
        category_distribution=category_distribution,
        ai_tool_distribution=ai_tool_distribution,
    )


@router.get("/recent_insights", response_model=InsightListResponse)
def get_recent_insights(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_email = current_user["user_email"]
    insights = db.query(Insight).filter(
        Insight.user_email == user_email
    ).order_by(Insight.created_at.desc()).limit(3).all()

    return InsightListResponse(insights=insights, total=len(insights))
