import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { Link } from 'wouter';
import { MapPin, ArrowRight, GraduationCap, Building2, Search, BookOpen, HeartHandshake, Sparkles, Clock, Newspaper } from 'lucide-react';
import { 
  useGetStatsOverview, 
  useGetStatsCities, 
  useGetStatsProgramsByDegree,
  useListUniversities
} from '@workspace/api-client-react';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

export default function Home() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const { data: stats } = useGetStatsOverview();
  const { data: cities } = useGetStatsCities();
  const { data: degreeStats } = useGetStatsProgramsByDegree();
  const { data: featuredUnis } = useListUniversities({ type: 'state', lang: language as any });

  return (
    <div className="min-h-[100dvh] flex flex-col pt-16">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Premium University Discovery
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            {t('home.heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto font-light">
            {t('home.heroSubtitle')}
          </p>
          
          <div className="relative max-w-2xl mx-auto w-full group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/10 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative flex items-center bg-card border border-border rounded-xl shadow-2xl p-2">
              <Search className="w-5 h-5 text-muted-foreground ms-3" />
              <input 
                type="text" 
                placeholder={t('home.searchPlaceholder')}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-foreground px-4 py-3 placeholder:text-muted-foreground/50"
              />
              <Link href="/explore" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors shrink-0">
                {t('common.search')}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border">
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-bold text-primary mb-2">{stats?.state_universities || '-'}</span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider">{t('home.stateUniversities')}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-bold text-primary mb-2">{stats?.private_universities || '-'}</span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider">{t('home.privateUniversities')}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-bold text-foreground mb-2">{stats?.total_programs || '-'}</span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider">{t('home.totalPrograms')}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-bold text-foreground mb-2">{stats?.total_cities || '-'}</span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider">{t('home.totalCities')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cities & Degrees */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <MapPin className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">{t('home.totalCities')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cities?.slice(0, 6).map((city) => (
                <div key={city.city} className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex items-center justify-between group cursor-pointer">
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">{city.city}</span>
                  <div className="text-end">
                    <div className="text-xs text-muted-foreground">{city.university_count} {t('nav.universities')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-8">
              <GraduationCap className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">{t('explore.degreeType')}</h2>
            </div>
            <div className="space-y-4">
              {degreeStats?.map((deg) => (
                <div key={deg.degree_type} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                  <span className="font-medium capitalize">{t(`common.${deg.degree_type}`)}</span>
                  <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                    {deg.program_count} {t('explore.programs')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Universities */}
      <section className="py-24 bg-card/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-6 h-6 text-primary" />
                <h2 className="text-3xl font-bold">{t('home.browseUniversities')}</h2>
              </div>
              <p className="text-muted-foreground max-w-xl">{t('home.pathwayDesc')}</p>
            </div>
            <Link href="/explore" className="hidden md:flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
              {t('common.all')} <DirectionalIcon icon={ArrowRight} className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredUnis?.slice(0, 3).map((uni) => (
              <Link key={uni.id} href={`/university?slug=${uni.slug}`} className="group block h-full">
                <div className="bg-card border border-border rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center border border-border overflow-hidden">
                      {uni.logo_url ? (
                        <img src={uni.logo_url} alt={uni.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground border border-border capitalize">
                      {t(`common.${uni.type}`)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{uni.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <MapPin className="w-4 h-4" />
                    {uni.city}
                  </div>
                  <div className="mt-auto flex items-center justify-between text-sm font-medium text-primary">
                    {t('explore.viewDetails')}
                    <DirectionalIcon icon={ArrowRight} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/explore" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
              {t('common.all')} <DirectionalIcon icon={ArrowRight} className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Expert Consulting CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-card border border-primary/20 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,hsl(var(--primary)/0.12),transparent_60%)]" />
            <div className="absolute end-0 top-0 w-80 h-80 opacity-[0.04]">
              <HeartHandshake className="w-full h-full text-primary" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('services.consultingBadge')}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{t('services.consultingTitle')}</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">{t('services.consultingDesc')}</p>
              </div>
              <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                <Link href="/services" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-base hover:bg-primary/90 transition-all shadow-[0_0_30px_-10px_hsl(var(--primary))] whitespace-nowrap">
                  {t('services.consultingCta')}
                  <DirectionalIcon icon={ArrowRight} className="w-5 h-5" />
                </Link>
                <p className="text-xs text-muted-foreground text-center">{t('services.formNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News & Insights */}
      <section className="py-24 px-6 border-t border-border" aria-labelledby="news-heading">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4 text-sm font-medium">
                <Newspaper className="w-3.5 h-3.5" aria-hidden="true" />
                {t('news.sectionBadge')}
              </div>
              <h2 id="news-heading" className="text-3xl md:text-4xl font-bold mb-3">{t('news.sectionTitle')}</h2>
              <p className="text-muted-foreground max-w-xl">{t('news.sectionSubtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(t('news.articles', { returnObjects: true }) as Array<{
              category: string;
              title: string;
              excerpt: string;
              date: string;
              readTime: string;
              image: string;
            }>).map((article, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden bg-secondary">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width={800}
                    height={400}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    {article.category}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <time dateTime={article.date}>{article.date}</time>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {article.readTime} {t('news.minRead')}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-5 flex-1">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center gap-1.5 text-sm font-medium text-primary mt-auto">
                    {t('news.readMore')}
                    <DirectionalIcon icon={ArrowRight} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Pathways Strip */}
      <section className="py-24 bg-gradient-to-b from-primary/10 to-transparent border-t border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=2000')] opacity-5 mix-blend-overlay bg-cover bg-center"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <BookOpen className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">{t('home.internationalPathways')}</h2>
          <p className="text-xl text-muted-foreground mb-10 font-light leading-relaxed">
            {t('home.pathwayDesc')}
          </p>
          <Link href="/explore" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all hover:shadow-[0_0_40px_-10px_hsl(var(--primary))]">
            {t('home.browseUniversities')}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
