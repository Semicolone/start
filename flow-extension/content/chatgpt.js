console.log("FLOW: ChatGPT 감지 시작 🌿");

// 마지막으로 저장한 답변 추적 (중복 방지)
let lastSavedAnswer = "";

// DOM 변화를 감시하는 Observer
const observer = new MutationObserver(() => {
  checkForNewResponse();
});

// 감시 시작
observer.observe(document.body, {
  childList: true,
  subtree: true
});

function checkForNewResponse() {
  // 로딩 중인지 확인 (로딩 중이면 아직 답변 안 끝난 것)
  const isLoading = document.querySelector(
    'button[data-testid="stop-button"]'
  );
  if (isLoading) return; // 아직 답변 중이면 패스

  // 모든 대화 가져오기
  const messages = document.querySelectorAll(
    '[data-message-author-role]'
  );
  if (messages.length < 2) return;

  // 마지막 질문과 답변 추출
  let lastQuestion = "";
  let lastAnswer = "";

  messages.forEach((msg) => {
    const role = msg.getAttribute("data-message-author-role");
    const text = msg.innerText.trim();

    if (role === "user") {
      lastQuestion = text;
    }
    if (role === "assistant") {
      lastAnswer = text;
    }
  });

  // 비어있거나 이미 저장한 답변이면 패스
  if (!lastQuestion || !lastAnswer) return;
  if (lastAnswer === lastSavedAnswer) return;

  // 새 답변 감지! 저장
  lastSavedAnswer = lastAnswer;
  console.log("FLOW: 새 대화 감지! 저장 중...");

  // service_worker.js로 전달
  chrome.runtime.sendMessage({
    type: "SAVE_INSIGHT",
    data: {
      ai_source: "ChatGPT",
      question: lastQuestion,
      answer: lastAnswer,
      collected_at: new Date().toISOString(),
      platform_url: window.location.href,
      has_attachment: false
    }
  });
}