import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminSettings } from '@/admin/api';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';

const FIELDS: { key: keyof AdminSettings; label: string; placeholder?: string; type?: string }[] = [
  { key: 'site_name', label: 'Site Name', placeholder: 'UniTurkey' },
  { key: 'site_tagline', label: 'Tagline', placeholder: 'Your Gateway to Turkish Universities' },
  { key: 'contact_email', label: 'Contact Email', placeholder: 'info@uniturkey.com', type: 'email' },
  { key: 'contact_phone', label: 'Contact Phone', placeholder: '+90 555 000 00 00' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', placeholder: '+90 555 000 00 00' },
  { key: 'featured_university_slug', label: 'Featured University Slug', placeholder: 'bogazici-university' },
];

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminApi.settings.get });
  const [form, setForm] = useState<Partial<AdminSettings>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<AdminSettings>) => adminApi.settings.update(payload),
    onSuccess: (updated) => {
      qc.setQueryData(['admin', 'settings'], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure site-wide details and contact information.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
        className="bg-card border border-border rounded-2xl p-6 space-y-5"
      >
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1.5">{field.label}</label>
            <input
              type={field.type ?? 'text'}
              value={form[field.key] ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        ))}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.maintenance_mode === 'true'}
              onChange={(e) => setForm((f) => ({ ...f, maintenance_mode: e.target.checked ? 'true' : 'false' }))}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-medium">Maintenance Mode</span>
          </label>
        </div>

        {mutation.isError && (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {(mutation.error as Error).message}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved</>
          ) : (
            <><Save className="w-4 h-4" /> Save Settings</>
          )}
        </button>
      </form>
    </div>
  );
}
