from datetime import datetime, timedelta

KST_OFFSET = timedelta(hours=9)


def kst_today(base_time: datetime = None) -> datetime.date:
    base_time = base_time or datetime.utcnow()
    return (base_time + KST_OFFSET).date()


def compute_next_review_at(base_time: datetime, days_offset: int) -> datetime:
    """오전 9시(KST, UTC 자정)에 맞춰 복습 예정 시각을 계산한다."""
    due_date = kst_today(base_time) + timedelta(days=days_offset)
    return datetime(due_date.year, due_date.month, due_date.day)
