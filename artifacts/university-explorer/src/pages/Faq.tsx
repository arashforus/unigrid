import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { HelpCircle, ChevronDown, ArrowRight, MessageCircle } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    category: 'Admissions',
    questions: [
      {
        q: 'What are the general requirements to study in Turkey as an international student?',
        a: 'Requirements vary by university and program, but generally you need a high school diploma (or bachelor\'s degree for graduate programs), academic transcripts, a passport copy, and proof of language proficiency. Some programs require an entrance exam score. Our advisors will tell you the exact requirements for your target universities.',
      },
      {
        q: 'Do I need to take a Turkish language test to apply?',
        a: 'Not necessarily. Many Turkish universities offer programs in English, especially at the graduate level. If you apply to a Turkish-language program, you will typically need to pass TÖMER (the official Turkish language exam) or complete a one-year preparatory language program upon arrival. We can help you identify English-taught programs that match your field.',
      },
      {
        q: 'When is the application deadline for Turkish universities?',
        a: 'Most universities have a main intake in September (fall semester) and a secondary intake in February (spring semester). Application windows typically open 3–5 months before the semester start. However, deadlines vary significantly between institutions — this is one reason we recommend starting the process at least 6 months in advance.',
      },
      {
        q: 'Can I apply to multiple universities at once?',
        a: 'Yes, and we strongly recommend it. We typically help students apply to 3–6 universities simultaneously to maximize their chances of acceptance. We handle the paperwork and communications for each application in parallel.',
      },
    ],
  },
  {
    category: 'Costs & Scholarships',
    questions: [
      {
        q: 'How much does it cost to study in Turkey?',
        a: 'Turkey is one of the most affordable destinations for higher education. Tuition at state universities ranges from roughly $300–$1,500/year for international students; private foundation universities range from $3,000–$15,000/year. Living costs in most Turkish cities are $400–$700/month including accommodation, food, and transport. Istanbul is higher, around $600–$900/month.',
      },
      {
        q: 'Are there scholarships available for international students?',
        a: 'Yes — notably the Türkiye Bursları (Turkey Scholarships) program, funded by the Turkish government, which covers full tuition, accommodation in a state dormitory, a monthly stipend, and a one-way flight. Applications open annually in January–February. Many universities also offer their own merit-based scholarships. Our advisors can guide you through the application.',
      },
      {
        q: 'Does UniTurkey charge fees for its services?',
        a: 'We offer a free initial consultation. For comprehensive application support — document preparation, university matching, and submission — we charge a one-time service fee that is clearly disclosed upfront. We do not take commissions from universities, so our recommendations are always in your best interest.',
      },
    ],
  },
  {
    category: 'Visas & Arrival',
    questions: [
      {
        q: 'Do I need a student visa to study in Turkey?',
        a: 'Yes. Once you receive an acceptance letter, you must apply for a student visa at the Turkish consulate or embassy in your country. After arriving in Turkey, you will apply for a student residence permit within 30 days. We guide you through both processes and provide a checklist of required documents.',
      },
      {
        q: 'How long does the visa process take?',
        a: 'Processing times vary by country, but typically range from 2 to 8 weeks. We recommend starting the visa application immediately after receiving your acceptance letter and no later than 2 months before your intended travel date.',
      },
      {
        q: 'Can UniTurkey help me find accommodation in Turkey?',
        a: 'Yes. We provide guidance on university dormitories (the most affordable option), private student housing platforms, and neighborhoods popular with international students. While we don\'t own or manage any properties, our advisors have curated recommendations for each major university city.',
      },
    ],
  },
  {
    category: 'About UniTurkey',
    questions: [
      {
        q: 'How does UniTurkey differ from other education agencies?',
        a: 'Most agencies either charge universities for student referrals (creating a conflict of interest) or provide only generic information. UniTurkey works exclusively for the student: our advisors are paid by you, speak your language natively, and are evaluated on your acceptance rate — not on which university you choose.',
      },
      {
        q: 'What languages do your advisors speak?',
        a: 'Our team includes native speakers of Arabic, Persian (Farsi), Turkish, and English. You will be matched with an advisor in your preferred language from your very first conversation.',
      },
      {
        q: 'What is your success rate?',
        a: 'We have a 95% acceptance rate for students who complete our full advisory process. The 5% who are not accepted in a given cycle are typically offered alternative programs or deferred to the next intake — we don\'t consider a student\'s journey complete until they are enrolled.',
      },
    ],
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start hover:bg-secondary/50 transition-colors"
      >
        <span className="font-medium text-foreground leading-snug">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[100dvh] flex flex-col pt-16">
      {/* Hero */}
      <section className="relative px-6 py-20 border-b border-border bg-card/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 text-sm font-medium">
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Everything you need to know about studying in Turkey, our services, and the application process.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-14">
          {faqs.map((group) => (
            <div key={group.category}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                {group.category}
              </h2>
              <div className="space-y-3">
                {group.questions.map((faq) => (
                  <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still have questions CTA */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-primary/20 rounded-2xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(var(--primary)/0.08),transparent_70%)]" />
            <div className="relative z-10">
              <MessageCircle className="w-10 h-10 text-primary mx-auto mb-5" />
              <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
              <p className="text-muted-foreground mb-7 max-w-md mx-auto">
                Our multilingual advisors are available to answer any question — in your language, at your pace.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-[0_0_25px_-8px_hsl(var(--primary))]"
              >
                {t('services.consultingCta')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
