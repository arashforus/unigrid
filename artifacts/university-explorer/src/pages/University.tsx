import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { useSearch } from 'wouter';
import { useGetUniversity, getGetUniversityQueryKey } from '@workspace/api-client-react';
import { MapPin, Globe, ExternalLink, GraduationCap, Building2, BookOpen, HeartHandshake } from 'lucide-react';
import { Link } from 'wouter';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function UniversityDetail() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const searchParams = new URLSearchParams(useSearch());
  const slug = searchParams.get('slug');

  const uniParams = { slug: slug || '', lang: language as any };
  const { data: uni, isLoading, error } = useGetUniversity(uniParams, {
    query: { enabled: !!slug, queryKey: getGetUniversityQueryKey(uniParams) }
  });

  const [activeTab, setActiveTab] = useState<'programs' | 'about'>('programs');

  if (!slug) return <div className="p-20 text-center">No university selected.</div>;
  
  if (isLoading) return (
    <div className="min-h-screen pt-16 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        {t('common.loading')}
      </div>
    </div>
  );

  if (error || !uni) return (
    <div className="min-h-screen pt-16 p-6 text-center text-destructive">
      {t('common.error')}
    </div>
  );

  return (
    <div className="min-h-[100dvh] pt-16 bg-background">
      {/* Hero Header */}
      <div className="relative border-b border-border bg-card/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,hsl(var(--background)))] pointer-events-none opacity-50 z-0"></div>
        
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-8 relative z-10">
          <Link href="/universities" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
            <DirectionalIcon icon={ArrowLeft} className="w-4 h-4" />
            {t('common.back')}
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 bg-white rounded-3xl p-4 shadow-xl shadow-black/20 border border-border flex items-center justify-center relative overflow-hidden">
              {uni.logo_url ? (
                <img src={uni.logo_url} alt={uni.name} className="w-full h-full object-contain relative z-10" />
              ) : (
                <Building2 className="w-16 h-16 text-muted-foreground/50" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-primary text-primary-foreground shadow-[0_0_15px_-5px_hsl(var(--primary))]">
                  {t(`common.${uni.type}`)}
                </span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground px-3 py-1 rounded-full bg-secondary">
                  <MapPin className="w-4 h-4" />
                  {uni.city}
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{uni.name}</h1>

              <div className="flex flex-wrap gap-4">
                <Link href="/services" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-semibold transition-colors">
                  <HeartHandshake className="w-4 h-4" />
                  {t('services.consultingCta')}
                </Link>
                {uni.website_url && (
                  <a href={uni.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-secondary text-sm font-medium transition-colors">
                    <Globe className="w-4 h-4 text-primary" />
                    {t('university.website')}
                    <ExternalLink className="w-3 h-3 ms-1 opacity-50" />
                  </a>
                )}
                {uni.apply_url_international && (
                  <a href={uni.apply_url_international} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-[0_0_20px_-5px_hsl(var(--primary))]">
                    {t('university.applyNow')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-border mb-8">
          <button 
            onClick={() => setActiveTab('programs')}
            className={`pb-4 text-lg font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'programs' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <GraduationCap className="w-5 h-5" />
            {t('university.programs')}
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`pb-4 text-lg font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'about' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <BookOpen className="w-5 h-5" />
            {t('university.about')}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'about' && (
          <div className="prose prose-invert prose-p:text-muted-foreground prose-h2:text-foreground max-w-none">
            {uni.description ? (
              <p className="text-muted-foreground leading-relaxed">{uni.description}</p>
            ) : (
              <p className="text-muted-foreground italic">No description available for this university.</p>
            )}
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="space-y-12">
            {uni.faculties?.map((faculty) => (
              <div key={faculty.id} className="relative">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-2 h-6 bg-primary rounded-full"></div>
                  {faculty.name}
                </h2>
                
                {faculty.programs && faculty.programs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faculty.programs.map(program => (
                      <Link key={program.id} href={`/program?id=${program.id}`} className="group block">
                        <div className="bg-card border border-border p-5 rounded-xl hover:border-primary/50 transition-colors h-full flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors pe-4">
                              {program.name}
                            </h3>
                            <span className="shrink-0 px-2.5 py-1 text-[10px] font-bold rounded bg-secondary text-secondary-foreground uppercase tracking-wider">
                              {t(`common.${program.degree_type}`)}
                            </span>
                          </div>
                          <div className="mt-auto flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border/50">
                            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {program.language}</span>
                            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {program.duration_years} Yrs</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No programs listed.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
