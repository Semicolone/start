import Icon from "./Icon.jsx";

const MAIN = [
  { id: "home", label: "홈", icon: "home" },
  { id: "save", label: "인사이트 저장", icon: "plus" },
  { id: "table", label: "인사이트 목록", icon: "table", count: 142 },
];

export default function Sidebar({ page, setPage, categories }) {
  const go = (id) => (e) => { e.preventDefault(); setPage(id); };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Icon name="leaf" /></div>
        <span className="brand-name">FLOW</span>
      </div>

      <nav className="nav">
        <div className="nav-group">
          <div className="nav-label">메인</div>
          {MAIN.map((m) => (
            <button
              key={m.id}
              className={"nav-item" + (page === m.id ? " active" : "")}
              onClick={go(m.id)}
            >
              <Icon name={m.icon} />
              {m.label}
              {m.count != null && <span className="nav-count">{m.count}</span>}
            </button>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-label">인사이트</div>
          <button
            className={"nav-item" + (page === "analysis" ? " active" : "")}
            onClick={go("analysis")}
          >
            <Icon name="chart-dots-3" />
            AI 분석
          </button>
        </div>

        <div className="nav-group">
          <div className="nav-label-row">
            <span className="nav-label">카테고리</span>
            <button className="nav-manage" onClick={go("category")} aria-label="카테고리 관리">
              <Icon name="settings" />
            </button>
          </div>
          {categories.map((c) => (
            <button key={c.name} className="nav-item">
              <Icon name={c.icon || "briefcase"} />
              {c.name}
              <span className="nav-count">{c.count}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="sidebar-foot">
        <div className="user-chip">
          <div className="avatar">지</div>
          <div className="user-meta">
            <div className="user-name">김지수</div>
            <div className="user-mail">jisu@email.com</div>
          </div>
          <button className="icon-btn" aria-label="설정"><Icon name="settings" /></button>
        </div>
      </div>
    </aside>
  );
}
