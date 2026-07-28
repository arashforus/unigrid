import { useState } from "react";
import { Sparkles, Send, RotateCcw, GraduationCap, MapPin, Globe, Award, ChevronRight, Terminal } from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');

@keyframes grid-scroll {
  from { transform: perspective(600px) rotateX(60deg) translateY(0); }
  to   { transform: perspective(600px) rotateX(60deg) translateY(80px); }
}
@keyframes scan-line {
  0%   { top: 0%; }
  100% { top: 100%; }
}
@keyframes neon-flicker {
  0%, 98%, 100% { opacity: 1; }
  99%            { opacity: 0.5; }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%            { transform: translateY(-4px); opacity: 1; }
}
@keyframes border-glow {
  0%, 100% { box-shadow: 0 0 6px rgba(0,255,200,0.3), inset 0 0 6px rgba(0,255,200,0.03); }
  50%       { box-shadow: 0 0 18px rgba(0,255,200,0.6), inset 0 0 10px rgba(0,255,200,0.08); }
}
@keyframes hex-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.4); opacity: 0.7; }
}
`;

const CYAN = "#00ffc8";
const MAGENTA = "#ff00aa";
const DIM = "rgba(0,255,200,0.6)";

const MESSAGES = [
  { role: "user", content: "I want to study Computer Science or Engineering in English" },
  {
    role: "assistant",
    content: "SCAN COMPLETE — Found 2 matching programs across 5 universities.\n\nBoğaziçi and Bilkent both offer top-tier Computer Engineering fully in English, with scholarship options available for international students.",
    recs: [
      { name: "Computer Engineering", uni: "Boğaziçi University", city: "Istanbul", degree: "BSc", lang: "EN", scholarship: true },
      { name: "Computer Science", uni: "Bilkent University", city: "Ankara", degree: "BSc", lang: "EN", scholarship: true },
    ]
  },
];

export function NeonGrid() {
  return (
    <>
      <style>{CSS}</style>
      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#03080f", fontFamily: "'JetBrains Mono', monospace", color: "#e2ffe0" }}>

        {/* Scrolling perspective grid */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: 0.18 }}>
          <div style={{
            position: "absolute", inset: "-50% -20%",
            backgroundImage: `linear-gradient(${CYAN} 1px, transparent 1px), linear-gradient(90deg, ${CYAN} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            animation: "grid-scroll 4s linear infinite",
            transformOrigin: "50% 0",
          }} />
        </div>

        {/* Scanline */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 5, opacity: 0.04 }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(transparent, ${CYAN}, transparent)`, animation: "scan-line 8s linear infinite" }} />
        </div>

        {/* Corner decoration — top left */}
        <div style={{ position: "absolute", top: 16, left: 16, pointerEvents: "none", opacity: 0.4 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M0 40 L0 0 L40 0" stroke={CYAN} strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="3" fill={CYAN}/>
          </svg>
        </div>
        <div style={{ position: "absolute", top: 16, right: 16, pointerEvents: "none", opacity: 0.4 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M40 40 L40 0 L0 0" stroke={CYAN} strokeWidth="1.5" fill="none"/>
            <circle cx="40" cy="0" r="3" fill={CYAN}/>
          </svg>
        </div>

        {/* Ambient glows */}
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 500, height: 300, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(0,255,200,0.06) 0%, transparent 70%)`, filter: "blur(20px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,0,170,0.05) 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 20, borderBottom: `1px solid rgba(0,255,200,0.12)`, backdropFilter: "blur(20px)", background: "rgba(3,8,15,0.85)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Hexagonal avatar */}
              <div style={{ position: "relative", width: 38, height: 38 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "30%", background: `rgba(0,255,200,0.08)`, border: `1px solid rgba(0,255,200,0.3)`, animation: "border-glow 2.5s ease-in-out infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={18} color={CYAN} style={{ animation: "neon-flicker 5s infinite" }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: CYAN, letterSpacing: "0.05em", animation: "neon-flicker 8s infinite" }}>
                  UNI_ADVISOR.exe
                </div>
                <div style={{ fontSize: 10, color: `rgba(0,255,200,0.5)`, letterSpacing: "0.04em", marginTop: 1 }}>
                  <span style={{ animation: "pulse-dot 1.5s ease-in-out infinite", display: "inline-block", marginRight: 5 }}>■</span>
                  NEURAL_NET_ACTIVE · CATALOG_LOADED · 26 PROGRAMS
                </div>
              </div>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: `rgba(0,255,200,0.6)`, padding: "6px 14px", borderRadius: 6, border: `1px solid rgba(0,255,200,0.2)`, background: `rgba(0,255,200,0.04)`, cursor: "pointer", letterSpacing: "0.04em" }}>
              <RotateCcw size={11} /> NEW_SESSION
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* System message */}
          <div style={{ padding: "10px 14px", borderRadius: 6, background: `rgba(0,255,200,0.04)`, border: `1px solid rgba(0,255,200,0.1)`, fontSize: 11, color: `rgba(0,255,200,0.5)`, letterSpacing: "0.03em" }}>
            <span style={{ color: CYAN }}>SYS »</span> Session initialized. University catalog synced. 5 universities, 26 active programs loaded into context.
          </div>

          {MESSAGES.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row", animation: "slide-up 0.35s ease forwards" }}>
              {msg.role === "assistant" ? (
                <div style={{ width: 32, height: 32, borderRadius: "30%", flexShrink: 0, background: `rgba(0,255,200,0.08)`, border: `1px solid rgba(0,255,200,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, animation: "border-glow 2.5s ease-in-out infinite" }}>
                  <Terminal size={14} color={CYAN} />
                </div>
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: "30%", flexShrink: 0, background: `rgba(255,0,170,0.08)`, border: `1px solid rgba(255,0,170,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                  <span style={{ fontSize: 12, color: MAGENTA, fontWeight: 700 }}>U</span>
                </div>
              )}
              <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  background: msg.role === "user" ? `rgba(255,0,170,0.06)` : `rgba(0,255,200,0.04)`,
                  border: `1px solid ${msg.role === "user" ? "rgba(255,0,170,0.2)" : "rgba(0,255,200,0.15)"}`,
                  color: msg.role === "user" ? "#fce7f3" : "#e2ffe0",
                  boxShadow: msg.role === "user"
                    ? "0 0 20px rgba(255,0,170,0.08)"
                    : "0 0 20px rgba(0,255,200,0.06)",
                }}>
                  {msg.role === "assistant" && (
                    <span style={{ color: CYAN, marginRight: 8, opacity: 0.7 }}>AI »</span>
                  )}
                  {msg.content}
                  {msg.role === "user" && <span style={{ animation: "cursor-blink 1s step-end infinite", color: MAGENTA, marginLeft: 4 }}>█</span>}
                </div>
                {(msg as any).recs && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: `rgba(0,255,200,0.4)`, marginBottom: 10 }}>
                      ── MATCH_RESULTS ──
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      {(msg as any).recs.map((r: any, j: number) => (
                        <div key={j} style={{ minWidth: 210, padding: "14px", borderRadius: 6, background: `rgba(0,255,200,0.03)`, border: `1px solid rgba(0,255,200,0.15)`, cursor: "pointer", animation: "border-glow 3s ease-in-out infinite", animationDelay: `${j * 0.8}s` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                            <div style={{ width: 26, height: 26, borderRadius: 4, background: `rgba(0,255,200,0.08)`, border: `1px solid rgba(0,255,200,0.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <GraduationCap size={13} color={CYAN} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `rgba(96,165,250,0.1)`, color: "#93c5fd", border: "1px solid rgba(96,165,250,0.2)", letterSpacing: "0.04em" }}>{r.degree}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, color: "#fff" }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: `rgba(0,255,200,0.5)`, marginBottom: 10, letterSpacing: "0.02em" }}>{r.uni}</div>
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: `rgba(0,255,200,0.5)` }}><MapPin size={9} />{r.city}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: `rgba(0,255,200,0.5)` }}><Globe size={9} />{r.lang}</span>
                            {r.scholarship && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#34d399" }}><Award size={9} />SCHOLARSHIP</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: CYAN, marginTop: 10 }}>
                            VIEW_PROGRAM <ChevronRight size={11} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing */}
          <div style={{ display: "flex", gap: 12, animation: "slide-up 0.35s ease forwards" }}>
            <div style={{ width: 32, height: 32, borderRadius: "30%", flexShrink: 0, background: `rgba(0,255,200,0.08)`, border: `1px solid rgba(0,255,200,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", animation: "border-glow 2.5s ease-in-out infinite" }}>
              <Terminal size={14} color={CYAN} />
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 6, background: `rgba(0,255,200,0.04)`, border: `1px solid rgba(0,255,200,0.15)`, fontSize: 12, color: `rgba(0,255,200,0.5)` }}>
              <span style={{ marginRight: 8 }}>AI »</span>
              <span style={{ animation: "cursor-blink 0.8s step-end infinite" }}>█</span>
              <span style={{ marginLeft: 8, opacity: 0.6 }}>processing neural pathways…</span>
            </div>
          </div>
        </div>

        {/* Input */}
        <div style={{ position: "sticky", bottom: 0, borderTop: `1px solid rgba(0,255,200,0.1)`, backdropFilter: "blur(20px)", background: "rgba(3,8,15,0.9)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "14px 20px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 16px", borderRadius: 6, background: `rgba(0,255,200,0.03)`, border: `1px solid rgba(0,255,200,0.2)`, animation: "border-glow 3s ease-in-out infinite" }}>
              <span style={{ fontSize: 12, color: CYAN, opacity: 0.7, marginRight: 4, flexShrink: 0 }}>&gt;</span>
              <span style={{ flex: 1, fontSize: 13, color: `rgba(0,255,200,0.3)` }}>ask about programs, universities, scholarships…</span>
              <button style={{ width: 36, height: 36, borderRadius: 6, background: `rgba(0,255,200,0.1)`, border: `1px solid rgba(0,255,200,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Send size={15} color={CYAN} />
              </button>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: `rgba(0,255,200,0.2)`, marginTop: 8, letterSpacing: "0.04em" }}>
              ENTER_TO_SEND · SHIFT+ENTER_NEW_LINE
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
