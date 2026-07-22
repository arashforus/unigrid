import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminSettings, type ApiKeysState } from '@/admin/api';
import { Loader2, Save, CheckCircle2, KeyRound, Eye, EyeOff, Settings2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// General settings tab
// ---------------------------------------------------------------------------

const FIELDS: { key: keyof AdminSettings; label: string; placeholder?: string; type?: string }[] = [
  { key: 'site_name', label: 'Site Name', placeholder: 'UniTurkey' },
  { key: 'site_tagline', label: 'Tagline', placeholder: 'Your Gateway to Turkish Universities' },
  { key: 'contact_email', label: 'Contact Email', placeholder: 'info@uniturkey.com', type: 'email' },
  { key: 'contact_phone', label: 'Contact Phone', placeholder: '+90 555 000 00 00' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', placeholder: '+90 555 000 00 00' },
  { key: 'featured_university_slug', label: 'Featured University Slug', placeholder: 'bogazici-university' },
];

function GeneralTab() {
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
  );
}

// ---------------------------------------------------------------------------
// API Keys tab
// ---------------------------------------------------------------------------

function ApiKeyField({
  label,
  description,
  status,
  onSave,
  isSaving,
  saveError,
}: {
  label: string;
  description: string;
  status: ApiKeysState['openai_api_key'] | undefined;
  onSave: (value: string) => Promise<void>;
  isSaving: boolean;
  saveError?: string | null;
}) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await onSave(value);
      setSaved(true);
      setValue('');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // error displayed via saveError prop
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
          status?.set
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
        }`}>
          {status?.set ? 'Configured' : 'Not set'}
        </span>
      </div>

      {status?.set && status.preview && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-input/60 border border-border">
          <code className="text-xs text-muted-foreground font-mono flex-1">{status.preview}</code>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {status?.set ? 'Replace with new key' : 'Enter API key'}
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={status?.set ? '••••••••••••••••••••••' : 'sk-...'}
            className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm pe-11 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 end-0 px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {saveError}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!value.trim() || isSaving}
        className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Saved</>
        ) : (
          <><Save className="w-4 h-4" /> {status?.set ? 'Update Key' : 'Save Key'}</>
        )}
      </button>
    </div>
  );
}

function ApiKeysTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'api-keys'],
    queryFn: adminApi.apiKeys.get,
  });

  const mutation = useMutation({
    mutationFn: (payload: { openai_api_key?: string }) => adminApi.apiKeys.update(payload),
    onSuccess: (updated) => qc.setQueryData(['admin', 'api-keys'], updated),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        API keys are stored securely in the database. Keys are never shown in full after saving.
      </p>
      <ApiKeyField
        label="OpenAI API Key"
        description="Used by the Fee Crawler to look up tuition fees via GPT-4o mini."
        status={data?.openai_api_key}
        onSave={(value) => mutation.mutateAsync({ openai_api_key: value })}
        isSaving={mutation.isPending}
        saveError={mutation.isError ? (mutation.error as Error).message : null}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell with tabs
// ---------------------------------------------------------------------------

type Tab = 'general' | 'api-keys';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings2 className="w-4 h-4" /> },
  { id: 'api-keys', label: 'API Keys', icon: <KeyRound className="w-4 h-4" /> },
];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('general');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage site configuration and integrations.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab />}
      {tab === 'api-keys' && <ApiKeysTab />}
    </div>
  );
}
