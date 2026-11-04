import { CAT_COLOR } from "../data.js";

// 카테고리 점 + 이름
export function CatTag({ name }) {
  return (
    <span className="cat">
      <span className="sw" style={{ background: CAT_COLOR[name] || "var(--ink-3)" }} />
      {name}
    </span>
  );
}

// 출처 점 + 이름 (ChatGPT/Claude/Gemini)
export function SrcMeta({ src, sc }) {
  return (
    <span className="srcm">
      <span className="sw" style={{ background: sc }} />
      {src}
    </span>
  );
}

// 체크박스 안의 체크 아이콘
export function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 12l5 5l9 -9" />
    </svg>
  );
}
