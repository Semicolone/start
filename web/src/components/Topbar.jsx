import Icon from "./Icon.jsx";

export default function Topbar({ setPage }) {
  return (
    <header className="topbar">
      <div className="searchbox" style={{ maxWidth: 480, minWidth: 240 }}>
        <Icon name="search" />
        <input placeholder="인사이트 검색" aria-label="인사이트 검색" />
      </div>
      <div className="topbar-spacer" />
      <button className="btn btn-primary" onClick={() => setPage("save")}>
        <Icon name="plus" />저장
      </button>
    </header>
  );
}
