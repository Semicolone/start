<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Team Project Description</title>

  <style>
    body {
      font-family: Arial, "Noto Sans KR", sans-serif;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.8;
      background-color: #fafafa;
      color: #222;
    }

    h1 {
      text-align: center;
      margin-bottom: 10px;
      font-size: 32px;
    }

    .subtitle {
      text-align: center;
      margin-bottom: 35px;
      color: #666;
      font-size: 15px;
    }

    table {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      border-collapse: collapse;
      background-color: #fff;
      border: 1px solid #ddd;
    }

    th,
    td {
      border: 1px solid #ddd;
      padding: 16px;
      text-align: left;
      vertical-align: top;
      word-break: keep-all;
    }

    th {
      width: 22%;
      background-color: #f3f4f6;
      font-weight: 700;
      white-space: nowrap;
    }

    td {
      width: 78%;
    }

    ul {
      margin: 0;
      padding-left: 20px;
    }

    .section-title {
      font-weight: 700;
      margin-top: 10px;
      margin-bottom: 4px;
    }

    .tag {
      display: inline-block;
      padding: 2px 8px;
      margin: 2px 4px 2px 0;
      border-radius: 999px;
      background-color: #eee;
      font-size: 13px;
    }

    a {
      color: #2563eb;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    @media (max-width: 700px) {
      body {
        padding: 20px 10px;
      }

      h1 {
        font-size: 24px;
      }

      table,
      tbody,
      tr,
      th,
      td {
        display: block;
        width: 100%;
      }

      th {
        box-sizing: border-box;
        border-bottom: none;
      }

      td {
        box-sizing: border-box;
      }

      tr {
        margin-bottom: 14px;
        border: 1px solid #ddd;
        background: #fff;
      }

      th,
      td {
        border-left: none;
        border-right: none;
      }
    }
  </style>
</head>

<body>
  <h1>Team Project Description</h1>
  <p class="subtitle">Team 13 Semicolone; / FLOW</p>

  <table>
    <tr>
      <th>팀명</th>
      <td>Semicolone;</td>
    </tr>

    <tr>
      <th>서비스명</th>
      <td>FLOW</td>
    </tr>

    <tr>
      <th>프로젝트명</th>
      <td>AI 질문을 ‘기억되는 인사이트’로 바꿔주는 개인 지식 관리 플랫폼</td>
    </tr>

    <tr>
      <th>프로젝트 소개</th>
      <td>
        AI 기반 질문 기록 및 인사이트 내재화 플랫폼을 만들고자 한다.<br><br>
        최근 많은 사람들이 ChatGPT와 같은 생성형 AI를 통해 다양한 질문을 하고 정보를 얻고 있지만,
        대부분의 대화 내용은 일회성으로 소비되고 이후에는 다시 활용되지 않는 경우가 많다.<br><br>
        본 서비스는 사용자가 AI에게 질문했던 내용과 답변을 기록하고,
        이를 AI가 자동으로 정리하고 연결하며,
        시간이 지나 다시 노출하여 장기 기억으로 내재화하도록 돕는 개인 지식 관리 시스템이다.<br><br>
        단순히 AI 대화를 저장하는 것이 아니라,
        사용자가 얻은 인사이트를 정리하고 필요할 때 다시 활용할 수 있도록 돕는 것을 목표로 한다.
      </td>
    </tr>

    <tr>
      <th>해결하려는 문제</th>
      <td>
        최근 생성형 AI 사용이 증가하면서 사용자들은 다양한 질문을 통해 많은 정보를 얻고 있다.<br><br>
        그러나 대부분의 AI 대화는 일회성으로 끝나고 시간이 지나면
        어떤 질문을 했는지, 어떤 답변을 받았는지 기억하기 어렵다.<br><br>
        또한 AI 대화 기록은 길고 복잡한 경우가 많아 필요한 정보를 다시 찾기 어렵고,
        중요한 인사이트가 묻히는 문제가 발생한다.<br><br>
        이로 인해 사용자는 많은 질문을 통해 정보를 얻지만,
        실제로 자신의 지식으로 축적되거나 활용되는 경우는 제한적이라는 문제가 발생한다.
      </td>
    </tr>

    <tr>
      <th>주요 기능</th>
      <td>
        <ul>
          <li>사용자는 ChatGPT, Gemini 등 외부 AI 사이트에서 얻은 질문과 답변을 서비스에 복사해 붙여넣는다.</li>
          <li>시스템은 질문과 답변을 분석하여 질문 요약, 답변 요약, 핵심 키워드를 자동으로 생성한다.</li>
          <li>생성된 키워드를 기반으로 인사이트를 구조화하고 저장한다.</li>
          <li>사용자는 저장된 인사이트를 다시 확인하거나 검색할 수 있다.</li>
          <li>시간이 지나면 3일 전 인사이트를 다시 보여주어 사용자가 내용을 기억하도록 돕는다.</li>
          <li>향후에는 관련 인사이트 추천과 팀 단위 공유 기능으로 확장한다.</li>
        </ul>
      </td>
    </tr>

    <tr>
      <th>기술 스택</th>
      <td>
        <div class="section-title">프론트엔드</div>
        <span class="tag">React</span>
        <span class="tag">Vite</span>
        <ul>
          <li>컴포넌트 기반 UI 구현</li>
          <li>질문/답변 입력, 요약 결과 렌더링, 키워드 칩 UI 구성</li>
          <li>Home, Login, Signup, My Page 등 주요 화면 라우팅</li>
        </ul>

        <div class="section-title">백엔드</div>
        <span class="tag">Node.js</span>
        <ul>
          <li>AI 분석 API 및 데이터 저장 API 구성</li>
          <li>비동기 요청 처리 및 데이터 파이프라인 구축</li>
        </ul>

        <div class="section-title">데이터베이스</div>
        <span class="tag">PostgreSQL</span>
        <ul>
          <li>사용자 정보, 인사이트, 키워드, 분석 로그 저장</li>
          <li>향후 검색 및 추천 기능 확장을 고려한 데이터 관리</li>
        </ul>

        <div class="section-title">AI 및 데이터 처리</div>
        <span class="tag">Groq Cloud API</span>
        <span class="tag">Llama 3.3</span>
        <ul>
          <li>질문 요약, 답변 요약, 키워드 추출</li>
          <li>JSON 기반 구조화 응답 생성</li>
        </ul>

        <div class="section-title">향후 확장</div>
        <span class="tag">Vector Embedding</span>
        <ul>
          <li>인사이트 간 의미적 유사도 분석</li>
          <li>관련 인사이트 추천 및 팀 단위 중복 탐색 방지</li>
        </ul>
      </td>
    </tr>

    <tr>
      <th>개발 환경</th>
      <td>
        <ul>
          <li><strong>OS:</strong> Windows 11 / macOS</li>
          <li><strong>IDE:</strong> Visual Studio Code</li>
          <li><strong>Version Control:</strong> Git, GitHub</li>
          <li><strong>Deploy:</strong> Vercel 예정</li>
        </ul>
      </td>
    </tr>

    <tr>
      <th>팀원 역할</th>
      <td>
        <ul>
          <li><strong>이채원:</strong> 프론트엔드, 화면 구현, 사용자 플로우 및 데모 UI 구성</li>
          <li><strong>윤현진:</strong> 백엔드, AI API 연동, 데이터 처리 파이프라인 구현</li>
          <li><strong>신지원:</strong> 백엔드, DB 연동, 문서 정리 및 프로젝트 관리 지원</li>
        </ul>
      </td>
    </tr>

    <tr>
      <th>기대 효과</th>
      <td>
        본 서비스를 통해 사용자는 AI와의 대화에서 얻은 정보를 체계적으로 관리할 수 있다.
        저장된 인사이트는 시간이 지나 다시 노출되기 때문에 기억에 오래 남게 되며,
        학습이나 프로젝트 과정에서 다시 활용될 가능성이 높아진다.<br><br>
        또한 관련 인사이트가 자동으로 연결되면,
        사용자는 자신의 질문과 생각이 구조적으로 확장되는 경험을 할 수 있다.
        결과적으로 AI 사용이 단순한 질문과 답변에서 끝나는 것이 아니라,
        개인의 지식 축적과 사고 확장으로 이어지는 효과를 기대할 수 있다.
      </td>
    </tr>

    <tr>
      <th>GitHub Repo</th>
      <td>
        <a href="https://github.com/Semicolone/start" target="_blank">
          https://github.com/Semicolone/start
        </a>
      </td>
    </tr>
  </table>
</body>
</html>
