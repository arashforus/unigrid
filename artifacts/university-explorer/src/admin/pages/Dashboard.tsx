import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/admin/api';
import { Users, Building2, BookOpen, ClipboardList, Loader2, ArrowUpRight } from 'lucide-react';
import { Link } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  converted: 'Converted',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400',
  contacted: 'bg-amber-500/15 text-amber-400',
  in_progress: 'bg-primary/15 text-primary',
  converted: 'bg-emerald-500/15 text-emerald-400',
  closed: 'bg-muted text-muted-foreground',
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: data.total_users, icon: Users, href: '/admin/users' },
    { label: 'Universities', value: data.total_universities, icon: Building2, href: '/admin/universities' },
    { label: 'Courses', value: data.total_programs, icon: BookOpen, href: '/admin/courses' },
    { label: 'New Inquiries', value: data.new_inquiries, icon: ClipboardList, href: '/admin/tasks' },
  ];

  const chartData = data.inquiries_by_day.map((d) => ({ day: d.day.slice(5), count: d.count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your platform's activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <c.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Inquiries (Last 14 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Recent Inquiries</h2>
          <div className="space-y-3">
            {data.recent_inquiries.length === 0 && (
              <p className="text-sm text-muted-foreground">No inquiries yet.</p>
            )}
            {data.recent_inquiries.map((task) => (
              <div key={task.id} className="flex items-start justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{task.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{task.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[task.status] ?? 'bg-secondary text-foreground'}`}>
                  {STATUS_LABELS[task.status] ?? task.status}
                </span>
              </div>
            ))}
          </div>
          <Link href="/admin/tasks" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            View all tasks <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
