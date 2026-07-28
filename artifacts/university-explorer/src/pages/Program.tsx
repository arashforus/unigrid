import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { useSearch } from 'wouter';
import { useGetProgram, getGetProgramQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import {
  ArrowLeft, Banknote, Clock, Globe, MapPin, Building2, ExternalLink, HeartHandshake,
  GraduationCap, Users, CalendarDays, BookOpen, CheckCircle2, XCircle, Award,
  Trophy, TreePine, School,
} from 'lucide-react';

type EnrichedFields = {
  description?: string | null;
  admission_requirements?: string | null;
  quota_total?: number | null;
  quota_international?: number | null;
  application_deadline_fall?: string | null;
  application_deadline_spring?: string | null;
  scholarship_available?: boolean | null;
  scholarship_description?: string | null;
  thesis_option?: string | null;
  // university extras
  university_logo?: string | null;
  university_website_url?: string | null;
  university_apply_url?: string | null;
  university_rank_turkey?: number | null;
  university_rank_world?: number | null;
  university_established_year?: number | null;
  university_students_total?: number | null;
  university_students_international?: number | null;
  university_campus_size_ha?: number | null;
};

export default function ProgramDetail() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const searchParams = new URLSearchParams(useSearch());
  const idParam = searchParams.get('id');
  const id = idParam ? parseInt(idParam, 10) : null;

  const programParams = { id: id as number, lang: language as any };
  const { data: rawProgram, isLoading, error } = useGetProgram(programParams, {
    query: { enabled: !!id, queryKey: getGetProgramQueryKey(programParams) }
  });

  const program = rawProgram as (typeof rawProgram & EnrichedFields) | undefined;

  if (!id) return <div className="p-20 text-center">No program selected.</div>;

  if (isLoading) return (
    <div className="min-h-screen pt-16 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        {t('common.loading')}
      </div>
    </div>
  );

  if (error || !program) return (
    <div className="min-h-screen pt-16 p-6 text-center text-destructive">
      {t('common.error')}
    </div>
  );

  const yokAtlasUrl = program.yok_atlas_code
    ? `https://yokatlas.yok.gov.tr/lisans.php?y=${program.yok_atlas_code}`
    : null;

  const hasKeyDetails =
    program.quota_total != null ||
    program.quota_international != null ||
    program.application_deadline_fall ||
    program.application_deadline_spring ||
    program.scholarship_available != null;

  const applyUrl = program.university_apply_url || program.university_website_url || '#';

  return (
    <div className="min-h-[100dvh] pt-16 bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link
          href={`/university?slug=${program.university_slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <DirectionalIcon icon={ArrowLeft} className="w-4 h-4" />
          {t('common.back')} to {program.university_name}
        </Link>

        {/* ── Header Card ── */}
        <div className="bg-card border border-border rounded-3xl p-5 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute top-0 end-0 p-8 opacity-5">
            <Building2 className="w-64 h-64" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="px-3 py-1 text-sm font-bold uppercase tracking-wider rounded-full bg-primary/20 text-primary border border-primary/30">
                {t(`common.${program.degree_type}`)}
              </span>
              {program.thesis_option && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-secondary text-secondary-foreground border border-border">
                  {program.thesis_option === 'thesis'
                    ? t('program.thesis')
                    : program.thesis_option === 'non-thesis'
                    ? t('program.nonThesis')
                    : t('program.both')}
                </span>
              )}
              {!program.is_active && (
                <span className="px-3 py-1 text-sm font-bold uppercase tracking-wider rounded-full bg-destructive/20 text-destructive border border-destructive/30">
                  Inactive
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
              {program.name}
            </h1>
            <p className="text-xl text-muted-foreground mb-10">{program.faculty_name}</p>

            {/* Core quick-facts grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-border">
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> {t('explore.language')}
                </div>
                <div className="font-semibold">{program.language}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Duration
                </div>
                <div className="font-semibold">{program.duration_years} {program.duration_years === 1 ? 'Year' : 'Years'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {t('explore.city')}
                </div>
                <div className="font-semibold">{program.city}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">YÖK Atlas</div>
                {yokAtlasUrl ? (
                  <a
                    href={yokAtlasUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    {t('program.yokAtlasLink')} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : program.yok_atlas_code ? (
                  <div className="font-mono bg-secondary px-2 py-0.5 rounded text-sm inline-block">
                    {program.yok_atlas_code}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── About This Program ── */}
        {program.description && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              {t('program.aboutProgram')}
            </h2>
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {program.description}
              </p>
            </div>
          </section>
        )}

        {/* ── Key Details Grid ── */}
        {hasKeyDetails && (
          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Seats */}
              {(program.quota_total != null || program.quota_international != null) && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm">{t('program.seatsAvailable')}</span>
                  </div>
                  {program.quota_total != null && (
                    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                      <span className="text-muted-foreground">{t('program.total')}</span>
                      <span className="font-bold text-lg">{program.quota_total.toLocaleString()}</span>
                    </div>
                  )}
                  {program.quota_international != null && (
                    <div className="flex items-center justify-between text-sm py-1.5">
                      <span className="text-muted-foreground">{t('program.international')}</span>
                      <span className="font-bold text-lg text-primary">
                        {program.quota_international.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Deadlines */}
              {(program.application_deadline_fall || program.application_deadline_spring) && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm">{t('program.applicationDeadlines')}</span>
                  </div>
                  {program.application_deadline_fall && (
                    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border">
                      <span className="text-muted-foreground">{t('program.fallSemester')}</span>
                      <span className="font-semibold">{program.application_deadline_fall}</span>
                    </div>
                  )}
                  {program.application_deadline_spring && (
                    <div className="flex items-center justify-between text-sm py-1.5">
                      <span className="text-muted-foreground">{t('program.springSemester')}</span>
                      <span className="font-semibold">{program.application_deadline_spring}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Scholarship */}
              {program.scholarship_available != null && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm">{t('program.scholarship')}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {program.scholarship_available ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <span className={`font-semibold ${program.scholarship_available ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {program.scholarship_available ? t('program.available') : t('program.notAvailable')}
                    </span>
                  </div>
                  {program.scholarship_description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      {program.scholarship_description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Admission Requirements ── */}
        {program.admission_requirements && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              {t('program.admissionRequirements')}
            </h2>
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-muted-foreground leading-relaxed">{program.admission_requirements}</p>
            </div>
          </section>
        )}

        {/* ── Tuition Fees ── */}
        {program.tuition_fees && program.tuition_fees.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
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
                              {parseFloat(String(fee.international_fee)).toLocaleString()}{' '}
                              {(fee as any).international_currency ?? fee.currency}{' '}
                              <span className="text-xs font-normal text-muted-foreground">{t('university.perYear')}</span>
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {fee.domestic_fee && parseFloat(String(fee.domestic_fee)) > 0 ? (
                            <span>
                              {parseFloat(String(fee.domestic_fee)).toLocaleString()}{' '}
                              {(fee as any).domestic_currency ?? fee.currency}
                            </span>
                          ) : (
                            <span className="text-emerald-500 font-medium">Free</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── University at a Glance ── */}
        {program.university_name && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <School className="w-6 h-6 text-primary" />
              University at a Glance
            </h2>
            <div className="bg-card border border-border rounded-2xl p-6">
              {/* University header */}
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center border border-border overflow-hidden shrink-0">
                  {program.university_logo ? (
                    <img src={program.university_logo} alt={program.university_name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/university?slug=${program.university_slug}`}
                    className="text-lg font-bold hover:text-primary transition-colors truncate block"
                  >
                    {program.university_name}
                  </Link>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {program.city}
                    {program.university_established_year && (
                      <>
                        <span className="text-muted-foreground/30 mx-0.5">·</span>
                        Est. {program.university_established_year}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {program.university_rank_turkey != null && (
                  <div className="flex flex-col items-center bg-secondary/50 rounded-xl p-4 text-center">
                    <Trophy className="w-5 h-5 text-primary mb-2" />
                    <span className="text-xl font-bold leading-none">#{program.university_rank_turkey}</span>
                    <span className="text-xs text-muted-foreground mt-1">Turkey Rank</span>
                  </div>
                )}
                {program.university_rank_world != null && (
                  <div className="flex flex-col items-center bg-secondary/50 rounded-xl p-4 text-center">
                    <Trophy className="w-5 h-5 text-muted-foreground mb-2" />
                    <span className="text-xl font-bold leading-none">{program.university_rank_world}</span>
                    <span className="text-xs text-muted-foreground mt-1">World Rank</span>
                  </div>
                )}
                {program.university_students_total != null && (
                  <div className="flex flex-col items-center bg-secondary/50 rounded-xl p-4 text-center">
                    <Users className="w-5 h-5 text-muted-foreground mb-2" />
                    <span className="text-xl font-bold leading-none">
                      {program.university_students_total >= 1000
                        ? `${Math.round(program.university_students_total / 1000)}k`
                        : program.university_students_total}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">Total Students</span>
                  </div>
                )}
                {program.university_students_international != null && (
                  <div className="flex flex-col items-center bg-secondary/50 rounded-xl p-4 text-center">
                    <Globe className="w-5 h-5 text-muted-foreground mb-2" />
                    <span className="text-xl font-bold leading-none">
                      {program.university_students_international >= 1000
                        ? `${Math.round(program.university_students_international / 1000)}k`
                        : program.university_students_international}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">Intl Students</span>
                  </div>
                )}
              </div>

              {/* Campus size */}
              {program.university_campus_size_ha != null && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                  <TreePine className="w-4 h-4 shrink-0 text-emerald-500" />
                  Campus size: <span className="font-semibold text-foreground">{program.university_campus_size_ha} ha</span>
                </div>
              )}

              {/* Website link */}
              {program.university_website_url && (
                <div className="mt-3">
                  <a
                    href={program.university_website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {program.university_website_url.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/services"
            className="flex-1 py-4 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-lg font-bold transition-all flex items-center justify-center gap-2"
          >
            <HeartHandshake className="w-5 h-5" />
            {t('services.consultingCta')}
          </Link>
          <a
            href={applyUrl}
            target={applyUrl !== '#' ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="flex-1 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold transition-all shadow-[0_0_30px_-10px_hsl(var(--primary))] flex items-center justify-center gap-2"
          >
            {t('explore.applyNow')} <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
