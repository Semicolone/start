console.log("FLOW: Gemini 감지 시작 🌿");

let lastSavedAnswer = "";

const observer = new MutationObserver(() => {
  checkForNewResponse();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

function checkForNewResponse() {
  // 로딩 중인지 확인
  const isLoading = document.querySelector(
    '.loading-indicator'
  );
  if (isLoading) return;

  // 질문 가져오기
  const questions = document.querySelectorAll(
    '.query-text'
  );
  // 답변 가져오기
  const answers = document.querySelectorAll(
    '.response-content p'
  );

  if (questions.length === 0 || answers.length === 0) return;

  const lastQuestion = questions[questions.length - 1]
    .innerText.trim();
  const lastAnswer = answers[answers.length - 1]
    .innerText.trim();

  if (!lastQuestion || !lastAnswer) return;
  if (lastAnswer === lastSavedAnswer) return;

  lastSavedAnswer = lastAnswer;
  console.log("FLOW: Gemini 새 대화 감지! 저장 중...");

  chrome.runtime.sendMessage({
    type: "SAVE_INSIGHT",
    data: {
      ai_source: "Gemini",
      question: lastQuestion,
      answer: lastAnswer,
      collected_at: new Date().toISOString(),
      platform_url: window.location.href,
      has_attachment: false
    }
  });
}