import { REVISIT, RECENT, HEATMAP, HEAT_COLORS, CAT_DIST } from "../data.js";
import { CatTag, SrcMeta } from "../components/Bits.jsx";

function Row({ item, onClick }) {
  return (
    <button className="row link" onClick={onClick}>
      <div className="row-t">{item.q}</div>
      <div className="row-s">{item.a}</div>
      <div className="row-m">
        <CatTag name={item.cat} />
        <SrcMeta src={item.src} sc={item.sc} />
        <span className="meta">{item.when}</span>
      </div>
    </button>
  );
}

export default function Home({ setPage }) {
  const stats = [
    { l: "총 인사이트", n: "142" },
    { l: "활동일", n: "23" },
    { l: "AI 툴", n: "3" },
    { l: "이달의 키워드", n: "취업", word: true },
  ];
  return (
    <div className="inner">
      <div className="home-date">2026 · 10월</div>
      <div className="stat-cards">
        {stats.map((s) => (
          <div className="stat-card" key={s.l}>
            <div className="l">{s.l}</div>
            <div className={s.word ? "n word" : "n"}>{s.n}</div>
          </div>
        ))}
      </div>

      <div className="home-grid" style={{ marginTop: 24 }}>
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="sect-head">
              <span className="sect-title">지금 다시 볼 인사이트</span>
              <button className="sect-act" onClick={() => setPage("table")}>모두 보기</button>
            </div>
            <div className="rowlist">
              {REVISIT.map((it, i) => (
                <Row key={i} item={it} onClick={() => setPage("table")} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="sect-head">
              <span className="sect-title">최근 저장</span>
              <button className="sect-act" onClick={() => setPage("table")}>전체 보기</button>
            </div>
            <div className="rowlist">
              {RECENT.map((it, i) => (
                <Row key={i} item={it} onClick={() => setPage("table")} />
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="rail-head">활동</div>
            <div className="heat">
              {HEATMAP.map((lv, i) => (
                <div className="hc" key={i} style={lv ? { background: HEAT_COLORS[lv] } : undefined} />
              ))}
            </div>
            <div className="heat-legend">
              적음
              <span className="hc" />
              <span className="hc" style={{ background: "#b7e4c7" }} />
              <span className="hc" style={{ background: "#5dcaa5" }} />
              <span className="hc" style={{ background: "#2d9e6b" }} />
              <span className="hc" style={{ background: "#1a4a35" }} />
              많음
            </div>
          </div>

          <div className="card">
            <div className="rail-head">카테고리 분포</div>
            {CAT_DIST.map((b) => (
              <div className="barline" key={b.label}>
                <span className="bl">{b.label}</span>
                <span className="bt"><span className="bf" style={{ width: `${b.w}%`, background: b.color }} /></span>
                <span className="bv">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
