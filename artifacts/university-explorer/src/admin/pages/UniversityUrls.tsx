import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminUniversity } from '@/admin/api';
import {
  Loader2, Search, ExternalLink, Pencil, Check, X, Sparkles, RefreshCw, Link2, Link2Off,
} from 'lucide-react';

// Per-row search state
type RowState = 'idle' | 'searching' | 'found' | 'error';

export default function AdminUniversityUrlsPage() {
  const qc = useQueryClient();
  const { data: universities, isLoading } = useQuery({
    queryKey: ['admin', 'universities'],
    queryFn: adminApi.universities.list,
  });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'has_url' | 'no_url'>('all');

  // Per-row inline edit state  { [id]: string }
  const [editing, setEditing] = useState<Record<number, string>>({});
  // Per-row AI search state
  const [rowState, setRowState] = useState<Record<number, RowState>>({});
  const [rowError, setRowError] = useState<Record<number, string>>({});

  // Bulk "find all missing" state
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, url }: { id: number; url: string }) =>
      adminApi.universities.update(id, { website_url: url || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'universities'] }),
  });

  const filtered = useMemo(() => {
    if (!universities) return [];
    const q = search.toLowerCase();
    return universities.filter((u) => {
      if (q && !u.name_en.toLowerCase().includes(q) && !u.city_en?.toLowerCase().includes(q)) return false;
      if (filterStatus === 'has_url' && !u.website_url) return false;
      if (filterStatus === 'no_url' && u.website_url) return false;
      return true;
    });
  }, [universities, search, filterStatus]);

  const counts = useMemo(() => {
    if (!universities) return { total: 0, withUrl: 0, noUrl: 0 };
    const withUrl = universities.filter((u) => u.website_url).length;
    return { total: universities.length, withUrl, noUrl: universities.length - withUrl };
  }, [universities]);

  // --- Inline edit helpers ---
  function startEdit(u: AdminUniversity) {
    setEditing((prev) => ({ ...prev, [u.id]: u.website_url ?? '' }));
  }
  function cancelEdit(id: number) {
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }
  function saveEdit(id: number) {
    updateMutation.mutate(
      { id, url: editing[id] ?? '' },
      { onSuccess: () => cancelEdit(id) },
    );
  }

  // --- AI search for a single university ---
  async function findUrl(u: AdminUniversity) {
    setRowState((s) => ({ ...s, [u.id]: 'searching' }));
    setRowError((e) => { const n = { ...e }; delete n[u.id]; return n; });
    try {
      const result = await adminApi.universities.findUrl(u.id);
      if (result.url) {
        await updateMutation.mutateAsync({ id: u.id, url: result.url });
        setRowState((s) => ({ ...s, [u.id]: 'found' }));
        setTimeout(() => setRowState((s) => ({ ...s, [u.id]: 'idle' })), 3000);
      } else {
        setRowState((s) => ({ ...s, [u.id]: 'error' }));
        setRowError((e) => ({ ...e, [u.id]: 'No URL found by AI' }));
      }
    } catch (err: any) {
      setRowState((s) => ({ ...s, [u.id]: 'error' }));
      setRowError((e) => ({ ...e, [u.id]: err.message ?? 'Search failed' }));
    }
  }

  // --- Bulk find missing URLs ---
  async function findAllMissing() {
    if (!universities) return;
    const missing = universities.filter((u) => !u.website_url);
    if (!missing.length) return;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: missing.length });
    for (let i = 0; i < missing.length; i++) {
      await findUrl(missing[i]).catch(() => {});
      setBulkProgress({ done: i + 1, total: missing.length });
    }
    setBulkRunning(false);
    setBulkProgress(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">University URLs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading
              ? 'Loading…'
              : `${counts.withUrl} of ${counts.total} universities have a website URL`}
          </p>
        </div>
        <button
          onClick={findAllMissing}
          disabled={bulkRunning || isLoading || counts.noUrl === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {bulkRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {bulkProgress ? `${bulkProgress.done}/${bulkProgress.total}` : 'Starting…'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Find All Missing ({counts.noUrl})
            </>
          )}
        </button>
      </div>

      {/* Stats pills */}
      <div className="flex gap-3 flex-wrap">
        <Pill
          label="All"
          count={counts.total}
          active={filterStatus === 'all'}
          onClick={() => setFilterStatus('all')}
        />
        <Pill
          label="Has URL"
          count={counts.withUrl}
          active={filterStatus === 'has_url'}
          onClick={() => setFilterStatus('has_url')}
          variant="green"
        />
        <Pill
          label="Missing URL"
          count={counts.noUrl}
          active={filterStatus === 'no_url'}
          onClick={() => setFilterStatus('no_url')}
          variant="amber"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-start font-medium px-5 py-3">University</th>
                <th className="text-start font-medium px-5 py-3">City</th>
                <th className="text-start font-medium px-5 py-3">Type</th>
                <th className="text-start font-medium px-5 py-3 min-w-72">Website URL</th>
                <th className="text-end font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isEditing = u.id in editing;
                const state = rowState[u.id] ?? 'idle';
                const errMsg = rowError[u.id];

                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-3.5 font-medium">
                      <div>{u.name_en}</div>
                      {u.name_tr && u.name_tr !== u.name_en && (
                        <div className="text-xs text-muted-foreground">{u.name_tr}</div>
                      )}
                    </td>

                    {/* City */}
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{u.city_en}</td>

                    {/* Type */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary capitalize">
                        {u.type}
                      </span>
                    </td>

                    {/* URL cell */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="url"
                            value={editing[u.id]}
                            onChange={(e) =>
                              setEditing((prev) => ({ ...prev, [u.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(u.id);
                              if (e.key === 'Escape') cancelEdit(u.id);
                            }}
                            placeholder="https://…"
                            className="flex-1 bg-input border border-primary/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                          />
                          <button
                            onClick={() => saveEdit(u.id)}
                            disabled={updateMutation.isPending}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => cancelEdit(u.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          {u.website_url ? (
                            <>
                              <Link2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <a
                                href={u.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-mono text-xs truncate max-w-56"
                                title={u.website_url}
                              >
                                {u.website_url}
                              </a>
                              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </>
                          ) : (
                            <>
                              <Link2Off className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground text-xs italic">No URL</span>
                            </>
                          )}

                          {/* AI state feedback */}
                          {state === 'searching' && (
                            <span className="ml-2 flex items-center gap-1 text-xs text-primary">
                              <Loader2 className="w-3 h-3 animate-spin" /> Searching…
                            </span>
                          )}
                          {state === 'found' && (
                            <span className="ml-2 flex items-center gap-1 text-xs text-emerald-400">
                              <Check className="w-3 h-3" /> Found!
                            </span>
                          )}
                          {state === 'error' && errMsg && (
                            <span className="ml-2 text-xs text-destructive" title={errMsg}>
                              {errMsg}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* AI find */}
                        <button
                          onClick={() => findUrl(u)}
                          disabled={state === 'searching' || bulkRunning}
                          title="Find URL with AI"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                        >
                          {state === 'searching' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </button>
                        {/* Manual edit */}
                        <button
                          onClick={() => startEdit(u)}
                          disabled={isEditing || state === 'searching'}
                          title="Edit URL manually"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Clear URL */}
                        {u.website_url && !isEditing && (
                          <button
                            onClick={() => {
                              if (confirm(`Clear URL for ${u.name_en}?`)) {
                                updateMutation.mutate({ id: u.id, url: '' });
                              }
                            }}
                            title="Clear URL"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    {search || filterStatus !== 'all'
                      ? 'No universities match your filters.'
                      : 'No universities found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <Sparkles className="w-3 h-3 inline mr-1" />
        The AI search uses OpenAI to look up each university's official website based on its name and city.
        You can also edit any URL manually by clicking the pencil icon.
      </p>
    </div>
  );
}

function Pill({
  label, count, active, onClick, variant = 'default',
}: {
  label: string; count: number; active: boolean; onClick: () => void;
  variant?: 'default' | 'green' | 'amber';
}) {
  const colors = {
    default: active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground',
    green: active ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-secondary text-muted-foreground hover:text-foreground',
    amber: active ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'bg-secondary text-muted-foreground hover:text-foreground',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${colors[variant]}`}
    >
      {label} <span className="opacity-70">{count}</span>
    </button>
  );
}
