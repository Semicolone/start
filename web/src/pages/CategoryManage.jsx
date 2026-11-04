import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { CAT_PALETTE } from "../data.js";

export default function CategoryManage({ categories, setCategories }) {
  const [input, setInput] = useState("");

  const add = () => {
    const name = input.trim();
    if (!name) return;
    setCategories((prev) => [
      ...prev,
      { name, color: CAT_PALETTE[prev.length % CAT_PALETTE.length], count: 0 },
    ]);
    setInput("");
  };
  const del = (i) => setCategories((prev) => prev.filter((_, idx) => idx !== i));
  const rename = (i, v) =>
    setCategories((prev) => prev.map((c, idx) => (idx === i ? { ...c, name: v } : c)));

  return (
    <div className="inner">
      <div className="page-head">
        <div className="eyebrow">설정</div>
        <h1 className="screen-title">카테고리 관리</h1>
        <p className="screen-sub">카테고리를 추가하거나 이름을 바꾸고, 쓰지 않는 건 삭제하세요.</p>
      </div>

      <div className="catlist">
        {categories.map((c, i) => (
          <div className="catrow" key={i}>
            <span className="sw" style={{ background: c.color }} />
            <input className="name" value={c.name} onChange={(e) => rename(i, e.target.value)} aria-label="카테고리 이름" />
            <span className="ct">{c.count}개</span>
            <button className="del" onClick={() => del(i)} aria-label="삭제"><Icon name="trash" /></button>
          </div>
        ))}
      </div>

      <div className="catadd">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="새 카테고리 이름"
          aria-label="새 카테고리 이름"
        />
        <button className="btn btn-primary" onClick={add}><Icon name="plus" />추가</button>
      </div>
    </div>
  );
}
