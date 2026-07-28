import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, RotateCcw, GraduationCap, MapPin, Globe, Award, ChevronRight, Loader2 } from "lucide-react";

/* ── Keyframe injection ── */
const CSS = `
@keyframes float-particle {
  0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 0.6; }
  100% { transform: translateY(-120px) translateX(var(--dx, 20px)); opacity: 0; }
}
@keyframes pulse-ring {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes orb-breathe {
  0%, 100% { box-shadow: 0 0 24px 4px rgba(139,92,246,0.5), 0 0 60px 10px rgba(139,92,246,0.15); }
  50%       { box-shadow: 0 0 40px 8px rgba(139,92,246,0.8), 0 0 90px 20px rgba(139,92,246,0.3); }
}
@keyframes shimmer-text {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0);   opacity: 0.4; }
  30%            { transform: translateY(-4px); opacity: 1; }
}
@keyframes card-glow {
  0%, 100% { box-shadow: 0 0 0 1px rgba(139,92,246,0.15), 0 4px 20px rgba(0,0,0,0.3); }
  50%       { box-shadow: 0 0 0 1px rgba(139,92,246,0.4),  0 4px 30px rgba(139,92,246,0.1); }
}
@keyframes input-glow {
  0%   { box-shadow: 0 0 0 2px rgba(139,92,246,0.3); }
  50%  { box-shadow: 0 0 0 2px rgba(139,92,246,0.7), 0 0 20px rgba(139,92,246,0.2); }
  100% { box-shadow: 0 0 0 2px rgba(139,92,246,0.3); }
}
`;

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 2, height: 2,
        background: "rgba(167,139,250,0.8)",
        animation: `float-particle ${style.animationDuration} ${style.animationDelay} infinite ease-out`,
        ...style,
      }}
    />
  );
}

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${60 + (i * 13) % 35}%`,
  "--dx": `${((i * 17) % 40) - 20}px`,
  animationDuration: `${3 + (i % 4)}s`,
  animationDelay: `${(i * 0.4) % 4}s`,
  width: i % 3 === 0 ? 3 : 2,
  height: i % 3 === 0 ? 3 : 2,
  opacity: 0,
} as React.CSSProperties));

const SUGGESTED = [
  "I want to study Computer Science or Engineering in English",
  "What are the best medicine or pharmacy programs?",
  "I need a master's degree with scholarship support",
  "Compare top state universities in Istanbul",
];

const MESSAGES = [
  { role: "user", content: "I want to study computer science in English. What are my best options?" },
  {
    role: "assistant",
    content: "Great choice! Based on your preferences, here are the top programs that match perfectly:",
    recs: [
      { type: "program", name: "Computer Engineering", uni: "Boğaziçi University", city: "Istanbul", degree: "bachelor", lang: "English", scholarship: true },
      { type: "program", name: "Computer Science", uni: "Bilkent University", city: "Ankara", degree: "bachelor", lang: "English", scholarship: true },
    ]
  },
];

export function NeuralPulse() {
  const [active, setActive] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);

  return (
    <>
      <style>{CSS}</style>
      <div className="relative flex flex-col min-h-screen overflow-hidden select-none"
        style={{ background: "#030712", fontFamily: "'Inter', sans-serif", color: "#f1f5f9" }}>

        {/* Star field */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: i % 5 === 0 ? 2 : 1,
                height: i % 5 === 0 ? 2 : 1,
                left: `${(i * 17 + 3) % 100}%`,
                top: `${(i * 13 + 7) % 100}%`,
                background: `rgba(255,255,255,${0.1 + (i % 5) * 0.08})`,
                animation: `orb-breathe ${3 + i % 3}s ${i * 0.3}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        {/* Ambient glow orbs */}
        <div className="absolute pointer-events-none" style={{ top: "-10%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 70%)" }} />
        <div className="absolute pointer-events-none" style={{ top: "30%", right: "-5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "5%", left: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />

        {/* Navbar */}
        <div className="sticky top-0 z-20 border-b" style={{ background: "rgba(3,7,18,0.8)", backdropFilter: "blur(24px)", borderColor: "rgba(139,92,246,0.12)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Orb avatar */}
              <div className="relative" style={{ width: 36, height: 36 }}>
                <div className="absolute inset-0 rounded-full" style={{ background: "rgba(139,92,246,0.15)", animation: "pulse-ring 2s ease-out infinite" }} />
                <div className="absolute inset-0 rounded-full" style={{ background: "rgba(139,92,246,0.1)", animation: "pulse-ring 2s 0.6s ease-out infinite" }} />
                <div style={{ position: "relative", zIndex: 1, width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", animation: "orb-breathe 3s ease-in-out infinite" }}>
                  <Sparkles size={16} color="white" />
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1, background: "linear-gradient(90deg, #a78bfa, #818cf8, #a78bfa)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer-text 3s linear infinite" }}>
                  AI Study Advisor
                </div>
                <div style={{ fontSize: 11, color: "rgba(148,163,184,0.8)", marginTop: 2 }}>Neural catalog search active</div>
              </div>
            </div>
            <button onClick={() => setActive(!active)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(148,163,184,0.7)", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.05)", cursor: "pointer" }}>
              <RotateCcw size={12} /> New chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, maxWidth: 800, margin: "0 auto", width: "100%", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24 }}>
          {MESSAGES.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row", animation: "slide-up 0.4s ease forwards" }}>
              {msg.role === "assistant" && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, animation: "orb-breathe 3s ease-in-out infinite" }}>
                  <Sparkles size={14} color="white" />
                </div>
              )}
              <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                  fontSize: 14, lineHeight: 1.6,
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                    : "rgba(15,23,42,0.8)",
                  border: msg.role === "user" ? "none" : "1px solid rgba(139,92,246,0.15)",
                  backdropFilter: "blur(12px)",
                  animation: "card-glow 3s ease-in-out infinite",
                }}>
                  {msg.content}
                </div>
                {(msg as any).recs && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                      Recommended for you
                    </div>
                    <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
                      {(msg as any).recs.map((r: any, j: number) => (
                        <div key={j} style={{ minWidth: 210, padding: "14px", borderRadius: 14, background: "rgba(15,23,42,0.9)", border: "1px solid rgba(139,92,246,0.2)", backdropFilter: "blur(12px)", cursor: "pointer", animation: "card-glow 3s ease-in-out infinite", animationDelay: `${j * 0.5}s` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <GraduationCap size={14} color="#a78bfa" />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(96,165,250,0.15)", color: "#93c5fd" }}>{r.degree}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(148,163,184,0.7)", marginBottom: 8 }}>{r.uni}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(148,163,184,0.7)" }}><MapPin size={10} />{r.city}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(148,163,184,0.7)" }}><Globe size={10} />{r.lang}</span>
                            {r.scholarship && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#34d399" }}><Award size={10} />Scholarship</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#a78bfa", marginTop: 10 }}>
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

          {/* Typing indicator */}
          <div style={{ display: "flex", gap: 12, animation: "slide-up 0.4s ease forwards" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", animation: "orb-breathe 3s ease-in-out infinite" }}>
              <Sparkles size={14} color="white" />
            </div>
            <div style={{ padding: "12px 16px", borderRadius: "4px 18px 18px 18px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <div style={{ display: "flex", gap: 5, alignItems: "center", height: 20 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Particle emitter area */}
        <div className="relative pointer-events-none" style={{ height: 1 }}>
          {PARTICLES.map((p, i) => <Particle key={i} style={p} />)}
        </div>

        {/* Input bar */}
        <div style={{ position: "sticky", bottom: 0, background: "rgba(3,7,18,0.85)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(139,92,246,0.12)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 14, background: "rgba(15,23,42,0.9)", border: "1px solid rgba(139,92,246,0.2)", animation: inputFocused ? "input-glow 2s ease-in-out infinite" : undefined }}>
                <Sparkles size={16} color="#7c3aed" style={{ opacity: 0.7 }} />
                <span style={{ fontSize: 14, color: "rgba(148,163,184,0.5)" }}>Ask about programs, universities, scholarships…</span>
              </div>
              <button style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", animation: "orb-breathe 3s ease-in-out infinite" }}>
                <Send size={18} color="white" />
              </button>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(148,163,184,0.35)", marginTop: 8 }}>
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
