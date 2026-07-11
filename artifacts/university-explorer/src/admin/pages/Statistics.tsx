import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/admin/api';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#84cc16'];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="font-semibold mb-4">{title}</h2>
      <div className="h-64">{children}</div>
    </div>
  );
}

const tooltipStyle = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 };
const axisTick = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' };

export default function AdminStatisticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats });

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  const signups = data.signups_by_day.map((d) => ({ day: d.day.slice(5), count: d.count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform analytics across universities, courses, and users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Courses by Degree Type">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.by_degree}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Cities by University Count">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.by_city} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={axisTick} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="University Types">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.by_university_type} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                {data.by_university_type.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Instruction Language">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.by_language} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                {data.by_language.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Task Status Breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.by_task_status}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New Signups (Last 30 Days)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={signups}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
