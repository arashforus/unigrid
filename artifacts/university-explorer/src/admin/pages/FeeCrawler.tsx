import React, { useState, useEffect, useRef } from 'react';
import { adminApi, type AdminFeeCrawlJob, type FeeCrawlerUniversity, type FeeCrawlUniversityResult } from '../api';
import {
  DollarSign, Play, RefreshCw, CheckCircle2, XCircle, Clock, Loader2,
  Globe, AlertTriangle, Search, ChevronDown, ChevronUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string) {
  switch (status) {
    case 'running':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400"><Loader2 className="w-3 h-3 animate-spin" />Running</span>;
    case 'success':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400"><CheckCircle2 className="w-3 h-3" />Success</span>;
    case 'failed':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400"><XCircle className="w-3 h-3" />Failed</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground"><Clock className="w-3 h-3" />Pending</span>;
  }
}

function uniStatusIcon(status: FeeCrawlUniversityResult['status']) {
  switch (status) {
    case 'done': return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />;
    case 'failed': return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
    case 'no_url': return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'fetching': return <Globe className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />;
    case 'extracting': return <Loader2 className="w-4 h-4 text-purple-400 shrink-0 animate-spin" />;
    default: return <Clock className="w-4 h-4 text-muted-foreground shrink-0" />;
  }
}

function fmt(date: string) {
  return new Date(date).toLocaleString();
}

// ---------------------------------------------------------------------------
// Job result table
// ---------------------------------------------------------------------------

function JobResults({ results }: { results: FeeCrawlUniversityResult[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const filtered = results.filter((r) => {
    const matchSearch = r.university_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const toggle = (id: number) => {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search universities…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm bg-secondary border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All</option>
          <option value="done">Done</option>
          <option value="failed">Failed</option>
          <option value="no_url">No URL</option>
          <option value="fetching">Fetching</option>
          <option value="extracting">Extracting</option>
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} of {results.length}</span>
      </div>

      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">No results match your filter.</div>
        )}
        {filtered.map((r) => (
          <div key={r.university_id}>
            <button
              onClick={() => toggle(r.university_id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 text-start"
            >
              {uniStatusIcon(r.status)}
              <span className="flex-1 text-sm font-medium truncate">{r.university_name}</span>
              {r.website_url && (
                <span className="text-xs text-muted-foreground truncate max-w-48 hidden md:block">{r.website_url}</span>
              )}
              <span className="text-xs text-muted-foreground shrink-0">{r.pages_fetched} page{r.pages_fetched !== 1 ? 's' : ''}</span>
              {r.fees_saved > 0 && (
                <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full shrink-0">{r.fees_saved} fee{r.fees_saved !== 1 ? 's' : ''}</span>
              )}
              {expanded.has(r.university_id) ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
            {expanded.has(r.university_id) && (
              <div className="px-4 pb-3 pt-1 bg-secondary/30 text-xs text-muted-foreground space-y-1">
                <p>Status: <span className="capitalize text-foreground">{r.status}</span></p>
                {r.website_url && <p>Website: <a href={r.website_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{r.website_url}</a></p>}
                <p>Pages fetched: {r.pages_fetched}</p>
                <p>Fees saved: {r.fees_saved}</p>
                {r.error && <p className="text-red-400">Error: {r.error}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminFeeCrawlerPage() {
  const [jobs, setJobs] = useState<AdminFeeCrawlJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [universities, setUniversities] = useState<FeeCrawlerUniversity[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<AdminFeeCrawlJob | null>(null);
  const [showResults, setShowResults] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadJobs = async () => {
    try {
      const data = await adminApi.feeCrawler.jobs.list();
      setJobs(data);
      const running = data.find((j) => j.status === 'running' || j.status === 'pending');
      if (running) {
        setActiveJob(running);
        startPolling(running.id);
      } else if (data[0]) {
        setActiveJob(data[0]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadUniversities = async () => {
    try {
      const data = await adminApi.feeCrawler.universities();
      setUniversities(data);
    } catch {}
  };

  const startPolling = (jobId: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const job = await adminApi.feeCrawler.jobs.get(jobId);
        setActiveJob(job);
        if (job.status === 'success' || job.status === 'failed') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          loadJobs();
        }
      } catch {}
    }, 3000);
  };

  useEffect(() => {
    loadJobs();
    loadUniversities();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleRun = async () => {
    setLaunching(true);
    setError(null);
    try {
      const ids = selectedIds.size > 0 ? [...selectedIds] : undefined;
      const job = await adminApi.feeCrawler.run(ids);
      setActiveJob(job);
      setJobs((prev) => [job, ...prev]);
      setShowResults(true);
      startPolling(job.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLaunching(false);
    }
  };

  const isRunning = activeJob?.status === 'running' || activeJob?.status === 'pending';

  const withUrl = universities.filter((u) => u.website_url).length;
  const withoutUrl = universities.length - withUrl;

  const progress = activeJob
    ? activeJob.stats.universities_total > 0
      ? Math.round((activeJob.stats.universities_done / activeJob.stats.universities_total) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Fee Crawler
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Uses AI to discover university websites, scrape tuition fee pages, and extract structured fee data.
          </p>
        </div>
        <button
          onClick={loadJobs}
          disabled={loadingJobs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingJobs ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Coverage cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Universities', value: universities.length, color: 'text-foreground' },
          { label: 'Website URL Known', value: withUrl, color: 'text-green-400' },
          { label: 'No URL Yet', value: withoutUrl, color: 'text-amber-400' },
          { label: 'Jobs Run', value: jobs.length, color: 'text-primary' },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Start panel */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Start a Fee Crawl</h2>
          {selectedIds.size > 0 && (
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted-foreground hover:text-foreground">
              Clear selection ({selectedIds.size})
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Leave all unselected to crawl every university. Or pick specific ones below.
        </p>

        {/* University selector */}
        {universities.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-border">
            {universities.map((u) => (
              <label key={u.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-secondary/50">
                <input
                  type="checkbox"
                  checked={selectedIds.has(u.id)}
                  onChange={() => {
                    setSelectedIds((s) => {
                      const n = new Set(s);
                      n.has(u.id) ? n.delete(u.id) : n.add(u.id);
                      return n;
                    });
                  }}
                  className="rounded"
                />
                <span className="flex-1 text-sm truncate">{u.name_en}</span>
                {u.website_url ? (
                  <Globe className="w-3.5 h-3.5 text-green-400 shrink-0" title={u.website_url} />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" title="No website URL" />
                )}
              </label>
            ))}
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={launching || isRunning}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {launching || isRunning ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{isRunning ? 'Running…' : 'Starting…'}</>
          ) : (
            <><Play className="w-4 h-4" />Start Crawl {selectedIds.size > 0 ? `(${selectedIds.size} universities)` : '(All)'}</>
          )}
        </button>
      </div>

      {/* Active job */}
      {activeJob && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">Job #{activeJob.id}</h2>
              {statusBadge(activeJob.status)}
            </div>
            <span className="text-xs text-muted-foreground">{fmt(activeJob.started_at)}</span>
          </div>

          {/* Progress bar */}
          {activeJob.stats.universities_total > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{activeJob.stats.universities_done} / {activeJob.stats.universities_total} universities</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'With Fees', value: activeJob.stats.universities_with_fees, color: 'text-green-400' },
              { label: 'No URL', value: activeJob.stats.universities_no_url, color: 'text-amber-400' },
              { label: 'Failed', value: activeJob.stats.universities_failed, color: 'text-red-400' },
              { label: 'Fee Rows Saved', value: activeJob.stats.fees_saved, color: 'text-primary' },
            ].map((s) => (
              <div key={s.label} className="bg-secondary/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {activeJob.error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{activeJob.error}</div>
          )}

          {/* Per-university results */}
          {activeJob.stats.results.length > 0 && (
            <div>
              <button
                onClick={() => setShowResults((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-3"
              >
                {showResults ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showResults ? 'Hide' : 'Show'} university results ({activeJob.stats.results.length})
              </button>
              {showResults && <JobResults results={activeJob.stats.results} />}
            </div>
          )}
        </div>
      )}

      {/* Job history */}
      {jobs.length > 1 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold">Job History</h2>
          </div>
          <div className="divide-y divide-border">
            {jobs.slice(1).map((job) => (
              <div
                key={job.id}
                onClick={() => setActiveJob(job)}
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-secondary/40 transition-colors"
              >
                <span className="text-sm text-muted-foreground w-12">#{job.id}</span>
                {statusBadge(job.status)}
                <span className="flex-1 text-sm text-muted-foreground">{fmt(job.started_at)}</span>
                <span className="text-sm">{job.stats.fees_saved} fees</span>
                <span className="text-sm text-muted-foreground">{job.stats.universities_done}/{job.stats.universities_total} unis</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
