import { useState } from "react";
import { Sparkles, Send, RotateCcw, GraduationCap, MapPin, Globe, Award, ChevronRight } from "lucide-react";

const CSS = `
@keyframes blob-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -20px) scale(1.05); }
  66%       { transform: translate(-20px, 15px) scale(0.97); }
}
@keyframes blob-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(-25px, 20px) scale(1.08); }
  66%       { transform: translate(20px, -10px) scale(0.95); }
}
@keyframes blob-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(15px, -30px) scale(1.04); }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes glass-shimmer {
  0%   { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}
@keyframes avatar-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%            { transform: translateY(-4px); opacity: 1; }
}
@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
`;

const SUGGESTED = [
  "I want to study Computer Science in English",
  "Best medicine programs with scholarships?",
  "Compare Istanbul universities",
  "Master's programs in Engineering",
];

const MESSAGES = [
  { role: "user", content: "I want to study Computer Engineering in English. What are my best options?" },
  {
    role: "assistant",
    content: "I found some excellent Computer Engineering programs taught in English that match your profile perfectly. These universities are well-ranked and offer strong scholarships:",
    recs: [
      { name: "Computer Engineering", uni: "Boğaziçi University", city: "Istanbul", degree: "Bachelor", lang: "English", scholarship: true },
      { name: "Computer Science", uni: "Bilkent University", city: "Ankara", degree: "Bachelor", lang: "English", scholarship: true },
    ]
  },
];

export function LiquidGlass() {
  return (
    <>
      <style>{CSS}</style>
      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#0a0a14", fontFamily: "'Inter', sans-serif", color: "#f8fafc" }}>

        {/* Drifting gradient blobs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(99,102,241,0.1) 40%, transparent 70%)", top: "-15%", left: "15%", animation: "blob-drift 12s ease-in-out infinite", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(79,70,229,0.08) 40%, transparent 70%)", top: "25%", right: "-10%", animation: "blob-drift-2 15s ease-in-out infinite", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)", bottom: "5%", left: "5%", animation: "blob-drift-3 18s ease-in-out infinite", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)", bottom: "30%", right: "20%", animation: "blob-drift 20s 5s ease-in-out infinite", filter: "blur(50px)" }} />
        </div>

        {/* Fine grid overlay */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.4 }} />

        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 30, borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(40px) saturate(180%)", background: "rgba(10,10,20,0.6)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Glass avatar */}
              <div style={{ position: "relative", width: 40, height: 40 }}>
                <div style={{ position: "absolute", inset: -2, borderRadius: "50%", background: "conic-gradient(from 0deg, #7c3aed, #6366f1, #38bdf8, #7c3aed)", animation: "avatar-spin 4s linear infinite", opacity: 0.7 }} />
                <div style={{ position: "absolute", inset: 1, borderRadius: "50%", background: "rgba(10,10,20,0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={18} color="#a78bfa" />
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>AI Study Advisor</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "badge-pulse 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: 11, color: "rgba(148,163,184,0.7)" }}>Live catalog · 5 universities · 26 programs</span>
                </div>
              </div>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(148,163,184,0.7)", padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", cursor: "pointer" }}>
              <RotateCcw size={12} /> New chat
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 22 }}>
          {MESSAGES.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row", animation: "slide-up 0.5s ease forwards" }}>
              {msg.role === "assistant" && (
                <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0, marginTop: 2 }}>
                  <div style={{ position: "absolute", inset: -1, borderRadius: "50%", background: "conic-gradient(from 0deg, #7c3aed, #6366f1, #38bdf8, #7c3aed)", animation: "avatar-spin 4s linear infinite", opacity: 0.6 }} />
                  <div style={{ position: "absolute", inset: 1, borderRadius: "50%", background: "rgba(10,10,20,0.95)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={14} color="#a78bfa" />
                  </div>
                </div>
              )}
              <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{
                  padding: "13px 18px",
                  borderRadius: msg.role === "user" ? "20px 4px 20px 20px" : "4px 20px 20px 20px",
                  fontSize: 14, lineHeight: 1.65,
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, rgba(124,58,237,0.9), rgba(99,102,241,0.85))"
                    : "rgba(255,255,255,0.04)",
                  border: msg.role === "user" ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(20px)",
                  boxShadow: msg.role === "user" ? "0 8px 32px rgba(124,58,237,0.2)" : "0 4px 20px rgba(0,0,0,0.2)",
                }}>
                  {msg.content}
                </div>
                {(msg as any).recs && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)", marginBottom: 10 }}>Recommended</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      {(msg as any).recs.map((r: any, j: number) => (
                        <div key={j} style={{ minWidth: 210, padding: "16px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <GraduationCap size={15} color="#a78bfa" />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(96,165,250,0.12)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.2)" }}>{r.degree}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.35, marginBottom: 4 }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: "rgba(148,163,184,0.65)", marginBottom: 10 }}>{r.uni}</div>
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "rgba(148,163,184,0.6)" }}><MapPin size={10} />{r.city}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "rgba(148,163,184,0.6)" }}><Globe size={10} />{r.lang}</span>
                            {r.scholarship && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#34d399" }}><Award size={10} />Scholarship</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#a78bfa", marginTop: 12 }}>
                            View program <ChevronRight size={12} />
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
          <div style={{ display: "flex", gap: 12, animation: "slide-up 0.5s ease forwards" }}>
            <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -1, borderRadius: "50%", background: "conic-gradient(from 0deg, #7c3aed, #6366f1, #38bdf8, #7c3aed)", animation: "avatar-spin 4s linear infinite", opacity: 0.6 }} />
              <div style={{ position: "absolute", inset: 1, borderRadius: "50%", background: "rgba(10,10,20,0.95)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={14} color="#a78bfa" />
              </div>
            </div>
            <div style={{ padding: "13px 18px", borderRadius: "4px 20px 20px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
              <div style={{ display: "flex", gap: 5, alignItems: "center", height: 20 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite` }} />)}
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div style={{ position: "sticky", bottom: 0, borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(40px) saturate(180%)", background: "rgba(10,10,20,0.7)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 10px 10px 18px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", boxShadow: "0 0 30px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              <span style={{ flex: 1, fontSize: 14, color: "rgba(148,163,184,0.45)" }}>Ask about programs, universities, scholarships…</span>
              <button style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 4px 15px rgba(124,58,237,0.4)" }}>
                <Send size={17} color="white" />
              </button>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(148,163,184,0.3)", marginTop: 8 }}>
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
