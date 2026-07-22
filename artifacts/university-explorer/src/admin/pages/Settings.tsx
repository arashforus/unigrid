import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminSettings, type ApiKeysState } from '@/admin/api';
import { Loader2, Save, CheckCircle2, KeyRound, Eye, EyeOff, Settings2, Bot } from 'lucide-react';

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
// AI tab
// ---------------------------------------------------------------------------

function AiTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminApi.settings.get });
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data) setModel(data.openai_model ?? 'gpt-4.1-mini'); }, [data]);

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
    <div className="space-y-5">
      {/* Model selector card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Fee Crawler Model</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The OpenAI model used by the Fee Crawler to look up and extract tuition fees.
            Changes take effect on the next crawl run.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Model name</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gpt-4.1-mini, gpt-4o, gpt-4o-mini"
            className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        {/* Quick-pick chips */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Quick pick</p>
          <div className="flex flex-wrap gap-2">
            {[
              // GPT-5.6 family (newest)
              'gpt-5.6-sol',
              'gpt-5.6-terra',
              'gpt-5.6-luna',
              // GPT-5.5 family
              'gpt-5.5-pro',
              'gpt-5.5',
              // GPT-5.4 family
              'gpt-5.4-pro',
              'gpt-5.4',
              'gpt-5.4-mini',
              'gpt-5.4-nano',
              // GPT-4.1 family
              'gpt-4.1',
              'gpt-4.1-mini',
              // GPT-4o family
              'gpt-4o',
              'gpt-4o-mini',
            ].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModel(m)}
                className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                  model === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {mutation.isError && (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {(mutation.error as Error).message}
          </div>
        )}

        <button
          type="button"
          disabled={!model.trim() || mutation.isPending}
          onClick={() => mutation.mutate({ openai_model: model.trim() })}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved</>
          ) : (
            <><Save className="w-4 h-4" /> Save Model</>
          )}
        </button>
      </div>

      <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs leading-relaxed">
        <strong>Note:</strong> The model must support <code className="font-mono">response_format: json_object</code>.
        Recommended: <code className="font-mono">gpt-4.1-mini</code> (fast &amp; cheap) or <code className="font-mono">gpt-4o-mini</code>.
        Make sure your OpenAI API key (set in the API Keys tab) has access to the chosen model.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell with tabs
// ---------------------------------------------------------------------------

type Tab = 'general' | 'api-keys' | 'ai';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings2 className="w-4 h-4" /> },
  { id: 'api-keys', label: 'API Keys', icon: <KeyRound className="w-4 h-4" /> },
  { id: 'ai', label: 'AI', icon: <Bot className="w-4 h-4" /> },
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
      {tab === 'ai' && <AiTab />}
    </div>
  );
}
