import os
import json
from groq import Groq
from fastapi import HTTPException

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


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
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI 분석 결과 파싱에 실패했습니다")
    except Exception:
        raise HTTPException(status_code=500, detail="AI 분석에 실패했습니다")
