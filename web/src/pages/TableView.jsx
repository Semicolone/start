import { useMemo, useState } from "react";
import Icon from "./../components/Icon.jsx";
import { CatTag, SrcMeta, CheckMark } from "../components/Bits.jsx";
import DocModal from "../components/DocModal.jsx";
import { INSIGHTS, PROJECTS } from "../data.js";

export default function TableView() {
  const [sortKey, setSortKey] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [proj, setProj] = useState("전체");
  const [selected, setSelected] = useState(() => new Set());
  const [showDoc, setShowDoc] = useState(false);

  const rows = useMemo(() => {
    const list = INSIGHTS.filter((r) => proj === "전체" || r.proj === proj);
    return [...list].sort((a, b) => {
      const x = a[sortKey], y = b[sortKey];
      if (x < y) return sortAsc ? -1 : 1;
      if (x > y) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [sortKey, sortAsc, proj]);

  const visibleIds = rows.map((r) => r.id);
  const allOn = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const onSort = (k) => {
    if (sortKey === k) setSortAsc((v) => !v);
    else { setSortKey(k); setSortAsc(k === "q" || k === "cat"); }
  };
  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (visibleIds.every((id) => next.has(id))) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const clearSel = () => setSelected(new Set());

  const COLS = [
    { k: "q", label: "질문" },
    { k: "cat", label: "카테고리", w: 130 },
    { k: "src", label: "출처", w: 120 },
    { k: "proj", label: "프로젝트", w: 120 },
    { k: "date", label: "날짜", w: 90 },
  ];
  const chosen = INSIGHTS.filter((r) => selected.has(r.id));

  return (
    <div className="inner">
      <div className="page-head">
        <div className="eyebrow">인사이트 142개</div>
        <h1 className="screen-title">인사이트 목록</h1>
        <p className="screen-sub">제목과 요약을 훑어 빠르게 찾고, 여러 개를 골라 하나의 문서로 정리하세요.</p>
      </div>

      <div className="toolbar">
        <div className="searchbox">
          <Icon name="search" />
          <input placeholder="질문·답변·키워드 검색" aria-label="인사이트 검색" />
        </div>
        <div className="seg">
          {PROJECTS.map((p) => (
            <button key={p} className={proj === p ? "on" : ""} onClick={() => setProj(p)}>{p}</button>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk">
          <span className="c">{selected.size}개 선택됨</span>
          <div className="spacer" />
          <button className="btn" onClick={clearSel}>선택 해제</button>
          <button className="btn btn-primary" onClick={() => setShowDoc(true)}>
            <Icon name="file-text" />문서로 정리
          </button>
        </div>
      )}

      <table className="itable">
        <thead>
          <tr>
            <th className="col-check nosort">
              <span className={"chk" + (allOn ? " on" : "")} onClick={toggleAll}><CheckMark /></span>
            </th>
            {COLS.map((c) => (
              <th
                key={c.k}
                className={c.k === "q" ? "col-q" : ""}
                style={c.w ? { width: c.w } : undefined}
                onClick={() => onSort(c.k)}
              >
                {c.label}
                {sortKey === c.k && <span className="so">{sortAsc ? "▴" : "▾"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={selected.has(r.id) ? "sel" : ""}>
              <td className="col-check">
                <span className={"chk" + (selected.has(r.id) ? " on" : "")} onClick={() => toggleRow(r.id)}><CheckMark /></span>
              </td>
              <td className="col-q">
                <div className="t-q">{r.q}</div>
                <div className="t-sub">{r.a}</div>
              </td>
              <td><CatTag name={r.cat} /></td>
              <td><SrcMeta src={r.src} sc={r.sc} /></td>
              <td><span className="proj">{r.proj}</span></td>
              <td><span className="meta">{r.date.slice(5).replace("-", ".")}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDoc && <DocModal insights={chosen} onClose={() => setShowDoc(false)} />}
    </div>
  );
}
