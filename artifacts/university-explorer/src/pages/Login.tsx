import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import { MapPin, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [, navigate] = useLocation();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = mode === 'login'
      ? await login(email, password)
      : await register(name, email, password);
    setLoading(false);
    if (result.ok) {
      navigate('/');
    } else {
      setError(result.error ?? t('auth.genericError'));
    }
  };

  return (
    <div className="min-h-[100dvh] pt-16 bg-background flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,hsl(var(--primary)/0.12),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_-5px_hsl(var(--primary))] mb-4">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Uni<span className="text-primary">Turkey</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-black/20">
          {/* Mode Toggle */}
          <div className="flex p-1 bg-secondary rounded-xl mb-8">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('auth.signIn')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('auth.createAccount')}
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">
              {mode === 'login' ? t('auth.welcomeBack') : t('auth.joinTitle')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('auth.fullName')}</label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className="w-full bg-input border border-border rounded-xl ps-9 pe-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-input border border-border rounded-xl ps-9 pe-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full bg-input border border-border rounded-xl ps-9 pe-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all shadow-[0_0_25px_-8px_hsl(var(--primary))] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
                  <DirectionalIcon icon={ArrowRight} className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t('auth.or')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Services CTA */}
          <Link href="/services" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-semibold transition-colors">
            <Sparkles className="w-4 h-4" />
            {t('auth.needHelp')}
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">{t('auth.privacyNote')}</p>
      </div>
    </div>
  );
}
