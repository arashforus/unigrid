import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminUniversity } from '@/admin/api';
import { Loader2, Plus, Pencil, Trash2, X, ExternalLink } from 'lucide-react';

type FormState = Partial<AdminUniversity>;

const EMPTY_FORM: FormState = {
  name_en: '', name_tr: '', name_fa: '', name_ar: '',
  slug: '', type: 'state',
  city_en: '', city_tr: '', city_fa: '', city_ar: '',
  website_url: '', apply_url_international: '', logo_url: '',
  description_en: '', description_tr: '', description_fa: '', description_ar: '',
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminUniversitiesPage() {
  const qc = useQueryClient();
  const { data: universities, isLoading } = useQuery({ queryKey: ['admin', 'universities'], queryFn: adminApi.universities.list });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: FormState) => adminApi.universities.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'universities'] }); closeModal(); },
    onError: (e: Error) => setError(e.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormState }) => adminApi.universities.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'universities'] }); closeModal(); },
    onError: (e: Error) => setError(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.universities.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'universities'] }),
    onError: (e: Error) => alert(e.message),
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }
  function openEdit(u: AdminUniversity) {
    setEditingId(u.id);
    setForm(u);
    setError('');
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Universities</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage the universities listed on the site.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add University
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-start font-medium px-5 py-3">Name</th>
                <th className="text-start font-medium px-5 py-3">City</th>
                <th className="text-start font-medium px-5 py-3">Type</th>
                <th className="text-start font-medium px-5 py-3">Slug</th>
                <th className="text-end font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {universities?.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{u.name_en}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.city_en}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary capitalize">{u.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{u.slug}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {u.website_url && (
                        <a href={u.website_url} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => openEdit(u)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete ${u.name_en}?`)) deleteMutation.mutate(u.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {universities?.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No universities yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{editingId ? 'Edit University' : 'Add University'}</h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Name (EN)" value={form.name_en} onChange={(v) => setForm((f) => ({ ...f, name_en: v, slug: editingId ? f.slug : slugify(v) }))} required />
                <Field label="Name (TR)" value={form.name_tr} onChange={(v) => setForm((f) => ({ ...f, name_tr: v }))} required />
                <Field label="Name (FA)" value={form.name_fa} onChange={(v) => setForm((f) => ({ ...f, name_fa: v }))} required dir="rtl" />
                <Field label="Name (AR)" value={form.name_ar} onChange={(v) => setForm((f) => ({ ...f, name_ar: v }))} required dir="rtl" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Slug" value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} required mono />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type</label>
                  <select
                    value={form.type ?? 'state'}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="state">State</option>
                    <option value="private">Private</option>
                    <option value="foundation">Foundation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="City (EN)" value={form.city_en} onChange={(v) => setForm((f) => ({ ...f, city_en: v }))} required />
                <Field label="City (TR)" value={form.city_tr} onChange={(v) => setForm((f) => ({ ...f, city_tr: v }))} required />
                <Field label="City (FA)" value={form.city_fa} onChange={(v) => setForm((f) => ({ ...f, city_fa: v }))} required dir="rtl" />
                <Field label="City (AR)" value={form.city_ar} onChange={(v) => setForm((f) => ({ ...f, city_ar: v }))} required dir="rtl" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Field label="Website URL" value={form.website_url ?? ''} onChange={(v) => setForm((f) => ({ ...f, website_url: v }))} />
                <Field label="International Application URL" value={form.apply_url_international ?? ''} onChange={(v) => setForm((f) => ({ ...f, apply_url_international: v }))} />
                <Field label="Logo URL" value={form.logo_url ?? ''} onChange={(v) => setForm((f) => ({ ...f, logo_url: v }))} />
              </div>

              <TextAreaField label="Description (EN)" value={form.description_en ?? ''} onChange={(v) => setForm((f) => ({ ...f, description_en: v }))} />
              <TextAreaField label="Description (TR)" value={form.description_tr ?? ''} onChange={(v) => setForm((f) => ({ ...f, description_tr: v }))} />
              <TextAreaField label="Description (FA)" value={form.description_fa ?? ''} onChange={(v) => setForm((f) => ({ ...f, description_fa: v }))} dir="rtl" />
              <TextAreaField label="Description (AR)" value={form.description_ar ?? ''} onChange={(v) => setForm((f) => ({ ...f, description_ar: v }))} dir="rtl" />

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create University'}
                </button>
                <button type="button" onClick={closeModal} className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/70 font-semibold transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, mono, dir }: { label: string; value?: string; onChange: (v: string) => void; required?: boolean; mono?: boolean; dir?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type="text"
        required={required}
        dir={dir}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, dir }: { label: string; value: string; onChange: (v: string) => void; dir?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <textarea
        dir={dir}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
      />
    </div>
  );
}
