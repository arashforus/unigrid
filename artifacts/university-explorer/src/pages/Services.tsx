import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Users, Globe2, Trophy, ClipboardList,
  FileText, Send, GraduationCap, MessageSquare, Phone, Mail, User, MapPin,
  BookOpen, Sparkles, ShieldCheck, Clock4, HeartHandshake
} from 'lucide-react';

const STEPS = [
  {
    icon: MessageSquare,
    key: 'step1',
  },
  {
    icon: BookOpen,
    key: 'step2',
  },
  {
    icon: FileText,
    key: 'step3',
  },
  {
    icon: Send,
    key: 'step4',
  },
  {
    icon: GraduationCap,
    key: 'step5',
  },
];

const WHY_US = [
  { icon: Trophy, key: 'expert' },
  { icon: Globe2, key: 'multilingual' },
  { icon: ShieldCheck, key: 'successRate' },
  { icon: HeartHandshake, key: 'endToEnd' },
];

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  desired_field: string;
  degree_type: string;
  message: string;
};

const EMPTY: FormState = {
  full_name: '',
  email: '',
  phone: '',
  country: '',
  desired_field: '',
  degree_type: '',
  message: '',
};

export default function Services() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm(EMPTY);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-[100dvh] pt-16 bg-background">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,hsl(var(--primary)/0.18),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,hsl(var(--background)))]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4" />
            {t('services.badge')}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            {t('services.heroTitle')}
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto mb-10">
            {t('services.heroSubtitle')}
          </p>
          <a href="#inquiry" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-[0_0_40px_-10px_hsl(var(--primary))]">
            {t('services.getStarted')}
            <DirectionalIcon icon={ArrowRight} className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* 5-Step Process */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t('services.processTitle')}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t('services.processSubtitle')}</p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 start-[10%] end-[10%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center text-center relative">
                  <div className="w-24 h-24 rounded-2xl bg-card border border-border flex items-center justify-center mb-6 relative z-10 shadow-xl shadow-black/10 group-hover:border-primary/50 transition-colors">
                    <div className="absolute inset-0 rounded-2xl bg-primary/5" />
                    <Icon className="w-10 h-10 text-primary relative z-10" />
                    <div className="absolute -top-3 -end-3 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg shadow-primary/30">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t(`services.${step.key}Title`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`services.${step.key}Desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-24 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('services.whyTitle')}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t('services.whySubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map(({ icon: Icon, key }) => (
              <div key={key} className="bg-card border border-border rounded-2xl p-8 hover:border-primary/40 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{t(`services.${key}Stat`)}</div>
                <h3 className="font-bold text-lg mb-2">{t(`services.${key}Title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`services.${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Handle */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">{t('services.handleTitle')}</h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">{t('services.handleSubtitle')}</p>
            <ul className="space-y-4">
              {(['handle1','handle2','handle3','handle4','handle5','handle6'] as const).map(key => (
                <li key={key} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{t(`services.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl" />
            <div className="relative bg-card border border-border rounded-3xl p-10 space-y-6">
              {[
                { icon: Users, label: t('services.stat1Label'), value: t('services.stat1Value') },
                { icon: Trophy, label: t('services.stat2Label'), value: t('services.stat2Value') },
                { icon: Clock4, label: t('services.stat3Label'), value: t('services.stat3Value') },
                { icon: Globe2, label: t('services.stat4Label'), value: t('services.stat4Value') },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquiry" className="py-24 bg-card/30 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
              <ClipboardList className="w-4 h-4" />
              {t('services.formBadge')}
            </div>
            <h2 className="text-4xl font-bold mb-4">{t('services.formTitle')}</h2>
            <p className="text-muted-foreground text-lg">{t('services.formSubtitle')}</p>
          </div>

          {status === 'success' ? (
            <div className="bg-card border border-primary/30 rounded-3xl p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('services.successTitle')}</h3>
              <p className="text-muted-foreground mb-8">{t('services.successDesc')}</p>
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-3 rounded-xl border border-border hover:border-primary/50 text-sm font-medium transition-colors"
              >
                {t('services.submitAnother')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> {t('services.fieldName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={set('full_name')}
                    placeholder={t('services.fieldNamePlaceholder')}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> {t('services.fieldEmail')} *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={set('email')}
                    placeholder={t('services.fieldEmailPlaceholder')}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" /> {t('services.fieldPhone')}
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder={t('services.fieldPhonePlaceholder')}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> {t('services.fieldCountry')}
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={set('country')}
                    placeholder={t('services.fieldCountryPlaceholder')}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" /> {t('services.fieldField')}
                  </label>
                  <input
                    type="text"
                    value={form.desired_field}
                    onChange={set('desired_field')}
                    placeholder={t('services.fieldFieldPlaceholder')}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" /> {t('services.fieldDegree')}
                  </label>
                  <select
                    value={form.degree_type}
                    onChange={set('degree_type')}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  >
                    <option value="">{t('services.fieldDegreePlaceholder')}</option>
                    <option value="bachelor">{t('common.bachelor')}</option>
                    <option value="master">{t('common.master')}</option>
                    <option value="doctorate">{t('common.doctorate')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> {t('services.fieldMessage')}
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={set('message')}
                  placeholder={t('services.fieldMessagePlaceholder')}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                />
              </div>

              {status === 'error' && (
                <p className="text-destructive text-sm">{t('services.submitError')}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold transition-all shadow-[0_0_30px_-10px_hsl(var(--primary))] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'sending' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t('services.submitting')}
                  </>
                ) : (
                  <>
                    {t('services.submitBtn')}
                    <DirectionalIcon icon={ArrowRight} className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-muted-foreground">{t('services.formNote')}</p>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
