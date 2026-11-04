import { useMemo, useState } from "react";
import Icon from "./Icon.jsx";

export default function DocModal({ insights, onClose }) {
  const [note, setNote] = useState("");

  const { groups, md, today } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const groups = {};
    insights.forEach((r) => {
      (groups[r.cat] = groups[r.cat] || []).push(r);
    });
    let md = `# 인사이트 정리 노트\n\n${today} · 인사이트 ${insights.length}개\n\n`;
    Object.keys(groups).forEach((cat) => {
      md += `## ${cat}\n\n`;
      groups[cat].forEach((r) => {
        md += `**Q. ${r.q}**\n\n${r.a}\n\n> ${r.src} · ${r.date}\n\n`;
      });
    });
    return { groups, md, today };
  }, [insights]);

  const copy = () => {
    const done = () => setNote("클립보드에 복사됐어요");
    try {
      navigator.clipboard.writeText(md).then(done).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = md;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        ta.remove();
      });
    } catch (e) {}
  };

  const topicCount = Object.keys(groups).length;

  return (
    <div className="modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="문서로 정리">
        <div className="modal-head">
          <Icon name="file-text" />
          <span className="modal-title">인사이트 문서</span>
          <button className="modal-close" onClick={onClose} aria-label="닫기"><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <div className="doc-preview">
            <h2>인사이트 정리 노트</h2>
            <div className="doc-meta">
              {today} · 인사이트 {insights.length}개 · {topicCount}개 주제
            </div>
            {Object.keys(groups).map((cat) => (
              <div key={cat}>
                <h3>{cat}</h3>
                {groups[cat].map((r) => (
                  <div key={r.id}>
                    <p><b>Q.</b> {r.q}</p>
                    <p>{r.a}</p>
                    <div className="doc-src">{r.src} · {r.date}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <span className="note2">
            {note || `${insights.length}개 인사이트를 ${topicCount}개 주제로 묶었어요`}
          </span>
          <div className="spacer" />
          <button className="btn" onClick={copy}><Icon name="copy" />복사</button>
          <button className="btn btn-primary" onClick={copy}><Icon name="download" />마크다운 내보내기</button>
        </div>
      </div>
    </div>
  );
}
