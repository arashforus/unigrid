import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type NewsItem, type NewsItemInput } from '@/admin/api';
import {
  Newspaper, Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff,
  Search, Calendar, User, Tag, Image, AlertCircle, CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'event', label: 'Event' },
  { value: 'admission', label: 'Admission' },
  { value: 'campus', label: 'Campus Life' },
];

const CAT_COLORS: Record<string, string> = {
  general: 'bg-secondary text-foreground',
  announcement: 'bg-blue-500/15 text-blue-400',
  scholarship: 'bg-emerald-500/15 text-emerald-400',
  event: 'bg-violet-500/15 text-violet-400',
  admission: 'bg-amber-500/15 text-amber-400',
  campus: 'bg-primary/15 text-primary',
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Empty form ────────────────────────────────────────────────────────────────

const EMPTY: NewsItemInput = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  cover_image_url: '',
  category: 'general',
  author: '',
  is_published: false,
};

// ── Form modal ────────────────────────────────────────────────────────────────

function NewsFormModal({
  initial,
  onClose,
  onSave,
  saving,
  error,
}: {
  initial: NewsItemInput;
  onClose: () => void;
  onSave: (data: NewsItemInput) => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<NewsItemInput>(initial);
  const [slugEdited, setSlugEdited] = useState(!!initial.slug);
  const [activeTab, setActiveTab] = useState<'basic' | 'content'>('basic');

  function set<K extends keyof NewsItemInput>(k: K, v: NewsItemInput[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'title' && !slugEdited) next.slug = slugify(v as string);
      return next;
    });
  }

  const isEdit = !!initial.slug;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-2xl my-8 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold">{isEdit ? 'Edit News Item' : 'Add News Item'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {(['basic', 'content'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'basic' ? 'Basic Info' : 'Content & Media'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && (
            <>
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="News headline…"
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Slug <span className="text-destructive">*</span>
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => { setSlugEdited(true); set('slug', slugify(e.target.value)); }}
                  placeholder="url-friendly-slug"
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-generated from title. Only lowercase letters, numbers, and hyphens.</p>
              </div>

              {/* Summary */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Summary</label>
                <textarea
                  value={form.summary ?? ''}
                  onChange={(e) => set('summary', e.target.value)}
                  rows={3}
                  placeholder="Short description shown in news cards…"
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Category + Author row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Author</label>
                  <input
                    value={form.author ?? ''}
                    onChange={(e) => set('author', e.target.value)}
                    placeholder="e.g. UniTurkey Team"
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Published toggle */}
              <div className="flex items-center justify-between p-4 bg-secondary/40 rounded-xl">
                <div>
                  <p className="text-sm font-semibold">Published</p>
                  <p className="text-xs text-muted-foreground">Visible to public when enabled</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('is_published', !form.is_published)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_published ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </>
          )}

          {activeTab === 'content' && (
            <>
              {/* Cover image */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  <Image className="w-3.5 h-3.5 inline-block mr-1" />Cover Image URL
                </label>
                <input
                  value={form.cover_image_url ?? ''}
                  onChange={(e) => set('cover_image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {form.cover_image_url && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-border h-36 bg-secondary/30">
                    <img
                      src={form.cover_image_url}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Full Content</label>
                <textarea
                  value={form.content ?? ''}
                  onChange={(e) => set('content', e.target.value)}
                  rows={14}
                  placeholder="Write the full news article here. Markdown is supported."
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">Markdown supported — **bold**, *italic*, ## headers, [links](url), etc.</p>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border">
          <div className="flex gap-2">
            {(['basic', 'content'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-2 h-2 rounded-full transition-colors ${activeTab === tab ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold bg-secondary hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={saving || !form.title.trim() || !form.slug.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Article'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({ item, onClose, onConfirm, deleting }: {
  item: NewsItem; onClose: () => void; onConfirm: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="text-lg font-bold text-center mb-1">Delete article?</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          "<span className="font-medium text-foreground">{item.title}</span>" will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary hover:bg-secondary/80 transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminNewsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [modal, setModal] = useState<null | { mode: 'create' } | { mode: 'edit'; item: NewsItem }>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'news'],
    queryFn: adminApi.news.list,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.news.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'news'] }); setModal(null); setFormError(null); },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NewsItemInput> }) => adminApi.news.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'news'] }); setModal(null); setFormError(null); },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.news.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'news'] }); setDeleteTarget(null); },
  });

  const togglePublish = (item: NewsItem) =>
    updateMutation.mutate({ id: item.id, data: { is_published: !item.is_published } });

  // Reset form error when modal opens
  useEffect(() => { setFormError(null); }, [modal]);

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || (item.summary ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || item.category === catFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'published' ? item.is_published : !item.is_published);
    return matchSearch && matchCat && matchStatus;
  });

  const published = items.filter((i) => i.is_published).length;
  const drafts = items.length - published;

  function handleSave(data: NewsItemInput) {
    setFormError(null);
    if (modal?.mode === 'create') createMutation.mutate(data);
    else if (modal?.mode === 'edit') updateMutation.mutate({ id: modal.item.id, data });
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" /> News
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage news articles and announcements shown on the platform.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Article
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Articles', value: items.length, color: 'text-foreground' },
          { label: 'Published', value: published, color: 'text-emerald-400' },
          { label: 'Drafts', value: drafts, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="w-full bg-input border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-secondary/40 rounded-xl p-1">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${statusFilter === s ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-input border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Newspaper className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-lg mb-1">{items.length === 0 ? 'No articles yet' : 'No results'}</p>
            <p className="text-sm text-muted-foreground mb-5">
              {items.length === 0
                ? 'Add your first news article to get started.'
                : 'Try adjusting your search or filters.'}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => setModal({ mode: 'create' })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add First Article
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Article</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Author</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="text-end px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    {/* Article */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.cover_image_url ? (
                          <img
                            src={item.cover_image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-secondary"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
                            <Newspaper className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-xs">{item.title}</p>
                          {item.summary && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{item.summary}</p>
                          )}
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">/{item.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CAT_COLORS[item.category] ?? 'bg-secondary text-foreground'}`}>
                        {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {item.author ? (
                          <><User className="w-3 h-3" />{item.author}</>
                        ) : (
                          <span className="italic">—</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(item)}
                        disabled={updateMutation.isPending}
                        title={item.is_published ? 'Click to unpublish' : 'Click to publish'}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                          item.is_published
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                        }`}
                      >
                        {item.is_published
                          ? <><CheckCircle2 className="w-3 h-3" /> Published</>
                          : <><EyeOff className="w-3 h-3" /> Draft</>}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {item.published_at ? formatDate(item.published_at) : formatDate(item.created_at)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setModal({ mode: 'edit', item }); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <NewsFormModal
          initial={modal.mode === 'edit' ? {
            title: modal.item.title,
            slug: modal.item.slug,
            summary: modal.item.summary,
            content: modal.item.content,
            cover_image_url: modal.item.cover_image_url,
            category: modal.item.category,
            author: modal.item.author,
            is_published: modal.item.is_published,
          } : EMPTY}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
          error={formError}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
