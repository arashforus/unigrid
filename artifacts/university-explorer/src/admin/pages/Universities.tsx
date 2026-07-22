import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminUniversity } from '@/admin/api';
import {
  Loader2, Plus, Pencil, Trash2, X, ExternalLink,
  Search, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';

const PAGE_SIZE = 10;

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
  const { data: universities = [], isLoading } = useQuery({
    queryKey: ['admin', 'universities'],
    queryFn: adminApi.universities.list,
  });

  // ── Toolbar state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [page, setPage] = useState(1);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: FormState) => adminApi.universities.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'universities'] }); closeModal(); },
    onError: (e: Error) => setFormError(e.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormState }) => adminApi.universities.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'universities'] }); closeModal(); },
    onError: (e: Error) => setFormError(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.universities.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'universities'] }),
    onError: (e: Error) => alert(e.message),
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openCreate() {
    setEditingId(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true);
  }
  function openEdit(u: AdminUniversity) {
    setEditingId(u.id); setForm(u); setFormError(''); setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setFormError(''); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  }
  const saving = createMutation.isPending || updateMutation.isPending;

  // ── Derived city options ──────────────────────────────────────────────────
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    universities.forEach((u) => { if (u.city_en) set.add(u.city_en); });
    return [...set].sort();
  }, [universities]);

  // ── Filtered + paginated data ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return universities.filter((u) => {
      if (typeFilter && u.type !== typeFilter) return false;
      if (cityFilter && u.city_en !== cityFilter) return false;
      if (q) {
        const hay = `${u.name_en} ${u.name_tr} ${u.city_en} ${u.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [universities, search, typeFilter, cityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 whenever filters change
  function updateSearch(v: string) { setSearch(v); setPage(1); }
  function updateType(v: string) { setTypeFilter(v); setPage(1); }
  function updateCity(v: string) { setCityFilter(v); setPage(1); }

  const hasFilters = search || typeFilter || cityFilter;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Universities</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? 'Loading…' : `${filtered.length} of ${universities.length} universities`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add University
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, city, or slug…"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-xl ps-9 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => updateSearch('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={typeFilter}
            onChange={(e) => updateType(e.target.value)}
            className="bg-input border border-border rounded-xl ps-9 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer pr-8"
          >
            <option value="">All types</option>
            <option value="state">State</option>
            <option value="private">Private</option>
            <option value="foundation">Foundation</option>
          </select>
        </div>

        {/* City filter */}
        {cityOptions.length > 0 && (
          <div className="relative">
            <Filter className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={cityFilter}
              onChange={(e) => updateCity(e.target.value)}
              className="bg-input border border-border rounded-xl ps-9 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer pr-8"
            >
              <option value="">All cities</option>
              {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={() => { updateSearch(''); updateType(''); updateCity(''); }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 transition-all"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
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
              {pageItems.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{u.name_en}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.city_en}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      u.type === 'state'
                        ? 'bg-blue-500/15 text-blue-400'
                        : u.type === 'private'
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {u.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{u.slug}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {u.website_url && (
                        <a
                          href={u.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => openEdit(u)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
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
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    {hasFilters ? 'No universities match your filters.' : 'No universities yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </PaginationButton>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === 'ellipsis' ? (
                  <span key={`e${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      safePage === item
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <PaginationButton
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </PaginationButton>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
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
              {formError && (
                <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{formError}</div>
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

// ── Shared sub-components ────────────────────────────────────────────────────

function PaginationButton({ children, onClick, disabled, label }: { children: React.ReactNode; onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, required, mono, dir }: {
  label: string; value?: string; onChange: (v: string) => void;
  required?: boolean; mono?: boolean; dir?: string;
}) {
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

function TextAreaField({ label, value, onChange, dir }: {
  label: string; value: string; onChange: (v: string) => void; dir?: string;
}) {
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
