console.log("FLOW: Claude 감지 시작 🌿");

let lastSavedAnswer = "";

const observer = new MutationObserver(() => {
  checkForNewResponse();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

function checkForNewResponse() {
  // 스트리밍 중인지 확인 (스트리밍 중이면 아직 답변 안 끝난 것)
  const isStreaming = document.querySelector(
    'div[data-is-streaming="true"]'
  );
  if (isStreaming) return;

  // 질문 가져오기
  const questions = document.querySelectorAll(
    '.human-turn p'
  );
  // 답변 가져오기
  const answers = document.querySelectorAll(
    '.assistant-turn .prose'
  );

  if (questions.length === 0 || answers.length === 0) return;

  // 마지막 질문이랑 답변만 추출
  const lastQuestion = questions[questions.length - 1]
    .innerText.trim();
  const lastAnswer = answers[answers.length - 1]
    .innerText.trim();

  if (!lastQuestion || !lastAnswer) return;
  if (lastAnswer === lastSavedAnswer) return;

  lastSavedAnswer = lastAnswer;
  console.log("FLOW: Claude 새 대화 감지! 저장 중...");

  chrome.runtime.sendMessage({
    type: "SAVE_INSIGHT",
    data: {
      ai_source: "Claude",
      question: lastQuestion,
      answer: lastAnswer,
      collected_at: new Date().toISOString(),
      platform_url: window.location.href,
      has_attachment: false
    }
  });
}