import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { useAuth } from '@/contexts/auth';
import { Link, useLocation } from 'wouter';
import { MapPin, Globe, ChevronDown, Check, Search, User, LogOut, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'tr', label: 'Türkçe', short: 'TR' },
    { code: 'fa', label: 'فارسی', short: 'FA' },
    { code: 'ar', label: 'العربية', short: 'AR' },
  ] as const;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_-3px_hsl(var(--primary))]">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Uni<span className="text-primary">Turkey</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.home')}
            </Link>
            <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.explore')}
            </Link>
            <Link href="/universities" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.universities')}
            </Link>
            <Link href="/services" className="text-primary font-semibold hover:text-primary/80 transition-colors">
              {t('nav.services')}
            </Link>
          </div>

          <div className="w-px h-6 bg-border hidden md:block"></div>

          <div className="relative">
            <button 
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md hover:bg-secondary transition-colors"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="uppercase">{language}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {langMenuOpen && (
              <div className="absolute end-0 top-full mt-2 w-40 bg-popover border border-popover-border rounded-xl shadow-xl overflow-hidden py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary transition-colors ${language === lang.code ? 'text-primary font-medium bg-primary/5' : 'text-foreground'}`}
                  >
                    {lang.label}
                    {language === lang.code && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-border hidden md:block"></div>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <div className="absolute end-0 top-full mt-2 w-44 bg-popover border border-popover-border rounded-xl shadow-xl overflow-hidden py-1 z-50">
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <User className="w-4 h-4" />
              {t('auth.signIn')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
