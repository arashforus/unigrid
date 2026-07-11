import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminTask } from '@/admin/api';
import { Loader2, Mail, Phone, Globe } from 'lucide-react';

const STATUSES = ['new', 'contacted', 'in_progress', 'converted', 'closed'];
const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  converted: 'Converted',
  closed: 'Closed',
};
const STATUS_COLORS: Record<string, string> = {
  new: 'border-blue-500/40 bg-blue-500/5',
  contacted: 'border-amber-500/40 bg-amber-500/5',
  in_progress: 'border-primary/40 bg-primary/5',
  converted: 'border-emerald-500/40 bg-emerald-500/5',
  closed: 'border-border bg-secondary/30',
};

export default function AdminTasksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('all');
  const { data: tasks, isLoading } = useQuery({ queryKey: ['admin', 'tasks'], queryFn: adminApi.tasks.list });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.tasks.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tasks'] }),
  });

  const filtered = tasks?.filter((t) => filter === 'all' || t.status === filter) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">Student inquiries and consulting requests.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((task: AdminTask) => (
            <div key={task.id} className={`rounded-2xl border p-5 ${STATUS_COLORS[task.status] ?? 'border-border bg-card'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{task.full_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(task.created_at).toLocaleString()}</p>
                </div>
                <select
                  value={task.status}
                  onChange={(e) => statusMutation.mutate({ id: task.id, status: e.target.value })}
                  className="text-xs bg-input border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 text-sm mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{task.email}</span>
                </div>
                {task.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {task.phone}
                  </div>
                )}
                {task.country && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-3.5 h-3.5 shrink-0" /> {task.country}
                  </div>
                )}
              </div>

              {(task.desired_field || task.degree_type) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {task.degree_type && <span className="text-xs px-2 py-1 rounded-full bg-secondary">{task.degree_type}</span>}
                  {task.desired_field && <span className="text-xs px-2 py-1 rounded-full bg-secondary">{task.desired_field}</span>}
                </div>
              )}

              {task.message && (
                <p className="text-sm text-muted-foreground bg-background/50 rounded-lg p-3 line-clamp-3">{task.message}</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-16">No tasks in this category.</div>
          )}
        </div>
      )}
    </div>
  );
}
