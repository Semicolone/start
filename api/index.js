// api/index.js
require('dotenv').config();             //.env 파일 저장된 환경 변수(DB 주소, API 키 등을 업로드)
const express = require('express');     // 웹 서버 프레임워크인 Express를 가져옴
const { Pool } = require('pg');         // PostgreSQL 데이터베이스와 연결하기 위한 클라이언트 가져옴
const path = require('path');           // 파일 경로 조작을 위한 내장 모듈
const app = express();                  // Express 애플리케이션 객체를 생성

// 미들웨어 설정(데이터 해석 및 정적 파일 제공)
app.use(express.json());                // 클라이언트가 보낸 JSON 데이터를 서버에서 해석할 수 있게 함
app.use(express.urlencoded({ extended: true })); // URL 인코딩 데이터를 해석
app.use(express.static(path.join(__dirname, '../frontend')));   // frontend 폴더 안의 정적 파일(HTML, JS)을 웹에 게시

// 라우팅 분리: AI 전용 파일을 불러와서 '/ai' 경로에 연결
// ==========================================
const aiRouter = require('./ai.js');    // AI 분석 로직이 담긴 ai.js 파일을 모듈로 불러옴
app.use('/ai', aiRouter);               // '/ai'로 시작하는 모든 요청은 aiRouter가 처리하도록 위임

// 데이터 베이스 연결 설정
// ==========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // 환경변수에서 DB 접속 주소를 가져옴
  ssl: { rejectUnauthorized: false }         // 외부 클라우드 DB(Vercel, Neon 등) 연결 시 필요한 보안 설정
});

// 과제: 계산기 로그 추가
app.get('/api/add', async (req, res) => {
  const num1 = parseInt(req.query.a);    // URL 파라미터 'a'의 값을 숫자로 변환
  const num2 = parseInt(req.query.b);    // URL 파라미터 'b'의 값을 숫자로 변환
  if (isNaN(num1) || isNaN(num2)) return res.status(400).json({ error: "올바른 숫자를 입력해주세요." });

  try {
    // 계산 이력을 Log 테이블에 저장
    await pool.query('INSERT INTO logs (num1, num2) VALUES ($1, $2)', [num1, num2]);
    res.json({ result: num1 + num2 });   // 결과를 JSON 형태로 응답
  } catch (err) {
    res.status(500).json({ error: '오류 발생' }); // 에러 발생 시 500 상태코드 반환
  }
});

// 과제: 전체 계산 로그 조회
app.get('/api/logs', async (req, res) => {
  try {
    // 데이터베이스의 logs 테이블에서 모든 데이터를 내림차순(최신순)으로 가져옴
    const result = await pool.query('SELECT * FROM logs ORDER BY id DESC');
    res.json(result.rows);               // 조회된 행(rows) 데이터를 응답
  } catch (err) {
    res.status(500).json({ error: '오류 발생' });
  }
});

// 서버 실행 코드: 3000번 포트에서 대기
if (require.main === module) {
  app.listen(3000, () => {
    console.log('🚀 서버 실행 완료!');
    console.log('👉 [계산기 로그] http://localhost:3000/api/logs'); // 계산 로그 확인용 URL
    console.log('👉 [AI DB 로그] http://localhost:3000/ai/logs');   // AI 분석 로그 확인용 URL
  });
}

module.exports = app;     // Vercel 등 배포 환경을 위해 app 객체를 내보냄
