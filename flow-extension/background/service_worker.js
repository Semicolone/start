// FLOW 서버 주소 (나중에 실제 서버 주소로 바꿔요)
const FLOW_API = "http://localhost:8000";

// 다른 스크립트에서 메시지가 오면 실행되는 함수
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_INSIGHT") {
    saveToFlow(message.data);
  }
  return true;
});

// FLOW 서버에 데이터 전송하는 함수
async function saveToFlow(data) {
  try {
    // 저장된 토큰 가져오기
    const { token } = await chrome.storage.local.get("token");
    
    if (!token) {
      console.log("FLOW: 로그인이 필요해요");
      return;
    }

    const response = await fetch(`${FLOW_API}/api/insights/auto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log("FLOW: 저장 성공! ✅");
      // 배지 표시
      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#2d6a4f" });
      // 2초 후 배지 지우기
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
    } else {
      console.log("FLOW: 저장 실패 ❌", response.status);
    }
  } catch (error) {
    console.log("FLOW: 에러 발생", error);
  }
}