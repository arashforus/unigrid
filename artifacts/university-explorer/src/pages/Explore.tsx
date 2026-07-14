import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useGetStatsCities, useGetStatsProgramsByDegree } from '@workspace/api-client-react';
import { Search, MapPin, Building2, Globe, Clock, Banknote, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import { ArrowRight } from 'lucide-react';

const BASE = import.meta.env.BASE_URL;
const PAGE_SIZE = 24;

type ProgramItem = {
  id: number;
  faculty_id: number;
  name: string;
  yok_atlas_code?: string | null;
  degree_type: 'associate' | 'bachelor' | 'master' | 'doctorate';
  language: string;
  duration_years: number;
  is_active: boolean;
  university_name?: string | null;
  university_slug?: string | null;
  university_logo?: string | null;
  faculty_name?: string | null;
  city?: string | null;
  tuition_fees: Array<{
    id: number;
    program_id: number;
    academic_year: string;
    domestic_fee: string | null;
    international_fee: string | null;
    currency: string;
  }>;
};

type ProgramsResponse = {
  data: ProgramItem[];
  total: number;
  page: number;
  totalPages: number;
};

async function fetchPrograms(params: Record<string, string | number | boolean | undefined>): Promise<ProgramsResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const res = await fetch(`${BASE}api/programs?${qs.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function Explore() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when filters change
  const resetPage = useCallback(() => setPage(1), []);

  const { data: cities } = useGetStatsCities();
  const { data: degrees } = useGetStatsProgramsByDegree();

  const queryParams = {
    lang: language,
    is_active: true,
    page,
    limit: PAGE_SIZE,
    ...(selectedDegree && { degree_type: selectedDegree }),
    ...(selectedLanguage && { language: selectedLanguage }),
    ...(selectedCity && { city: selectedCity }),
    ...(search && { search }),
  };

  const { data, isLoading, isFetching } = useQuery<ProgramsResponse>({
    queryKey: ['programs', queryParams],
    queryFn: () => fetchPrograms(queryParams as any),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const programs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const availableLanguages = ['Turkish', 'English', 'Turkish/English'];

  const clearFilters = () => {
    setSelectedCity('');
    setSelectedDegree('');
    setSelectedLanguage('');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const hasFilters = selectedCity || selectedDegree || selectedLanguage || search;

  return (
    <div className="min-h-[100dvh] pt-16 flex flex-col md:flex-row">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-80 shrink-0 border-e border-border bg-sidebar/50 backdrop-blur-xl h-[calc(100vh-64px)] md:sticky md:top-16 overflow-y-auto p-6 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            {t('explore.filters')}
          </h2>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> {t('explore.resetFilters')}
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-input border border-border rounded-lg py-2 ps-9 pe-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('explore.degreeType')}</h3>
          <div className="space-y-3">
            {degrees?.map((deg) => (
              <label key={deg.degree_type} className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedDegree === deg.degree_type ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card group-hover:border-primary/50'}`}
                  onClick={() => { setSelectedDegree(prev => prev === deg.degree_type ? '' : deg.degree_type); resetPage(); }}
                >
                  {selectedDegree === deg.degree_type && <CheckIcon />}
                </div>
                <span className="text-sm capitalize group-hover:text-primary transition-colors" onClick={() => { setSelectedDegree(prev => prev === deg.degree_type ? '' : deg.degree_type); resetPage(); }}>{t(`common.${deg.degree_type}`)}</span>
                <span className="ms-auto text-xs text-muted-foreground">{deg.program_count}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('explore.language')}</h3>
          <div className="space-y-3">
            {availableLanguages.map((lang) => (
              <label key={lang} className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedLanguage === lang ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card group-hover:border-primary/50'}`}
                  onClick={() => { setSelectedLanguage(prev => prev === lang ? '' : lang); resetPage(); }}
                >
                  {selectedLanguage === lang && <CheckIcon />}
                </div>
                <span className="text-sm group-hover:text-primary transition-colors" onClick={() => { setSelectedLanguage(prev => prev === lang ? '' : lang); resetPage(); }}>{lang}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('explore.city')}</h3>
          <div className="space-y-3">
            {cities?.map((city) => (
              <label key={city.city} className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCity === city.city ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card group-hover:border-primary/50'}`}
                  onClick={() => { setSelectedCity(prev => prev === city.city ? '' : city.city); resetPage(); }}
                >
                  {selectedCity === city.city && <CheckIcon />}
                </div>
                <span className="text-sm group-hover:text-primary transition-colors" onClick={() => { setSelectedCity(prev => prev === city.city ? '' : city.city); resetPage(); }}>{city.city}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 bg-background/50">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('explore.results')}</h1>
          <div className="flex items-center gap-3">
            {isFetching && !isLoading && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
              {total.toLocaleString()} {t('explore.programs')}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 h-48 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-secondary rounded w-3/4 mb-2" />
                    <div className="h-4 bg-secondary rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-secondary rounded-full" />
                  <div className="h-6 w-20 bg-secondary rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-border rounded-2xl bg-card/50">
            <Search className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">{t('explore.noResults')}</h3>
            <button onClick={clearFilters} className="text-primary font-medium hover:underline">
              {t('explore.resetFilters')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {programs.map((program) => (
                <div key={program.id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 end-0 p-4">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                      {t(`common.${program.degree_type}`)}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4 pe-20">
                    <div className="w-14 h-14 rounded-xl bg-secondary flex-shrink-0 flex items-center justify-center border border-border overflow-hidden">
                      {program.university_logo ? (
                        <img src={program.university_logo} alt={program.university_name || ''} className="w-full h-full object-contain p-2" />
                      ) : (
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Link href={`/university?slug=${program.university_slug}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors block mb-1">
                        {program.university_name}
                      </Link>
                      <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors mb-1">
                        {program.name}
                      </h3>
                      {program.faculty_name && (
                        <p className="text-sm text-muted-foreground">{program.faculty_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary/70" />
                      {program.city}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4 text-primary/70" />
                      {program.language}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary/70" />
                      {program.duration_years} Years
                    </div>
                    {program.tuition_fees && program.tuition_fees.length > 0 && program.tuition_fees[0].international_fee && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Banknote className="w-4 h-4 text-primary/70" />
                        {parseFloat(String(program.tuition_fees[0].international_fee)).toLocaleString()} {program.tuition_fees[0].currency}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-3 pt-4 border-t border-border">
                    <Link href={`/program?id=${program.id}`} className="flex-1 text-center py-2.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors">
                      {t('explore.viewDetails')}
                    </Link>
                    <button className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-[0_0_20px_-8px_hsl(var(--primary))]">
                      {t('explore.applyNow')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('common.previous') || 'Previous'}
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers(page, totalPages).map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(Number(p))}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${Number(p) === page ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-secondary'}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('common.next') || 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground mt-4">
              {t('explore.showingPage') || `Page ${page} of ${totalPages}`} — {total.toLocaleString()} {t('explore.programs')}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
