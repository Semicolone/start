import os
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.insight import Insight
from app.models.user import User
from app.services.push import send_push_notification

router = APIRouter(prefix="/api/internal", tags=["internal"])

INTERNAL_TASK_SECRET = os.getenv("INTERNAL_TASK_SECRET")

REMINDER_DAYS = 3
REMINDER_TITLE = "FLOW"
REMINDER_BODY = "3일 전 인사이트를 확인해보세요"


def verify_internal_secret(x_internal_secret: str = Header(None)):
    if not INTERNAL_TASK_SECRET or x_internal_secret != INTERNAL_TASK_SECRET:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")


@router.post("/send_reminders", dependencies=[Depends(verify_internal_secret)])
def send_reminders(db: Session = Depends(get_db)):
    target_date = date.today() - timedelta(days=REMINDER_DAYS)

    insights = db.query(Insight).filter(
        Insight.reminded_at.is_(None),
        func.date(Insight.created_at) == target_date,
    ).all()

    sent = 0
    skipped = 0
    failed = 0

    for insight in insights:
        user = db.query(User).filter(User.email == insight.user_email).first()
        if not user or not user.push_token:
            skipped += 1
            continue

        try:
            send_push_notification(
                push_token=user.push_token,
                title=REMINDER_TITLE,
                body=REMINDER_BODY,
                data={"insight_id": insight.id},
            )
            insight.reminded_at = datetime.utcnow()
            sent += 1
        except Exception:
            failed += 1

    db.commit()

    return {
        "target_date": target_date.isoformat(),
        "sent": sent,
        "skipped": skipped,
        "failed": failed,
    }
