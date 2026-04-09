import { useState, useEffect, useRef } from "react";

const T = {
  ink:"#1B2620",inkSoft:"#3D4F45",inkMuted:"#7E9389",inkFaint:"#B5C7BE",
  cream:"#F4F9F6",parchment:"#E8F0EC",white:"#FFFFFF",
  accent:"#3A8F7A",accentDark:"#2B7464",accentSoft:"#D6EDE6",accentPale:"#EAF5F1",
  safe:"#4A9B7F",
  shadow1:"0 1px 4px rgba(27,38,32,0.05)",
  shadow2:"0 4px 16px rgba(27,38,32,0.08)",
  serif:"'Shippori Mincho',serif",
  sans:"'Zen Kaku Gothic New','Noto Sans JP',sans-serif",
};

const RARITY={
  common:{star:1,color:"#9CA3AF",bg:"rgba(156,163,175,0.07)",border:"rgba(156,163,175,0.15)"},
  uncommon:{star:2,color:"#4CAF50",bg:"rgba(76,175,80,0.07)",border:"rgba(76,175,80,0.15)"},
  rare:{star:3,color:"#E91E8C",bg:"rgba(233,30,140,0.07)",border:"rgba(233,30,140,0.18)"},
  legendary:{star:4,color:"#F59E0B",bg:"rgba(245,158,11,0.07)",border:"rgba(245,158,11,0.22)"},
};

const RO=["legendary","rare","uncommon","common"];
function sortR(a){return[...a].sort((x,y)=>{const d=RO.indexOf(x.rarity)-RO.indexOf(y.rarity);return d||((x.found?0:1)-(y.found?0:1))});}

const GENRES=[
  {key:"water",label:"うるおい",icon:"💧",color:"#4FC3F7",total:28,disc:12,
    items:sortR([
      {name:"サクラン",rarity:"legendary",found:false,hint:"スイゼンジノリ由来の超保湿成分"},
      {name:"アセチルヒアルロン酸",rarity:"rare",found:true,note:"通常の2倍の保水力"},
      {name:"プロテオグリカン",rarity:"rare",found:false,hint:"サケ鼻軟骨由来。EGF様作用"},
      {name:"ポリクオタニウム-51",rarity:"uncommon",found:true,note:"リピジュア"},
      {name:"ヒアルロン酸Na",rarity:"common",found:true,note:"1gで6Lの水分保持"},
      {name:"グリセリン",rarity:"common",found:true},
      {name:"ベタイン",rarity:"common",found:true},
    ])},
  {key:"amino_acid",label:"アミノ酸",icon:"🧬",color:"#7986CB",total:20,disc:6,
    items:sortR([
      {name:"アセチルグルタミン",rarity:"rare",found:true,note:"NMF産生を促すアミノ酸誘導体"},
      {name:"PCA-Na",rarity:"uncommon",found:true,note:"NMFの主成分"},
      {name:"ヒドロキシプロリン",rarity:"uncommon",found:false,hint:"コラーゲン特有のアミノ酸"},
      {name:"アルギニン",rarity:"common",found:true},
      {name:"グリシン",rarity:"common",found:true},
    ])},
  {key:"vitamin",label:"ビタミン",icon:"🍊",color:"#FFB74D",total:32,disc:9,
    items:sortR([
      {name:"アスタキサンチン",rarity:"legendary",found:true,note:"整肌力はビタミンEの数百倍"},
      {name:"レチナール",rarity:"legendary",found:false,hint:"最も活性の高いレチノイド"},
      {name:"レチノール",rarity:"rare",found:true,note:"シワ改善の有効成分"},
      {name:"バクチオール",rarity:"rare",found:false,hint:"植物由来のレチノール代替"},
      {name:"アスコルビン酸",rarity:"uncommon",found:true,note:"純粋ビタミンC"},
      {name:"ナイアシンアミド",rarity:"common",found:true,note:"万能選手"},
    ])},
  {key:"peptide",label:"ペプチド",icon:"🧪",color:"#E91E8C",total:20,disc:5,
    items:sortR([
      {name:"銅トリペプチド-1",rarity:"legendary",found:true,note:"GHK-Cu。コラーゲン合成促進"},
      {name:"EGF",rarity:"legendary",found:false,hint:"発見者はノーベル賞受賞"},
      {name:"アセチルヘキサペプチド-8",rarity:"legendary",found:false,hint:"通称アルジレリン"},
      {name:"パルミトイルペンタペプチド-4",rarity:"rare",found:true,note:"マトリキシル"},
      {name:"パルミトイルトリペプチド-5",rarity:"rare",found:true},
    ])},
  {key:"botanical",label:"ボタニカル",icon:"🌿",color:"#4CAF50",total:55,disc:14,
    items:sortR([
      {name:"アルブチン",rarity:"rare",found:true,note:"日本発の美白有効成分"},
      {name:"レスベラトロール",rarity:"rare",found:false,hint:"赤ワインのポリフェノール"},
      {name:"ツボクサエキス",rarity:"uncommon",found:true,note:"CICA"},
      {name:"甘草エキス",rarity:"common",found:true,note:"鎮静の王道"},
      {name:"緑茶エキス",rarity:"common",found:true},
    ])},
  {key:"oil_lipid",label:"オイル・脂質",icon:"🫙",color:"#81C784",total:47,disc:15,
    items:sortR([
      {name:"ヒト型セラミド",rarity:"legendary",found:false,hint:"最高峰のバリア成分"},
      {name:"セラミドNP",rarity:"rare",found:true,note:"バリア修復の要"},
      {name:"スクワラン",rarity:"common",found:true,note:"皮脂に近い天然の潤い"},
      {name:"ホホバ油",rarity:"common",found:true},
    ])},
  {key:"ferment",label:"発酵",icon:"🧫",color:"#9C27B0",total:10,disc:3,
    items:sortR([
      {name:"サッカロミセス培養液",rarity:"rare",found:true,note:"SK-IIのピテラ"},
      {name:"ガラクトミセス培養液",rarity:"rare",found:false,hint:"酵母系発酵美容液に"},
      {name:"コメ発酵液",rarity:"uncommon",found:true,note:"日本酒の醸造技術が生んだ成分"},
    ])},
  {key:"acid",label:"アシッド",icon:"⚗️",color:"#90A4AE",total:27,disc:7,
    items:sortR([
      {name:"サリチル酸",rarity:"rare",found:false,hint:"BHA。毛穴ケアのエース"},
      {name:"乳酸",rarity:"uncommon",found:true,note:"穏やかなAHA"},
      {name:"ラクトビオン酸",rarity:"uncommon",found:true,note:"PHA。敏感肌OKの次世代酸"},
      {name:"クエン酸",rarity:"common",found:true},
    ])},
  {key:"base",label:"ベース",icon:"⚙️",color:"#BDBDBD",total:84,disc:22,
    items:sortR([
      {name:"フェノキシエタノール",rarity:"common",found:true,note:"パラベンフリー時代の防腐剤"},
      {name:"カルボマー",rarity:"common",found:true},
      {name:"ジメチコン",rarity:"common",found:true},
    ])},
];

const CONCERNS=[
  {label:"乾燥",icon:"🏜️",color:"#4FC3F7",
    tip:"水分→NMF→油分の3層保湿が鍵",
    keys:[
      {id:"ha",name:"ヒアルロン酸Na",rarity:"common",role:"水分を抱え込む王道保湿",found:true,
        products:[{name:"HEARTLEAF 80 AMPOULE",brand:"anua"},{name:"PDRN CAPSULE MASK",brand:"ANUA"}]},
      {id:"cer",name:"セラミドNP",rarity:"rare",role:"角層バリアを修復",found:true,
        products:[{name:"SKIN BARRIER ATO CREAM",brand:"OxygenCeuticals"}]},
      {id:"sq",name:"スクワラン",rarity:"common",role:"皮脂に近い油分でフタ",found:true,
        products:[{name:"Alpine Berry Watery Cream",brand:"primera"}]},
      {id:"pg",name:"プロテオグリカン",rarity:"rare",role:"ヒアルロン酸超えの保水力",found:false,products:[]},
    ]},
  {label:"くすみ",icon:"✨",color:"#CE93D8",
    tip:"ビタミンC+ナイアシンアミドの併用で透明感",
    keys:[
      {id:"nia",name:"ナイアシンアミド",rarity:"common",role:"メラニン輸送抑制の万能選手",found:true,
        products:[{name:"SKIN BARRIER ATO CREAM",brand:"OxygenCeuticals"},{name:"Alpine Berry Cream",brand:"primera"},{name:"Reset Ampoule Serum",brand:"DOPAMY"}]},
      {id:"vc",name:"アスコルビン酸",rarity:"uncommon",role:"最も高活性なビタミンC",found:true,
        products:[{name:"1st Control Serum",brand:"ACNI Dr."}]},
      {id:"tx",name:"トラネキサム酸",rarity:"rare",role:"肝斑にも使われる整肌成分",found:false,products:[]},
    ]},
  {label:"ハリ",icon:"📐",color:"#FFB74D",
    tip:"レチノール（夜）+ペプチド（朝晩）で攻めのケア",
    keys:[
      {id:"ret",name:"レチノール",rarity:"rare",role:"ターンオーバー促進のビタミンA",found:true,
        products:[{name:"Reset Ampoule Serum",brand:"DOPAMY"}]},
      {id:"cu",name:"銅トリペプチド-1",rarity:"legendary",role:"コラーゲン合成の伝説ペプチド",found:true,
        products:[{name:"Hydrating Tone Up Cream",brand:"EXPRESSIONS"}]},
      {id:"egf",name:"EGF",rarity:"legendary",role:"発見者はノーベル賞受賞",found:false,products:[]},
    ]},
  {label:"毛穴",icon:"🔍",color:"#90A4AE",
    tip:"BHA/PHA→鎮静→保湿の3ステップ",
    keys:[
      {id:"lac",name:"ラクトビオン酸",rarity:"uncommon",role:"敏感肌OKのPHA角質ケア",found:true,
        products:[{name:"1st Control Serum",brand:"ACNI Dr."}]},
      {id:"cica",name:"ツボクサエキス",rarity:"uncommon",role:"CICA。ピーリング後の鎮静に",found:true,
        products:[{name:"HEARTLEAF 80 AMPOULE",brand:"anua"},{name:"MIRACLE CREAM",brand:"SOMEBYMI"}]},
      {id:"sal",name:"サリチル酸",rarity:"rare",role:"BHA。毛穴の皮脂を溶かすエース",found:false,products:[]},
    ]},
  {label:"敏感",icon:"🛡️",color:"#81C784",
    tip:"バリア強化+鎮静で守りのスキンケア",
    keys:[
      {id:"pan",name:"パンテノール",rarity:"common",role:"ビタミンB5。バリア修復",found:true,
        products:[{name:"HEARTLEAF 80 AMPOULE",brand:"anua"},{name:"SKIN BARRIER ATO CREAM",brand:"OxygenCeuticals"}]},
      {id:"mad",name:"マデカッソシド",rarity:"uncommon",role:"CICAの活性成分",found:true,
        products:[{name:"MIRACLE CREAM",brand:"SOMEBYMI"}]},
      {id:"gly",name:"グリチルリチン酸2K",rarity:"common",role:"甘草由来の鎮静成分",found:true,
        products:[{name:"1st Control Serum",brand:"ACNI Dr."},{name:"Alpine Berry Cream",brand:"primera"}]},
    ]},
];

// ═══════════════════════════════════════

function GenreExplorer() {
  const [sel,setSel]=useState(GENRES[0].key);
  const g=GENRES.find(x=>x.key===sel);

  return (
    <div>
      {/* Horizontal icon selector */}
      <div style={{
        display:"flex",gap:4,overflowX:"auto",padding:"14px 16px 10px",
        WebkitOverflowScrolling:"touch",
      }}>
        {GENRES.map(genre=>{
          const active=sel===genre.key;
          const pct=Math.round((genre.disc/genre.total)*100);
          return (
            <button key={genre.key} onClick={()=>setSel(genre.key)} style={{
              flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              padding:"8px 10px 6px",borderRadius:14,border:"none",cursor:"pointer",
              background:active?T.white:"transparent",
              boxShadow:active?T.shadow2:"none",
              transition:"all 0.2s ease",minWidth:52,
            }}>
              <div style={{
                width:34,height:34,borderRadius:10,
                background:`${genre.color}${active?"20":"0C"}`,
                border:`1.5px solid ${active?genre.color+"50":genre.color+"15"}`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,
                transition:"all 0.2s ease",
              }}>{genre.icon}</div>
              <span style={{fontSize:9,fontWeight:active?700:500,color:active?T.ink:T.inkMuted,fontFamily:T.sans,whiteSpace:"nowrap"}}>
                {genre.label}
              </span>
              <span style={{fontSize:9,fontWeight:700,color:active?genre.color:T.inkFaint,fontFamily:T.sans}}>
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail */}
      {g && (
        <div key={g.key} style={{padding:"0 16px 8px",animation:"fadeUp 0.2s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontSize:16,fontWeight:800,color:T.ink,fontFamily:T.serif}}>{g.label}</span>
              <span style={{fontSize:11,color:T.inkMuted,fontFamily:T.sans}}>{g.disc}/{g.total}</span>
            </div>
            <div style={{height:4,width:72,borderRadius:2,background:T.parchment,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:2,
                width:`${Math.round((g.disc/g.total)*100)}%`,
                background:`linear-gradient(90deg,${g.color},${g.color}AA)`,
                transition:"width 0.6s ease"}}/>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {g.items.map((ing,i)=>{
              const r=RARITY[ing.rarity];
              const isLeg=ing.rarity==="legendary";
              return (
                <div key={i} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"9px 12px",borderRadius:13,
                  background:ing.found?r.bg:"rgba(232,240,236,0.4)",
                  border:`1px solid ${ing.found?r.border:"transparent"}`,
                  opacity:ing.found?1:0.5,position:"relative",overflow:"hidden",
                }}>
                  {isLeg&&ing.found&&<div style={{position:"absolute",inset:0,opacity:0.1,
                    background:"linear-gradient(135deg,transparent 25%,rgba(245,158,11,0.5) 50%,transparent 75%)",
                    animation:"shimmer 3.5s infinite"}}/>}
                  <span style={{fontSize:10,color:r.color,flexShrink:0,width:34,textAlign:"center",position:"relative"}}>
                    {"★".repeat(r.star)}<span style={{color:T.parchment}}>{"★".repeat(4-r.star)}</span>
                  </span>
                  <div style={{flex:1,minWidth:0,position:"relative"}}>
                    <div style={{fontSize:13,fontWeight:600,color:ing.found?T.ink:T.inkFaint,fontFamily:T.sans,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {ing.found?ing.name:"？？？"}
                    </div>
                    {(ing.found?ing.note:ing.hint)&&(
                      <div style={{fontSize:10,color:ing.found?T.inkMuted:"#B08D3A",fontFamily:T.sans,marginTop:1,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {ing.found?ing.note:`💡 ${ing.hint}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ConcernView() {
  const [selC,setSelC]=useState(null);
  const [expIng,setExpIng]=useState(null);
  const concern=CONCERNS.find(c=>c.label===selC);

  if (!concern) return (
    <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
      {CONCERNS.map(c=>{
        const covered=c.keys.filter(k=>k.products.length>0).length;
        const coverPct=Math.round((covered/c.keys.length)*100);
        return (
          <button key={c.label} onClick={()=>setSelC(c.label)} style={{
            display:"flex",alignItems:"center",gap:12,
            padding:"14px 16px",borderRadius:16,border:`1px solid ${T.parchment}`,
            background:T.white,boxShadow:T.shadow1,cursor:"pointer",textAlign:"left",width:"100%",
          }}>
            <div style={{
              width:40,height:40,borderRadius:12,flexShrink:0,
              background:`${c.color}12`,border:`1px solid ${c.color}22`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
            }}>{c.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:T.ink,fontFamily:T.sans}}>{c.label}</div>
              <div style={{fontSize:10,color:T.inkMuted,fontFamily:T.sans,marginTop:2}}>
                Myコスメカバー {covered}/{c.keys.length}
              </div>
            </div>
            <div style={{
              width:36,height:36,borderRadius:10,flexShrink:0,
              background:`${c.color}10`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,fontWeight:800,color:c.color,fontFamily:T.serif,
            }}>{coverPct}</div>
          </button>
        );
      })}
    </div>
  );

  const covered=concern.keys.filter(k=>k.products.length>0).length;
  const coverPct=Math.round((covered/concern.keys.length)*100);

  return (
    <div style={{padding:"12px 0",animation:"fadeUp 0.2s ease"}}>
      {/* Header */}
      <div style={{padding:"0 16px 12px",display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>{setSelC(null);setExpIng(null)}} style={{
          width:30,height:30,borderRadius:9,border:`1px solid ${T.parchment}`,
          background:T.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.inkMuted} strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span style={{fontSize:18}}>{concern.icon}</span>
        <span style={{fontSize:16,fontWeight:800,color:T.ink,fontFamily:T.serif,flex:1}}>{concern.label}</span>
        <div style={{padding:"3px 10px",borderRadius:8,background:`${concern.color}12`,
          fontSize:12,fontWeight:800,color:concern.color,fontFamily:T.serif}}>{coverPct}%</div>
      </div>

      {/* Tip */}
      <div style={{
        margin:"0 16px 12px",padding:"9px 14px",borderRadius:12,
        background:`${concern.color}08`,border:`1px solid ${concern.color}12`,
        fontSize:11,color:T.inkSoft,fontFamily:T.sans,lineHeight:1.5,
      }}>💡 {concern.tip}</div>

      {/* Ingredients */}
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:6}}>
        {concern.keys.map(ing=>{
          const r=RARITY[ing.rarity];
          const open=expIng===ing.id;
          const has=ing.products.length>0;
          return (
            <div key={ing.id} style={{borderRadius:14,overflow:"hidden",background:T.white,border:`1px solid ${T.parchment}`,boxShadow:T.shadow1}}>
              <div onClick={()=>setExpIng(open?null:ing.id)} style={{
                padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,
              }}>
                <div style={{
                  width:24,height:24,borderRadius:7,flexShrink:0,
                  background:ing.found?"rgba(58,143,122,0.08)":"rgba(181,199,190,0.15)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,
                }}>{ing.found?"✅":"🔒"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:13,fontWeight:700,color:ing.found?T.ink:T.inkFaint,fontFamily:T.sans}}>
                      {ing.found?ing.name:"？？？"}
                    </span>
                    <span style={{fontSize:9,color:r.color}}>{"★".repeat(r.star)}</span>
                  </div>
                  <div style={{fontSize:10,color:T.inkMuted,fontFamily:T.sans,marginTop:1,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ing.role}</div>
                </div>
                {has?(
                  <span style={{fontSize:10,fontWeight:700,color:T.accent,fontFamily:T.sans,flexShrink:0,
                    padding:"2px 8px",borderRadius:6,background:"rgba(58,143,122,0.08)"}}>
                    {ing.products.length}件
                  </span>
                ):(
                  <span style={{fontSize:10,color:T.inkFaint,fontFamily:T.sans,flexShrink:0}}>
                    {ing.found?"未配合":"未発見"}
                  </span>
                )}
              </div>
              <div style={{maxHeight:open?300:0,overflow:"hidden",transition:"max-height 0.3s ease"}}>
                <div style={{padding:"0 14px 12px",borderTop:`1px solid ${T.parchment}`}}>
                  {has?ing.products.map((p,i)=>(
                    <div key={i} style={{
                      display:"flex",alignItems:"center",gap:8,
                      padding:"8px 10px",borderRadius:10,marginTop:6,background:T.accentPale,
                    }}>
                      <span style={{fontSize:13}}>📦</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:600,color:T.ink,fontFamily:T.sans,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                        <div style={{fontSize:10,color:T.inkMuted,fontFamily:T.sans}}>{p.brand}</div>
                      </div>
                    </div>
                  )):(
                    <div style={{padding:"10px 0",textAlign:"center"}}>
                      <button style={{padding:"8px 20px",borderRadius:10,border:"none",
                        background:T.accent,color:"#fff",fontSize:11,fontWeight:700,fontFamily:T.sans,cursor:"pointer"}}>
                        📸 スキャンして探す
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coverage bar */}
      <div style={{margin:"12px 16px 0",display:"flex",alignItems:"center",gap:10}}>
        <div style={{flex:1,height:4,borderRadius:2,background:T.parchment,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:2,width:`${coverPct}%`,
            background:`linear-gradient(90deg,${concern.color},${concern.color}AA)`,
            transition:"width 0.8s ease"}}/>
        </div>
        <span style={{fontSize:10,color:T.inkMuted,fontFamily:T.sans}}>
          <span style={{fontWeight:700,color:concern.color}}>{covered}</span>/{concern.keys.length} カバー
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
export default function ZukanCompletion() {
  const [tab,setTab]=useState("genre");
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{setMounted(true)},[]);

  const totalDisc=GENRES.reduce((s,g)=>s+g.disc,0);
  const totalAll=GENRES.reduce((s,g)=>s+g.total,0);
  const pct=mounted?Math.round((totalDisc/totalAll)*100):0;

  return (
    <div style={{minHeight:"100vh",background:T.cream,fontFamily:T.sans,maxWidth:480,margin:"0 auto"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {/* ══ HEADER — clean & minimal ══ */}
      <div style={{padding:"50px 20px 16px",background:`linear-gradient(180deg,${T.accentPale} 0%,${T.cream} 100%)`}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:12}}>
          <span style={{fontSize:15,fontWeight:700,color:T.ink,fontFamily:T.sans}}>成分図鑑</span>
          <div>
            <span style={{fontSize:28,fontWeight:800,color:T.accent,fontFamily:T.serif,lineHeight:1}}>
              {pct}
            </span>
            <span style={{fontSize:12,fontWeight:500,color:T.inkMuted,fontFamily:T.sans}}>
              % <span style={{marginLeft:4}}>{totalDisc}/{totalAll}</span>
            </span>
          </div>
        </div>
        <div style={{height:5,borderRadius:3,background:T.parchment,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:3,width:`${pct}%`,
            background:`linear-gradient(90deg,${T.accent},${T.safe})`,
            transition:"width 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div style={{display:"flex",padding:"0 16px",borderBottom:`1px solid ${T.parchment}`}}>
        {[{key:"genre",label:"ジャンル別"},{key:"concern",label:"肌悩みから探す"}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1,padding:"11px 0",border:"none",cursor:"pointer",background:"transparent",
            fontSize:13,fontWeight:tab===t.key?700:500,color:tab===t.key?T.accent:T.inkMuted,
            fontFamily:T.sans,borderBottom:tab===t.key?`2.5px solid ${T.accent}`:"2.5px solid transparent",
            transition:"all 0.2s ease",
          }}>{t.label}</button>
        ))}
      </div>

      {tab==="genre"&&<GenreExplorer/>}
      {tab==="concern"&&<ConcernView/>}
    </div>
  );
}
