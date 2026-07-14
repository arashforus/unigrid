import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth';
import {
  LayoutDashboard, Users, Building2, BookOpen, BarChart3,
  ClipboardList, Settings as SettingsIcon, MapPin, LogOut, ShieldAlert, Loader2, Bot,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/universities', label: 'Universities', icon: Building2 },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/crawler', label: 'Crawler', icon: Bot },
  { href: '/admin/statistics', label: 'Statistics', icon: BarChart3 },
  { href: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground text-sm mb-6">You need to sign in with an admin account to access this area.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access denied</h1>
          <p className="text-muted-foreground text-sm mb-6">Your account does not have admin privileges.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-semibold">
            Back to site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-e border-border bg-card/40 flex flex-col fixed inset-y-0 start-0 z-40">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_-3px_hsl(var(--primary))]">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Uni<span className="text-primary">Turkey</span>
          </span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? location === item.href : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors mt-1"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <MapPin className="w-4 h-4" />
            View Site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ms-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
