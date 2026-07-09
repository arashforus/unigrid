import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { 
  useListPrograms, 
  useGetStatsCities,
  useGetStatsProgramsByDegree 
} from '@workspace/api-client-react';
import { Search, MapPin, Building2, Globe, Clock, Banknote, Filter, X } from 'lucide-react';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import { ArrowRight } from 'lucide-react';

export default function Explore() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  // Filters state
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Fetch filter options
  const { data: cities } = useGetStatsCities();
  const { data: degrees } = useGetStatsProgramsByDegree();

  // Fetch all programs and filter client-side to support multi-select
  const { data: allPrograms, isLoading } = useListPrograms({
    lang: language as any,
    is_active: true,
  });

  const programs = useMemo(() => {
    if (!allPrograms) return [];
    return allPrograms.filter((p) => {
      if (selectedCities.length > 0 && !selectedCities.some(c => p.city?.toLowerCase().includes(c.toLowerCase()))) return false;
      if (selectedDegrees.length > 0 && !selectedDegrees.includes(p.degree_type)) return false;
      if (selectedLanguages.length > 0 && !selectedLanguages.some(l => p.language?.includes(l))) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name?.toLowerCase().includes(q) && !p.university_name?.toLowerCase().includes(q) && !p.faculty_name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allPrograms, selectedCities, selectedDegrees, selectedLanguages, search]);

  const availableLanguages = ['Turkish', 'English', 'Turkish/English'];

  const toggleCity = (city: string) => {
    setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
  };

  const toggleDegree = (degree: string) => {
    setSelectedDegrees(prev => prev.includes(degree) ? prev.filter(d => d !== degree) : [...prev, degree]);
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const clearFilters = () => {
    setSelectedCities([]);
    setSelectedDegrees([]);
    setSelectedLanguages([]);
    setSearch('');
  };

  return (
    <div className="min-h-[100dvh] pt-16 flex flex-col md:flex-row">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-80 shrink-0 border-e border-border bg-sidebar/50 backdrop-blur-xl h-[calc(100vh-64px)] md:sticky md:top-16 overflow-y-auto p-6 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            {t('explore.filters')}
          </h2>
          {(selectedCities.length > 0 || selectedDegrees.length > 0 || selectedLanguages.length > 0 || search) && (
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-lg py-2 ps-9 pe-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('explore.degreeType')}</h3>
          <div className="space-y-3">
            {degrees?.map((deg) => (
              <label key={deg.degree_type} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedDegrees.includes(deg.degree_type) ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card group-hover:border-primary/50'}`}>
                  {selectedDegrees.includes(deg.degree_type) && <CheckIcon />}
                </div>
                <span className="text-sm capitalize group-hover:text-primary transition-colors">{t(`common.${deg.degree_type}`)}</span>
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
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedLanguages.includes(lang) ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card group-hover:border-primary/50'}`}>
                  {selectedLanguages.includes(lang) && <CheckIcon />}
                </div>
                <span className="text-sm group-hover:text-primary transition-colors">{lang}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('explore.city')}</h3>
          <div className="space-y-3">
            {cities?.map((city) => (
              <label key={city.city} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCities.includes(city.city) ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card group-hover:border-primary/50'}`}>
                  {selectedCities.includes(city.city) && <CheckIcon />}
                </div>
                <span className="text-sm group-hover:text-primary transition-colors">{city.city}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 bg-background/50">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('explore.results')}</h1>
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
            {programs?.length || 0} {t('explore.programs')}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 h-48 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-secondary rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-secondary rounded w-1/2"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-secondary rounded-full"></div>
                  <div className="h-6 w-20 bg-secondary rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : programs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-border rounded-2xl bg-card/50">
            <Search className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">{t('explore.noResults')}</h3>
            <button onClick={clearFilters} className="text-primary font-medium hover:underline">
              {t('explore.resetFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {programs?.map((program) => (
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
        )}
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
