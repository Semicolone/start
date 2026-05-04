// api/ai.js
const express = require('express');    // 라우터 설정을 위해 Express를 가져옵니다.
const router = express.Router();       // 별도의 라우터 객체를 생성합니다.
const { Pool } = require('pg');        // DB 저장을 위해 PostgreSQL 풀을 가져옵니다.
const Groq = require('groq-sdk');     // Groq Cloud SDK(Llama 모델 사용을 위함)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });    // API 키 인증

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // .env에 정의된 DB 연결 URL 사용
  ssl: { rejectUnauthorized: false }
});

// POST /ai/analyze: 프론트엔드에서 질문/답변을 보내면 분석 수행
router.post('/analyze', async (req, res) => {
  try {
    const { question, answer } = req.body;

    // 필수 데이터(질문과 답변)가 본문에 있는지 확인합니다.
    if (!question || !answer) {
      return res.status(400).json({ error: "질문과 답변을 모두 입력해주세요." });
    }

    // 1. Groq API로 요약 및 키워드 추출 (Prompt Engineering)
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',   // 최신 고성능 모델 사용
      response_format: { type: 'json_object' },   // 반드시 JSON으로 응답받도록 강제
      messages: [
        {
          role: 'system',
          content: '반드시 JSON만 응답해. 형식: {"question_summary": "...", "answer_summary": "...", "keywords": ["...", ...]}'
        },
        {
          role: 'user',
          content: `질문: ${question}\n답변: ${answer}\n\n위 내용을 분석해서 question_summary(한 문장), answer_summary(2~3문장), keywords(5개 이내 배열)를 JSON으로 반환해.`
        }
      ]
    });

    // 1-1. AI 응답 처리: Groq에서 받은 JSON 문자열을 JSON.parse()를 통해 JS 객체로 역직렬화(Deserialization)합니다.
    const parsed = JSON.parse(chatCompletion.choices[0].message.content);
    const qs = parsed.question_summary;  // AI가 생성한 질문의 핵심 요약 (한 문장)
    const as = parsed.answer_summary;    // AI가 생성한 답변의 핵심 인사이트 (2~3문장)
    const kw = parsed.keywords;          // 분석된 핵심 키워드 배열 (최대 5개)

    // 2. 데이터 영속화(Persistence): 분석 결과를 PostgreSQL DB에 저장하여 추후 '분석 히스토리' 조회 시 사용합니다.
    const insertQuery = `
      INSERT INTO ai_logs (question, answer, q_summary, a_summary, keywords) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(insertQuery, [question.trim(), answer.trim(), qs, as, JSON.stringify(kw)]); // DB에 최종 저장합니다.

    // 3. 프론트엔드로 결과 반환
    res.json({
      question_summary: qs,              // 클라이언트에 질문 요약 전달
      answer_summary: as,                // 클라이언트에 답변 요약 전달
      keywords: kw                       // 클라이언트에 키워드 전달
    });

  } catch (err) {
    console.error("AI 분석 저장 중 오류:", err);
    res.status(500).json({ error: '오류가 발생했습니다.' });
  }
});

// 분석된 과거 로그 리스트 가져오기
router.get('/logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_logs ORDER BY id DESC'); // ai_logs 테이블 조회
    res.json(result.rows);                                                     // 조회 결과 반환
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB 로그를 불러오는 중 오류가 발생했습니다.' });
  }
});

// 이 라우터를 밖에서 쓸 수 있게 내보냄
module.exports = router;