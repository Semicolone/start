// CDN 환경에서는 React를 전역 변수에서 가져옵니다.
const { useMemo, useState } = React;

/**
 * React 18 + Fetch API
 * 백엔드 필요:
 * POST /ai/analyze
 * req: { question, answer }
 * res: { question_summary, answer_summary, keywords: string[] }
 */

const AI_LINKS = {
  chatgpt: "https://chat.openai.com/",
  gemini: "https://gemini.google.com/",
  other: "https://www.perplexity.ai/",
};

function cleanKeywords(input) {
  let arr = [];
  if (Array.isArray(input)) arr = input;
  else if (typeof input === "string") arr = input.split(/[,#\n]/g);

  arr = arr
    .map((k) => String(k).trim().replace(/^#+/, ""))
    .filter((k) => k.length > 0);

  // 중복 제거(순서 유지)
  const seen = new Set();
  const dedup = [];
  for (const k of arr) {
    const key = k.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(k);
    }
  }
  return dedup;
}

function InsightGeneratePage() {
  const [selectedAI, setSelectedAI] = useState("chatgpt");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [questionSummary, setQuestionSummary] = useState("");
  const [answerSummary, setAnswerSummary] = useState("");
  const [keywords, setKeywords] = useState([]);

  const canSubmit = useMemo(() => {
    return question.trim().length > 0 && answer.trim().length > 0 && !loading;
  }, [question, answer, loading]);

  const onClickAI = (key) => {
    setSelectedAI(key);
    window.open(AI_LINKS[key], "_blank", "noopener,noreferrer");
  };

  const onGenerate = async () => {
    setErrorMsg("");

    if (!question.trim() || !answer.trim()) {
      setErrorMsg("질문/답변을 모두 입력(또는 붙여넣기)해 주세요.");
      return;
    }

    setQuestionSummary("");
    setAnswerSummary("");
    setKeywords([]);
    setLoading(true);

    try {
      const res = await fetch("/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `분석 실패 (${res.status})`);
      }

      const data = await res.json();

      const qs = (data?.question_summary ?? "").toString().trim();
      const as = (data?.answer_summary ?? "").toString().trim();
      const kw = cleanKeywords(data?.keywords);

      if (!qs || !as) {
        throw new Error("요약 결과 형식이 올바르지 않아요. (question_summary/answer_summary 필요)");
      }

      setQuestionSummary(qs);
      setAnswerSummary(as);
      setKeywords(kw);
    } catch (e) {
      setErrorMsg(e?.message || "알 수 없는 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.aiTabs}>
        <button
          type="button"
          style={selectedAI === "chatgpt" ? styles.aiTabActive : styles.aiTab}
          onClick={() => onClickAI("chatgpt")}
        >
          chatgpt
        </button>
        <button
          type="button"
          style={selectedAI === "gemini" ? styles.aiTabActive : styles.aiTab}
          onClick={() => onClickAI("gemini")}
        >
          gemini
        </button>
        <button
          type="button"
          style={selectedAI === "other" ? styles.aiTabActive : styles.aiTab}
          onClick={() => onClickAI("other")}
        >
          다른 AI
        </button>
      </div>

      <div style={styles.form}>
        <div style={styles.row}>
          <div style={styles.label}>질문</div>
          <input
            style={styles.input}
            placeholder="AI에게 한 질문을 입력하세요"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div style={styles.row}>
          <div style={styles.label}>답변</div>
          <input
            style={styles.input}
            placeholder="AI에게 받은 답변을 입력하세요"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.plusBtn} onClick={() => {}}>
            +
          </button>

          <button
            type="button"
            style={canSubmit ? styles.primaryBtn : styles.primaryBtnDisabled}
            onClick={onGenerate}
            disabled={!canSubmit}
          >
            {loading ? "생성 중..." : "인사이트 생성하기"}
          </button>
        </div>

        {errorMsg ? <div style={styles.error}>{errorMsg}</div> : null}
      </div>

      <div style={styles.result}>
        <div style={styles.block}>
          <div style={styles.blockTitle}>질문 요약</div>
          <div style={styles.textAreaLike}>
            {questionSummary || (
              <span style={styles.placeholder}>AI로부터 사용자가 알고자한 것</span>
            )}
          </div>
        </div>

        <div style={styles.block}>
          <div style={styles.blockTitle}>답변 요약</div>
          <div style={{ ...styles.textAreaLike, minHeight: 180 }}>
            {answerSummary || (
              <span style={styles.placeholder}>AI에게 얻은 답변 요약</span>
            )}
          </div>
        </div>

        <div style={styles.keywordsWrap}>
          {keywords.map((k, idx) => (
            <span key={`${k}-${idx}`} style={styles.keywordChip}>
              #{k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 720,
    margin: "40px auto",
    padding: "0 16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", Arial, sans-serif',
    color: "#111",
  },
  aiTabs: { display: "flex", gap: 10, marginBottom: 18 },
  aiTab: {
    border: "none",
    padding: "10px 16px",
    borderRadius: 999,
    background: "#eee",
    cursor: "pointer",
    fontSize: 14,
  },
  aiTabActive: {
    border: "none",
    padding: "10px 16px",
    borderRadius: 999,
    background: "#ddd",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },
  form: {
    background: "#fff",
    borderRadius: 12,
    padding: 18,
    border: "1px solid #e5e5e5",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "64px 1fr",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  label: { fontWeight: 800 },
  input: {
    height: 44,
    borderRadius: 10,
    border: "1px solid #d9d9d9",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid #d9d9d9",
    background: "#fff",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: "44px",
  },
  primaryBtn: {
    width: 240,
    height: 48,
    borderRadius: 10,
    border: "none",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 15,
  },
  primaryBtnDisabled: {
    width: 240,
    height: 48,
    borderRadius: 10,
    border: "none",
    background: "#333",
    color: "#aaa",
    cursor: "not-allowed",
    fontWeight: 800,
    fontSize: 15,
    opacity: 0.7,
  },
  error: { marginTop: 12, color: "#d32f2f", fontSize: 13, textAlign: "center" },
  result: { marginTop: 22 },
  block: { marginBottom: 18 },
  blockTitle: { fontWeight: 900, marginBottom: 10, fontSize: 16 },
  textAreaLike: {
    border: "1px solid #d9d9d9",
    borderRadius: 12,
    padding: 16,
    minHeight: 70,
    background: "#fff",
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
  },
  placeholder: { color: "#9b9b9b" },
  keywordsWrap: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 },
  keywordChip: { background: "#eee", borderRadius: 999, padding: "10px 16px", fontSize: 14 },
};
