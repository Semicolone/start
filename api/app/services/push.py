import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push_notification(push_token: str, title: str, body: str, data: dict = None) -> dict:
    payload = {
        "to": push_token,
        "title": title,
        "body": body,
        "data": data or {},
    }

    with httpx.Client(timeout=10.0) as client:
        response = client.post(EXPO_PUSH_URL, json=payload)
        response.raise_for_status()
        result = response.json()

    # Expo는 토큰이 무효해도 HTTP 상태코드는 200으로 주고, 실제 에러는
    # 응답 본문(data.status)에 담아서 준다. 이것도 실패로 처리해야 한다.
    ticket = result.get("data", {})
    if ticket.get("status") == "error":
        raise Exception(ticket.get("message", "Expo 푸시 발송에 실패했습니다"))

    return result
