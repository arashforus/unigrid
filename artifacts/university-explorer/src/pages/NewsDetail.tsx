import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language';
import { useSearch, Link } from 'wouter';
import { useGetNewsArticle, getGetNewsArticleQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, Calendar, User, Tag, Newspaper } from 'lucide-react';
import { DirectionalIcon } from '@/components/DirectionalIcon';
import { Footer } from '@/components/Footer';

/** Minimal Markdown renderer — handles headings, bold, italic, lists, paragraphs */
function renderMarkdown(md: string) {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) { i++; continue; }

    // Heading ###
    const h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      elements.push(<h3 key={i} className="text-xl font-bold mt-8 mb-3 text-foreground">{h3[1]}</h3>);
      i++; continue;
    }
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      elements.push(<h2 key={i} className="text-2xl font-bold mt-10 mb-4 text-foreground">{h2[1]}</h2>);
      i++; continue;
    }
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) {
      elements.push(<h1 key={i} className="text-3xl font-bold mt-10 mb-4 text-foreground">{h1[1]}</h1>);
      i++; continue;
    }

    // Unordered list block
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc ps-6 my-4 space-y-1.5 text-muted-foreground">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list block
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal ps-6 my-4 space-y-1.5 text-muted-foreground">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-s-4 border-primary/40 ps-4 my-4 text-muted-foreground italic">
          {inlineFormat(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Paragraph
    elements.push(
      <p key={i} className="my-4 text-muted-foreground leading-relaxed">
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function inlineFormat(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function NewsDetail() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const searchParams = new URLSearchParams(useSearch());
  const slug = searchParams.get('slug');

  const params = { slug: slug || '', lang: language as any };
  const { data: article, isLoading, error } = useGetNewsArticle(params, {
    query: { enabled: !!slug, queryKey: getGetNewsArticleQueryKey(params) },
  });

  const isRtl = language === 'fa' || language === 'ar';

  if (!slug) return <div className="p-20 text-center">{t('news.notFound')}</div>;

  if (isLoading) return (
    <div className="min-h-screen pt-16 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        {t('common.loading')}
      </div>
    </div>
  );

  if (error || !article) return (
    <div className="min-h-screen pt-16 p-6 text-center text-destructive">
      {t('news.notFound')}
    </div>
  );

  const dateStr = article.published_at ?? article.created_at;
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString(
        language === 'en' ? 'en-US' : language === 'tr' ? 'tr-TR' : language === 'fa' ? 'fa-IR' : 'ar-SA',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : null;

  return (
    <div className="min-h-[100dvh] pt-16 bg-background">
      {/* Hero */}
      <div className="relative border-b border-border overflow-hidden">
        {article.cover_image_url && (
          <div className="absolute inset-0">
            <img
              src={article.cover_image_url}
              alt=""
              aria-hidden
              className="w-full h-full object-cover opacity-15"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>
        )}

        <div className="relative max-w-3xl mx-auto px-6 pt-12 pb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
            <DirectionalIcon icon={ArrowLeft} className="w-4 h-4" />
            {t('news.backToHome')}
          </Link>

          {/* Category badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5">
            <Tag className="w-3.5 h-3.5" />
            {article.category}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6 text-foreground">
            {article.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary/60" />
                <time dateTime={dateStr ?? undefined}>{formattedDate}</time>
              </span>
            )}
            {article.author && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary/60" />
                {article.author}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cover image (large) */}
      {article.cover_image_url && (
        <div className="max-w-3xl mx-auto px-6 -mt-4 mb-0">
          <div className="rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/30 h-64 md:h-96">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Article body */}
      <article
        className="max-w-3xl mx-auto px-6 py-12"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {article.content ? (
          <div className="text-base leading-relaxed">
            {renderMarkdown(article.content)}
          </div>
        ) : (
          /* No content yet — show expanded summary */
          <div className="text-muted-foreground leading-relaxed space-y-4">
            {article.summary
              ? article.summary.split('\n').map((para, i) => (
                  <p key={i} className="text-base leading-relaxed">{para}</p>
                ))
              : (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <Newspaper className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">{t('news.contentComingSoon')}</p>
                </div>
              )
            }
          </div>
        )}
      </article>

      {/* Back link */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors border border-border rounded-xl px-5 py-3 hover:border-primary/30 hover:bg-card transition-all">
          <DirectionalIcon icon={ArrowLeft} className="w-4 h-4" />
          {t('news.backToHome')}
        </Link>
      </div>

      <Footer />
    </div>
  );
}
