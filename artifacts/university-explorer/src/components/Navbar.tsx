import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { useAuth } from '@/contexts/auth';
import { Link, useLocation } from 'wouter';
import { MapPin, Globe, ChevronDown, Check, User, LogOut, LayoutDashboard, Sparkles, Menu, X } from 'lucide-react';

export function Navbar() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'tr', label: 'Türkçe', short: 'TR' },
    { code: 'fa', label: 'فارسی', short: 'FA' },
    { code: 'ar', label: 'العربية', short: 'AR' },
  ] as const;

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/explore', label: t('nav.explore') },
    { href: '/universities', label: t('nav.universities') },
    { href: '/services', label: t('nav.services') },
  ];

  function closeAll() {
    setLangMenuOpen(false);
    setUserMenuOpen(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_-3px_hsl(var(--primary))]">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Uni<span className="text-primary">Turkey</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-6 text-sm font-medium">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href="/advisor" className="flex items-center gap-1.5 text-violet-400 font-semibold hover:text-violet-300 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              {t('nav.advisor')}
            </Link>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Language switcher — desktop */}
          <div className="relative">
            <button
              onClick={() => { setLangMenuOpen(!langMenuOpen); setUserMenuOpen(false); }}
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
                    onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary transition-colors ${language === lang.code ? 'text-primary font-medium bg-primary/5' : 'text-foreground'}`}
                  >
                    {lang.label}
                    {language === lang.code && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* User menu — desktop */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => { setUserMenuOpen(!userMenuOpen); setLangMenuOpen(false); }}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              {userMenuOpen && (
                <div className="absolute end-0 top-full mt-2 w-44 bg-popover border border-popover-border rounded-xl shadow-xl overflow-hidden py-1 z-50">
                  {user.role === 'admin' && (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={async () => { setUserMenuOpen(false); await logout(); navigate('/'); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <User className="w-4 h-4" />
              {t('auth.signIn')}
            </Link>
          )}
        </div>

        {/* Mobile right: language + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          {/* Language switcher — mobile */}
          <div className="relative">
            <button
              onClick={() => { setLangMenuOpen(!langMenuOpen); setMobileMenuOpen(false); }}
              className="flex items-center gap-1 text-sm font-medium px-2 py-2 rounded-md hover:bg-secondary transition-colors min-w-[44px] min-h-[44px] justify-center"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="uppercase text-xs font-semibold">{language}</span>
            </button>
            {langMenuOpen && (
              <div className="absolute end-0 top-full mt-2 w-40 bg-popover border border-popover-border rounded-xl shadow-xl overflow-hidden py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary transition-colors ${language === lang.code ? 'text-primary font-medium bg-primary/5' : 'text-foreground'}`}
                  >
                    {lang.label}
                    {language === lang.code && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger button */}
          <button
            onClick={() => { setMobileMenuOpen(!mobileMenuOpen); closeAll(); }}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          {/* Nav links */}
          <div className="px-3 pt-3 pb-2 space-y-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/advisor"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-violet-400 hover:text-violet-300 hover:bg-secondary transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t('nav.advisor')}
            </Link>
          </div>

          {/* Auth section */}
          <div className="px-3 pt-2 pb-3 border-t border-border/60">
            {user ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate font-medium">{user.name}</span>
                </div>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={async () => { setMobileMenuOpen(false); await logout(); navigate('/'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <User className="w-4 h-4" />
                {t('auth.signIn')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
