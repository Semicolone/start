import os
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.insight import Insight
from app.models.user import User
from app.services.push import send_push_notification

router = APIRouter(prefix="/api/internal", tags=["internal"])

INTERNAL_TASK_SECRET = os.getenv("INTERNAL_TASK_SECRET")

REMINDER_TITLE = "FLOW"
DEFAULT_KEYWORD = "저장한 인사이트"


def verify_internal_secret(x_internal_secret: str = Header(None)):
    if not INTERNAL_TASK_SECRET or x_internal_secret != INTERNAL_TASK_SECRET:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")


@router.post("/send_reminders", dependencies=[Depends(verify_internal_secret)])
def send_reminders(db: Session = Depends(get_db)):
    now = datetime.utcnow()

    insights = db.query(Insight).filter(
        Insight.next_review_at.isnot(None),
        Insight.next_review_at <= now,
        Insight.reminded_at.is_(None),
    ).all()

    sent = 0
    skipped = 0
    failed = 0

    for insight in insights:
        user = db.query(User).filter(User.email == insight.user_email).first()
        if not user or not user.push_token or not user.reminder_enabled:
            skipped += 1
            continue

        keyword = (insight.keywords or [None])[0] or DEFAULT_KEYWORD

        try:
            send_push_notification(
                push_token=user.push_token,
                title=REMINDER_TITLE,
                body=f"{keyword}에 대해 기억나시나요?",
                data={"insight_id": insight.id},
            )
            insight.reminded_at = datetime.utcnow()
            sent += 1
        except Exception:
            failed += 1

    db.commit()

    return {
        "checked_at": now.isoformat(),
        "sent": sent,
        "skipped": skipped,
        "failed": failed,
    }
