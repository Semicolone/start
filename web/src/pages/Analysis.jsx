import { CAT_DIST, Q_STYLE, KEYWORDS, TIMELINE } from "../data.js";

export default function Analysis() {
  return (
    <div className="inner">
      <div className="page-head">
        <div className="eyebrow">2026 · 10월 · 인사이트 142개 기반</div>
        <h1 className="screen-title">AI 분석</h1>
      </div>

      <div className="home-grid">
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="sect-head"><span className="sect-title">관심 분야</span></div>
            {CAT_DIST.map((b) => (
              <div className="barline" key={b.label}>
                <span className="bl">{b.label}</span>
                <span className="bt"><span className="bf" style={{ width: `${b.w}%`, background: b.color }} /></span>
                <span className="bv">{b.pct}%</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="sect-head"><span className="sect-title">질문 스타일</span></div>
            {Q_STYLE.map((b) => (
              <div className="barline" key={b.label}>
                <span className="bl">{b.label}</span>
                <span className="bt"><span className="bf" style={{ width: `${b.w}%`, background: "var(--green)" }} /></span>
                <span className="bv">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="rail-head">키워드</div>
            <div className="kw-cloud">
              {KEYWORDS.map((k) => (
                <button className="chip" key={k.t} style={k.size ? { fontSize: k.size } : undefined}>{k.t}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="sect-head"><span className="sect-title">이달의 회고</span></div>
        <div className="retro">
          <div className="lead">취업 준비로 가득 찬 한 달이었어요</div>
          <p>
            면접·자소서 키워드가 10월 중순부터 급증했어요. 지난달보다 커리어 질문이 <b>40% 늘었고</b>,
            Claude 사용 비율도 <b>12% 증가</b>했어요.
          </p>
          <div className="timeline">
            {TIMELINE.map((t) => (
              <div className="tl" key={t.w}>
                <div className="w">{t.w}</div>
                <div className="x"><b>{t.x}</b>{t.tail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
