import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminCrawlJob } from '@/admin/api';
import { Loader2, PlayCircle, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

const STATUS_META: Record<AdminCrawlJob['status'], { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', className: 'border-border bg-secondary/30 text-muted-foreground', icon: Clock },
  running: { label: 'Running', className: 'border-primary/40 bg-primary/5 text-primary', icon: Loader2 },
  success: { label: 'Success', className: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-500', icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'border-destructive/40 bg-destructive/5 text-destructive', icon: XCircle },
};

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary/40 px-3 py-2">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function JobCard({ job }: { job: AdminCrawlJob }) {
  const meta = STATUS_META[job.status];
  const Icon = meta.icon;
  const isRunning = job.status === 'running' || job.status === 'pending';

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <StatCell label="Universities" value={job.stats.universities_created + job.stats.universities_updated} />
        <StatCell label="Faculties" value={job.stats.faculties_created} />
        <StatCell label="Programs" value={job.stats.programs_created + job.stats.programs_updated} />
        <StatCell label="Fees updated" value={job.stats.fees_updated} />
      </div>

      {job.error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{job.error}</span>
        </div>
      )}

      {job.stats.errors.length > 0 && (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium">
            {job.stats.errors.length} item{job.stats.errors.length === 1 ? '' : 's'} skipped — details
          </summary>
          <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
            {job.stats.errors.map((e, i) => (
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Crawler</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pulls universities &amp; programs from YÖK Atlas and tuition fees from configured university adapters.
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

      {runMutation.isError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {(runMutation.error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <div className="text-center text-muted-foreground py-16 border border-dashed border-border rounded-2xl">
              No crawl jobs yet. Click &quot;Run Crawler&quot; to fetch data for the first time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
