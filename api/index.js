require('dotenv').config(); // 로컬 테스트용 환경변수(.env) 불러오기
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 내 컴퓨터에서 기존 HTML 파일을 화면에 띄우기 위한 설정
app.use(express.static(path.join(__dirname, '../')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// [기존 기능] 덧셈하고 DB에 저장하기
app.get('/api/add', async (req, res) => {
  const num1 = parseInt(req.query.a);
  const num2 = parseInt(req.query.b);

  if (isNaN(num1) || isNaN(num2)) {
    return res.status(400).json({ error: "올바른 숫자를 입력해주세요." });
  }

  try {
    await pool.query('INSERT INTO logs (num1, num2) VALUES ($1, $2)', [num1, num2]);
    res.json({ result: num1 + num2 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB 저장 중 오류가 발생했습니다.' });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    // logs 테이블의 모든 데이터를 최근에 만든 순서(id 역순)로 가져옵니다.
    const result = await pool.query('SELECT * FROM logs ORDER BY id DESC');
    
    // 요구사항: "HTML decoration 없이 그냥 json으로 오면 됩니다" -> res.json 사용
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB 로그를 불러오는 중 오류가 발생했습니다.' });
  }
});

// 내 컴퓨터에서 서버를 켜는 코드
if (require.main === module) {
  app.listen(3000, () => {
    console.log('🚀 서버 실행 완료!');
    console.log('👉 계산기 테스트: http://localhost:3000/calculator.html');
    console.log('👉 로그 테스트: http://localhost:3000/api/logs');
  });
}

module.exports = app;