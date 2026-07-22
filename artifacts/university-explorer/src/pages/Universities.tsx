import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { Link } from 'wouter';
import { Search, Building2, MapPin, ArrowRight, GraduationCap, X } from 'lucide-react';
import { useListUniversities } from '@workspace/api-client-react';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

const TYPES = ['all', 'state', 'private', 'foundation'] as const;
type TypeFilter = (typeof TYPES)[number];

export default function Universities() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [cityFilter, setCityFilter] = useState('');

  const { data: universities, isLoading } = useListUniversities({ lang: language as any });

  // Derive unique cities from loaded data
  const cities = useMemo(() => {
    if (!universities) return [];
    return [...new Set(universities.map((u) => u.city).filter(Boolean))].sort();
  }, [universities]);

  // Client-side filtering for instant UX (small dataset)
  const filtered = useMemo(() => {
    if (!universities) return [];
    const q = search.toLowerCase().trim();
    return universities.filter((u) => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.city ?? '').toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || u.type === typeFilter;
      const matchesCity = !cityFilter || u.city === cityFilter;
      return matchesSearch && matchesType && matchesCity;
    });
  }, [universities, search, typeFilter, cityFilter]);

  const hasActiveFilters = search || typeFilter !== 'all' || cityFilter;

  function clearFilters() {
    setSearch('');
    setTypeFilter('all');
    setCityFilter('');
  }

  return (
    <div className="min-h-[100dvh] flex flex-col pt-16">
      {/* Hero */}
      <section className="relative px-6 py-16 md:py-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-5 text-sm font-medium">
            <Building2 className="w-3.5 h-3.5" />
            {t('universities.badge')}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            {t('universities.title')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto font-light">
            {t('universities.subtitle')}
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/10 rounded-xl blur opacity-20 group-hover:opacity-50 transition duration-500" />
            <div className="relative flex items-center bg-card border border-border rounded-xl shadow-lg px-4">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('universities.searchPlaceholder')}
                className="w-full bg-transparent border-none focus:outline-none text-foreground px-3 py-3.5 placeholder:text-muted-foreground/50 text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Filters + Results */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-6 pb-20">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 items-start sm:items-center justify-between">
          {/* Type pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  typeFilter === type
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_12px_-4px_hsl(var(--primary))]'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {type === 'all' ? t('universities.allTypes') : t(`common.${type}`)}
              </button>
            ))}

            {/* City dropdown */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-1.5 rounded-full text-sm font-medium border border-border bg-card text-muted-foreground hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">{t('universities.allCities')}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Result count + clear */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
            {!isLoading && (
              <span>
                <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                {t('universities.totalCount')}
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                {t('explore.resetFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-3/4" />
                    <div className="h-3 bg-secondary rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-secondary rounded w-full mb-2" />
                <div className="h-3 bg-secondary rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <GraduationCap className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">{t('universities.noResults')}</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-primary hover:underline text-sm font-medium">
                {t('explore.resetFilters')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((uni, i) => (
              <motion.div
                key={uni.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
              >
                <Link href={`/university?slug=${uni.slug}`} className="group block h-full">
                  <div className="bg-card border border-border rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 flex flex-col">
                    {/* Logo + Badge */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-16 h-16 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden shadow-sm">
                        {uni.logo_url ? (
                          <img
                            src={uni.logo_url}
                            alt={uni.name}
                            className="w-full h-full object-contain p-2"
                            loading="lazy"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-muted-foreground/40" />
                        )}
                      </div>
                      <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-secondary text-secondary-foreground border border-border">
                        {t(`common.${uni.type}`)}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="text-lg font-bold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {uni.name}
                    </h3>

                    {/* City */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {uni.city}
                    </div>

                    {/* Description snippet */}
                    {uni.description && (
                      <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 mb-5">
                        {uni.description}
                      </p>
                    )}

                    {/* CTA */}
                    <div className="mt-auto flex items-center justify-between text-sm font-semibold text-primary pt-4 border-t border-border/50">
                      {t('universities.viewUniversity')}
                      <DirectionalIcon
                        icon={ArrowRight}
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
