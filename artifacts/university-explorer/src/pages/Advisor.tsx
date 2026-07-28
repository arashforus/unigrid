import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Sparkles, Send, User, RotateCcw, GraduationCap, MapPin, Globe, Award, ChevronRight, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/auth';

// ── Types ────────────────────────────────────────────────────────────────────

type Recommendation =
  | {
      type: 'program';
      id: number;
      name: string;
      university_name: string;
      university_slug: string;
      city: string;
      degree_type: string;
      language: string;
      scholarship: boolean;
    }
  | {
      type: 'university';
      id: number;
      name: string;
      slug: string;
      city: string;
      university_type: string;
      rank_turkey: number | null;
    };

type Message = {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Recommendation[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const MARKER = '\n---\nRECOMMENDATIONS_JSON:';
const MARKER_ALT = '---\nRECOMMENDATIONS_JSON:';

function parseResponse(raw: string): { text: string; recommendations: Recommendation[] } {
  let idx = raw.indexOf(MARKER);
  let markerLen = MARKER.length;
  if (idx === -1) {
    idx = raw.indexOf(MARKER_ALT);
    markerLen = MARKER_ALT.length;
  }
  if (idx === -1) return { text: raw.trim(), recommendations: [] };
  const text = raw.slice(0, idx).trim();
  const jsonStr = raw.slice(idx + markerLen).trim();
  try {
    const recs = JSON.parse(jsonStr);
    return { text, recommendations: Array.isArray(recs) ? recs : [] };
  } catch {
    return { text, recommendations: [] };
  }
}

// SUGGESTED is now built inside the component using t() so it reacts to language changes

const DEGREE_COLORS: Record<string, string> = {
  bachelor:  'bg-blue-500/15 text-blue-400',
  master:    'bg-violet-500/15 text-violet-400',
  doctorate: 'bg-rose-500/15 text-rose-400',
  associate: 'bg-amber-500/15 text-amber-400',
};

const TYPE_COLORS: Record<string, string> = {
  state:      'bg-blue-500/15 text-blue-400',
  private:    'bg-purple-500/15 text-purple-400',
  foundation: 'bg-amber-500/15 text-amber-400',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function ProgramCard({ rec }: { rec: Extract<Recommendation, { type: 'program' }> }) {
  const { t } = useTranslation();
  return (
    <Link
      href={`/program?id=${rec.id}`}
      className="group flex flex-col gap-2 bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition-all min-w-[220px] max-w-[260px]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-primary" />
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${DEGREE_COLORS[rec.degree_type] ?? 'bg-secondary text-foreground'}`}>
          {rec.degree_type}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{rec.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{rec.university_name}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-auto">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />{rec.city}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Globe className="w-3 h-3" />{rec.language}
        </span>
        {rec.scholarship && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Award className="w-3 h-3" />{t('program.scholarship')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-1">
        {t('advisor.viewProgram')} <ChevronRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

function UniversityCard({ rec }: { rec: Extract<Recommendation, { type: 'university' }> }) {
  const { t } = useTranslation();
  return (
    <Link
      href={`/university?slug=${rec.slug}`}
      className="group flex flex-col gap-2 bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition-all min-w-[220px] max-w-[260px]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[rec.university_type] ?? 'bg-secondary text-foreground'}`}>
          {rec.university_type}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{rec.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{rec.city}</p>
      </div>
      {rec.rank_turkey != null && (
        <p className="text-xs text-muted-foreground">
          🏆 {t('university.rankTurkey')} <span className="text-foreground font-semibold">#{rec.rank_turkey}</span>
        </p>
      )}
      <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-auto">
        {t('advisor.viewUniversity')} <ChevronRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

function RecommendationRow({ recs }: { recs: Recommendation[] }) {
  const { t } = useTranslation();
  if (!recs.length) return null;
  return (
    <div className="mt-3 -mx-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
        {t('advisor.recommended')}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-thin">
        {recs.map((rec, i) =>
          rec.type === 'program'
            ? <ProgramCard key={i} rec={rec} />
            : <UniversityCard key={i} rec={rec} />
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? 'bg-primary/15' : 'bg-violet-500/15'
      }`}>
        {isUser
          ? <User className="w-4 h-4 text-primary" />
          : <Sparkles className="w-4 h-4 text-violet-400" />}
      </div>
      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
        {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
          <RecommendationRow recs={msg.recommendations} />
        )}
      </div>
    </div>
  );
}

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {text || <span className="flex gap-1 items-center h-5"><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay:'0ms'}} /><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay:'150ms'}} /><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay:'300ms'}} /></span>}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdvisorPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState('');
  const [showAuthGate, setShowAuthGate] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const SUGGESTED = [
    t('advisor.suggested1'),
    t('advisor.suggested2'),
    t('advisor.suggested3'),
    t('advisor.suggested4'),
  ];

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    if (!user) {
      setShowAuthGate(true);
      return;
    }

    setError('');
    const userMsg: Message = { role: 'user', content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setStreaming(true);
    setStreamText('');

    // Build messages payload (strip recommendations — only send role+content)
    const payload = history.map((m) => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();
    let accumulated = '';
    let markerHit = false;

    try {
      const res = await fetch(`${BASE}/api/advisor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || `Request failed (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          let event: any;
          try { event = JSON.parse(json); } catch { continue; }

          if (event.error) throw new Error(event.error);

          if (event.done) {
            // Parse full accumulated text
            const { text: cleanText, recommendations } = parseResponse(accumulated);
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: cleanText, recommendations },
            ]);
            setStreamText('');
            break;
          }

          if (event.content) {
            accumulated += event.content;

            if (!markerHit) {
              // Hide everything from the marker onwards
              const markerIdx = accumulated.indexOf('\n---');
              if (markerIdx !== -1) {
                markerHit = true;
                setStreamText(accumulated.slice(0, markerIdx).trim());
              } else {
                // Safe display: hide last few chars in case marker is split across chunks
                setStreamText(accumulated.slice(0, -4).trim());
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Something went wrong. Please try again.');
      }
      setStreamText('');
    } finally {
      setStreaming(false);
      setStreamText('');
      abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setInput('');
    setStreamText('');
    setStreaming(false);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const isEmpty = messages.length === 0 && !streaming;

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">

      {/* Auth gate modal */}
      {showAuthGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShowAuthGate(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full flex flex-col items-center text-center gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center">
              <LogIn className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-1">{t('advisor.authGateTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('advisor.authGateSubtitle')}</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {t('advisor.authGateLogin')}
              </button>
              <button
                onClick={() => setShowAuthGate(false)}
                className="w-full py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                {t('advisor.authGateCancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-16 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-none">{t('advisor.title')}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{t('advisor.subtitle')}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {t('advisor.newChat')}
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('advisor.emptyTitle')}</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              {t('advisor.emptySubtitle')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left px-4 py-3 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-card/80 text-sm transition-all group"
                >
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {!isEmpty && (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {streaming && <StreamingBubble text={streamText} />}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder={t('advisor.placeholder')}
              rows={1}
              className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-60 overflow-hidden"
              style={{ height: '44px' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {streaming
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t('advisor.sendHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
