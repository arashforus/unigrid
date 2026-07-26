import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, type AiRequest } from '@/admin/api';
import {
  Sparkles, Loader2, ChevronLeft, ChevronRight, Clock, Cpu, Zap,
  MessageSquare, AlertCircle, CheckCircle2, X, ChevronDown, ChevronUp,
} from 'lucide-react';

const SOURCE_LABELS: Record<string, string> = {
  'fee-crawler': 'Fee Crawler',
  'program-enrich': 'Program Enrich',
  'university-enrich': 'University Enrich',
};

const SOURCE_COLORS: Record<string, string> = {
  'fee-crawler': 'bg-amber-500/15 text-amber-400',
  'program-enrich': 'bg-primary/15 text-primary',
  'university-enrich': 'bg-violet-500/15 text-violet-400',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatNum(n: number | string | null | undefined) {
  if (n == null) return '—';
  return Number(n).toLocaleString();
}

function StatCard({ label, value, icon: Icon, sub }: {
  label: string; value: string | number; icon: React.ElementType; sub?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold">{formatNum(value as number)}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function TextPreview({ text, maxLen = 120 }: { text: string | null; maxLen?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-muted-foreground text-xs italic">—</span>;
  const short = text.length <= maxLen;
  return (
    <div className="font-mono text-xs leading-relaxed text-foreground/80 bg-secondary/40 rounded-lg px-3 py-2">
      <p className="whitespace-pre-wrap break-words">
        {expanded || short ? text : `${text.slice(0, maxLen)}…`}
      </p>
      {!short && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1 text-primary hover:text-primary/80 text-xs font-semibold transition-colors"
        >
          {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show all ({text.length} chars)</>}
        </button>
      )}
    </div>
  );
}

function RequestDrawer({ req, onClose }: { req: AiRequest; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-background border-s border-border overflow-y-auto flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">AI Request #{req.id}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Time</p>
              <p className="font-medium">{formatDate(req.created_at)}</p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Model</p>
              <p className="font-mono font-medium text-xs">{req.model}</p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Source</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${SOURCE_COLORS[req.source] ?? 'bg-secondary text-foreground'}`}>
                {SOURCE_LABELS[req.source] ?? req.source}
              </span>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-1.5">
                {req.status === 'success'
                  ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs font-semibold text-emerald-400">Success</span></>
                  : <><AlertCircle className="w-3.5 h-3.5 text-destructive" /><span className="text-xs font-semibold text-destructive">Error</span></>
                }
              </div>
            </div>
          </div>

          {/* Token usage */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Token Usage</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Prompt', value: req.prompt_tokens },
                { label: 'Completion', value: req.completion_tokens },
                { label: 'Total', value: req.total_tokens },
              ].map(({ label, value }) => (
                <div key={label} className="bg-secondary/40 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold">{formatNum(value)}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            {req.duration_ms != null && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Duration: {req.duration_ms.toLocaleString()} ms
              </p>
            )}
          </div>

          {/* Context */}
          {req.context && Object.keys(req.context).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Context</h3>
              <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
                {Object.entries(req.context).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-muted-foreground font-mono min-w-[120px]">{k}</span>
                    <span className="font-medium break-all">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {req.error && (
            <div>
              <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">Error</h3>
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                <p className="text-xs font-mono text-destructive break-all">{req.error}</p>
              </div>
            </div>
          )}

          {/* Request text */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Request (Prompt)</h3>
            <TextPreview text={req.request_text} maxLen={600} />
          </div>

          {/* Response text */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Response</h3>
            <TextPreview text={req.response_text} maxLen={600} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiRequestsPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AiRequest | null>(null);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ai-requests', page],
    queryFn: () => adminApi.aiRequests.list(page, limit),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const { data: rows, pagination, stats } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> AI Requests
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Every OpenAI call made by the platform — fee crawling, program enrichment, and more.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={stats.total_requests} icon={Sparkles} />
        <StatCard label="Total Tokens" value={stats.total_tokens} icon={Zap} sub="across all calls" />
        <StatCard label="Prompt Tokens" value={stats.total_prompt_tokens} icon={MessageSquare} />
        <StatCard
          label="Avg Duration"
          value={stats.avg_duration_ms != null ? `${formatNum(stats.avg_duration_ms)} ms` : '—'}
          icon={Clock}
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Time</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Source</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Model</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-end px-4 py-3 text-xs font-semibold text-muted-foreground">Prompt</th>
                <th className="text-end px-4 py-3 text-xs font-semibold text-muted-foreground">Completion</th>
                <th className="text-end px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                <th className="text-end px-4 py-3 text-xs font-semibold text-muted-foreground">ms</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No AI requests logged yet. Trigger a fee crawl or program enrichment to see data here.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="hover:bg-secondary/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${SOURCE_COLORS[r.source] ?? 'bg-secondary text-foreground'}`}>
                      {SOURCE_LABELS[r.source] ?? r.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{r.model}</td>
                  <td className="px-4 py-3">
                    {r.status === 'success'
                      ? <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> OK</span>
                      : <span className="flex items-center gap-1 text-destructive text-xs font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Error</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-end font-mono text-xs">{formatNum(r.prompt_tokens)}</td>
                  <td className="px-4 py-3 text-end font-mono text-xs">{formatNum(r.completion_tokens)}</td>
                  <td className="px-4 py-3 text-end font-mono text-xs font-semibold">{formatNum(r.total_tokens)}</td>
                  <td className="px-4 py-3 text-end font-mono text-xs text-muted-foreground">
                    {r.duration_ms != null ? r.duration_ms.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                    {r.context
                      ? Object.entries(r.context).map(([k, v]) => `${k}: ${v}`).join(', ')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} requests
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && <RequestDrawer req={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
