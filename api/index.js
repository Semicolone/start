// api/index.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 프론트엔드 빌드 결과물이 있다면 그 폴더를 지정해야 할 수도 있습니다. 
app.use(express.static(path.join(__dirname, '../frontend'))); 

// ==========================================
// AI 전용 파일을 불러와서 '/ai' 경로에 연결
// ==========================================
const aiRouter = require('./ai.js');
app.use('/ai', aiRouter);

// [계산기 기능]
// ==========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/api/add', async (req, res) => {
  const num1 = parseInt(req.query.a);
  const num2 = parseInt(req.query.b);
  if (isNaN(num1) || isNaN(num2)) return res.status(400).json({ error: "올바른 숫자를 입력해주세요." });

  try {
    await pool.query('INSERT INTO logs (num1, num2) VALUES ($1, $2)', [num1, num2]);
    res.json({ result: num1 + num2 });
  } catch (err) {
    res.status(500).json({ error: '오류 발생' });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM logs ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '오류 발생' });
  }
});

// 서버 실행 코드
if (require.main === module) {
  app.listen(3000, () => {
    console.log('🚀 서버 실행 완료!');
    console.log('👉 [계산기 로그] http://localhost:3000/api/logs');
    console.log('👉 [AI DB 로그] http://localhost:3000/ai/logs');
  });
}

module.exports = app;