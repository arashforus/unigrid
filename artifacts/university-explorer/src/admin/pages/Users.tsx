import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminUser } from '@/admin/api';
import { useAuth } from '@/contexts/auth';
import { Loader2, Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const { data: users, isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.users.list });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.users.updateRole(id, role),
    onSuccess: () => { setError(''); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.remove(id),
    onSuccess: () => { setError(''); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage accounts and admin access.</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-start text-muted-foreground">
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
                  <td className="px-5 py-3.5 font-medium">{u.name}{u.id === me?.id && <span className="ms-2 text-xs text-muted-foreground font-normal">(you)</span>}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={u.role}
                        onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                        className="text-xs bg-input border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="student">student</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMutation.mutate(u.id); }}
                        disabled={u.id === me?.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
