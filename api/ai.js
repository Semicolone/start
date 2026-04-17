// api/ai.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 프론트엔드에서 '/ai/analyze'로 요청하므로 여기서 '/analyze'만 적으면 자동으로 합쳐집니다.
router.post('/analyze', async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "질문과 답변을 모두 입력해주세요." });
    }

    // 1. Groq API로 요약 및 키워드 추출
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
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

    const parsed = JSON.parse(chatCompletion.choices[0].message.content);
    const qs = parsed.question_summary;
    const as = parsed.answer_summary;
    const kw = parsed.keywords;

    // 2. DB(ai_logs 테이블)에 데이터 삽입
    const insertQuery = `
      INSERT INTO ai_logs (question, answer, q_summary, a_summary, keywords) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(insertQuery, [question.trim(), answer.trim(), qs, as, JSON.stringify(kw)]);

    // 3. 프론트엔드로 결과 반환
    res.json({
      question_summary: qs,
      answer_summary: as,
      keywords: kw
    });

  } catch (err) {
    console.error("AI 분석 저장 중 오류:", err);
    res.status(500).json({ error: '오류가 발생했습니다.' });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_logs ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB 로그를 불러오는 중 오류가 발생했습니다.' });
  }
});

// 이 라우터를 밖에서 쓸 수 있게 내보냄
module.exports = router;