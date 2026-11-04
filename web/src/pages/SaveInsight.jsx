import { useState } from "react";
import Icon from "../components/Icon.jsx";

const SOURCES = ["ChatGPT", "Claude", "Gemini"];
const CATS = ["커리어/진로", "개발", "학습/공부", "감정/고민"];

export default function SaveInsight() {
  const [src, setSrc] = useState("ChatGPT");
  const [cat, setCat] = useState("커리어/진로");
  const [q, setQ] = useState("백엔드 개발자로 취업하려면 뭘 준비해야 해?");
  const [a, setA] = useState(
    "CS 기초(자료구조, OS, 네트워크)를 탄탄히 하고, 실제 서비스 경험이 담긴 프로젝트를 만드세요. 코딩 테스트 준비도 병행하는 게 좋아요."
  );

  return (
    <div className="inner">
      <div className="page-head">
        <h1 className="screen-title">인사이트 저장</h1>
        <p className="screen-sub">AI와 나눈 질문과 답변을 붙여넣으면, 요약하고 기존 인사이트와 연결해 드려요.</p>
      </div>

      <div className="save-grid">
        <div>
          <label className="fld-label">질문 (Q)</label>
          <textarea className="ta" value={q} onChange={(e) => setQ(e.target.value)} placeholder="AI에게 했던 질문을 붙여넣으세요" />
        </div>
        <div>
          <label className="fld-label">답변 (A)</label>
          <textarea className="ta" value={a} onChange={(e) => setA(e.target.value)} placeholder="AI의 답변을 붙여넣으세요" />
        </div>
      </div>

      <div className="settings">
        <div className="set-col">
          <div className="sl">AI 출처</div>
          <div className="chip-set">
            {SOURCES.map((s) => (
              <button key={s} className={"schip" + (src === s ? " on" : "")} onClick={() => setSrc(s)}>{s}</button>
            ))}
          </div>
        </div>
        <div className="set-col">
          <div className="sl">카테고리</div>
          <div className="chip-set">
            {CATS.map((c) => (
              <button key={c} className={"schip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="save-foot">
        <button className="btn">취소</button>
        <button className="btn btn-primary"><Icon name="sparkles" />AI 분석 후 저장</button>
      </div>

      <div className="note">
        <div className="note-h">분석 완료</div>
        <div className="qa-row"><span className="qa-k q">Q 요약</span><span className="qa-v">백엔드 개발자 취업 준비 체크리스트</span></div>
        <div className="qa-row"><span className="qa-k a">A 요약</span><span className="qa-v">CS 기초 + 프로젝트 경험 + 코딩테스트 병행</span></div>
        <p className="note-link">이전에 저장한 <b>“포트폴리오 프로젝트 구성”</b>과 연결됐어요.</p>
        <div className="tags">
          <span className="tg">#취업</span>
          <span className="tg">#백엔드</span>
          <span className="tg">#포트폴리오</span>
          <span className="tg">#코딩테스트</span>
        </div>
      </div>
    </div>
  );
}
