import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminCrawlJob } from '@/admin/api';
import { Loader2, PlayCircle, CheckCircle2, XCircle, Clock, AlertTriangle, GraduationCap, Info, Wifi, WifiOff } from 'lucide-react';

const WAF_MARKER = "Graduate endpoint (lisansustu-kilavuz) is WAF-blocked";

const STATUS_META: Record<AdminCrawlJob['status'], { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', className: 'border-border bg-secondary/30 text-muted-foreground', icon: Clock },
  running: { label: 'Running', className: 'border-primary/40 bg-primary/5 text-primary', icon: Loader2 },
  success: { label: 'Success', className: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-500', icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'border-destructive/40 bg-destructive/5 text-destructive', icon: XCircle },
};

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary/40 px-3 py-2">
      <p className="text-lg font-bold leading-none">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function JobCard({ job }: { job: AdminCrawlJob }) {
  const meta = STATUS_META[job.status];
  const Icon = meta.icon;
  const isRunning = job.status === 'running' || job.status === 'pending';

  // Separate WAF-block notice from regular per-item errors
  const wafError = job.stats.errors.find((e) => e.startsWith(WAF_MARKER));
  const itemErrors = job.stats.errors.filter((e) => !e.startsWith(WAF_MARKER));

  return (
    <div className={`rounded-2xl border p-5 ${meta.className.split(' ').filter((c) => c.startsWith('border') || c.startsWith('bg')).join(' ')}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold">Job #{job.id} · {job.source}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Started {new Date(job.started_at).toLocaleString()}
            {job.finished_at && ` · finished ${new Date(job.finished_at).toLocaleString()}`}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${meta.className}`}>
          <Icon className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          {meta.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <StatCell label="Universities" value={job.stats.universities_created + job.stats.universities_updated} />
        <StatCell label="Faculties" value={job.stats.faculties_created} />
        <StatCell label="Programs" value={job.stats.programs_created + job.stats.programs_updated} />
        <StatCell label="Fees updated" value={job.stats.fees_updated} />
      </div>

      {job.error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{job.error}</span>
        </div>
      )}

      {/* WAF block notice — shown as a prominent warning, not buried in errors */}
      {wafError && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-3">
          <WifiOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div className="text-sm">
            <p className="font-semibold text-amber-500 mb-1">Graduate endpoint blocked by YÖK Atlas firewall</p>
            <p className="text-muted-foreground leading-relaxed">
              The YÖK Atlas firewall blocked requests to the Master's &amp; Doctorate endpoint from this
              server's IP address. <strong>Bachelor &amp; Associate programs were still imported normally.</strong>
            </p>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              To also import <strong>Master's &amp; Doctorate</strong> programs, deploy the app to production
              (Deploy → Publish) and run the crawler from there — production servers use a different IP
              that is not rate-limited.
            </p>
          </div>
        </div>
      )}

      {itemErrors.length > 0 && (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium">
            {itemErrors.length} item{itemErrors.length === 1 ? '' : 's'} skipped — details
          </summary>
          <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
            {itemErrors.map((e, i) => (
              <li key={i} className="text-xs bg-background/50 rounded-lg px-2 py-1.5">{e}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function AdminCrawlerPage() {
  const qc = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['admin', 'crawler', 'jobs'],
    queryFn: adminApi.crawler.jobs.list,
    refetchInterval: (query) => {
      const list = query.state.data as AdminCrawlJob[] | undefined;
      const hasActive = list?.some((j) => j.status === 'running' || j.status === 'pending');
      return hasActive ? 2000 : false;
    },
  });

  const runMutation = useMutation({
    mutationFn: adminApi.crawler.run,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'crawler', 'jobs'] }),
  });

  const activeJob = jobs?.find((j) => j.status === 'running' || j.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Crawler</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pulls all degree types from YÖK Atlas and tuition fees from configured university adapters.
          </p>
        </div>
        <button
          onClick={() => runMutation.mutate()}
          disabled={!!activeJob || runMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {runMutation.isPending || activeJob ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PlayCircle className="w-4 h-4" />
          )}
          {activeJob ? 'Crawl running…' : 'Run Crawler'}
        </button>
      </div>

      {/* Coverage info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <Wifi className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Undergraduate · tercih-kilavuz API</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-foreground">Bachelor</span> + <span className="font-medium text-foreground">Associate</span> degrees — sourced from the ÖSYM placement guide. Always accessible.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <GraduationCap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Graduate · lisansustu-kilavuz API</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-foreground">Master's</span> + <span className="font-medium text-foreground">Doctorate</span> degrees — may be WAF-blocked on dev. Works from production deployment.
            </p>
          </div>
        </div>
      </div>

      {runMutation.isError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {(runMutation.error as Error).message}
        </div>
      )}

      {/* Job list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16 border border-dashed border-border rounded-2xl gap-3">
              <GraduationCap className="w-8 h-8 opacity-40" />
              <div>
                <p className="font-medium">No crawl jobs yet</p>
                <p className="text-sm mt-1">Click "Run Crawler" to import universities and programs from YÖK Atlas.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
