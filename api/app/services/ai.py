import os
import json
from groq import Groq, APITimeoutError, RateLimitError, APIConnectionError
from fastapi import HTTPException

client = Groq(api_key=os.getenv("GROQ_API_KEY"), timeout=15.0)

MODEL = "openai/gpt-oss-120b"


def analyze_with_groq(question: str, answer: str) -> dict:
    prompt = f"""다음 질문과 답변을 분석해서 아래 JSON 형식으로만 반환해주세요. 다른 텍스트는 포함하지 마세요.

질문: {question}
답변: {answer}

반환 형식:
{{
    "question_summary": "질문을 1-2문장으로 요약",
    "answer_summary": "답변을 2-3문장으로 요약",
    "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI 분석 결과 파싱에 실패했습니다")
    except Exception:
        raise HTTPException(status_code=500, detail="AI 분석에 실패했습니다")


def generate_monthly_review(year: int, month: int, insights: list) -> dict:
    if not insights:
        return {
            "title": f"{year}년 {month}월 회고",
            "summary": "이번 달은 저장된 인사이트가 없어요.",
            "highlight": None,
            "timeline": [],
            "total_questions": 0,
            "active_days": 0,
            "max_questions": 0
        }

    insights_text = "\n".join([
        f"- [{i['date']}] Q: {i['question_summary']} (카테고리: {i['category']})"
        for i in insights
    ])

    prompt = f"""{year}년 {month}월의 AI 질문 기록을 분석해서 아래 JSON 형식으로만 반환해주세요. 다른 텍스트는 포함하지 마세요.

질문 기록:
{insights_text}

반환 형식:
{{
    "title": "이달을 한 문장으로 표현한 제목",
    "summary": "이달 전체 흐름을 2-3문장으로 요약",
    "highlight": "가장 인상적인 질문이나 변화 한 문장",
    "timeline": [
        {{"week": "1주차", "text": "1주차 주요 활동 요약"}},
        {{"week": "2주차", "text": "2주차 주요 활동 요약"}},
        {{"week": "3주차", "text": "3주차 주요 활동 요약"}},
        {{"week": "4주차", "text": "4주차 주요 활동 요약"}}
    ]
}}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
        )
        content = response.choices[0].message.content
        result = json.loads(content)
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI 회고 생성 결과를 처리하지 못했어요. 잠시 후 다시 시도해주세요.")
    except APITimeoutError:
        raise HTTPException(status_code=504, detail="AI 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="지금 요청이 많아 회고 생성이 지연되고 있어요. 잠시 후 다시 시도해주세요.")
    except APIConnectionError:
        raise HTTPException(status_code=503, detail="AI 서비스에 연결하지 못했어요. 잠시 후 다시 시도해주세요.")
    except Exception:
        raise HTTPException(status_code=500, detail="AI 회고 생성에 실패했어요. 잠시 후 다시 시도해주세요.")
