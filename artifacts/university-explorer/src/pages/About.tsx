import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { MapPin, Users, Globe, Award, ArrowRight, Heart, Target, Lightbulb } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

export default function About() {
  const { t } = useTranslation();

  const stats = [
    { value: '500+', label: 'Students Enrolled' },
    { value: '95%', label: 'Acceptance Rate' },
    { value: '40+', label: 'Partner Universities' },
    { value: '10+', label: 'Years of Experience' },
  ];

  const values = [
    {
      icon: Heart,
      title: 'Student-First',
      desc: 'Every decision we make centers on the student experience. Your success is our mission, from the first inquiry to graduation day.',
    },
    {
      icon: Target,
      title: 'Precision Matching',
      desc: 'We don\'t guess — we analyze your academic profile, goals, and budget to identify the universities where you have the best chance of thriving.',
    },
    {
      icon: Globe,
      title: 'Cultural Bridge',
      desc: 'With advisors fluent in Arabic, Persian, Turkish, and English, we eliminate language barriers and help you feel at home before you arrive.',
    },
    {
      icon: Lightbulb,
      title: 'Transparent Guidance',
      desc: 'No hidden fees, no vague promises. We give you clear information about costs, timelines, and realistic outcomes so you can decide with confidence.',
    },
  ];

  const team = [
    {
      name: 'Dr. Ayşe Kara',
      role: 'Founder & Head Advisor',
      initials: 'AK',
      bio: '15 years guiding international students through Turkish admissions.',
    },
    {
      name: 'Mohammed Al-Rashid',
      role: 'Arab World Relations',
      initials: 'MA',
      bio: 'Native Arabic speaker specializing in MENA student placement.',
    },
    {
      name: 'Parisa Ahmadi',
      role: 'Iran & Persian Markets',
      initials: 'PA',
      bio: 'Expert in Persian-speaking student needs and visa processes.',
    },
    {
      name: 'Can Yıldız',
      role: 'University Partnerships',
      initials: 'CY',
      bio: 'Manages relationships with 40+ Turkish university admissions offices.',
    },
  ];

  const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

  return (
    <div className="min-h-[100dvh] flex flex-col pt-16">

      {/* Hero */}
      <section className="relative px-6 py-24 md:py-32 text-center overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.12),transparent_60%)]" />
        <motion.div {...fade} transition={{ duration: 0.6 }} className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 text-sm font-medium">
            <Users className="w-3.5 h-3.5" />
            About UniTurkey
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            We Open Doors to Turkish Higher Education
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed font-light">
            UniTurkey was built by a team of educators, advisors, and former international students who experienced the complexity of studying abroad firsthand — and decided to fix it.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center text-center px-4">
                <span className="text-4xl font-bold text-primary mb-1">{s.value}</span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fade} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Our Story</h2>
            </div>
            <div className="space-y-5 text-muted-foreground leading-relaxed text-lg">
              <p>
                UniTurkey started in 2014 when our founder, Dr. Ayşe Kara, noticed that thousands of qualified international students were failing to gain admission to Turkish universities — not because they lacked merit, but because the process was confusing, poorly documented, and inaccessible in their native languages.
              </p>
              <p>
                We built a bilingual advisory platform that puts real human guidance at the center. Unlike automated tools or aggregator sites, every student who works with us is matched with a native-speaking advisor who understands their background, their goals, and the specific requirements of Turkish institutions.
              </p>
              <p>
                Today, UniTurkey serves students from over 30 countries. We've helped 500+ students enroll in programs ranging from medicine and engineering to business and fine arts — at some of Turkey's most prestigious universities.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 bg-card/30 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fade} transition={{ duration: 0.5 }} className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">What We Stand For</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Our values guide every conversation, recommendation, and application we handle.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} {...fade} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-7 flex gap-5 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fade} transition={{ duration: 0.5 }} className="text-center mb-14">
            <div className="flex items-center gap-3 justify-center mb-4">
              <Award className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Meet the Team</h2>
            </div>
            <p className="text-muted-foreground max-w-xl mx-auto">A multilingual team of experts dedicated to your academic success.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div key={member.name} {...fade} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/30 transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-xl mx-auto mb-4">
                  {member.initials}
                </div>
                <h3 className="font-bold text-base mb-0.5">{member.name}</h3>
                <p className="text-xs text-primary font-medium mb-3">{member.role}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Browse thousands of programs or talk to one of our advisors today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/explore" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-[0_0_30px_-10px_hsl(var(--primary))]">
              Explore Universities <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 border border-border px-7 py-3.5 rounded-xl font-medium hover:bg-secondary transition-colors">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
