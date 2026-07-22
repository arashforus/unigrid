import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminProgram } from '@/admin/api';
import { Loader2, Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

type FormState = {
  faculty_id?: number;
  name_en: string; name_tr: string; name_fa: string; name_ar: string;
  yok_atlas_code?: string;
  degree_type: string;
  language: string;
  duration_years: number;
  is_active: boolean;
  tuition_fee: {
    academic_year: string;
    domestic_fee: string;
    international_fee: string;
    domestic_currency: string;
    international_currency: string;
  };
};

const EMPTY_FORM: FormState = {
  faculty_id: undefined,
  name_en: '', name_tr: '', name_fa: '', name_ar: '',
  yok_atlas_code: '',
  degree_type: 'bachelor',
  language: 'English',
  duration_years: 4,
  is_active: true,
  tuition_fee: { academic_year: '2024-2025', domestic_fee: '', international_fee: '', domestic_currency: 'TRY', international_currency: 'TRY' },
};

export default function AdminCoursesPage() {
  const qc = useQueryClient();
  const { data: programs, isLoading } = useQuery({ queryKey: ['admin', 'programs'], queryFn: adminApi.programs.list });
  const { data: faculties } = useQuery({ queryKey: ['admin', 'faculties'], queryFn: adminApi.faculties.list });

  // filters
  const [search, setSearch] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('');
  const [filterDegree, setFilterDegree] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: FormState) => adminApi.programs.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'programs'] }); closeModal(); },
    onError: (e: Error) => setError(e.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormState }) => adminApi.programs.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'programs'] }); closeModal(); },
    onError: (e: Error) => setError(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.programs.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'programs'] }),
    onError: (e: Error) => alert(e.message),
  });

  // derived: unique universities from loaded programs
  const universities = useMemo(() => {
    if (!programs) return [];
    const seen = new Map<string, string>();
    for (const p of programs) {
      if (p.university_name) seen.set(p.university_name, p.university_name);
    }
    return [...seen.keys()].sort();
  }, [programs]);

  // filtered + paginated rows
  const filtered = useMemo(() => {
    if (!programs) return [];
    const q = search.toLowerCase();
    return programs.filter((p) => {
      if (q && !p.name_en.toLowerCase().includes(q) && !p.name_tr.toLowerCase().includes(q)) return false;
      if (filterUniversity && p.university_name !== filterUniversity) return false;
      if (filterDegree && p.degree_type !== filterDegree) return false;
      if (filterStatus === 'active' && !p.is_active) return false;
      if (filterStatus === 'inactive' && p.is_active) return false;
      return true;
    });
  }, [programs, search, filterUniversity, filterDegree, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetPage() { setPage(1); }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, faculty_id: faculties?.[0]?.id });
    setError('');
    setModalOpen(true);
  }
  function openEdit(p: AdminProgram) {
    setEditingId(p.id);
    const fee = p.tuition_fees[0];
    setForm({
      faculty_id: p.faculty_id,
      name_en: p.name_en, name_tr: p.name_tr, name_fa: p.name_fa, name_ar: p.name_ar,
      yok_atlas_code: p.yok_atlas_code ?? '',
      degree_type: p.degree_type,
      language: p.language,
      duration_years: p.duration_years,
      is_active: p.is_active,
      tuition_fee: {
        academic_year: fee?.academic_year ?? '2024-2025',
        domestic_fee: fee?.domestic_fee ?? '',
        international_fee: fee?.international_fee ?? '',
        domestic_currency: fee?.domestic_currency ?? 'TRY',
        international_currency: fee?.international_currency ?? 'TRY',
      },
    });
    setError('');
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setError(''); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.faculty_id) { setError('Please select a faculty'); return; }
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const hasFilters = search || filterUniversity || filterDegree || filterStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? 'Loading…' : `${filtered.length} of ${programs?.length ?? 0} programs`}
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={!faculties?.length}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <select
          value={filterUniversity}
          onChange={(e) => { setFilterUniversity(e.target.value); resetPage(); }}
          className="bg-input border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All universities</option>
          {universities.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>

        <select
          value={filterDegree}
          onChange={(e) => { setFilterDegree(e.target.value); resetPage(); }}
          className="bg-input border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All degrees</option>
          <option value="associate">Associate</option>
          <option value="bachelor">Bachelor</option>
          <option value="master">Master</option>
          <option value="doctorate">Doctorate</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
          className="bg-input border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterUniversity(''); setFilterDegree(''); setFilterStatus(''); resetPage(); }}
            className="px-3 py-2.5 rounded-xl bg-secondary hover:bg-secondary/70 text-sm font-medium transition-colors flex items-center gap-1.5"
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
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-start font-medium px-5 py-3">Course</th>
                  <th className="text-start font-medium px-5 py-3">University</th>
                  <th className="text-start font-medium px-5 py-3">Degree</th>
                  <th className="text-start font-medium px-5 py-3">Language</th>
                  <th className="text-start font-medium px-5 py-3">Tuition</th>
                  <th className="text-start font-medium px-5 py-3">Status</th>
                  <th className="text-end font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => {
                  const fee = p.tuition_fees[0];
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium max-w-64">
                        <div className="truncate" title={p.name_en}>{p.name_en}</div>
                        {p.name_tr && p.name_tr !== p.name_en && (
                          <div className="text-xs text-muted-foreground truncate" title={p.name_tr}>{p.name_tr}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{p.university_name}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary capitalize whitespace-nowrap">{p.degree_type}</span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{p.language}</td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                        {fee?.international_fee
                          ? `${parseFloat(fee.international_fee).toLocaleString()} ${fee.international_currency}`
                          : fee?.domestic_fee
                          ? `${parseFloat(fee.domestic_fee).toLocaleString()} ${fee.domestic_currency}`
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-secondary text-muted-foreground'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete ${p.name_en}?`)) deleteMutation.mutate(p.id); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      {hasFilters ? 'No courses match your filters.' : 'No courses yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border text-sm text-muted-foreground">
                <span>
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                    .reduce<(number | '…')[]>((acc, n, i, arr) => {
                      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === '…' ? (
                        <span key={`ellipsis-${i}`} className="px-1">…</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item as number)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            item === safePage ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{editingId ? 'Edit Course' : 'Add Course'}</h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">University / Faculty</label>
                <select
                  required
                  value={form.faculty_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, faculty_id: Number(e.target.value) }))}
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="" disabled>Select a faculty</option>
                  {faculties?.map((fac) => (
                    <option key={fac.id} value={fac.id}>{fac.university_name} — {fac.name_en}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Name (EN)" value={form.name_en} onChange={(v) => setForm((f) => ({ ...f, name_en: v }))} required />
                <Field label="Name (TR)" value={form.name_tr} onChange={(v) => setForm((f) => ({ ...f, name_tr: v }))} required />
                <Field label="Name (FA)" value={form.name_fa} onChange={(v) => setForm((f) => ({ ...f, name_fa: v }))} required dir="rtl" />
                <Field label="Name (AR)" value={form.name_ar} onChange={(v) => setForm((f) => ({ ...f, name_ar: v }))} required dir="rtl" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Degree</label>
                  <select
                    value={form.degree_type}
                    onChange={(e) => setForm((f) => ({ ...f, degree_type: e.target.value }))}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="associate">Associate</option>
                    <option value="bachelor">Bachelor</option>
                    <option value="master">Master</option>
                    <option value="doctorate">Doctorate</option>
                  </select>
                </div>
                <Field label="Language" value={form.language} onChange={(v) => setForm((f) => ({ ...f, language: v }))} required />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Duration (years)</label>
                  <input
                    type="number" min={1} max={8} required
                    value={form.duration_years}
                    onChange={(e) => setForm((f) => ({ ...f, duration_years: Number(e.target.value) }))}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <Field label="YÖK Atlas Code (optional)" value={form.yok_atlas_code ?? ''} onChange={(v) => setForm((f) => ({ ...f, yok_atlas_code: v }))} mono />

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-medium">Active / visible on site</span>
              </label>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3">Tuition Fee</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Academic Year" value={form.tuition_fee.academic_year} onChange={(v) => setForm((f) => ({ ...f, tuition_fee: { ...f.tuition_fee, academic_year: v } }))} required />
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <Field label="Domestic Fee" value={form.tuition_fee.domestic_fee} onChange={(v) => setForm((f) => ({ ...f, tuition_fee: { ...f.tuition_fee, domestic_fee: v } }))} />
                      <label className="block text-sm font-medium mt-2 mb-1.5">Domestic Currency</label>
                      <select
                        value={form.tuition_fee.domestic_currency}
                        onChange={(e) => setForm((f) => ({ ...f, tuition_fee: { ...f.tuition_fee, domestic_currency: e.target.value } }))}
                        className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="TRY">TRY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div>
                      <Field label="International Fee" value={form.tuition_fee.international_fee} onChange={(v) => setForm((f) => ({ ...f, tuition_fee: { ...f.tuition_fee, international_fee: v } }))} />
                      <label className="block text-sm font-medium mt-2 mb-1.5">International Currency</label>
                      <select
                        value={form.tuition_fee.international_currency}
                        onChange={(e) => setForm((f) => ({ ...f, tuition_fee: { ...f.tuition_fee, international_currency: e.target.value } }))}
                        className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="TRY">TRY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Course'}
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

function Field({ label, value, onChange, required, mono, dir }: {
  label: string; value?: string; onChange: (v: string) => void;
  required?: boolean; mono?: boolean; dir?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type="text" required={required} dir={dir} value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}
