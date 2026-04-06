import React, { useState, useEffect, useRef } from "react";

// ─── Fonts ───
const fl = document.createElement("link");
fl.href = "https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Shippori+Mincho:wght@400;600;800&display=swap";
fl.rel = "stylesheet";
if (!document.querySelector(`link[href="${fl.href}"]`)) document.head.appendChild(fl);

// ─── Tokens ───
const T = {
  ink: "#1B2620", inkSoft: "#3D4F45", inkMuted: "#7E9389", inkFaint: "#B5C7BE",
  cream: "#F4F9F6", parchment: "#E8F0EC", cardSolid: "#FFFFFF",
  glass: "rgba(244,249,246,0.6)", glassBorder: "rgba(255,255,255,0.4)",
  accent: "#3A8F7A", accentDark: "#2B7464", accentSoft: "#D6EDE6", accentGlow: "rgba(58,143,122,0.14)",
  safe: "#4A9B7F", safeBg: "#E8F5EE", caution: "#C49032", cautionBg: "#FFF5E0",
  danger: "#C05050", dangerBg: "#FCEAEA",
  serif: "'Shippori Mincho', serif", sans: "'Zen Kaku Gothic New', sans-serif",
  s1: "0 1px 3px rgba(26,23,20,0.04)", s2: "0 4px 20px rgba(26,23,20,0.06)",
  r1: "12px", r2: "18px", r3: "28px",
};

// ─── Utils ───
function Counter({ to, dur = 900 }) {
  const [v, setV] = useState(0); const ref = useRef();
  useEffect(() => { let s; const step = t => { if(!s)s=t; const p=Math.min((t-s)/dur,1); setV(Math.round(p*p*to)); if(p<1)ref.current=requestAnimationFrame(step); }; ref.current=requestAnimationFrame(step); return()=>cancelAnimationFrame(ref.current); }, [to,dur]);
  return <>{v}</>;
}

function ScoreBar({ score, h = 4 }) {
  const c = score >= 75 ? T.safe : score >= 45 ? T.caution : T.danger;
  return <div style={{width:"100%",height:h,borderRadius:h,background:T.parchment,overflow:"hidden"}}><div style={{width:`${score}%`,height:"100%",borderRadius:h,background:c,transition:"width 0.8s cubic-bezier(0.16,1,0.3,1)"}}/></div>;
}

function Glass({ children, style, ...p }) {
  return <div style={{background:T.glass,backdropFilter:"blur(24px) saturate(1.6)",WebkitBackdropFilter:"blur(24px) saturate(1.6)",border:`1px solid ${T.glassBorder}`,borderRadius:T.r2,boxShadow:T.s2,...style}} {...p}>{children}</div>;
}

// ─── Nav ───
function Nav({ active, onNav }) {
  const tabs=[
    {id:"home",label:"ホーム",ariaLabel:"ホーム画面",paths:["M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z","M9 21V12h6v9"]},
    {id:"scan",label:"撮る",ariaLabel:"コスメを撮影してスキャン",paths:["M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z","M12 13a4 4 0 100-8 4 4 0 000 8z"]},
    {id:"zukan",label:"集める",ariaLabel:"成分図鑑を見る",paths:["M4 19.5A2.5 2.5 0 016.5 17H20","M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"]},
    {id:"deck",label:"組む",ariaLabel:"スキンケアデッキを編集",paths:["M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5z","M19 12l1 2.5 2.5 1-2.5 1L19 19l-1-2.5-2.5-1 2.5-1z"]},
    {id:"my",label:"Myコスメ",ariaLabel:"保存したコスメ一覧",paths:["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 7a4 4 0 100-8 4 4 0 000 8z"]},
  ];
  return (
    <nav role="navigation" aria-label="メインナビゲーション" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(244,249,246,0.88)",backdropFilter:"blur(28px) saturate(1.8)",WebkitBackdropFilter:"blur(28px) saturate(1.8)",borderTop:"1px solid rgba(181,199,190,0.3)",zIndex:200,paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div style={{display:"flex",height:58}}>
        {tabs.map(t => {
          const on = active === t.id;
          return (
            <button key={t.id} onClick={() => onNav(t.id)} aria-label={t.ariaLabel} aria-current={on ? "page" : undefined} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",WebkitTapHighlightColor:"transparent",padding:0}}>
              <div style={{width:32,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,background:on?T.accentGlow:"transparent",transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",transform:on?"scale(1.15) translateY(-1px)":"scale(1)"}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={on?T.accent:T.inkMuted} strokeWidth={on?2.2:1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {t.paths.map((d, i) => <path key={i} d={d} />)}
                </svg>
              </div>
              <span style={{fontSize:9,fontWeight:on?700:400,fontFamily:T.sans,color:on?T.accent:T.inkMuted,letterSpacing:"0.02em",transition:"all 0.2s"}}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════
// HOME — Real data: 93 ingredients, 23 products, 29 scans
// ═══════════════════════════════════════
function Home({ onOpenSettings }) {
  const [checkedSteps, setCheckedSteps] = useState(new Set());
  const [particles, setParticles] = useState([]);
  const [absorbedCats, setAbsorbedCats] = useState({ "保湿": 0, "鎮静": 0, "修復": 0, "美白": 0, "UV防御": 0, "エイジング": 0 });
  const avatarRef = useRef(null);

  const morningSteps = [
    { name: "Neuropep 8 Reset Ampoule", brand: "DOPAMY", type: "美容液", ingredients: [
      { name: "ナイアシンアミド", icon: "✨", cat: "美白" }, { name: "パンテノール", icon: "💧", cat: "修復" }, { name: "レチノール", icon: "🔬", cat: "エイジング" },
    ]},
    { name: "Lifting Cream", brand: "PROBIODERM", type: "クリーム", ingredients: [
      { name: "グリセリン", icon: "💧", cat: "保湿" }, { name: "銅トリペプチド-1", icon: "🔬", cat: "エイジング" },
    ]},
    { name: "Glutathione ToneUp Cream", brand: "OxygenCeuticals", type: "クリーム", ingredients: [
      { name: "グルタチオン", icon: "✨", cat: "美白" }, { name: "ヒアルロン酸Na", icon: "💧", cat: "保湿" },
    ]},
    { name: "HEARTLEAF 77+ TONER", brand: "anua", type: "化粧水", ingredients: [
      { name: "ツボクサエキス", icon: "🌿", cat: "鎮静" }, { name: "パンテノール", icon: "💧", cat: "修復" }, { name: "ヒアルロン酸Na", icon: "💧", cat: "保湿" },
    ]},
    { name: "Water Barrier Sun Cream", brand: "P.CALM", type: "日焼け止め", ingredients: [
      { name: "酸化チタン", icon: "🛡️", cat: "UV防御" }, { name: "ヒアルロン酸Na", icon: "💧", cat: "保湿" },
    ]},
    { name: "PDRN 100 MASK", brand: "ANUA", type: "マスク", ingredients: [
      { name: "パンテノール", icon: "💧", cat: "修復" }, { name: "グルタチオン", icon: "✨", cat: "美白" },
    ]},
  ];

  const allCats = ["保湿", "鎮静", "修復", "美白", "UV防御", "エイジング"];
  const catIcons = { "保湿": "💧", "鎮静": "🌿", "修復": "🩹", "美白": "✨", "UV防御": "🛡️", "エイジング": "🔬" };

  const toggleStep = (i) => {
    const wasChecked = checkedSteps.has(i);
    setCheckedSteps(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

    if (!wasChecked) {
      // Spawn particles from button position toward avatar
      const step = morningSteps[i];
      const baseY = 330 + i * 56; // approximate button y position
      const newParticles = step.ingredients.map((ing, j) => ({
        id: Date.now() + j + Math.random() * 1000,
        icon: ing.icon,
        name: ing.name,
        x: 40 + Math.random() * 120,
        y: baseY,
        delay: j * 200,
      }));
      setParticles(prev => [...prev, ...newParticles]);

      // Update category gauge
      setAbsorbedCats(prev => {
        const next = { ...prev };
        step.ingredients.forEach(ing => { next[ing.cat] = Math.min(100, (next[ing.cat] || 0) + 33); });
        return next;
      });

      // Remove particles after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1500);
    } else {
      // Unchecking: reduce gauge
      const step = morningSteps[i];
      setAbsorbedCats(prev => {
        const next = { ...prev };
        step.ingredients.forEach(ing => { next[ing.cat] = Math.max(0, (next[ing.cat] || 0) - 33); });
        return next;
      });
    }
  };

  const tips = [
    { icon: "💡", text: "パンテノール（ビタミンB5）は保湿と修復の両方を担う万能成分。朝晩どちらでも効果的です。" },
    { icon: "🌿", text: "ツボクサエキス（CICA）は★3のレア成分。韓国では「鎮静の王様」と呼ばれています。" },
    { icon: "🔬", text: "ヒアルロン酸Naは1gで6Lの水分を保持。乾燥肌の救世主です。" },
  ];
  const todayTip = tips[new Date().getDate() % tips.length];
  const totalGauge = allCats.reduce((sum, c) => sum + absorbedCats[c], 0) / (allCats.length * 100) * 100;

  return (
    <div style={{padding:"16px 20px 100px", position: "relative", overflow: "hidden"}}>
      {/* Particle layer */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: p.x, top: p.y, zIndex: 50,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          animation: "particleFly 1.3s cubic-bezier(0.16,1,0.3,1) forwards",
          animationDelay: p.delay + "ms", opacity: 0,
          pointerEvents: "none",
        }}>
          <span style={{ fontSize: 20, filter: "drop-shadow(0 0 6px rgba(58,143,122,0.5))" }}>{p.icon}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: T.accent, fontFamily: T.sans, background: "rgba(255,255,255,0.95)", borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>{p.name}</span>
        </div>
      ))}

      <style>{`
        @keyframes particleFly {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          25% { opacity: 1; transform: translate(30px, -60px) scale(0.85); }
          60% { opacity: 0.7; transform: translate(120px, -200px) scale(0.45); }
          85% { opacity: 0.4; transform: translate(180px, -280px) scale(0.2); }
          100% { opacity: 0; transform: translate(200px, -300px) scale(0); }
        }
        @keyframes avatarAbsorb {
          0% { transform: scale(1); box-shadow: 0 6px 20px rgba(58,143,122,0.15); }
          40% { transform: scale(1.15); box-shadow: 0 0 24px rgba(58,143,122,0.5); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); box-shadow: 0 6px 20px rgba(58,143,122,0.15); }
        }
        @keyframes gaugeGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(58,143,122,0); }
          50% { box-shadow: 0 0 12px 2px rgba(58,143,122,0.3); }
        }
        @keyframes gaugeBarFill {
          0% { transform: scaleX(0.8); opacity: 0.7; }
          50% { transform: scaleX(1.05); }
          100% { transform: scaleX(1); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <p style={{fontSize:12,color:T.inkMuted,fontFamily:T.sans,margin:"0 0 4px",letterSpacing:"0.12em",textTransform:"uppercase"}}>Good evening</p>
          <h1 style={{fontSize:28,fontWeight:800,fontFamily:T.serif,color:T.ink,margin:0,lineHeight:1.2,letterSpacing:"-0.02em"}}>成分から、<br/>美しさを選ぶ。</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onOpenSettings} aria-label="設定を開く" style={{ width: 36, height: 36, borderRadius: 10, background: T.parchment, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.2s" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.inkMuted} strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
          {/* Avatar — particle absorption target */}
          <div ref={avatarRef} style={{
            width:44,height:44,borderRadius:14,
            background:`linear-gradient(145deg,${T.accent},${T.accentDark})`,
            display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",
            fontSize:15,fontWeight:700,fontFamily:T.sans,
            boxShadow: particles.length > 0 ? `0 0 24px rgba(58,143,122,0.5), 0 0 48px rgba(58,143,122,0.2)` : `0 6px 20px ${T.accentGlow}`,
            animation: particles.length > 0 ? "avatarAbsorb 0.8s ease" : "none",
            transition: "box-shadow 0.4s",
            position: "relative",
          }}>
            こ
            {particles.length > 0 && (
              <div style={{
                position: "absolute", inset: -4, borderRadius: 18,
                border: "2px solid rgba(58,143,122,0.4)",
                animation: "avatarAbsorb 1s ease infinite",
                pointerEvents: "none",
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Category absorption gauge */}
      <div style={{
        marginBottom: 20, padding: "14px 16px", borderRadius: T.r2,
        background: T.cardSolid, border: "1px solid " + T.parchment, boxShadow: T.s1,
        animation: totalGauge > 0 ? "gaugeGlow 2s ease infinite" : "none",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>今日の成分シールド</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: totalGauge >= 80 ? T.safe : T.accent, fontFamily: T.serif }}>{Math.round(totalGauge)}%</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {allCats.map(cat => {
            const val = absorbedCats[cat];
            return (
              <div key={cat} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, marginBottom: 3 }}>{catIcons[cat]}</div>
                <div style={{ height: 3, borderRadius: 1.5, background: T.parchment, overflow: "hidden", marginBottom: 2 }}>
                  <div style={{ height: "100%", borderRadius: 1.5, background: val > 0 ? T.accent : "transparent", width: val + "%", transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
                </div>
                <div style={{ fontSize: 8, color: val > 0 ? T.accent : T.inkFaint, fontFamily: T.sans, fontWeight: val > 0 ? 700 : 400 }}>{cat}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Routine Checklist */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:15,fontWeight:700,fontFamily:T.sans,color:T.ink,margin:0}}>☀️ 朝ルーティン</h2>
          <span style={{fontSize:12,fontWeight:900,fontFamily:T.serif,color:checkedSteps.size===morningSteps.length?T.safe:T.accent}}>
            {checkedSteps.size}/{morningSteps.length}
          </span>
        </div>
        <div style={{height:4,borderRadius:2,background:T.parchment,marginBottom:14,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:2,background:checkedSteps.size===morningSteps.length?"linear-gradient(90deg, "+T.safe+", #6BC4A0)":"linear-gradient(90deg, "+T.accent+", #7DD3C8)",width:(checkedSteps.size/morningSteps.length*100)+"%",transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {morningSteps.map((step, i) => {
            const done = checkedSteps.has(i);
            return (
              <button key={i} onClick={() => toggleStep(i)} aria-label={step.name + (done ? "（完了）" : "")} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                background:done ? T.accentSoft : T.cardSolid,
                borderRadius:T.r1, border:"1px solid "+(done?T.accent:T.parchment),
                boxShadow:T.s1, cursor:"pointer", textAlign:"left",
                transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                transform:done?"scale(0.98)":"scale(1)", position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  width:22,height:22,borderRadius:6,flexShrink:0,
                  background:done?T.accent:T.cardSolid,
                  border:done?"none":"1.5px solid "+T.inkFaint,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  transform:done?"scale(1.1)":"scale(1)",
                }}>
                  {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <div style={{width:18,height:18,borderRadius:5,background:done?"rgba(255,255,255,0.6)":T.parchment,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,fontFamily:T.serif,color:done?"#fff":T.inkMuted,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:done?600:700,color:done?T.inkMuted:T.ink,fontFamily:T.sans,textDecoration:done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{step.name}</div>
                  <div style={{fontSize:9,color:T.inkMuted,fontFamily:T.sans,marginTop:1}}>{step.brand} · {step.type}</div>
                </div>
                {/* Ingredient mini-icons */}
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  {step.ingredients.map((ing, j) => (
                    <span key={j} style={{ fontSize: 10, opacity: done ? 0.4 : 0.7, transition: "opacity 0.3s" }}>{ing.icon}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        {checkedSteps.size === morningSteps.length && (
          <div style={{marginTop:12,padding:"14px 16px",borderRadius:T.r1,background:"linear-gradient(135deg, "+T.accentSoft+", #E0F5EE)",textAlign:"center",animation:"fadeUp 0.4s ease"}}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>🎉🛡️</div>
            <span style={{fontSize:12,fontWeight:700,color:T.accent,fontFamily:T.sans}}>今日の成分シールド完成！お疲れさまです</span>
          </div>
        )}
      </div>

      {/* Scan CTA */}
      <div style={{position:"relative",borderRadius:T.r3,overflow:"hidden",marginBottom:24,cursor:"pointer",background:`linear-gradient(135deg,${T.accentSoft} 0%,#EAF5F0 50%,${T.parchment} 100%)`,border:"1px solid rgba(58,143,122,0.15)",boxShadow:"0 8px 32px rgba(58,143,122,0.08)"}}>
        <div style={{position:"absolute",top:-30,right:-10,width:120,height:120,borderRadius:"50%",background:"radial-gradient(circle,rgba(58,143,122,0.1) 0%,transparent 70%)"}}/>
        <div style={{position:"relative",padding:"20px 20px",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:46,height:46,borderRadius:14,background:"rgba(255,255,255,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:T.s1}}>📸</div>
            <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:T.ink,fontFamily:T.sans,marginBottom:2}}>成分をスキャン</div><div style={{fontSize:11,color:T.inkMuted,fontFamily:T.sans}}>パッケージを撮影 → AI が成分を検索</div></div>
            <div style={{width:34,height:34,borderRadius:11,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(58,143,122,0.25)"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        {[{n:93,label:"成分コレクト",icon:"📖"},{n:23,label:"Myコスメ",icon:"📦"},{n:3,label:"連続日数",icon:"🔥"}].map((s,i)=>
          <Glass key={i} style={{padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:13,marginBottom:3}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:900,fontFamily:T.serif,color:T.accent,lineHeight:1}}><Counter to={s.n}/></div>
            <div style={{fontSize:9,color:T.inkMuted,fontFamily:T.sans,marginTop:3}}>{s.label}</div>
          </Glass>
        )}
      </div>

      {/* #3 Today's Ingredient Tip */}
      <div style={{padding:"16px 18px",borderRadius:T.r2,background:T.cardSolid,border:"1px solid "+T.parchment,boxShadow:T.s1,marginBottom:24}}>
        <div style={{display:"flex",gap:12}}>
          <span style={{fontSize:20,flexShrink:0}}>{todayTip.icon}</span>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:T.accent,fontFamily:T.sans,marginBottom:4}}>今日の成分メモ</div>
            <p style={{fontSize:11,color:T.inkSoft,fontFamily:T.sans,lineHeight:1.8,margin:0}}>{todayTip.text}</p>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}><h2 style={{fontSize:15,fontWeight:700,fontFamily:T.sans,color:T.ink,margin:0}}>最近のスキャン</h2><span style={{fontSize:11,color:T.inkMuted,fontFamily:T.sans,cursor:"pointer"}}>すべて →</span></div>
        <div style={{display:"flex",gap:12,overflowX:"auto",scrollbarWidth:"none",margin:"0 -20px",padding:"0 20px 4px",scrollSnapType:"x mandatory"}}>
          {[{name:"HEARTLEAF 77+ SOOTHING TONER",brand:"anua",badge:"化粧水"},{name:"SKIN PROTECT ELIXIER ESSENCE",brand:"Beautegem",badge:"美容液"},{name:"AHA.BHA.PHA MIRACLE CREAM",brand:"SOMEBYMI",badge:"クリーム"}].map((item,i)=>
            <div key={i} style={{minWidth:180,scrollSnapAlign:"start",background:T.cardSolid,borderRadius:T.r2,padding:"16px 14px",boxShadow:T.s1,border:`1px solid ${T.parchment}`,cursor:"pointer",flexShrink:0,transition:"transform 0.2s",}}>
              <div style={{fontSize:10,fontWeight:700,fontFamily:T.sans,color:T.accent,background:T.accentSoft,padding:"3px 8px",borderRadius:6,display:"inline-block",marginBottom:8}}>{item.badge}</div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink,fontFamily:T.sans,marginBottom:3,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.name}</div>
              <div style={{fontSize:10,color:T.inkMuted,fontFamily:T.sans}}>{item.brand}</div>
            </div>
          )}
        </div>
      </div>

      {/* Top ingredients */}
      <div>
        <h2 style={{fontSize:15,fontWeight:700,fontFamily:T.sans,color:T.ink,margin:"0 0 12px"}}>よく出会う成分</h2>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[{name:"パンテノール",cat:"保湿・修復",icon:"💧",rarity:1},{name:"ヒアルロン酸Na",cat:"保湿",icon:"💧",rarity:1},{name:"グリセリン",cat:"保湿",icon:"💧",rarity:1},{name:"ベタイン",cat:"保湿・浸透圧調整",icon:"🌿",rarity:1}].map((ing,i)=>
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:T.cardSolid,borderRadius:T.r1,boxShadow:T.s1,border:`1px solid ${T.parchment}`,cursor:"pointer",transition:"transform 0.15s"}}>
              <div style={{width:36,height:36,borderRadius:10,background:T.parchment,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ing.icon}</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:T.ink,fontFamily:T.sans}}>{ing.name}</div><div style={{fontSize:10,color:T.inkMuted,fontFamily:T.sans,marginTop:1}}>{ing.cat}</div></div>
              <span style={{fontSize:10,color:"#D4A853",letterSpacing:0.5}} aria-label={"レアリティ"+ing.rarity}>{"★".repeat(ing.rarity)}{"☆".repeat(5-ing.rarity)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCAN — Full 4-step flow
// ═══════════════════════════════════════
function ScanResult() {
  const [step, setStep] = useState(1);
  const [exp, setExp] = useState(null);
  const [productName, setProductName] = useState("HEARTLEAF 77+ HYALURON SOOTHING TONER");
  const [brand, setBrand] = useState("anua");
  const [productType, setProductType] = useState("toner");

  const steps = [
    { label: "撮影", icon: "📷" },
    { label: "特定", icon: "🔍" },
    { label: "分類", icon: "🏷️" },
    { label: "結果", icon: "✨" },
  ];

  const typeOptions = [
    { key: "toner", label: "化粧水", icon: "💦" },
    { key: "serum", label: "美容液", icon: "💧" },
    { key: "cream", label: "クリーム", icon: "🧴" },
    { key: "mask_pack", label: "マスク", icon: "🎭" },
    { key: "sunscreen", label: "日焼け止め", icon: "☀️" },
    { key: "other", label: "その他", icon: "📦" },
  ];

  const ingredients = [
    { name: "ホウテイアエキス", cat: "植物エキス", rarity: 2, desc: "ドクダミ科の植物由来。鎮静・抗炎症作用があり、肌荒れケアに使用されます。" },
    { name: "グリセリン", cat: "保湿", rarity: 1, desc: "代表的な保湿剤。水分を引き寄せて保持し、肌をしっとりさせます。" },
    { name: "ベタイン", cat: "保湿", rarity: 1, desc: "アミノ酸系保湿成分。浸透圧調整作用があり、肌にうるおいを与えます。" },
    { name: "パンテノール", cat: "修復", rarity: 1, desc: "ビタミンB5誘導体。肌のバリア修復を助け、荒れた肌を整えます。" },
    { name: "ツボクサエキス", cat: "鎮静", rarity: 3, desc: "CICA成分として知られる。肌の修復・鎮静を促進します。", isNew: true },
    { name: "ヒアルロン酸Na", cat: "保湿", rarity: 1, desc: "高い水分保持力を持つ保湿成分。肌表面にうるおいの膜を形成します。" },
    { name: "エデト酸二ナトリウム", cat: "キレート", rarity: 2, desc: "金属イオンを捕捉するキレート剤。製品の安定性を保つために配合されます。" },
  ];

  return (
    <div style={{ padding: "16px 20px 100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: T.ink, fontFamily: T.sans, margin: 0 }}>成分スキャン</h1>
        {step > 1 && (
          <button onClick={() => setStep(1)} style={{ fontSize: 12, color: T.accent, background: T.accentSoft, border: "none", borderRadius: 20, padding: "5px 14px", fontWeight: 600, fontFamily: T.sans, cursor: "pointer" }}>最初から</button>
        )}
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, padding: "0 8px" }}>
        {steps.map((s, i) => {
          const num = i + 1;
          const done = num < step;
          const active = num === step;
          return (
            <React.Fragment key={i}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 44 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: active ? "linear-gradient(135deg, " + T.accent + ", #7DD3C8)" : done ? T.accent : T.parchment,
                  color: active || done ? "#fff" : T.inkFaint,
                  boxShadow: active ? "0 2px 8px " + T.accentGlow : "none",
                  transition: "all 0.3s",
                }}>{done ? "✓" : s.icon}</div>
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: active ? T.accent : done ? T.accent : T.inkFaint, fontFamily: T.sans }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: "0 6px", marginBottom: 18, borderRadius: 1, background: done ? T.accent : active ? "linear-gradient(90deg, " + T.accent + ", " + T.parchment + ")" : T.parchment }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ─── Step 1: 撮影 ─── */}
      {step === 1 && (
        <div style={{ animation: "fadeUp 0.35s ease" }}>
          {/* Camera capture area */}
          <button onClick={() => setStep(2)} style={{
            width: "100%", height: 200, borderRadius: T.r3, border: "none",
            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
            cursor: "pointer", marginBottom: 16,
            boxShadow: "inset 0 0 0 1px rgba(58,143,122,0.2), 0 4px 24px rgba(58,143,122,0.08)",
          }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: "linear-gradient(135deg, " + T.accentSoft + ", #D4F5EF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📸</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>タップしてコスメを撮影</div>
              <div style={{ fontSize: 12, color: T.inkMuted, fontFamily: T.sans, marginTop: 4 }}>パッケージ正面を撮影してください</div>
            </div>
          </button>

          {/* Manual input option */}
          <button style={{
            width: "100%", padding: "16px 18px", borderRadius: T.r2, background: T.cardSolid,
            border: "1.5px solid rgba(58,143,122,0.15)", textAlign: "left", cursor: "pointer", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📋</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>成分リストを直接入力</div>
                <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans, marginTop: 2 }}>スキャン回数を消費しません</div>
              </div>
              <span style={{ color: T.inkFaint, fontSize: 16 }}>›</span>
            </div>
          </button>

          {/* Tips */}
          <div style={{ padding: "14px 16px", borderRadius: T.r1, background: T.accentSoft, border: "1px solid rgba(58,143,122,0.1)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, fontFamily: T.sans, marginBottom: 6 }}>💡 撮影のコツ</div>
            <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: T.sans, lineHeight: 1.8 }}>
              パッケージ正面を明るい場所で撮影。商品名・ブランド名が読める距離で、ブレないようしっかり固定。
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 2: 解析中 ─── */}
      {step === 2 && (
        <div style={{ animation: "fadeUp 0.35s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 32 }}>
          {/* Preview image */}
          <div style={{ width: 120, height: 120, borderRadius: 20, overflow: "hidden", boxShadow: T.s2 }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, " + T.accentSoft + ", " + T.parchment + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📦</div>
          </div>

          {/* Ripple animation */}
          <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 40, border: "2px solid rgba(58,143,122,0.3)", animation: "fadeUp 2s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 8, borderRadius: 32, border: "2px solid rgba(58,143,122,0.2)", animation: "fadeUp 2s ease-in-out infinite 0.4s" }} />
            <span style={{ fontSize: 24, position: "relative", zIndex: 1 }}>✨</span>
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", maxWidth: 240 }}>
            <div style={{ height: 6, borderRadius: 3, background: T.parchment, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, width: "65%", background: "linear-gradient(90deg, " + T.accent + ", #7DD3C8)", transition: "width 0.7s" }} />
            </div>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: T.accent, fontFamily: T.sans }}>ネットで成分情報を検索中...</p>

          {/* Auto-advance for demo */}
          <button onClick={() => setStep(3)} style={{ fontSize: 11, color: T.inkMuted, background: T.parchment, border: "none", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontFamily: T.sans }}>（デモ: 次へ進む）</button>
        </div>
      )}

      {/* ─── Step 3: 製品情報の確認 ─── */}
      {step === 3 && (
        <div style={{ animation: "fadeUp 0.35s ease" }}>
          {/* Product info card */}
          <div style={{ background: T.cardSolid, borderRadius: T.r2, border: "1px solid " + T.parchment, boxShadow: T.s1, padding: "18px", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: 14, overflow: "hidden", background: T.parchment, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: T.inkMuted, fontFamily: T.sans, marginBottom: 2 }}>コスメ名</div>
                  <input type="text" value={productName} onChange={e => setProductName(e.target.value)} style={{ width: "100%", fontSize: 13, fontWeight: 700, fontFamily: T.sans, color: T.ink, border: "none", borderBottom: "1.5px solid " + T.parchment, paddingBottom: 4, outline: "none", background: "transparent" }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.inkMuted, fontFamily: T.sans, marginBottom: 2 }}>ブランド</div>
                  <input type="text" value={brand} onChange={e => setBrand(e.target.value)} style={{ width: "100%", fontSize: 12, fontFamily: T.sans, color: T.ink, border: "none", borderBottom: "1.5px solid " + T.parchment, paddingBottom: 4, outline: "none", background: "transparent" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Product type selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 10 }}>コスメタイプを選択</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {typeOptions.map(t => {
                const on = productType === t.key;
                return (
                  <button key={t.key} onClick={() => setProductType(t.key)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, border: "none",
                    background: on ? T.accent : T.cardSolid, color: on ? "#fff" : T.inkMuted,
                    fontSize: 11, fontWeight: 600, fontFamily: T.sans, cursor: "pointer",
                    boxShadow: on ? "0 2px 8px " + T.accentGlow : T.s1,
                  }}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={() => setStep(4)} style={{
            width: "100%", padding: "14px 0", borderRadius: T.r1, border: "none",
            background: T.accent, color: "#fff", fontSize: 13, fontWeight: 700,
            fontFamily: T.sans, cursor: "pointer", boxShadow: "0 4px 16px " + T.accentGlow,
          }}>成分を確認する →</button>
        </div>
      )}

      {/* ─── Step 4: 結果 ─── */}
      {step === 4 && (
        <div style={{ animation: "fadeUp 0.35s ease" }}>
          {/* Product card */}
          <div style={{ borderRadius: T.r3, overflow: "hidden", marginBottom: 20, background: T.cardSolid, boxShadow: T.s2, border: "1px solid " + T.parchment }}>
            <div style={{ height: 3, background: "linear-gradient(90deg, " + T.accent + ", #5BBFAD, " + T.safe + ")" }} />
            <div style={{ padding: "20px 18px" }}>
              <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>{brand}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, fontFamily: T.serif, lineHeight: 1.35 }}>{productName}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                {["化粧水", "鎮静", "保湿"].map((tag, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 600, color: T.inkSoft, fontFamily: T.sans, background: T.parchment, padding: "3px 10px", borderRadius: 6 }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 10, borderTop: "1px solid " + T.parchment }}>
                <span style={{ fontSize: 11, color: T.accent, fontWeight: 700, fontFamily: T.sans }}>検出 {ingredients.length}種</span>
                <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans }}>未登録 3種</span>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 12 }}>検出成分</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ingredients.map((ing, i) => {
              const open = exp === i;
              return (
                <div key={i} style={{ background: T.cardSolid, borderRadius: T.r1, border: "1px solid " + (ing.isNew ? T.accent : T.parchment), boxShadow: ing.isNew ? "0 2px 12px rgba(58,143,122,0.12)" : T.s1, overflow: "hidden" }}>
                  <div onClick={() => setExp(open ? null : i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>{ing.name}</span>
                        {ing.isNew && <span style={{ fontSize: 8, fontWeight: 800, color: "#fff", background: T.accent, padding: "1px 5px", borderRadius: 3 }}>NEW</span>}
                      </div>
                      <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, marginTop: 2 }}>{ing.cat}</div>
                    </div>
                    <span style={{ fontSize: 11, color: "#D4A853", letterSpacing: 0.5 }}>{"★".repeat(ing.rarity)}{"☆".repeat(5 - ing.rarity)}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                  {open && <div style={{ padding: "0 14px 12px 14px", fontSize: 12, color: T.inkSoft, fontFamily: T.sans, lineHeight: 1.75, animation: "fadeUp 0.25s ease" }}>{ing.desc}</div>}
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <p style={{ fontSize: 9, color: T.inkFaint, fontFamily: T.sans, marginTop: 14, lineHeight: 1.6 }}>
            ※ 解析結果はAIによる参考情報です。すべての成分を正確に解析できることを保証するものではありません。
          </p>

          {/* Save button (fixed-like) */}
          <div style={{ marginTop: 24 }}>
            <button style={{
              width: "100%", padding: "14px 0", borderRadius: T.r1, border: "none",
              background: T.accent, color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: T.sans, cursor: "pointer", boxShadow: "0 4px 16px " + T.accentGlow,
            }}>✨ Myコスメに保存する</button>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════
// ZUKAN — Pokédex-style Skincare Ingredient Collection
// ═══════════════════════════════════════
function Zukan() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showAchievements, setShowAchievements] = useState(false);

  const STORAGE_BASE = "https://krxagbqtpfgqvtfgvvcx.supabase.co/storage/v1/object/public/product-images/";
  const IMG = (id) => "75979d43-4235-4f06-8f8a-53130c5bd899/" + id;

  // Card texture backgrounds per type
  const cardTextures = {
    moisturize: { bg: "linear-gradient(145deg, #E3F4EE 0%, #D4EDE3 50%, #C5E8D8 100%)", pattern: "radial-gradient(ellipse at 30% 60%, rgba(58,143,122,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(58,143,122,0.06) 0%, transparent 40%)", label: "保湿", color: "#3A7D65", emoji: "💧" },
    soothe: { bg: "linear-gradient(145deg, #E8EFE3 0%, #D8E6CF 50%, #C8DEC0 100%)", pattern: "radial-gradient(ellipse at 40% 70%, rgba(90,122,74,0.08) 0%, transparent 50%)", label: "鎮静", color: "#5A7A4A", emoji: "🌿" },
    repair: { bg: "linear-gradient(145deg, #EDE3F0 0%, #E0D4EB 50%, #D5C8E2 100%)", pattern: "radial-gradient(ellipse at 60% 40%, rgba(107,74,138,0.08) 0%, transparent 50%)", label: "修復", color: "#6B4A8A", emoji: "🔬" },
    brighten: { bg: "linear-gradient(145deg, #FFF5E5 0%, #FDECC8 50%, #FBE3B0 100%)", pattern: "radial-gradient(ellipse at 50% 50%, rgba(160,122,48,0.08) 0%, transparent 50%)", label: "美白", color: "#A07A30", emoji: "✨" },
    base: { bg: "linear-gradient(145deg, #FDE8E0 0%, #F5D8CC 50%, #EECABC 100%)", pattern: "radial-gradient(ellipse at 40% 60%, rgba(160,90,64,0.08) 0%, transparent 50%)", label: "基剤", color: "#A05A40", emoji: "🧪" },
  };

  const rarityLabels = ["", "よくある", "めずらしい", "レア", "希少", "伝説"];
  const rarityColors = ["", T.inkMuted, "#6B8E7B", "#D4A853", "#C77DBA", "#E8A04C"];

  // Collector level
  const totalDiscovered = 93;
  const totalAll = 323;
  const levels = [
    { lv: 1, need: 10, title: "新米コレクター", icon: "🌱" },
    { lv: 2, need: 30, title: "見習い調合師", icon: "🧪" },
    { lv: 3, need: 50, title: "成分ハンター", icon: "🔍" },
    { lv: 4, need: 100, title: "上級探索者", icon: "🗺️" },
    { lv: 5, need: 150, title: "マスター調合師", icon: "⚗️" },
    { lv: 6, need: 200, title: "伝説の研究者", icon: "🔬" },
    { lv: 7, need: 323, title: "成分博士", icon: "👑" },
  ];
  const currentLevel = levels.filter(l => totalDiscovered >= l.need).pop() || levels[0];
  const nextLevel = levels.find(l => totalDiscovered < l.need);
  const progressToNext = nextLevel ? ((totalDiscovered - (currentLevel.need || 0)) / (nextLevel.need - (currentLevel.need || 0))) * 100 : 100;

  // Category stats
  const catStats = [
    { id: "moisturize", discovered: 28, total: 85 },
    { id: "soothe", discovered: 12, total: 48 },
    { id: "repair", discovered: 18, total: 62 },
    { id: "brighten", discovered: 8, total: 38 },
    { id: "base", discovered: 27, total: 90 },
  ];

  // All ingredient cards (discovered + locked)
  const allCards = [
    { no: 1, name: "ヒアルロン酸Na", inci: "Sodium Hyaluronate", type: "moisturize", rarity: 1, discovered: true, desc: "1gで6Lの水分を保持できる保湿成分の代名詞。肌表面にうるおいの膜を形成し、乾燥から肌を守ります。", products: [
      { name: "HEARTLEAF 77+ TONER", brand: "anua", img: IMG("1a2a1c55-1dba-43ad-b419-163685f6f2ae.jpg") },
      { name: "MIRACLE CREAM", brand: "SOMEBYMI", img: IMG("9ed6fa46-daf0-4f5c-a17a-e5bc20aa02c1.jpg") },
      { name: "Reset Ampoule", brand: "DOPAMY", img: IMG("90026144-46e1-4493-a03e-b1e6dc1b48e7.jpg") },
    ]},
    { no: 2, name: "グリセリン", inci: "Glycerin", type: "moisturize", rarity: 1, discovered: true, desc: "代表的な保湿剤。水分を引き寄せて保持し、肌をしっとりさせます。ほぼすべてのスキンケア製品に配合される基本成分。", products: [
      { name: "ToneUp Cream", brand: "OxygenCeuticals", img: IMG("c1deded0-d33e-4bec-91cc-ae14d506946e.jpg") },
      { name: "ELIXIER ESSENCE", brand: "Beautegem", img: IMG("c0e2ee43-db94-4b11-8490-b2bd78bba8f3.jpg") },
    ]},
    { no: 3, name: "ベタイン", inci: "Betaine", type: "moisturize", rarity: 1, discovered: true, desc: "アミノ酸系保湿成分。浸透圧調整作用があり、肌にうるおいを与えます。天然由来でビート（砂糖大根）から抽出。" },
    { no: 4, name: "セラミドNP", inci: "Ceramide NP", type: "moisturize", rarity: 3, discovered: true, desc: "肌バリアの主成分。角質層のラメラ構造を形成し、外的刺激から肌を守る重要な脂質成分。" },
    { no: 5, name: null, type: "moisturize", rarity: 2, discovered: false, hint: "韓国コスメの化粧水に多く含まれる天然アミノ酸系保湿成分" },
    { no: 6, name: null, type: "moisturize", rarity: 4, discovered: false, hint: "海洋由来の希少な保湿成分。高級美容液に配合されることが多い" },
    { no: 10, name: "パンテノール", inci: "Panthenol", type: "repair", rarity: 1, discovered: true, isNew: true, desc: "ビタミンB5誘導体。肌のバリア修復を助け、荒れた肌を整えます。保湿と修復の両方を担う万能成分。", products: [
      { name: "HEARTLEAF 77+ TONER", brand: "anua", img: IMG("1a2a1c55-1dba-43ad-b419-163685f6f2ae.jpg") },
      { name: "ELIXIER ESSENCE", brand: "Beautegem", img: IMG("c0e2ee43-db94-4b11-8490-b2bd78bba8f3.jpg") },
    ]},
    { no: 11, name: "レチノール", inci: "Retinol", type: "repair", rarity: 4, discovered: true, desc: "ビタミンA誘導体。ターンオーバーを促進し、シワ・たるみに対応する高機能成分。使用には注意が必要。", products: [
      { name: "Reset Ampoule", brand: "DOPAMY", img: IMG("90026144-46e1-4493-a03e-b1e6dc1b48e7.jpg") },
    ]},
    { no: 12, name: "銅トリペプチド-1", inci: "Copper Tripeptide-1", type: "repair", rarity: 5, discovered: true, desc: "超希少ペプチド成分。コラーゲン合成を促進し、肌のハリ・弾力を内側から支える。研究論文多数の注目成分。", products: [
      { name: "Lifting Cream", brand: "PROBIODERM", img: IMG("a2b9d044-f5d4-4610-9a78-49a2936611fd.jpg") },
    ]},
    { no: 13, name: null, type: "repair", rarity: 3, discovered: false, hint: "EGF系の成長因子。クリニック向け美容液に配合される" },
    { no: 20, name: "ツボクサエキス", inci: "Centella Asiatica Extract", type: "soothe", rarity: 3, discovered: true, isNew: true, desc: "CICA成分として有名。韓国では「鎮静の王様」と呼ばれ、肌の修復・鎮静を促進します。", products: [
      { name: "1st Control Serum", brand: "ACNI Dr.", img: IMG("8735a245-36d2-4e5a-af2d-47db3f3707f1.jpg") },
    ]},
    { no: 21, name: "ローズマリーエキス", inci: "Rosmarinus Officinalis Extract", type: "soothe", rarity: 3, discovered: true, desc: "抗酸化・抗菌作用を持つ植物エキス。製品の安定性向上にも寄与する優秀な植物成分。" },
    { no: 22, name: null, type: "soothe", rarity: 4, discovered: false, hint: "古代エジプトから使われてきた鎮静ハーブ。青い精油が特徴" },
    { no: 30, name: "ナイアシンアミド", inci: "Niacinamide", type: "brighten", rarity: 2, discovered: true, desc: "ビタミンB3誘導体。美白効果に加え、毛穴ケア・バリア強化など多機能な万能成分。" },
    { no: 31, name: "グルタチオン", inci: "Glutathione", type: "brighten", rarity: 3, discovered: true, desc: "抗酸化トリペプチド。メラニン生成を抑制し、透明感を引き出す注目成分。" },
    { no: 32, name: null, type: "brighten", rarity: 5, discovered: false, hint: "ノーベル賞受賞者が発見した美白成分。点滴でも使われる" },
    { no: 40, name: "カルボマー", inci: "Carbomer", type: "base", rarity: 1, discovered: true, desc: "ジェル状のテクスチャーを作る増粘剤。製品の使用感を向上させる縁の下の力持ち。" },
    { no: 41, name: "エチルヘキシルグリセリン", inci: "Ethylhexylglycerin", type: "base", rarity: 2, discovered: true, desc: "防腐補助剤・保湿剤。パラベンの代替として使われることが多い。多機能な安定化成分。" },
  ];

  const filtered = filter === "all" ? allCards : allCards.filter(c => c.type === filter);

  // Achievements
  const achievements = [
    { name: "はじめの一歩", desc: "初めて成分を発見した", icon: "🌱", done: true },
    { name: "10種コレクト", desc: "成分を10種集めた", icon: "📗", done: true },
    { name: "50種コレクト", desc: "成分を50種集めた", icon: "📙", done: true },
    { name: "★3ハンター", desc: "★3以上を5種発見", icon: "⭐", done: true },
    { name: "★4ハンター", desc: "★4以上を3種発見", icon: "🌟", done: false, progress: "1/3" },
    { name: "伝説の出会い", desc: "★5の成分を発見", icon: "💎", done: true },
    { name: "全タイプ発見", desc: "5タイプすべてで成分を発見", icon: "🗺️", done: true },
    { name: "成分博士", desc: "323種すべて発見", icon: "🏆", done: false },
  ];
  const doneCount = achievements.filter(a => a.done).length;

  // ─── Full-screen Card Detail ───
  if (selectedCard) {
    const card = selectedCard;
    const tex = cardTextures[card.type];
    const cardIdx = filtered.indexOf(card);
    const prevCard = cardIdx > 0 ? filtered[cardIdx - 1] : null;
    const nextCard = cardIdx < filtered.length - 1 ? filtered[cardIdx + 1] : null;

    if (!card.discovered) {
      return (
        <div style={{ padding: "16px 20px 100px", animation: "fadeUp 0.35s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <button onClick={() => { setSelectedCard(null); }} style={{ display: "flex", alignItems: "center", gap: 6, background: T.parchment, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: T.inkSoft, fontFamily: T.sans, fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.inkSoft} strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              戻る
            </button>
            <span style={{ fontSize: 12, color: T.inkMuted, fontFamily: T.sans }}>#{String(card.no).padStart(3, "0")} / {totalAll}</span>
          </div>
          {/* Locked card visual */}
          <div style={{ borderRadius: 24, overflow: "hidden", marginBottom: 24, position: "relative", aspectRatio: "3/4", background: T.parchment, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed " + T.inkFaint }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🔒</div>
            <div style={{ fontSize: 12, color: "#D4A853", letterSpacing: 1, marginBottom: 4 }}>{"★".repeat(card.rarity)}{"☆".repeat(5 - card.rarity)}</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: rarityColors[card.rarity], fontFamily: T.sans }}>{rarityLabels[card.rarity]}</span>
            <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, color: tex.color, background: tex.bg, padding: "3px 10px", borderRadius: 6, fontWeight: 700, fontFamily: T.sans }}>{tex.emoji} {tex.label}</div>
          </div>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: T.serif, color: T.inkMuted }}>？？？？？</div>
          </div>
          <div style={{ padding: "16px 18px", borderRadius: T.r2, background: T.cardSolid, border: "1px solid " + T.parchment, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, fontFamily: T.sans, marginBottom: 6 }}>💡 ヒント</div>
            <p style={{ fontSize: 12, color: T.inkSoft, fontFamily: T.sans, lineHeight: 1.8, margin: 0 }}>{card.hint}</p>
          </div>
          <button style={{ width: "100%", padding: "14px 0", borderRadius: T.r1, border: "none", background: T.accent, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: T.sans, cursor: "pointer", boxShadow: "0 4px 16px " + T.accentGlow }}>📸 コスメをスキャンして探す</button>
        </div>
      );
    }

    // Discovered card detail
    return (
      <div style={{ padding: "16px 20px 100px", animation: "fadeUp 0.35s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button onClick={() => { setSelectedCard(null); }} style={{ display: "flex", alignItems: "center", gap: 6, background: T.parchment, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: T.inkSoft, fontFamily: T.sans, fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.inkSoft} strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            戻る
          </button>
          <span style={{ fontSize: 12, color: T.inkMuted, fontFamily: T.sans }}>#{String(card.no).padStart(3, "0")} / {totalAll}</span>
        </div>

        {/* Card visual */}
        <div style={{
          borderRadius: 24, overflow: "hidden", marginBottom: 24, position: "relative",
          aspectRatio: "3/4", background: tex.bg,
          boxShadow: card.rarity >= 4 ? "0 8px 32px " + rarityColors[card.rarity] + "30" : T.s2,
        }}>
          {/* Texture pattern */}
          <div style={{ position: "absolute", inset: 0, background: tex.pattern, opacity: 0.5 }} />
          {/* Card border glow for rare */}
          {card.rarity >= 4 && <div style={{ position: "absolute", inset: 0, borderRadius: 24, border: "2px solid " + rarityColors[card.rarity] + "40" }} />}
          {/* Content */}
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 16, filter: card.rarity >= 4 ? "drop-shadow(0 0 12px " + rarityColors[card.rarity] + "80)" : "none" }}>{tex.emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: T.serif, color: T.ink, textAlign: "center", marginBottom: 4 }}>{card.name}</div>
            <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, letterSpacing: "0.05em", marginBottom: 12 }}>{card.inci}</div>
            <div style={{ fontSize: 14, color: "#D4A853", letterSpacing: 1.5, marginBottom: 4 }}>{"★".repeat(card.rarity)}{"☆".repeat(5 - card.rarity)}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: rarityColors[card.rarity], fontFamily: T.sans }}>{rarityLabels[card.rarity]}</span>
          </div>
          {/* Type badge */}
          <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: tex.color, fontFamily: T.sans }}>{tex.emoji} {tex.label}</div>
          {/* Number */}
          <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 900, color: T.ink, fontFamily: T.serif }}>#{String(card.no).padStart(3, "0")}</div>
          {/* NEW badge */}
          {card.isNew && <div style={{ position: "absolute", bottom: 16, left: 16, background: T.accent, color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 800, fontFamily: T.sans }}>NEW</div>}
        </div>

        {/* Description */}
        <div style={{ padding: "18px", borderRadius: T.r2, background: T.cardSolid, border: "1px solid " + T.parchment, boxShadow: T.s1, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: T.inkSoft, fontFamily: T.sans, lineHeight: 1.9, margin: 0 }}>{card.desc}</p>
        </div>

        {/* Products containing this ingredient */}
        {card.products && card.products.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 10 }}>この成分を含むMyコスメ</div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none" }}>
              {card.products.map((p, i) => (
                <div key={i} style={{ minWidth: 90, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ width: 90, height: 90, borderRadius: 12, overflow: "hidden", background: T.parchment, marginBottom: 4 }}>
                    <img src={STORAGE_BASE + p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.ink, fontFamily: T.sans, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 8, color: T.inkMuted, fontFamily: T.sans }}>{p.brand}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prev / Next navigation */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => prevCard && setSelectedCard(prevCard)} disabled={!prevCard} style={{ flex: 1, padding: "12px 0", borderRadius: T.r1, border: "1px solid " + T.parchment, background: T.cardSolid, color: prevCard ? T.ink : T.inkFaint, fontSize: 11, fontWeight: 600, fontFamily: T.sans, cursor: prevCard ? "pointer" : "default", opacity: prevCard ? 1 : 0.4 }}>← 前の成分</button>
          <button onClick={() => nextCard && setSelectedCard(nextCard)} disabled={!nextCard} style={{ flex: 1, padding: "12px 0", borderRadius: T.r1, border: "1px solid " + T.parchment, background: T.cardSolid, color: nextCard ? T.ink : T.inkFaint, fontSize: 11, fontWeight: 600, fontFamily: T.sans, cursor: nextCard ? "pointer" : "default", opacity: nextCard ? 1 : 0.4 }}>次の成分 →</button>
        </div>
      </div>
    );
  }

  // ─── Achievements View ───
  if (showAchievements) {
    return (
      <div style={{ padding: "16px 20px 100px", animation: "fadeUp 0.35s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => { setShowAchievements(false); }} style={{ display: "flex", alignItems: "center", gap: 6, background: T.parchment, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: T.inkSoft, fontFamily: T.sans, fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.inkSoft} strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            戻る
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: T.serif, color: T.ink, margin: 0 }}>🏆 実績</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {achievements.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: a.done ? T.accentSoft : T.cardSolid, borderRadius: T.r1, border: "1px solid " + (a.done ? T.accent + "40" : T.parchment), opacity: a.done ? 1 : 0.5, animation: "fadeUp 0.3s ease forwards", animationDelay: i * 50 + "ms" }}>
              <span style={{ fontSize: 24, filter: a.done ? "none" : "grayscale(1)" }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: a.done ? T.ink : T.inkMuted, fontFamily: T.sans }}>{a.name}</div>
                <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans }}>{a.desc}</div>
              </div>
              {a.done ? <span style={{ fontSize: 10, fontWeight: 700, color: T.accent }}>✓</span> : a.progress ? <span style={{ fontSize: 10, color: T.inkMuted }}>{a.progress}</span> : <span style={{ fontSize: 10 }}>🔒</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Main: Mini Card Grid ───
  return (
    <div style={{ padding: "16px 20px 100px" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: T.serif, color: T.ink, margin: "0 0 4px" }}>成分図鑑</h1>
        <p style={{ fontSize: 12, color: T.inkMuted, fontFamily: T.sans, margin: 0 }}>{totalDiscovered} / {totalAll} 種コレクト</p>
      </div>

      {/* Collector Level */}
      <div style={{ borderRadius: T.r2, padding: "16px", marginBottom: 14, background: "linear-gradient(135deg, " + T.accentSoft + " 0%, " + T.parchment + " 100%)", border: "1px solid rgba(58,143,122,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{currentLevel.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: T.serif, color: T.ink }}>Lv.{currentLevel.lv} {currentLevel.title}</div>
            {nextLevel && <div style={{ fontSize: 9, color: T.inkMuted, fontFamily: T.sans }}>次: Lv.{nextLevel.lv} まであと{nextLevel.need - totalDiscovered}種</div>}
          </div>
          <button onClick={() => setShowAchievements(true)} style={{ padding: "5px 10px", borderRadius: 8, background: T.cardSolid, border: "1px solid " + T.parchment, fontSize: 10, fontWeight: 700, color: T.inkSoft, fontFamily: T.sans, cursor: "pointer" }}>🏆 {doneCount}/{achievements.length}</button>
        </div>
        {nextLevel && (
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.5)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: T.accent, width: Math.round(progressToNext) + "%", transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
          </div>
        )}
      </div>

      {/* Category progress pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", scrollbarWidth: "none", padding: "0 0 4px" }}>
        <button onClick={() => setFilter("all")} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: filter === "all" ? T.ink : T.cardSolid, color: filter === "all" ? "#fff" : T.inkMuted, fontSize: 10, fontWeight: 600, fontFamily: T.sans, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>すべて</button>
        {catStats.map(cs => {
          const tex = cardTextures[cs.id];
          const on = filter === cs.id;
          return (
            <button key={cs.id} onClick={() => setFilter(cs.id)} style={{ padding: "6px 12px", borderRadius: 20, border: "none", background: on ? tex.color : T.cardSolid, color: on ? "#fff" : T.inkMuted, fontSize: 10, fontWeight: 600, fontFamily: T.sans, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
              {tex.emoji} {tex.label} <span style={{ fontSize: 9, opacity: 0.8 }}>{cs.discovered}/{cs.total}</span>
            </button>
          );
        })}
      </div>

      {/* Mini Card Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {filtered.map((card, i) => {
          const tex = cardTextures[card.type];
          return (
            <div key={card.no} onClick={() => setSelectedCard(card)} style={{
              aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", cursor: "pointer",
              background: card.discovered ? tex.bg : T.parchment,
              border: card.discovered ? "1.5px solid " + tex.color + "20" : "1.5px dashed " + T.inkFaint,
              boxShadow: card.rarity >= 4 && card.discovered ? "0 4px 16px " + rarityColors[card.rarity] + "25" : T.s1,
              position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "8px 4px",
              opacity: 0, animation: "fadeUp 0.35s ease forwards", animationDelay: i * 40 + "ms",
              transition: "transform 0.2s", 
            }}>
              {card.discovered ? (
                <>
                  {/* Number */}
                  <div style={{ position: "absolute", top: 6, left: 7, fontSize: 8, fontWeight: 900, color: tex.color, fontFamily: T.serif, opacity: 0.5 }}>#{String(card.no).padStart(3, "0")}</div>
                  {/* NEW dot */}
                  {card.isNew && <div style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, borderRadius: 4, background: T.accent }} />}
                  {/* Icon */}
                  <div style={{ fontSize: 24, filter: card.rarity >= 4 ? "drop-shadow(0 0 6px " + rarityColors[card.rarity] + "60)" : "none" }}>{tex.emoji}</div>
                  {/* Name */}
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.ink, fontFamily: T.sans, textAlign: "center", lineHeight: 1.3, maxWidth: "90%", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{card.name}</div>
                  {/* Stars */}
                  <div style={{ fontSize: 7, color: "#D4A853", letterSpacing: 0.5 }}>{"★".repeat(card.rarity)}{"☆".repeat(5 - card.rarity)}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, opacity: 0.25 }}>🔒</div>
                  <div style={{ fontSize: 7, color: "#D4A853", letterSpacing: 0.5 }}>{"★".repeat(card.rarity)}{"☆".repeat(5 - card.rarity)}</div>
                  <div style={{ fontSize: 8, color: T.inkFaint, fontFamily: T.sans }}>#{String(card.no).padStart(3, "0")}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════
// DECK — Hand-style + coverage bar + analysis sheet
// ═══════════════════════════════════════
function Deck() {
  const [viewMode, setViewMode] = useState("hand");
  const [activeRoutine, setActiveRoutine] = useState("morning");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editItems, setEditItems] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const typeLabels = { cream: "クリーム", serum: "美容液", mask_pack: "マスク", toner: "化粧水", sunscreen: "日焼け止め" };
  const STORAGE_BASE = "https://krxagbqtpfgqvtfgvvcx.supabase.co/storage/v1/object/public/product-images/";

  const morningDeck = [
    { order: 0, name: "Neuropep 8 Reset Ampoule Serum", brand: "DOPAMY", type: "serum", img: "75979d43-4235-4f06-8f8a-53130c5bd899/90026144-46e1-4493-a03e-b1e6dc1b48e7.jpg", cats: ["修復", "エイジング"], ingredients: [
      { name: "ナイアシンアミド", rarity: 2 }, { name: "パンテノール", rarity: 1 }, { name: "レチノール", rarity: 4 }, { name: "セラミドNP", rarity: 3 },
    ]},
    { order: 1, name: "Lifting Cream", brand: "PROBIODERM", type: "cream", img: "75979d43-4235-4f06-8f8a-53130c5bd899/a2b9d044-f5d4-4610-9a78-49a2936611fd.jpg", cats: ["保湿", "エイジング"], ingredients: [
      { name: "グリセリン", rarity: 1 }, { name: "パンテノール", rarity: 1 }, { name: "銅トリペプチド-1", rarity: 5 }, { name: "ベタイン", rarity: 1 },
    ]},
    { order: 3, name: "Glutathione ToneUp Cream", brand: "OxygenCeuticals", type: "cream", img: "75979d43-4235-4f06-8f8a-53130c5bd899/c1deded0-d33e-4bec-91cc-ae14d506946e.jpg", cats: ["美白", "保湿"], ingredients: [
      { name: "グルタチオン", rarity: 3 }, { name: "ヒアルロン酸Na", rarity: 1 }, { name: "パンテノール", rarity: 1 },
    ]},
    { order: 5, name: "HEARTLEAF 77+ SOOTHING TONER", brand: "anua", type: "toner", img: "75979d43-4235-4f06-8f8a-53130c5bd899/1a2a1c55-1dba-43ad-b419-163685f6f2ae.jpg", cats: ["鎮静", "保湿"], ingredients: [
      { name: "ヒアルロン酸Na", rarity: 1 }, { name: "ベタイン", rarity: 1 }, { name: "パンテノール", rarity: 1 }, { name: "ツボクサエキス", rarity: 3 },
    ]},
    { order: 6, name: "Water Barrier Sun Cream", brand: "P.CALM", type: "sunscreen", img: "75979d43-4235-4f06-8f8a-53130c5bd899/ce334b9d-8abf-4174-8d00-45d1fdad9673.jpg", cats: ["UV防御", "保湿"], ingredients: [
      { name: "酸化チタン", rarity: 2 }, { name: "ヒアルロン酸Na", rarity: 1 },
    ]},
    { order: 7, name: "PDRN 100 CAPSULE SERUM MASK", brand: "ANUA", type: "mask_pack", img: "75979d43-4235-4f06-8f8a-53130c5bd899/6b451419-f141-42c3-9a91-233f5ca2c82a.jpg", cats: ["保湿", "修復"], ingredients: [
      { name: "グリセリン", rarity: 1 }, { name: "パンテノール", rarity: 1 }, { name: "アセチル化ヒアルロン酸", rarity: 3 }, { name: "グルタチオン", rarity: 3 },
    ]},
  ];

  const currentDeck = activeRoutine === "morning" ? morningDeck : [];
  const allCategories = ["保湿", "美白", "鎮静", "エイジング", "UV防御", "修復"];
  const coveredCats = [...new Set(currentDeck.flatMap(d => d.cats))];
  const coveragePercent = currentDeck.length > 0 ? Math.round((coveredCats.length / allCategories.length) * 100) : 0;

  const synergies = [
    { combo: "パンテノール × ヒアルロン酸Na", effect: "バリア修復 + 水分保持の二段構え", strength: "◎" },
    { combo: "ナイアシンアミド × CICA", effect: "美白しながら鎮静。刺激を抑えた透明感ケア", strength: "◎" },
    { combo: "グリセリン × セラミド", effect: "水分補給 + バリア強化の基本コンビ", strength: "○" },
  ];

  return (
    <div style={{ padding: "16px 20px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: T.serif, color: T.ink, margin: "0 0 4px" }}>マイデッキ</h1>
          <p style={{ fontSize: 12, color: T.inkMuted, fontFamily: T.sans, margin: 0 }}>スキンケアルーティンを管理</p>
        </div>
        <div style={{ display: "flex", background: T.parchment, borderRadius: 10, padding: 3, gap: 2 }}>
          <button onClick={() => setViewMode("hand")} style={{ width: 32, height: 28, borderRadius: 8, border: "none", background: viewMode === "hand" ? T.cardSolid : "transparent", color: viewMode === "hand" ? T.ink : T.inkFaint, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: viewMode === "hand" ? T.s1 : "none", fontSize: 14 }}>🃏</button>
          <button onClick={() => setViewMode("list")} style={{ width: 32, height: 28, borderRadius: 8, border: "none", background: viewMode === "list" ? T.cardSolid : "transparent", color: viewMode === "list" ? T.ink : T.inkFaint, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: viewMode === "list" ? T.s1 : "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="3.5" cy="18" r="1.5"/></svg>
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[{ id: "morning", label: "☀️ 朝ルーティン" }, { id: "night", label: "🌙 夜ルーティン" }].map(r => (
          <button key={r.id} onClick={() => { setActiveRoutine(r.id); setShowAnalysis(false); }} style={{ flex: 1, padding: "12px 0", borderRadius: T.r1, border: "none", background: activeRoutine === r.id ? T.accent : T.cardSolid, color: activeRoutine === r.id ? "#fff" : T.inkMuted, fontSize: 13, fontWeight: 700, fontFamily: T.sans, cursor: "pointer", boxShadow: activeRoutine === r.id ? "0 4px 16px " + T.accentGlow : T.s1 }}>{r.label}</button>
        ))}
      </div>

      {currentDeck.length > 0 && (
        <div>
          {/* Layer 1: Coverage mini bar */}
          <Glass style={{ padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, fontFamily: T.sans }}>{activeRoutine === "morning" ? "朝" : "夜"}ルーティン</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: T.accent, fontFamily: T.serif }}>{currentDeck.length}ステップ</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans }}>カテゴリカバー率</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: coveragePercent >= 80 ? T.safe : T.caution, fontFamily: T.serif }}>{coveragePercent}%</span>
            </div>
            <ScoreBar score={coveragePercent} h={5} />
            <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
              {allCategories.map(cat => {
                const covered = coveredCats.includes(cat);
                return (
                  <span key={cat} style={{ fontSize: 9, fontWeight: 600, fontFamily: T.sans, padding: "2px 8px", borderRadius: 4, background: covered ? T.accentSoft : T.parchment, color: covered ? T.accent : T.inkFaint }}>{covered ? "✓ " : ""}{cat}</span>
                );
              })}
            </div>
          </Glass>

          {/* Hand view */}
          {viewMode === "hand" && (
            <div>
              <div style={{ display: "flex", gap: 14, overflowX: "auto", scrollbarWidth: "none", margin: "0 -20px", padding: "20px 20px 30px", scrollSnapType: "x mandatory" }}>
                {currentDeck.map((item, i) => {
                  const rotation = (i - (currentDeck.length - 1) / 2) * 3;
                  const translateY = Math.abs(i - (currentDeck.length - 1) / 2) * 6;
                  return (
                    <div key={i} onClick={() => setSelectedCard({...item, stepNum: i + 1})} style={{ minWidth: 150, maxWidth: 150, flexShrink: 0, scrollSnapAlign: "center", transform: "rotate(" + rotation + "deg) translateY(" + translateY + "px)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", cursor: "pointer", opacity: 0, animation: "fadeUp 0.5s ease forwards", animationDelay: i * 80 + "ms" }}>
                      <div style={{ borderRadius: 20, overflow: "hidden", background: T.cardSolid, border: "1.5px solid " + T.parchment, boxShadow: "0 8px 24px rgba(27,38,32,0.1), 0 2px 6px rgba(27,38,32,0.06)" }}>
                        <div style={{ position: "relative" }}>
                          <div style={{ aspectRatio: "3/4", background: T.parchment, overflow: "hidden" }}>
                            <img src={STORAGE_BASE + item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = "none"; }} />
                          </div>
                          <div style={{ position: "absolute", top: 8, left: 8, width: 26, height: 26, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 900, fontFamily: T.serif, boxShadow: "0 2px 8px rgba(58,143,122,0.3)" }}>{i + 1}</div>
                          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: T.inkSoft, fontFamily: T.sans }}>{typeLabels[item.type]}</div>
                        </div>
                        <div style={{ padding: "10px 12px 14px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.ink, fontFamily: T.sans, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 4 }}>{item.name}</div>
                          <div style={{ fontSize: 9, color: T.inkMuted, fontFamily: T.sans }}>{item.brand}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: T.inkMuted, fontFamily: T.sans }}>← スワイプして確認 →</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 16 }}>
                {currentDeck.map((_, i) => (
                  <React.Fragment key={i}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontFamily: T.serif, fontWeight: 900, color: T.accent }}>{i + 1}</div>
                    {i < currentDeck.length - 1 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* List view */}
          {viewMode === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentDeck.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.cardSolid, borderRadius: T.r1, border: "1px solid " + T.parchment, boxShadow: T.s1, opacity: 0, animation: "fadeUp 0.35s ease forwards", animationDelay: i * 60 + "ms" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 900, fontFamily: T.serif, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", background: T.parchment, flexShrink: 0 }}>
                    <img src={STORAGE_BASE + item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: T.sans, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans }}>{item.brand}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: T.inkMuted, background: T.parchment, padding: "1px 7px", borderRadius: 4 }}>{typeLabels[item.type]}</span>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" /></svg>
                </div>
              ))}
            </div>
          )}

          {/* Edit deck button */}
          <button onClick={() => { setEditItems([...currentDeck]); setEditMode(true); }} style={{
            width: "100%", marginTop: 24, padding: "14px 0", borderRadius: T.r1,
            border: "1.5px solid " + T.accent, background: T.cardSolid, color: T.accent,
            fontSize: 13, fontWeight: 700, fontFamily: T.sans, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            デッキを編集
          </button>

          {/* Layer 2 trigger */}
          <button onClick={() => setShowAnalysis(!showAnalysis)} style={{ width: "100%", marginTop: 24, padding: "14px 0", borderRadius: T.r1, border: "1.5px solid " + (showAnalysis ? T.accent : T.parchment), background: showAnalysis ? T.accentSoft : T.cardSolid, color: showAnalysis ? T.accent : T.inkSoft, fontSize: 13, fontWeight: 700, fontFamily: T.sans, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.25s" }}>
            <span style={{ fontSize: 16 }}>📊</span>デッキ分析
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: showAnalysis ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }}><path d="M6 9l6 6 6-6" /></svg>
          </button>

          {/* Layer 2: Analysis panel */}
          {showAnalysis && (
            <div style={{ marginTop: 12, animation: "fadeUp 0.35s ease" }}>
              {/* Category breakdown */}
              <div style={{ background: T.cardSolid, borderRadius: T.r2, border: "1px solid " + T.parchment, boxShadow: T.s1, padding: "20px 18px", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 14 }}>カテゴリ別の成分カバー</div>
                {allCategories.map(cat => {
                  const prods = currentDeck.filter(d => d.cats.includes(cat));
                  const covered = prods.length > 0;
                  return (
                    <div key={cat} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: covered ? T.inkSoft : T.inkFaint, fontFamily: T.sans }}>{covered ? "✓" : "✗"} {cat}</span>
                        <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans }}>{covered ? prods.length + "製品" : "未カバー"}</span>
                      </div>
                      <ScoreBar score={covered ? Math.min(prods.length * 35, 100) : 0} h={3} />
                    </div>
                  );
                })}
              </div>

              {/* Synergy */}
              <div style={{ background: T.cardSolid, borderRadius: T.r2, border: "1px solid " + T.parchment, boxShadow: T.s1, padding: "20px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 14 }}>期待できる相乗効果</div>
                {synergies.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: T.cream, borderRadius: T.r1, marginBottom: i < synergies.length - 1 ? 10 : 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: s.strength === "◎" ? T.accentSoft : T.parchment, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: s.strength === "◎" ? T.accent : T.inkMuted, flexShrink: 0 }}>{s.strength}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 3 }}>{s.combo}</div>
                      <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, lineHeight: 1.6 }}>{s.effect}</div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 9, color: T.inkFaint, fontFamily: T.sans, marginTop: 12, lineHeight: 1.6 }}>※ 相乗効果は一般的な成分知識に基づく参考情報です。効果を保証するものではありません。</p>
              </div>
            </div>
          )}
        </div>
      )}

      {currentDeck.length === 0 && (
        <div style={{ marginTop: 20, padding: "40px 18px", borderRadius: T.r2, border: "1.5px dashed " + T.inkFaint, textAlign: "center", background: T.cardSolid }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #F0E8F5, #E8E0F0)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🌙</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 6 }}>夜ルーティンはまだ未設定</div>
          <p style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans, margin: "0 0 16px", lineHeight: 1.7 }}>Myコスメから製品を選んで、<br />夜のスキンケアルーティンを組みましょう。</p>
          <button style={{ padding: "10px 24px", borderRadius: T.r1, border: "none", background: T.accent, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: T.sans, cursor: "pointer", boxShadow: "0 4px 12px " + T.accentGlow }}>
            ＋ 夜ルーティンを作る
          </button>
        </div>
      )}

      {/* ─── Card Detail Overlay (pull-up zoom) ─── */}
      {selectedCard && (
        <div onClick={() => setSelectedCard(null)} style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(27,38,32,0.6)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, animation: "fadeUp 0.3s ease",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "100%", maxWidth: 320, borderRadius: 24,
            background: T.cardSolid, boxShadow: "0 24px 80px rgba(27,38,32,0.25)",
            overflow: "hidden",
            transform: "scale(1)", animation: "fadeUp 0.35s cubic-bezier(0.16,1,0.3,1)",
          }}>
            {/* Product image header */}
            <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
              <img src={STORAGE_BASE + selectedCard.img} alt={selectedCard.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = "none"; }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(27,38,32,0.7) 0%, transparent 50%)" }} />
              {/* Step badge */}
              <div style={{ position: "absolute", top: 14, left: 14, width: 32, height: 32, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 900, fontFamily: T.serif, boxShadow: "0 2px 8px rgba(58,143,122,0.4)" }}>
                {selectedCard.stepNum}
              </div>
              {/* Close button */}
              <button onClick={() => setSelectedCard(null)} style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
              {/* Product info overlay */}
              <div style={{ position: "absolute", bottom: 16, left: 18, right: 18 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: T.sans, letterSpacing: "0.08em", textTransform: "uppercase" }}>{selectedCard.brand}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: T.serif, lineHeight: 1.3, marginTop: 2 }}>{selectedCard.name}</div>
              </div>
            </div>

            {/* Card content */}
            <div style={{ padding: "18px 20px 22px" }}>
              {/* Type + Categories */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, background: T.accentSoft, padding: "3px 10px", borderRadius: 6, fontFamily: T.sans }}>{typeLabels[selectedCard.type]}</span>
                {selectedCard.cats.map((cat, ci) => (
                  <span key={ci} style={{ fontSize: 10, fontWeight: 600, color: T.inkSoft, background: T.parchment, padding: "3px 10px", borderRadius: 6, fontFamily: T.sans }}>{cat}</span>
                ))}
              </div>

              {/* Key ingredients */}
              <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 10 }}>成分ハイライト</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedCard.ingredients.map((ing, ii) => (
                  <div key={ii} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 10, background: T.cream,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.ink, fontFamily: T.sans }}>{ing.name}</span>
                    <span style={{ fontSize: 10, color: "#D4A853", letterSpacing: 0.5 }}>{"★".repeat(ing.rarity)}{"☆".repeat(5 - ing.rarity)}</span>
                  </div>
                ))}
              </div>

              {/* Hint */}
              <p style={{ fontSize: 9, color: T.inkFaint, fontFamily: T.sans, marginTop: 12, textAlign: "center" }}>タップで閉じる</p>
            </div>
          </div>
        </div>
      )}
      {/* ─── Edit Mode Overlay ─── */}
      {editMode && editItems && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: T.cream,
          display: "flex", flexDirection: "column",
          animation: "fadeUp 0.3s ease",
        }}>
          {/* Edit header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid " + T.parchment, background: T.cardSolid }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => { setEditMode(false); setDeleteConfirm(null); }} style={{ fontSize: 13, color: T.inkMuted, background: "none", border: "none", cursor: "pointer", fontFamily: T.sans }}>キャンセル</button>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>デッキ編集</span>
              <button onClick={() => { setEditMode(false); setDeleteConfirm(null); }} style={{ fontSize: 13, fontWeight: 700, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: T.sans }}>完了</button>
            </div>
          </div>

          {/* Edit content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, fontFamily: T.sans, marginBottom: 12 }}>
              {activeRoutine === "morning" ? "☀️ 朝" : "🌙 夜"}ルーティン — {editItems.length}ステップ
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {editItems.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: T.cardSolid, borderRadius: T.r1,
                  border: deleteConfirm === i ? "1.5px solid #E57373" : "1px solid " + T.parchment,
                  boxShadow: T.s1,
                }}>
                  {/* Drag handle */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, cursor: "grab", padding: "4px 2px", flexShrink: 0 }}>
                    <div style={{ width: 14, height: 2, borderRadius: 1, background: T.inkFaint }} />
                    <div style={{ width: 14, height: 2, borderRadius: 1, background: T.inkFaint }} />
                    <div style={{ width: 14, height: 2, borderRadius: 1, background: T.inkFaint }} />
                  </div>

                  {/* Step number */}
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 900, fontFamily: T.serif, flexShrink: 0 }}>{i + 1}</div>

                  {/* Thumbnail */}
                  <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: T.parchment, flexShrink: 0 }}>
                    <img src={STORAGE_BASE + item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: T.sans, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, marginTop: 1 }}>{item.brand}</div>
                  </div>

                  {/* Delete button */}
                  {deleteConfirm === i ? (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setEditItems(editItems.filter((_, idx) => idx !== i)); setDeleteConfirm(null); }} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#E57373", color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: T.sans, cursor: "pointer" }}>削除</button>
                      <button onClick={() => setDeleteConfirm(null)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid " + T.parchment, background: T.cardSolid, color: T.inkMuted, fontSize: 10, fontFamily: T.sans, cursor: "pointer" }}>戻す</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(i)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: T.parchment, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E57373" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add product button */}
            <button style={{
              width: "100%", marginTop: 16, padding: "14px 0", borderRadius: T.r1,
              border: "1.5px dashed " + T.accent, background: T.accentSoft,
              color: T.accent, fontSize: 13, fontWeight: 700, fontFamily: T.sans,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Myコスメから追加
            </button>

            {/* Hint */}
            <p style={{ fontSize: 10, color: T.inkFaint, fontFamily: T.sans, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
              ≡ をドラッグして順番を変更<br />🗑 をタップして削除
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════
// MY PAGE — Real data: 23 products, 3 favorites
// ═══════════════════════════════════════
function MyPage({ onSelectProduct }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [favOnly, setFavOnly] = useState(false);
  const [viewMode, setViewMode] = useState("photo"); // "photo" | "list"

  const typeLabels = { cream: "クリーム", serum: "美容液", mask_pack: "マスク", toner: "化粧水", emulsion: "乳液", sunscreen: "日焼け止め", other: "その他" };
  const typeIcons = { cream: "🧴", serum: "💧", mask_pack: "🎭", toner: "💦", emulsion: "🥛", sunscreen: "☀️", other: "📦" };

  const STORAGE_BASE = "https://krxagbqtpfgqvtfgvvcx.supabase.co/storage/v1/object/public/product-images/";

  const products = [
    { name: "HEARTLEAF 77+ SOOTHING TONER", brand: "anua", type: "toner", fav: true, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/1a2a1c55-1dba-43ad-b419-163685f6f2ae.jpg" },
    { name: "SKIN PROTECT ELIXIER ESSENCE", brand: "Beautegem", type: "serum", fav: true, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/c0e2ee43-db94-4b11-8490-b2bd78bba8f3.jpg" },
    { name: "AHA.BHA.PHA MIRACLE CREAM", brand: "SOMEBYMI", type: "cream", fav: true, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/9ed6fa46-daf0-4f5c-a17a-e5bc20aa02c1.jpg" },
    { name: "Clarifying Mask", brand: "OxygenCeuticals", type: "mask_pack", fav: false, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/08ab4ef1-73eb-415f-9e27-9f0ab058aa29.jpg" },
    { name: "MOISTURE Aqua Serum", brand: "OXYGEN CEUTICALS", type: "serum", fav: false, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/62500aea-31c4-40da-a8ba-5d4b6d5daaf3.jpg" },
    { name: "Glutathione ToneUp Cream", brand: "OxygenCeuticals", type: "cream", fav: false, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/c1deded0-d33e-4bec-91cc-ae14d506946e.jpg" },
    { name: "PDRN 100 CAPSULE SERUM MASK", brand: "ANUA", type: "mask_pack", fav: false, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/6b451419-f141-42c3-9a91-233f5ca2c82a.jpg" },
    { name: "A5 AZULEN SKINBOOSTER MASK", brand: "SHEGAIA", type: "mask_pack", fav: false, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/8ee9f5f6-cd32-43ca-b4d0-a72a074bbc28.jpg" },
    { name: "Neuropep 8 Reset Ampoule", brand: "DOPAMY", type: "serum", fav: false, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/90026144-46e1-4493-a03e-b1e6dc1b48e7.jpg" },
    { name: "ティーツリー カーミングマスク", brand: "MEDIHEAL", type: "mask_pack", fav: false, date: "4/5", img: "75979d43-4235-4f06-8f8a-53130c5bd899/867bc4f4-f84f-49d8-be27-22ac8df03197.jpg" },
    { name: "Alpine Berry Watery Cream", brand: "primera", type: "cream", fav: false, date: "4/4", img: "75979d43-4235-4f06-8f8a-53130c5bd899/80526ca5-4f0b-46ac-9691-3a8e54cbda60.jpg" },
    { name: "Water Barrier Sun Cream", brand: "P.CALM", type: "sunscreen", fav: false, date: "4/4", img: "75979d43-4235-4f06-8f8a-53130c5bd899/ce334b9d-8abf-4174-8d00-45d1fdad9673.jpg" },
  ];

  const filters = ["all", "cream", "serum", "mask_pack", "toner", "sunscreen", "other"];
  const filtered = products.filter(p => activeFilter === "all" || p.type === activeFilter).filter(p => !favOnly || p.fav);

  const getImgUrl = (img) => img.startsWith("http") ? img : STORAGE_BASE + img;

  return (
    <div style={{ padding: "16px 16px 100px" }}>
      {/* Header */}
      <div style={{ padding: "0 4px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: T.serif, color: T.ink, margin: "0 0 4px" }}>Myコスメ</h1>
            <p style={{ fontSize: 12, color: T.inkMuted, fontFamily: T.sans, margin: 0 }}>{products.length}品 スキャン済み</p>
          </div>
          {/* View toggle: Photo / List */}
          <div style={{ display: "flex", background: T.parchment, borderRadius: 10, padding: 3, gap: 2 }}>
            <button onClick={() => setViewMode("photo")} style={{ width: 32, height: 28, borderRadius: 8, border: "none", background: viewMode === "photo" ? T.cardSolid : "transparent", color: viewMode === "photo" ? T.ink : T.inkFaint, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: viewMode === "photo" ? T.s1 : "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </button>
            <button onClick={() => setViewMode("list")} style={{ width: 32, height: 28, borderRadius: 8, border: "none", background: viewMode === "list" ? T.cardSolid : "transparent", color: viewMode === "list" ? T.ink : T.inkFaint, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: viewMode === "list" ? T.s1 : "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="3.5" cy="18" r="1.5"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20, padding: "0 4px" }}>
        {[{ n: 23, label: "登録製品", icon: "📋" }, { n: 3, label: "お気に入り", icon: "❤️" }, { n: 7, label: "カテゴリ", icon: "📂" }].map((s, i) => (
          <Glass key={i} style={{ padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 13, marginBottom: 3 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: T.serif, color: T.accent, lineHeight: 1 }}><Counter to={s.n} /></div>
            <div style={{ fontSize: 9, color: T.inkMuted, fontFamily: T.sans, marginTop: 3 }}>{s.label}</div>
          </Glass>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "0 4px" }}>
        <button onClick={() => setFavOnly(!favOnly)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 20, border: "none", background: favOnly ? T.accent : T.cardSolid, color: favOnly ? "#fff" : T.inkMuted, fontSize: 11, fontWeight: 600, fontFamily: T.sans, boxShadow: favOnly ? T.s2 : T.s1, cursor: "pointer", flexShrink: 0 }}>
          {favOnly ? "❤️" : "🤍"} お気に入り
        </button>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", flex: 1 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: "7px 11px", borderRadius: 20, border: "none", background: activeFilter === f ? T.ink : T.cardSolid, color: activeFilter === f ? "#fff" : T.inkMuted, fontSize: 10, fontWeight: 600, fontFamily: T.sans, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: activeFilter === f ? T.s2 : T.s1 }}>
              {f === "all" ? "すべて" : typeLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* ─── PHOTO GRID VIEW (Mercari style) ─── */}
      {viewMode === "photo" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 4px" }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "40px 20px", textAlign: "center" }}><div style={{ width: 56, height: 56, borderRadius: 16, background: T.parchment, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📸</div><div style={{ fontSize: 13, fontWeight: 600, color: T.inkMuted, fontFamily: T.sans, marginBottom: 4 }}>該当する製品がありません</div><div style={{ fontSize: 11, color: T.inkFaint, fontFamily: T.sans }}>フィルターを変更するか、新しいコスメをスキャンしてみましょう</div></div>
          )}
          {filtered.map((p, i) => (
            <div key={i} onClick={() => onSelectProduct && onSelectProduct(p)} style={{
              borderRadius: T.r2, overflow: "hidden", background: T.cardSolid,
              border: "1px solid " + T.parchment, boxShadow: T.s1, cursor: "pointer",
              opacity: 0, animation: "fadeUp 0.4s ease forwards", animationDelay: i * 50 + "ms",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}>
              {/* Product image */}
              <div style={{ position: "relative", aspectRatio: "1", background: T.parchment, overflow: "hidden" }}>
                <img
                  src={getImgUrl(p.img)}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                {/* Favorite badge */}
                <div style={{
                  position: "absolute", top: 8, right: 8, width: 28, height: 28,
                  borderRadius: 14, background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13,
                }}>
                  {p.fav ? "❤️" : "🤍"}
                </div>
                {/* Category badge */}
                <div style={{
                  position: "absolute", bottom: 8, left: 8,
                  background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
                  borderRadius: 6, padding: "2px 8px",
                  fontSize: 9, fontWeight: 700, color: T.inkSoft, fontFamily: T.sans,
                }}>
                  {typeLabels[p.type]}
                </div>
              </div>
              {/* Product info */}
              <div style={{ padding: "10px 12px" }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: T.ink, fontFamily: T.sans,
                  lineHeight: 1.4, overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  marginBottom: 4,
                }}>{p.name}</div>
                <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans }}>{p.brand}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── LIST VIEW ─── */}
      {viewMode === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 4px" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}><div style={{ width: 56, height: 56, borderRadius: 16, background: T.parchment, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📸</div><div style={{ fontSize: 13, fontWeight: 600, color: T.inkMuted, fontFamily: T.sans, marginBottom: 4 }}>該当する製品がありません</div><div style={{ fontSize: 11, color: T.inkFaint, fontFamily: T.sans }}>フィルターを変更するか、新しいコスメをスキャンしてみましょう</div></div>
          )}
          {filtered.map((p, i) => (
            <div key={i} onClick={() => onSelectProduct && onSelectProduct(p)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
              background: T.cardSolid, borderRadius: T.r1,
              border: "1px solid " + T.parchment, boxShadow: T.s1, cursor: "pointer",
              opacity: 0, animation: "fadeUp 0.35s ease forwards", animationDelay: i * 40 + "ms",
            }}>
              {/* Thumbnail */}
              <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", background: T.parchment, flexShrink: 0 }}>
                <img
                  src={getImgUrl(p.img)}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: T.sans, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans }}>{p.brand}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: T.inkMuted, background: T.parchment, padding: "1px 7px", borderRadius: 4 }}>{typeLabels[p.type]}</span>
                </div>
              </div>
              {/* Fav + date */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 14 }}>{p.fav ? "❤️" : "🤍"}</span>
                <span style={{ fontSize: 9, color: T.inkFaint, fontFamily: T.sans }}>{p.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* X share CTA */}
      <div style={{ marginTop: 24, padding: "16px 18px", borderRadius: T.r2, background: T.accentSoft, border: "1px solid rgba(58,143,122,0.15)", display: "flex", alignItems: "center", gap: 12, margin: "24px 4px 0" }}>
        <span style={{ fontSize: 20 }}>🐦</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>お気に入りをXでシェア</div>
          <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, marginTop: 2 }}>キャプチャ画像付きで投稿できます</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SETTINGS — Account, X linkage, legal, delete
// ═══════════════════════════════════════
function Settings({ onBack }) {
  const [editingName, setEditingName] = useState(false);
  const [nickname, setNickname] = useState("こっぺ");
  const [showDelete, setShowDelete] = useState(false);
  const [xLinked, setXLinked] = useState(true);

  const SectionCard = ({ children, style }) => (
    <div style={{
      background: T.cardSolid, borderRadius: T.r2,
      border: "1px solid " + T.parchment, boxShadow: T.s1,
      padding: "20px 18px", marginBottom: 12, ...style,
    }}>{children}</div>
  );

  const SectionTitle = ({ children, color }) => (
    <div style={{ fontSize: 13, fontWeight: 700, color: color || T.ink, fontFamily: T.sans, marginBottom: 14 }}>{children}</div>
  );

  return (
    <div style={{ padding: "16px 20px 100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: T.parchment, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.inkSoft} strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: T.serif, color: T.ink, margin: 0 }}>設定</h1>
      </div>

      {/* ─── Profile ─── */}
      <SectionCard>
        <SectionTitle>アカウント情報</SectionTitle>

        {/* Avatar + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "linear-gradient(135deg, " + T.accentSoft + ", " + T.parchment + ")",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, flexShrink: 0,
          }}>🌿</div>
          <div style={{ flex: 1 }}>
            {editingName ? (
              <div>
                <input
                  type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                  maxLength={20} autoFocus
                  style={{
                    width: "100%", fontSize: 14, fontWeight: 700, fontFamily: T.sans, color: T.ink,
                    border: "1.5px solid " + T.accent, borderRadius: 10, padding: "8px 12px",
                    outline: "none", background: T.cream,
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => setEditingName(false)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: T.sans, cursor: "pointer" }}>保存</button>
                  <button onClick={() => setEditingName(false)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: T.parchment, color: T.inkMuted, fontSize: 11, fontWeight: 600, fontFamily: T.sans, cursor: "pointer" }}>キャンセル</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>{nickname}</div>
                  <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, marginTop: 2 }}>ニックネーム</div>
                </div>
                <button onClick={() => setEditingName(true)} style={{ padding: "5px 14px", borderRadius: 20, border: "none", background: T.accentSoft, color: T.accent, fontSize: 10, fontWeight: 700, fontFamily: T.sans, cursor: "pointer" }}>編集</button>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div style={{ padding: "12px 14px", borderRadius: 10, background: T.cream }}>
          <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, marginBottom: 2 }}>メールアドレス</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: T.sans }}>sya4sya3mi@gmail.com</div>
        </div>
      </SectionCard>

      {/* ─── X Integration ─── */}
      <SectionCard>
        <SectionTitle>
          X（Twitter）連携
        </SectionTitle>

        {xLinked ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: T.safe }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>連携済み</div>
                  <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans }}>@mio_mihadanote</div>
                </div>
              </div>
              <button onClick={() => setXLinked(false)} style={{ padding: "5px 14px", borderRadius: 20, border: "none", background: "#FFEBEE", color: "#E57373", fontSize: 10, fontWeight: 700, fontFamily: T.sans, cursor: "pointer" }}>連携解除</button>
            </div>
            <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, padding: "8px 12px", background: T.cream, borderRadius: 8, lineHeight: 1.6 }}>
              シェア画面から画像付きでXに投稿できます（1日3件まで）
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans, lineHeight: 1.7, margin: "0 0 12px" }}>
              Xアカウントを連携すると、成分図鑑やデッキの情報を画像付きでXに投稿できます。
            </p>
            <button onClick={() => setXLinked(true)} style={{
              width: "100%", padding: "12px 0", borderRadius: T.r1, border: "none",
              background: "#1DA1F2", color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: T.sans, cursor: "pointer",
            }}>Xアカウントを連携する</button>
          </div>
        )}
      </SectionCard>

      {/* ─── Usage Stats ─── */}
      <SectionCard>
        <SectionTitle>利用状況</SectionTitle>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "スキャン回数", value: "29回", icon: "📸" },
            { label: "保存コスメ", value: "23品", icon: "📦" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "14px 12px", borderRadius: 12, background: T.cream, textAlign: "center" }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: T.serif, color: T.accent }}>{s.value}</div>
              <div style={{ fontSize: 9, color: T.inkMuted, fontFamily: T.sans, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ─── Logout ─── */}
      <button style={{
        width: "100%", padding: "14px 18px", borderRadius: T.r2,
        background: T.cardSolid, border: "1px solid " + T.parchment, boxShadow: T.s1,
        display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer", marginBottom: 12,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.accent, fontFamily: T.sans }}>ログアウト</span>
      </button>

      {/* ─── Legal ─── */}
      <SectionCard>
        <SectionTitle>法的情報</SectionTitle>
        {["プライバシーポリシー", "利用規約"].map((item, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: T.parchment, margin: "0 -18px", marginBottom: 0 }} />}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 0", cursor: "pointer",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: T.sans }}>{item}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* ─── Danger Zone ─── */}
      <SectionCard style={{ border: "1px solid rgba(229,115,115,0.2)" }}>
        <SectionTitle color="#E57373">アカウント削除</SectionTitle>
        <p style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.sans, lineHeight: 1.7, margin: "0 0 14px" }}>
          アカウントを削除すると、保存したコスメ・図鑑データ・写真がすべて完全に削除されます。この操作は取り消せません。
        </p>

        {showDelete ? (
          <div style={{ padding: "16px", borderRadius: 12, background: "#FFF5F5", animation: "fadeUp 0.25s ease" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E57373", fontFamily: T.sans, marginBottom: 12 }}>
              本当に削除しますか？
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#E57373", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: T.sans, cursor: "pointer" }}>完全に削除する</button>
              <button onClick={() => setShowDelete(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid " + T.parchment, background: T.cardSolid, color: T.inkMuted, fontSize: 12, fontWeight: 600, fontFamily: T.sans, cursor: "pointer" }}>キャンセル</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDelete(true)} style={{
            padding: "8px 18px", borderRadius: 10, border: "1px solid #E57373",
            background: "none", color: "#E57373", fontSize: 12, fontWeight: 600,
            fontFamily: T.sans, cursor: "pointer",
          }}>アカウントを削除する</button>
        )}
      </SectionCard>

      {/* App version */}
      <div style={{ textAlign: "center", marginTop: 20, paddingBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.inkFaint, fontFamily: T.sans }}>HADAMI v0.1.0 β</div>
        <div style={{ fontSize: 9, color: T.inkFaint, fontFamily: T.sans, marginTop: 2 }}>クローズドβ版 — 15名限定</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ONBOARDING — 3-step walkthrough for first-time users
// ═══════════════════════════════════════
function Onboarding({ onComplete }) {
  const [page, setPage] = useState(0);

  const pages = [
    {
      icon: "📸", bg: "linear-gradient(135deg, #E8FAF8 0%, #D4F5EF 100%)",
      title: "撮って、知る",
      desc: "コスメのパッケージにカメラを向けるだけ。\nAIが商品を特定し、ネットから\n成分情報を自動で取得します。",
    },
    {
      icon: "📖", bg: "linear-gradient(135deg, #F0E8F5 0%, #E8E0F0 100%)",
      title: "集めて、楽しむ",
      desc: "見つけた成分は図鑑にコレクト。\n★レアリティで珍しさがわかる。\nコンプリートを目指そう。",
    },
    {
      icon: "🃏", bg: "linear-gradient(135deg, #FFF3DC 0%, #FDECC8 100%)",
      title: "組んで、整える",
      desc: "お気に入りの製品でスキンケア\nデッキを組む。カテゴリカバー率や\n相乗効果も確認できます。",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: T.cream }}>
      {/* Skip */}
      <div style={{ padding: "16px 20px 0", textAlign: "right" }}>
        <button onClick={onComplete} style={{ fontSize: 12, color: T.inkMuted, background: "none", border: "none", cursor: "pointer", fontFamily: T.sans }}>スキップ</button>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px", textAlign: "center" }}>
        <div key={page} style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{
            width: 120, height: 120, borderRadius: 36, margin: "0 auto 32px",
            background: pages[page].bg,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48,
            boxShadow: "0 12px 40px rgba(58,143,122,0.1)",
          }}>{pages[page].icon}</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: T.serif, color: T.ink, margin: "0 0 16px", letterSpacing: "-0.02em" }}>{pages[page].title}</h2>
          <p style={{ fontSize: 14, color: T.inkMuted, fontFamily: T.sans, lineHeight: 2, margin: 0, whiteSpace: "pre-line" }}>{pages[page].desc}</p>
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{ padding: "0 24px 48px" }}>
        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {pages.map((_, i) => (
            <div key={i} style={{
              width: i === page ? 24 : 8, height: 8, borderRadius: 4,
              background: i === page ? T.accent : T.parchment,
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        {page < pages.length - 1 ? (
          <button onClick={() => setPage(page + 1)} style={{
            width: "100%", padding: "16px 0", borderRadius: T.r1, border: "none",
            background: T.accent, color: "#fff", fontSize: 15, fontWeight: 700,
            fontFamily: T.sans, cursor: "pointer", boxShadow: "0 4px 16px " + T.accentGlow,
          }}>次へ</button>
        ) : (
          <button onClick={onComplete} style={{
            width: "100%", padding: "16px 0", borderRadius: T.r1, border: "none",
            background: "linear-gradient(135deg, " + T.accent + ", #5BBFAD)",
            color: "#fff", fontSize: 15, fontWeight: 700,
            fontFamily: T.sans, cursor: "pointer", boxShadow: "0 4px 20px " + T.accentGlow,
          }}>最初のコスメをスキャンしよう 📸</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// PRODUCT DETAIL — bidirectional: product → ingredients
// ═══════════════════════════════════════
function ProductDetail({ product, onClose }) {
  const STORAGE_BASE = "https://krxagbqtpfgqvtfgvvcx.supabase.co/storage/v1/object/public/product-images/";
  const getImgUrl = (img) => img && (img.startsWith("http") ? img : STORAGE_BASE + img);

  // Simulated ingredient data for this product
  const productIngredients = {
    "HEARTLEAF 77+ SOOTHING TONER": [
      { name: "ヒアルロン酸Na", cat: "保湿", rarity: 1 },
      { name: "ベタイン", cat: "保湿", rarity: 1 },
      { name: "パンテノール", cat: "修復", rarity: 1 },
      { name: "ツボクサエキス", cat: "鎮静", rarity: 3 },
    ],
    "AHA.BHA.PHA MIRACLE CREAM": [
      { name: "ナイアシンアミド", cat: "美白", rarity: 2 },
      { name: "パンテノール", cat: "修復", rarity: 1 },
      { name: "ヒアルロン酸Na", cat: "保湿", rarity: 1 },
      { name: "ローズマリーエキス", cat: "鎮静", rarity: 3 },
    ],
  };

  // Fallback ingredients
  const ingredients = productIngredients[product.name] || [
    { name: "グリセリン", cat: "保湿", rarity: 1 },
    { name: "パンテノール", cat: "修復", rarity: 1 },
    { name: "ヒアルロン酸Na", cat: "保湿", rarity: 1 },
  ];

  const typeLabels = { cream: "クリーム", serum: "美容液", mask_pack: "マスク", toner: "化粧水", emulsion: "乳液", sunscreen: "日焼け止め", other: "その他" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: T.cream, overflowY: "auto",
      animation: "fadeUp 0.3s ease",
    }}>
      {/* Image header */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        {product.img ? (
          <img src={getImgUrl(product.img)} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, " + T.accentSoft + ", " + T.parchment + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>📦</div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(27,38,32,0.7) 0%, transparent 50%)", pointerEvents: "none" }} />

        {/* Fav button (top-right) */}
        <button style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, zIndex: 2 }}>
          {product.fav ? "❤️" : "🤍"}
        </button>

        {/* Product info on image */}
        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: T.sans, letterSpacing: "0.08em", textTransform: "uppercase" }}>{product.brand}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: T.serif, lineHeight: 1.3, marginTop: 4 }}>{product.name}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 6, fontFamily: T.sans }}>{typeLabels[product.type] || "その他"}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 20px 100px", marginTop: -16, borderRadius: "16px 16px 0 0", background: T.cream, position: "relative" }}>
        {/* Ingredients section — bidirectional link */}
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: T.sans, marginBottom: 14 }}>
          この製品の成分 <span style={{ fontSize: 12, fontWeight: 400, color: T.inkMuted }}>{ingredients.length}種</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ingredients.map((ing, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              background: T.cardSolid, borderRadius: T.r1,
              border: "1px solid " + T.parchment, boxShadow: T.s1, cursor: "pointer",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>{ing.name}</div>
                <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.sans, marginTop: 2 }}>{ing.cat}</div>
              </div>
              <span style={{ fontSize: 10, color: "#D4A853", letterSpacing: 0.5, flexShrink: 0 }}>{"★".repeat(ing.rarity)}{"☆".repeat(5 - ing.rarity)}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 9, color: T.inkFaint, fontFamily: T.sans, marginTop: 12, lineHeight: 1.6 }}>
          成分をタップすると図鑑で詳細を確認できます
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button style={{ flex: 1, padding: "13px 0", borderRadius: T.r1, border: "1.5px solid " + T.accent, background: T.cardSolid, color: T.accent, fontSize: 12, fontWeight: 700, fontFamily: T.sans, cursor: "pointer" }}>デッキに追加</button>
          <button style={{ flex: 1, padding: "13px 0", borderRadius: T.r1, border: "none", background: T.accent, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: T.sans, cursor: "pointer", boxShadow: "0 4px 16px " + T.accentGlow }}>再スキャン</button>
        </div>
      </div>

      {/* Bottom fixed back bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, zIndex: 310,
        padding: "12px 20px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        background: "rgba(244,249,246,0.92)", backdropFilter: "blur(20px)",
        borderTop: "1px solid " + T.parchment,
      }}>
        <button onClick={() => { onClose(); }} style={{
          width: "100%", padding: "14px 0", borderRadius: T.r1,
          background: T.parchment, border: "none",
          fontSize: 13, fontWeight: 700, color: T.inkSoft, fontFamily: T.sans,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.inkSoft} strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Myコスメに戻る
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function HADAMI_V2_RealData() {
  const [tab, setTab] = useState("home");
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div style={{ background: T.cream, minHeight: "100vh", fontFamily: T.sans, maxWidth: 430, margin: "0 auto", position: "relative", boxShadow: "0 0 80px rgba(26,23,20,0.06)" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn { 0%{transform:scale(0.8);opacity:0} 50%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes checkPop { 0%{transform:scale(0)} 50%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{display:none}
        button{transition:transform 0.15s ease, opacity 0.15s ease}
        button:active{transform:scale(0.97);opacity:0.85}
        button:focus-visible{outline:2px solid ${T.accent};outline-offset:2px}
      `}</style>

      {showOnboarding ? (
        <Onboarding onComplete={() => { setShowOnboarding(false); setTab("scan"); }} />
      ) : showSettings ? (
        <div style={{ animation: "fadeUp 0.35s ease" }}>
          <Settings onBack={() => setShowSettings(false)} />
        </div>
      ) : (
        <div>
          <div key={tab} style={{ animation: "fadeUp 0.35s ease" }}>
            {tab === "home" && <Home onOpenSettings={() => setShowSettings(true)} />}
            {tab === "scan" && <ScanResult />}
            {tab === "zukan" && <Zukan />}
            {tab === "deck" && <Deck />}
            {tab === "my" && <MyPage onSelectProduct={setSelectedProduct} />}
          </div>
          <Nav active={tab} onNav={setTab} />
        </div>
      )}

      {/* Product detail overlay (③ bidirectional link) */}
      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
