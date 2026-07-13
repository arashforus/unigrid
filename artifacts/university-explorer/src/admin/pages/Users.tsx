import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminUser } from '@/admin/api';
import { useAuth } from '@/contexts/auth';
import { Loader2, Trash2, ShieldCheck, User as UserIcon, Pencil, Plus, X, Eye, EyeOff } from 'lucide-react';

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50";

// ─── Add User Modal ───────────────────────────────────────────────────────────
function AddUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => adminApi.users.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal title="Add New User" onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

        <Field label="Full Name">
          <input className={inputCls} placeholder="e.g. Jane Doe" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>

        <Field label="Email">
          <input className={inputCls} type="email" placeholder="jane@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              className={inputCls + ' pr-10'}
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground transition-colors">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Role">
          <select className={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary transition-colors">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.email || !form.password}
            className="px-5 py-2 text-sm rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create User
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: user.name, email: user.email, password: '', role: user.role });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      return adminApi.users.update(user.id, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal title={`Edit — ${user.name}`} onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

        <Field label="Full Name">
          <input className={inputCls} placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>

        <Field label="Email">
          <input className={inputCls} type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>

        <Field label="New Password">
          <div className="relative">
            <input
              className={inputCls + ' pr-10'}
              type={showPw ? 'text' : 'password'}
              placeholder="Leave blank to keep current"
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground transition-colors">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Role">
          <select className={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-secondary transition-colors">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.email}
            className="px-5 py-2 text-sm rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const { data: users, isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.users.list });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.remove(id),
    onSuccess: () => { setError(''); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage accounts and admin access.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_-8px_hsl(var(--primary))]"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-start font-medium px-5 py-3">Name</th>
                <th className="text-start font-medium px-5 py-3">Email</th>
                <th className="text-start font-medium px-5 py-3">Role</th>
                <th className="text-start font-medium px-5 py-3">Joined</th>
                <th className="text-end font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u: AdminUser) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium">
                    {u.name}
                    {u.id === me?.id && <span className="ms-2 text-xs text-muted-foreground font-normal">(you)</span>}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(u)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit user"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete ${u.name}? This cannot be undone.`)) deleteMutation.mutate(u.id); }}
                        disabled={u.id === me?.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} />}
      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
