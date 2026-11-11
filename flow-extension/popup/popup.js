// FLOW 서버 주소 (나중에 실제 서버 주소로 바꿔요)
const FLOW_API = "https://your-flow-server.com";

// 페이지 로드되면 실행
document.addEventListener("DOMContentLoaded", async () => {
  // 저장된 토큰 확인
  const { token, userName } = await chrome.storage.local.get([
    "token",
    "userName"
  ]);

  if (token) {
    // 로그인 상태 → 메인 화면 보여주기
    showMainView(userName);
    loadStats();
  } else {
    // 비로그인 상태 → 로그인 화면 보여주기
    showLoginView();
  }
});

// ── 로그인 화면 ──────────────────────────────────────
function showLoginView() {
  document.getElementById("login-view").style.display = "block";
  document.getElementById("main-view").style.display = "none";
}

// 로그인 버튼 클릭
document.getElementById("login-btn").addEventListener(
  "click",
  async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    // 빈칸 체크
    if (!email || !password) {
      errorMsg.textContent = "이메일과 비밀번호를 입력해주세요";
      return;
    }

    // 버튼 로딩 상태
    const btn = document.getElementById("login-btn");
    btn.textContent = "로그인 중...";
    btn.disabled = true;
    errorMsg.textContent = "";

    try {
      const response = await fetch(`${FLOW_API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // 토큰 저장
        await chrome.storage.local.set({
          token: data.access_token,
          userName: data.user_name
        });
        showMainView(data.user_name);
        loadStats();
      } else {
        errorMsg.textContent =
          "이메일 또는 비밀번호가 틀렸어요";
      }
    } catch (error) {
      errorMsg.textContent =
        "서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요";
    } finally {
      btn.textContent = "로그인";
      btn.disabled = false;
    }
  }
);

// ── 메인 화면 ──────────────────────────────────────
function showMainView(userName) {
  document.getElementById("login-view").style.display = "none";
  document.getElementById("main-view").style.display = "block";

  // 이름 표시
  if (userName) {
    document.getElementById("user-name").textContent =
      `${userName}님`;
  }
}

// 수집 현황 불러오기
async function loadStats() {
  try {
    const { token } = await chrome.storage.local.get("token");

    const response = await fetch(
      `${FLOW_API}/api/insights/summary`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.ok) {
      const data = await response.json();
      document.getElementById("today-count").textContent =
        data.today_count ?? 0;
      document.getElementById("total-count").textContent =
        data.total_count ?? 0;
    }
  } catch (error) {
    // 서버 연결 안 돼도 팝업은 정상 표시
    console.log("FLOW: 통계 불러오기 실패", error);
  }
}

// ── 로그아웃 ──────────────────────────────────────
document.getElementById("logout-btn").addEventListener(
  "click",
  async () => {
    await chrome.storage.local.clear();
    showLoginView();
    // 입력창 초기화
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
  }
);

// ── 자동 수집 토글 ──────────────────────────────────
document.getElementById("collect-toggle").addEventListener(
  "change",
  async (e) => {
    const isOn = e.target.checked;
    await chrome.storage.local.set({ autoCollect: isOn });
    console.log("FLOW: 자동 수집", isOn ? "ON" : "OFF");
  }
);

// 토글 초기 상태 불러오기
chrome.storage.local.get("autoCollect", ({ autoCollect }) => {
  // 기본값은 true (켜짐)
  const toggle = document.getElementById("collect-toggle");
  toggle.checked = autoCollect !== false;
});