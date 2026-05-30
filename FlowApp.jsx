import { useState, useEffect, useRef } from "react";

const C = {
  acc: "#2d6a4f", acc2: "#e8f5ee", acc3: "#1a4a35",
  bg: "#f5f4f0", white: "#ffffff", border: "#e8e6e0", border2: "#d1cec8",
  tx: "#1a1a18", muted: "#6b7280", hint: "#9ca3af",
  career: "#7b5ea7", dev: "#3b5bdb", study: "#2d9e6b",
  emotion: "#d45d79", create: "#e07b39", daily: "#888780",
};

const CATS = [
  { name:"커리어/진로", icon:"💼", color:C.career, cnt:48, pct:34, short:"커리어" },
  { name:"개발",        icon:"💻", color:C.dev,    cnt:40, pct:28, short:"개발" },
  { name:"학습/공부",   icon:"📖", color:C.study,  cnt:26, pct:18, short:"학습" },
  { name:"감정/고민",   icon:"💙", color:C.emotion,cnt:17, pct:12, short:"감정" },
  { name:"창작",        icon:"💡", color:C.create, cnt:7,  pct:5,  short:"창작" },
  { name:"일상",        icon:"☀️", color:C.daily,  cnt:4,  pct:3,  short:"일상" },
];

const QS = [
  { q:"개발자 취업 vs 대학원 진학, 어떤 선택이 더 좋을까?", a:"취업은 빠른 실무 경험, 대학원은 연구 역량. 목표에 따라 달라짐.", cat:"커리어/진로", src:"Claude",   date:"5/14" },
  { q:"React 상태관리 Zustand vs Redux 비교",               a:"소규모는 Zustand가 보일러플레이트 적어 유리, 대형 프로젝트는 Redux.", cat:"개발",       src:"ChatGPT", date:"5/13" },
  { q:"자기소개서에서 지원 동기를 잘 쓰는 방법",            a:"구체적인 경험과 해당 회사를 선택한 이유를 연결해 작성.", cat:"커리어/진로", src:"Claude",   date:"5/12" },
  { q:"딥러닝과 머신러닝의 차이점",                         a:"딥러닝은 머신러닝의 하위 개념, 다층 신경망을 사용.", cat:"학습/공부",  src:"ChatGPT", date:"5/11" },
  { q:"번아웃이 왔을 때 회복하는 방법",                     a:"충분한 휴식과 작은 성취감 쌓기가 중요.", cat:"감정/고민",  src:"Claude",   date:"5/10" },
];

const CAL_DATA = {
  14:[{q:"개발자 취업 vs 대학원",cat:"커리어/진로"},{q:"자기소개서 첫 문장",cat:"커리어/진로"},{q:"포트폴리오 구성",cat:"커리어/진로"}],
  13:[{q:"Zustand vs Redux",cat:"개발"},{q:"React 최적화",cat:"개발"}],
  12:[{q:"자기소개서 지원 동기",cat:"커리어/진로"}],
  11:[{q:"딥러닝 vs 머신러닝",cat:"학습/공부"}],
  10:[{q:"번아웃 회복",cat:"감정/고민"}],
  8:[{q:"Node.js 비동기 처리",cat:"개발"}],
  7:[{q:"알고리즘 공부 순서",cat:"학습/공부"}],
};

const GL = [0,1,0,2,1,3,2,1,0,2,4,3,1,2,0,1,3,2,4,3,1,0,2,1,3,4,2,0,1,2,3,1,2,4,3,2,1,0,1,2,3,2,1];

const CAT_COLOR = {"커리어/진로":C.career,"개발":C.dev,"학습/공부":C.study,"감정/고민":C.emotion,"창작":C.create,"일상":C.daily};

const hmColor = (l) => ["#e8e6e0","#b7e4c7","#74c69d","#40916c","#1b4332"][l];

const s = {
  outer: { width:"320px", height:"620px", background:C.white, borderRadius:"38px", border:"6px solid #1a1a18", boxShadow:"0 32px 64px rgba(0,0,0,0.28)", overflow:"hidden", display:"flex", flexDirection:"column", flexShrink:0 },
  notch: { height:"28px", background:"#1a1a18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  notchPill: { width:"80px", height:"14px", background:C.white, borderRadius:"100px" },
  screen: { flex:1, background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden" },
  homeBar: { height:"20px", background:C.white, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  homeBarPill: { width:"100px", height:"4px", background:"#1a1a18", borderRadius:"100px" },
  scrollArea: { flex:1, overflowY:"auto", padding:"12px", scrollbarWidth:"none" },
  topbar: { background:C.white, padding:"12px 16px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0 },
  card: { background:C.white, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"12px", marginBottom:"10px" },
  sectionLabel: { fontSize:"10px", fontWeight:"700", color:C.hint, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:"8px" },
  statGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"6px", marginBottom:"10px" },
  statItem: { background:C.bg, borderRadius:"10px", padding:"10px 6px", textAlign:"center" },
  statNum: { fontSize:"20px", fontWeight:"700", color:C.tx, lineHeight:"1" },
  statLbl: { fontSize:"9px", color:C.muted, marginTop:"3px" },
  bottomNav: { background:C.white, borderTop:`1px solid ${C.border}`, display:"flex", padding:"6px 0 4px", flexShrink:0 },
  backHeader: { background:C.white, padding:"12px 16px 10px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:"10px", flexShrink:0 },
  inputField: { width:"100%", border:`1px solid ${C.border2}`, borderRadius:"10px", padding:"10px 12px", fontSize:"13px", fontFamily:"'Noto Sans KR', sans-serif", color:C.tx, background:C.white, outline:"none", marginBottom:"8px", boxSizing:"border-box" },
  authBtn: { width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:C.acc, color:"white", fontSize:"14px", fontWeight:"700", fontFamily:"'Noto Sans KR', sans-serif", cursor:"pointer", marginTop:"4px" },
};

function Badge({ cat }) {
  const c = CAT_COLOR[cat] || "#888";
  return <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"100px", fontWeight:"500", background:`${c}22`, color:c, border:`1px solid ${c}44` }}>{cat}</span>;
}
function SrcBadge({ src }) {
  return <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"100px", fontWeight:"500", background:C.bg, color:C.muted, border:`1px solid ${C.border}` }}>{src}</span>;
}

function BarRow({ label, pct, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
      <span style={{ fontSize:"10px", color:C.muted, width:"52px", flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:"5px", background:C.bg, borderRadius:"100px", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:"100px", background:color, width:`${pct}%`, transition:"width 0.6s ease" }} />
      </div>
      <span style={{ fontSize:"10px", color:C.hint, width:"26px", textAlign:"right" }}>{pct}%</span>
    </div>
  );
}

function BnavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", cursor:"pointer", padding:"4px 0" }}>
      <span style={{ fontSize:"20px", color: active ? C.acc : C.hint }}>{icon}</span>
      <span style={{ fontSize:"9px", color: active ? C.acc : C.hint, fontWeight: active ? "700" : "400" }}>{label}</span>
    </div>
  );
}

function BottomNav({ active, go }) {
  return (
    <div style={s.bottomNav}>
      <BnavItem icon="🏠" label="홈" active={active==="home"} onClick={()=>go("home")} />
      <BnavItem icon="📅" label="캘린더" active={active==="calendar"} onClick={()=>go("calendar")} />
      <div style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"center" }}>
        <button onClick={()=>go("add")} style={{ width:"42px", height:"42px", borderRadius:"50%", background:C.acc, display:"flex", alignItems:"center", justifyContent:"center", border:"none", cursor:"pointer", marginTop:"-18px", boxShadow:`0 4px 12px rgba(45,106,79,0.4)`, fontSize:"22px", color:"white", lineHeight:1 }}>+</button>
      </div>
      <BnavItem icon="🗂️" label="카테고리" active={active==="category"} onClick={()=>go("category")} />
      <BnavItem icon="👤" label="마이" active={active==="mypage"} onClick={()=>go("mypage")} />
    </div>
  );
}

function BackHeader({ title, onBack, extra }) {
  return (
    <div style={s.backHeader}>
      <button onClick={onBack} style={{ width:"32px", height:"32px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.muted, fontSize:"18px", flexShrink:0 }}>←</button>
      <span style={{ fontSize:"16px", fontWeight:"700", color:C.tx }}>{title}</span>
      {extra}
    </div>
  );
}

function InputLabel({ children }) {
  return <label style={{ fontSize:"11px", color:C.muted, fontWeight:"500", display:"block", marginBottom:"4px", marginTop:"10px" }}>{children}</label>;
}

// ── SCREENS ────────────────────────────────────────────

function HomeScreen({ go }) {
  return (
    <>
      <div style={s.topbar}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:"16px", fontWeight:"700", color:C.tx }}>안녕하세요, 지수님 👋</div>
            <div style={{ fontSize:"11px", color:C.hint, marginTop:"2px" }}>이번 달 142개 질문했어요</div>
          </div>
          <button style={{ width:"32px", height:"32px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.muted, fontSize:"16px" }}>🔍</button>
        </div>
      </div>
      <div style={s.scrollArea}>
        <div style={s.statGrid}>
          {[["142","총 질문"],["23","활동일"],["3","AI 툴"]].map(([n,l])=>(
            <div key={l} style={s.statItem}>
              <div style={s.statNum}>{n}</div>
              <div style={s.statLbl}>{l}</div>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <div style={s.sectionLabel}>활동 히트맵</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(13,1fr)", gap:"3px" }}>
            {GL.map((l,i)=>(
              <div key={i} style={{ height:"13px", borderRadius:"2px", background:hmColor(l) }} />
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionLabel}>카테고리 분포</div>
          {CATS.slice(0,4).map(c=><BarRow key={c.name} label={c.short} pct={c.pct} color={c.color} />)}
        </div>

        <div style={s.card}>
          <div style={{ ...s.sectionLabel, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span>최근 질문</span>
            <span onClick={()=>go("calendar")} style={{ fontSize:"11px", color:C.acc, cursor:"pointer", fontWeight:"500" }}>전체 보기 →</span>
          </div>
          {QS.slice(0,3).map((q,i)=>(
            <div key={i} style={{ padding:"10px 0", borderBottom: i<2 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize:"12px", fontWeight:"700", color:C.tx, marginBottom:"3px", lineHeight:"1.4" }}>{q.q}</div>
              <div style={{ fontSize:"11px", color:C.muted, lineHeight:"1.5", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{q.a}</div>
              <div style={{ display:"flex", alignItems:"center", gap:"5px", marginTop:"6px" }}>
                <SrcBadge src={q.src} /><Badge cat={q.cat} />
                <span style={{ fontSize:"10px", color:C.hint, marginLeft:"auto" }}>{q.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...s.card, marginBottom:0 }}>
          <div style={s.sectionLabel}>AI 툴 사용 비율</div>
          {[["ChatGPT",58,"#10a37f"],["Claude",32,"#d97706"],["Gemini",10,"#4285f4"]].map(([n,p,c])=>(
            <BarRow key={n} label={n} pct={p} color={c} />
          ))}
        </div>
      </div>
      <BottomNav active="home" go={go} />
    </>
  );
}

function LoginScreen({ go }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"24px 20px", background:C.white }}>
      <div style={{ textAlign:"center", marginBottom:"32px" }}>
        <div style={{ fontSize:"28px", fontWeight:"700", color:C.acc, letterSpacing:"-1px" }}>🌿 FLOW</div>
        <div style={{ fontSize:"12px", color:C.hint, marginTop:"4px" }}>AI 질문 기록으로 나를 발견해요</div>
      </div>
      <InputLabel>이메일</InputLabel>
      <input style={s.inputField} placeholder="이메일을 입력하세요" type="email" />
      <InputLabel>비밀번호</InputLabel>
      <input style={s.inputField} placeholder="비밀번호를 입력하세요" type="password" />
      <button style={s.authBtn} onClick={()=>go("home")}>로그인</button>
      <div style={{ textAlign:"center", fontSize:"12px", color:C.muted, marginTop:"14px", cursor:"pointer" }} onClick={()=>go("register")}>
        계정이 없으신가요? <b style={{ color:C.acc }}>회원가입</b>
      </div>
    </div>
  );
}

function RegisterScreen({ go }) {
  return (
    <>
      <BackHeader title="회원가입" onBack={()=>go("login")} />
      <div style={{ ...s.scrollArea, background:C.white }}>
        <InputLabel>이름</InputLabel>
        <input style={s.inputField} placeholder="이름을 입력하세요" />
        <InputLabel>이메일</InputLabel>
        <input style={s.inputField} placeholder="이메일을 입력하세요" type="email" />
        <InputLabel>비밀번호</InputLabel>
        <input style={s.inputField} placeholder="8자 이상 입력하세요" type="password" />
        <InputLabel>비밀번호 확인</InputLabel>
        <input style={s.inputField} placeholder="비밀번호를 다시 입력하세요" type="password" />
        <div style={{ fontSize:"11px", color:C.hint, marginBottom:"16px" }}>이메일 인증은 MVP 이후 추가 예정이에요</div>
        <button style={s.authBtn} onClick={()=>go("home")}>가입하기</button>
        <div style={{ textAlign:"center", fontSize:"12px", color:C.muted, marginTop:"14px", cursor:"pointer" }} onClick={()=>go("login")}>
          이미 계정이 있으신가요? <b style={{ color:C.acc }}>로그인</b>
        </div>
      </div>
    </>
  );
}

function AddScreen({ go }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [src, setSrc] = useState("ChatGPT");

  const analyze = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 1600);
  };

  if (step === 1) return (
    <>
      <BackHeader title="질문 추가하기" onBack={()=>go("home")} />
      <div style={{ ...s.scrollArea, background:C.white }}>
        <InputLabel>AI 출처</InputLabel>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"4px" }}>
          {["ChatGPT","Claude","Gemini"].map(x=>(
            <div key={x} onClick={()=>setSrc(x)} style={{ padding:"5px 12px", borderRadius:"100px", fontSize:"12px", cursor:"pointer", fontWeight:"500", border:`1px solid ${src===x ? C.acc : C.border2}`, background:src===x ? C.acc2 : C.white, color:src===x ? C.acc3 : C.muted, transition:"all 0.15s" }}>{x}</div>
          ))}
        </div>
        <InputLabel>질문 (Q)</InputLabel>
        <textarea style={{ ...s.inputField, height:"70px", resize:"none", lineHeight:"1.5" }} placeholder="AI에게 했던 질문을 붙여넣으세요..." />
        <InputLabel>답변 (A)</InputLabel>
        <textarea style={{ ...s.inputField, height:"70px", resize:"none", lineHeight:"1.5" }} placeholder="AI의 답변을 붙여넣으세요..." />
        <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end", marginTop:"4px" }}>
          <button onClick={()=>go("home")} style={{ padding:"8px 16px", borderRadius:"10px", fontSize:"13px", fontFamily:"'Noto Sans KR',sans-serif", fontWeight:"500", cursor:"pointer", border:`1px solid ${C.border2}`, background:"transparent", color:C.tx }}>취소</button>
          <button onClick={analyze} style={{ padding:"8px 16px", borderRadius:"10px", fontSize:"13px", fontFamily:"'Noto Sans KR',sans-serif", fontWeight:"500", cursor:"pointer", border:`1px solid ${C.acc}`, background:C.acc, color:"white", display:"flex", alignItems:"center", gap:"5px" }}>✨ AI 분석하기</button>
        </div>
      </div>
    </>
  );

  if (loading) return (
    <>
      <div style={s.backHeader}><span style={{ fontSize:"16px", fontWeight:"700", color:C.tx }}>분석 중...</span></div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:C.white, gap:"12px" }}>
        <div style={{ fontSize:"32px", animation:"spin 1s linear infinite" }}>⏳</div>
        <p style={{ fontSize:"13px", color:C.muted }}>AI가 분석 중이에요...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  );

  return (
    <>
      <BackHeader title="분석 결과" onBack={()=>setStep(1)} />
      <div style={{ ...s.scrollArea, background:C.white }}>
        <div style={{ background:C.bg, borderRadius:"10px", padding:"12px", marginTop:"4px" }}>
          <div style={{ ...s.sectionLabel, marginBottom:"8px" }}>분석 완료 ✅</div>
          <div style={{ fontSize:"12px", color:C.muted, marginBottom:"4px", lineHeight:"1.6" }}><b style={{ color:C.tx }}>Q 요약</b> 개발자 취업과 대학원 진학의 장단점 비교</div>
          <div style={{ fontSize:"12px", color:C.muted, lineHeight:"1.6" }}><b style={{ color:C.tx }}>A 요약</b> 취업은 빠른 실무 경험, 대학원은 연구 역량 강화. 개인 목표에 따라 선택.</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"5px", marginTop:"8px" }}>
            <Badge cat="커리어/진로" />
            {["#취업","#대학원","#진로"].map(t=>(
              <span key={t} style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"100px", fontWeight:"500", background:C.bg, color:C.muted, border:`1px solid ${C.border}` }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end", marginTop:"12px" }}>
          <button onClick={()=>setStep(1)} style={{ padding:"8px 16px", borderRadius:"10px", fontSize:"13px", fontFamily:"'Noto Sans KR',sans-serif", fontWeight:"500", cursor:"pointer", border:`1px solid ${C.border2}`, background:"transparent", color:C.tx }}>이전</button>
          <button onClick={()=>go("home")} style={{ padding:"8px 16px", borderRadius:"10px", fontSize:"13px", fontFamily:"'Noto Sans KR',sans-serif", fontWeight:"500", cursor:"pointer", border:`1px solid ${C.acc}`, background:C.acc, color:"white" }}>저장하기</button>
        </div>
      </div>
    </>
  );
}

function CalendarScreen({ go }) {
  const [selDay, setSelDay] = useState(14);
  const DAYS_OF_WEEK = ["일","월","화","수","목","금","토"];
  const firstDow = 3; // May 2025 starts on Thursday
  const daysInMonth = 31;
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <>
      <div style={s.topbar}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"16px", fontWeight:"700", color:C.tx }}>2025년 5월</span>
          <div style={{ display:"flex", gap:"4px" }}>
            <button style={{ width:"28px", height:"28px", borderRadius:"7px", border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", fontSize:"14px" }}>‹</button>
            <button style={{ width:"28px", height:"28px", borderRadius:"7px", border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", fontSize:"14px" }}>›</button>
          </div>
        </div>
      </div>
      <div style={s.scrollArea}>
        <div style={s.card}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:"4px" }}>
            {DAYS_OF_WEEK.map(d=>(
              <div key={d} style={{ textAlign:"center", fontSize:"10px", color:C.hint, fontWeight:"700", padding:"3px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px" }}>
            {cells.map((d,i)=>{
              if (!d) return <div key={i} />;
              const has = !!CAL_DATA[d];
              const isToday = d===14;
              const isSel = d===selDay;
              const qs = CAL_DATA[d] || [];
              return (
                <div key={i} onClick={()=>has && setSelDay(d)} style={{ minHeight:"36px", borderRadius:"7px", padding:"3px 2px", cursor:has?"pointer":"default", border:`1px solid ${isSel ? C.acc : isToday ? C.acc : has ? C.border : "transparent"}`, background: isSel ? C.acc2 : "transparent", transition:"all 0.1s" }}>
                  <div style={{ fontSize:"10px", color:isSel?C.acc3:isToday?C.acc:C.muted, fontWeight:isSel||isToday?"700":"400" }}>{d}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"1px" }}>
                    {qs.slice(0,3).map((q,j)=>(
                      <div key={j} style={{ width:"4px", height:"4px", borderRadius:"50%", background:CAT_COLOR[q.cat]||C.muted }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selDay && CAL_DATA[selDay] && (
          <div style={s.card}>
            <div style={{ ...s.sectionLabel, marginBottom:"8px" }}>5월 {selDay}일 질문 ({CAL_DATA[selDay].length}개)</div>
            {CAL_DATA[selDay].map((q,i)=>(
              <div key={i} style={{ padding:"8px 0", borderBottom: i<CAL_DATA[selDay].length-1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ fontSize:"12px", fontWeight:"600", color:C.tx, lineHeight:"1.4", marginBottom:"4px" }}>{q.q}</div>
                <Badge cat={q.cat} />
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav active="calendar" go={go} />
    </>
  );
}

function CategoryScreen({ go }) {
  const [selCat, setSelCat] = useState("커리어/진로");
  const filteredQs = QS.filter(q=>q.cat===selCat);
  return (
    <>
      <div style={s.topbar}>
        <div style={{ fontSize:"16px", fontWeight:"700", color:C.tx }}>카테고리</div>
      </div>
      <div style={s.scrollArea}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"8px", marginBottom:"10px" }}>
          {CATS.map(c=>(
            <div key={c.name} onClick={()=>setSelCat(c.name)} style={{ background:C.white, border:`${selCat===c.name?"2px":"1px"} solid ${selCat===c.name?c.color:C.border}`, borderRadius:"12px", padding:"12px", cursor:"pointer", transition:"border-color 0.1s" }}>
              <span style={{ fontSize:"20px", display:"block", marginBottom:"6px" }}>{c.icon}</span>
              <div style={{ fontSize:"12px", fontWeight:"700", color:C.tx, marginBottom:"2px" }}>{c.name}</div>
              <div style={{ fontSize:"10px", color:C.muted }}>{c.cnt}개 질문</div>
              <div style={{ marginTop:"6px", height:"3px", background:C.bg, borderRadius:"100px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${c.pct}%`, background:c.color, borderRadius:"100px" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <div style={{ ...s.sectionLabel, display:"flex", justifyContent:"space-between" }}>
            <span>{selCat}</span>
            <span style={{ color:C.acc }}>{CATS.find(c=>c.name===selCat)?.cnt}개</span>
          </div>
          {filteredQs.length > 0 ? filteredQs.map((q,i)=>(
            <div key={i} style={{ padding:"8px 0", borderBottom: i<filteredQs.length-1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize:"12px", fontWeight:"600", color:C.tx, lineHeight:"1.4", marginBottom:"3px" }}>{q.q}</div>
              <div style={{ fontSize:"11px", color:C.muted, lineHeight:"1.5" }}>{q.a}</div>
              <div style={{ display:"flex", gap:"5px", marginTop:"5px" }}>
                <SrcBadge src={q.src} />
                <span style={{ fontSize:"10px", color:C.hint }}>{q.date}</span>
              </div>
            </div>
          )) : (
            <div style={{ fontSize:"12px", color:C.hint, textAlign:"center", padding:"16px 0" }}>아직 질문이 없어요</div>
          )}
        </div>
      </div>
      <BottomNav active="category" go={go} />
    </>
  );
}

function MypageScreen({ go }) {
  return (
    <>
      <div style={s.topbar}>
        <div style={{ fontSize:"16px", fontWeight:"700", color:C.tx }}>마이페이지</div>
      </div>
      <div style={s.scrollArea}>
        <div style={{ ...s.card, textAlign:"center", marginBottom:"10px" }}>
          <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:C.acc2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", fontWeight:"700", color:C.acc3, margin:"0 auto 8px", position:"relative" }}>
            김
            <div style={{ position:"absolute", bottom:"-1px", right:"-1px", width:"16px", height:"16px", background:C.acc, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:"white" }}>✏️</div>
          </div>
          <div style={{ fontSize:"14px", fontWeight:"700", color:C.tx }}>김지수</div>
          <div style={{ fontSize:"11px", color:C.muted, marginTop:"2px" }}>jisu@email.com</div>
          <div onClick={()=>go("account")} style={{ fontSize:"11px", color:C.acc, marginTop:"6px", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:"3px" }}>계정 관리 →</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0, marginTop:"12px", paddingTop:"12px", borderTop:`1px solid ${C.border}` }}>
            {[["142","총 질문"],["23","활동일"],["3","AI 툴"]].map(([n,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"16px", fontWeight:"700", color:C.tx }}>{n}</div>
                <div style={{ fontSize:"9px", color:C.hint, marginTop:"1px" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div onClick={()=>go("persona")} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"12px", cursor:"pointer", display:"flex", alignItems:"flex-start", gap:"10px", marginBottom:"8px" }}>
          <span style={{ fontSize:"24px", flexShrink:0 }}>🔍</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:"13px", fontWeight:"700", color:C.tx, marginBottom:"3px" }}>나는 어떤 사람?</div>
            <div style={{ fontSize:"11px", color:C.muted, lineHeight:"1.5" }}>탐구하는 질문자 · 커리어, 개발에 관심</div>
            <div style={{ display:"flex", gap:"4px", marginTop:"5px" }}>
              {["호기심 주도형","야간 집중형"].map(t=><span key={t} style={{ fontSize:"9px", padding:"2px 7px", borderRadius:"100px", background:C.acc2, color:C.acc3, fontWeight:"500" }}>{t}</span>)}
            </div>
          </div>
          <span style={{ color:C.hint, fontSize:"14px", flexShrink:0, marginTop:"2px" }}>›</span>
        </div>

        <div onClick={()=>go("retro")} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"12px", cursor:"pointer", marginBottom:"10px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"4px" }}>
            <span style={{ fontSize:"10px", color:C.hint, textTransform:"uppercase", letterSpacing:"0.4px", fontWeight:"700" }}>May 2025</span>
            <span style={{ fontSize:"14px", color:C.hint }}>›</span>
          </div>
          <div style={{ fontSize:"13px", fontWeight:"700", color:C.tx, marginBottom:"5px" }}>취업 준비로 가득 찬 한 달이었어요</div>
          <div style={{ fontSize:"11px", color:C.muted, lineHeight:"1.5" }}>가장 많이 물어본 주제는 취업 준비였어요. 5월 중순부터 자기소개서와 면접 관련 질문이 급격히 늘었어요.</div>
          <div style={{ display:"flex", gap:0, marginTop:"10px", paddingTop:"10px", borderTop:`1px solid ${C.border}` }}>
            {[["142","총 질문"],["23","활동일"],["21","최다 질문"]].map(([n,l])=>(
              <div key={l} style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:"14px", fontWeight:"700", color:C.tx }}>{n}</div>
                <div style={{ fontSize:"9px", color:C.hint }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"4px 12px", marginBottom:0 }}>
          {[{icon:"🔔",label:"알림 설정"},{icon:"🛡️",label:"개인정보 처리방침"},{icon:"📋",label:"이용약관"},{icon:"ℹ️",label:"앱 정보"}].map((row,i,arr)=>(
            <div key={row.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontSize:"16px" }}>{row.icon}</span>
                <span style={{ fontSize:"13px", color:C.tx, fontWeight:"500" }}>{row.label}</span>
              </div>
              <span style={{ fontSize:"14px", color:C.hint }}>›</span>
            </div>
          ))}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderTop:`1px solid ${C.border}`, cursor:"pointer" }} onClick={()=>go("login")}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"16px" }}>🚪</span>
              <span style={{ fontSize:"13px", fontWeight:"500", color:"#d45d79" }}>로그아웃</span>
            </div>
            <span style={{ fontSize:"14px", color:C.hint }}>›</span>
          </div>
        </div>
      </div>
      <BottomNav active="mypage" go={go} />
    </>
  );
}

function PersonaScreen({ go }) {
  return (
    <>
      <BackHeader title="나는 어떤 사람?" onBack={()=>go("mypage")} />
      <div style={s.scrollArea}>
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"20px", textAlign:"center", marginBottom:"10px" }}>
          <div style={{ fontSize:"40px", marginBottom:"8px" }}>🔍</div>
          <div style={{ fontSize:"16px", fontWeight:"700", color:C.tx, marginBottom:"6px" }}>탐구하는 질문자</div>
          <div style={{ fontSize:"12px", color:C.muted, lineHeight:"1.7" }}>실행보다 이해를 먼저 찾는 사람이에요. 질문의 61%가 원리나 이유를 묻는 형태이고, 하나의 답에 만족하지 않고 더 깊이 파고드는 경향이 있어요.</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"5px", justifyContent:"center", marginTop:"10px" }}>
            {["호기심 주도형","원리 탐구","야간 집중형","멀티 AI 유저"].map(t=>(
              <span key={t} style={{ fontSize:"11px", padding:"3px 10px", borderRadius:"100px", background:C.acc2, color:C.acc3, fontWeight:"500" }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionLabel}>관심 분야 Top 3</div>
          {[["커리어",34,C.career],["개발",28,C.dev],["철학",18,C.emotion]].map(([n,p,c])=>(
            <BarRow key={n} label={n} pct={p} color={c} />
          ))}
        </div>

        <div style={s.card}>
          <div style={s.sectionLabel}>질문 스타일</div>
          {[["원리 탐구",61,C.career],["방법 요청",27,C.dev],["비교 분석",12,C.study]].map(([n,p,c])=>(
            <BarRow key={n} label={n} pct={p} color={c} />
          ))}
        </div>

        <div style={s.card}>
          <div style={s.sectionLabel}>최근 변화</div>
          <p style={{ fontSize:"12px", color:C.muted, lineHeight:"1.7" }}>감정/고민 관련 질문이 <b style={{ color:C.tx }}>지난달보다 40% 증가</b>했어요. 무언가 고민이 많았던 달이었던 것 같아요.</p>
        </div>

        <div style={{ ...s.card, marginBottom:0 }}>
          <div style={s.sectionLabel}>활동 패턴</div>
          <p style={{ fontSize:"12px", color:C.muted, lineHeight:"1.7" }}>주로 <b style={{ color:C.tx }}>밤 10시~자정</b>에 가장 많이 질문해요. 평일이 주말보다 2.3배 더 활발해요.</p>
        </div>
      </div>
      <BottomNav active="mypage" go={go} />
    </>
  );
}

function RetroScreen({ go }) {
  const tl = [
    { w:"1주차 (5/1~5/7)",   t:"개발 공부", d:"React 상태관리, Node.js 비동기 관련 질문이 많았어요." },
    { w:"2주차 (5/8~5/14)",  t:"커리어 고민", d:"'취업 vs 대학원'에 대한 질문이 반복됐어요." },
    { w:"3주차 (5/15~5/21)", t:"자기소개서", d:"지원 동기와 강점 작성 질문이 집중됐어요." },
    { w:"4주차 (5/22~5/31)", t:"면접 준비", d:"기술 면접 예상 질문과 포트폴리오 구성에 대해 많이 물었어요." },
  ];
  return (
    <>
      <BackHeader title="월간 회고" onBack={()=>go("mypage")} extra={<span style={{ fontSize:"11px", background:C.acc2, color:C.acc3, padding:"3px 10px", borderRadius:"100px", fontWeight:"700", marginLeft:"auto" }}>5월</span>} />
      <div style={s.scrollArea}>
        <div style={{ ...s.statGrid, marginBottom:"10px" }}>
          {[["142","총 질문"],["23","활동일"],["21","최다 질문"]].map(([n,l])=>(
            <div key={l} style={s.statItem}>
              <div style={s.statNum}>{n}</div>
              <div style={s.statLbl}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px", marginBottom:"10px" }}>
          <div style={{ fontSize:"10px", color:C.hint, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"4px" }}>2025년 5월 회고</div>
          <div style={{ fontSize:"14px", fontWeight:"700", color:C.tx, marginBottom:"8px" }}>취업 준비로 가득 찬 한 달이었어요</div>
          <div style={{ fontSize:"12px", color:C.muted, lineHeight:"1.7" }}>가장 많이 물어본 주제는 <b style={{ color:C.tx }}>취업 준비</b>였어요. 5월 중순부터 자기소개서와 면접 관련 질문이 급격히 늘었어요.</div>
          <div style={{ background:C.acc2, borderLeft:`3px solid ${C.acc}`, borderRadius:"0 8px 8px 0", padding:"8px 12px", margin:"10px 0", fontSize:"12px", color:C.acc3, fontWeight:"500" }}>
            5월 14일에 질문이 21개로 가장 많았어요. 이날 무슨 일이 있었나요?
          </div>
          <div style={{ fontSize:"12px", color:C.muted, lineHeight:"1.7" }}>Claude 사용 비율이 <b style={{ color:C.tx }}>지난달보다 12% 늘었어요.</b> 긴 글 피드백이나 감정 고민 상담에 Claude를 더 자주 찾은 것 같아요.</div>
        </div>

        <div style={{ ...s.card, marginBottom:0 }}>
          <div style={{ ...s.sectionLabel, marginBottom:"12px" }}>이달의 질문 흐름</div>
          <div style={{ paddingLeft:"14px", borderLeft:`2px solid ${C.border}` }}>
            {tl.map((item,i)=>(
              <div key={i} style={{ paddingBottom: i<tl.length-1 ? "12px" : 0, paddingLeft:"14px", position:"relative" }}>
                <div style={{ position:"absolute", left:"-6px", top:"4px", width:"9px", height:"9px", borderRadius:"50%", background:C.acc2, border:`2px solid ${C.acc}` }} />
                <div style={{ fontSize:"10px", color:C.hint, marginBottom:"2px", fontWeight:"700" }}>{item.w}</div>
                <div style={{ fontSize:"12px", color:C.muted, lineHeight:"1.5" }}><b style={{ color:C.tx }}>{item.t}</b> {item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav active="mypage" go={go} />
    </>
  );
}

function AccountScreen({ go }) {
  return (
    <>
      <BackHeader title="계정 관리" onBack={()=>go("mypage")} />
      <div style={{ ...s.scrollArea, background:C.white }}>
        <div style={{ textAlign:"center", marginBottom:"20px" }}>
          <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:C.acc2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", fontWeight:"700", color:C.acc3, margin:"0 auto 8px" }}>김</div>
          <div style={{ fontSize:"14px", fontWeight:"700", color:C.tx }}>김지수</div>
          <div style={{ fontSize:"12px", color:C.muted, marginTop:"2px" }}>jisu@email.com</div>
        </div>
        <div style={s.sectionLabel}>정보 수정</div>
        <InputLabel>이름</InputLabel>
        <input style={s.inputField} defaultValue="김지수" />
        <InputLabel>이메일</InputLabel>
        <input style={s.inputField} defaultValue="jisu@email.com" type="email" />
        <button style={{ ...s.authBtn, marginBottom:"20px" }}>저장하기</button>
        <div style={s.sectionLabel}>비밀번호 변경</div>
        <InputLabel>현재 비밀번호</InputLabel>
        <input style={s.inputField} placeholder="현재 비밀번호" type="password" />
        <InputLabel>새 비밀번호</InputLabel>
        <input style={s.inputField} placeholder="8자 이상" type="password" />
        <InputLabel>새 비밀번호 확인</InputLabel>
        <input style={s.inputField} placeholder="비밀번호 재입력" type="password" />
        <button style={{ ...s.authBtn, marginBottom:"20px" }}>변경하기</button>
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"4px 12px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"16px" }}>🗑️</span>
              <span style={{ fontSize:"13px", fontWeight:"500", color:"#991b1b" }}>회원 탈퇴</span>
            </div>
            <span style={{ fontSize:"14px", color:C.hint }}>›</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── MAIN ─────────────────────────────────────────────

const SCREEN_TABS = [
  { id:"home", label:"홈" },
  { id:"login", label:"로그인" },
  { id:"register", label:"회원가입" },
  { id:"add", label:"질문 추가" },
  { id:"calendar", label:"캘린더" },
  { id:"category", label:"카테고리" },
  { id:"mypage", label:"마이페이지" },
  { id:"account", label:"계정 관리" },
  { id:"persona", label:"성향 분석" },
  { id:"retro", label:"월간 회고" },
];

export default function FlowApp() {
  const [screen, setScreen] = useState("home");

  const go = (s) => setScreen(s);

  const renderScreen = () => {
    switch(screen) {
      case "home":     return <HomeScreen go={go} />;
      case "login":    return <LoginScreen go={go} />;
      case "register": return <RegisterScreen go={go} />;
      case "add":      return <AddScreen go={go} />;
      case "calendar": return <CalendarScreen go={go} />;
      case "category": return <CategoryScreen go={go} />;
      case "mypage":   return <MypageScreen go={go} />;
      case "account":  return <AccountScreen go={go} />;
      case "persona":  return <PersonaScreen go={go} />;
      case "retro":    return <RetroScreen go={go} />;
      default:         return <HomeScreen go={go} />;
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#e8e4dc", display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 16px 40px", fontFamily:"'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        input:focus, textarea:focus { border-color: #2d6a4f !important; outline: none; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .screen-fade { animation: fadeIn 0.18s ease; }
      `}</style>

      {/* 화면 선택 탭 */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", justifyContent:"center", marginBottom:"20px", maxWidth:"700px" }}>
        {SCREEN_TABS.map(t=>(
          <button key={t.id} onClick={()=>setScreen(t.id)} style={{ padding:"6px 14px", borderRadius:"100px", fontSize:"12px", fontFamily:"'Noto Sans KR',sans-serif", cursor:"pointer", border:`1px solid ${screen===t.id ? C.acc : C.border2}`, background:screen===t.id ? C.acc : C.white, color:screen===t.id ? "#fff" : C.muted, fontWeight:"500", transition:"all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 폰 프레임 */}
      <div style={s.outer}>
        <div style={s.notch}><div style={s.notchPill} /></div>
        <div style={s.screen}>
          <div key={screen} className="screen-fade" style={{ display:"contents" }}>
            {renderScreen()}
          </div>
        </div>
        <div style={s.homeBar}><div style={s.homeBarPill} /></div>
      </div>
    </div>
  );
}
