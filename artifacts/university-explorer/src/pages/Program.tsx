import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { useSearch } from 'wouter';
import { useGetProgram, getGetProgramQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import { ArrowLeft, Banknote, Clock, Globe, MapPin, Building2, ExternalLink, HeartHandshake } from 'lucide-react';

export default function ProgramDetail() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const searchParams = new URLSearchParams(useSearch());
  const idParam = searchParams.get('id');
  const id = idParam ? parseInt(idParam, 10) : null;

  const programParams = { id: id as number, lang: language as any };
  const { data: program, isLoading, error } = useGetProgram(programParams, {
    query: { enabled: !!id, queryKey: getGetProgramQueryKey(programParams) }
  });

  if (!id) return <div className="p-20 text-center">No program selected.</div>;
  
  if (isLoading) return (
    <div className="min-h-screen pt-16 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        {t('common.loading')}
      </div>
    </div>
  );

  if (error || !program) return (
    <div className="min-h-screen pt-16 p-6 text-center text-destructive">
      {t('common.error')}
    </div>
  );

  return (
    <div className="min-h-[100dvh] pt-16 bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href={`/university?slug=${program.university_slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
          <DirectionalIcon icon={ArrowLeft} className="w-4 h-4" />
          {t('common.back')} to {program.university_name}
        </Link>

        {/* Header Card */}
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute top-0 end-0 p-8 opacity-5">
            <Building2 className="w-64 h-64" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 text-sm font-bold uppercase tracking-wider rounded-full bg-primary/20 text-primary border border-primary/30">
                {t(`common.${program.degree_type}`)}
              </span>
              {!program.is_active && (
                <span className="px-3 py-1 text-sm font-bold uppercase tracking-wider rounded-full bg-destructive/20 text-destructive border border-destructive/30">
                  Inactive
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">{program.name}</h1>
            <p className="text-xl text-muted-foreground mb-10">{program.faculty_name}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-border">
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Globe className="w-4 h-4" /> {t('explore.language')}</div>
                <div className="font-semibold">{program.language}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Duration</div>
                <div className="font-semibold">{program.duration_years} Years</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {t('explore.city')}</div>
                <div className="font-semibold">{program.city}</div>
              </div>
              {program.yok_atlas_code && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">YÖK Atlas Code</div>
                  <div className="font-mono bg-secondary px-2 py-0.5 rounded text-sm inline-block">{program.yok_atlas_code}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tuition Fees */}
        {program.tuition_fees && program.tuition_fees.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-primary" />
              Tuition Fees
            </h2>
            
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-sm">Academic Year</th>
                      <th className="px-6 py-4 font-semibold text-sm">{t('university.internationalFee')}</th>
                      <th className="px-6 py-4 font-semibold text-sm">{t('university.domesticFee')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {program.tuition_fees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 font-medium">{fee.academic_year}</td>
                        <td className="px-6 py-4">
                          {fee.international_fee ? (
                            <span className="font-bold text-primary">
                              {parseFloat(String(fee.international_fee)).toLocaleString()} {fee.currency} <span className="text-xs font-normal text-muted-foreground">{t('university.perYear')}</span>
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {fee.domestic_fee ? (
                            <span>{parseFloat(String(fee.domestic_fee)).toLocaleString()} {fee.currency}</span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/services" className="flex-1 py-4 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-lg font-bold transition-all flex items-center justify-center gap-2">
            <HeartHandshake className="w-5 h-5" />
            {t('services.consultingCta')}
          </Link>
          <button className="flex-1 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold transition-all shadow-[0_0_30px_-10px_hsl(var(--primary))] flex items-center justify-center gap-2">
            {t('explore.applyNow')} <ExternalLink className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
