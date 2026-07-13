import { Footer } from '@/components/Footer';
import { Shield } from 'lucide-react';

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, submit an inquiry, or contact our advisors. This may include:

• Full name, email address, and phone number
• Country of origin and academic background
• Desired field of study and target degree level
• Any additional information you choose to share in free-text fields

We also automatically collect certain technical information when you visit our site, including your IP address, browser type, operating system, referring URLs, and pages visited. This is collected via standard server logs and analytics tools.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:

• Match you with suitable universities and academic programs
• Connect you with a dedicated advisor who speaks your language
• Send you application updates, reminders, and relevant guidance
• Improve and personalize your experience on our platform
• Comply with legal obligations and resolve disputes

We do not use your personal data for automated decision-making or profiling that produces legal effects.`,
  },
  {
    title: '3. Sharing of Information',
    content: `We do not sell, trade, or rent your personal data to third parties. We may share your information with:

• Turkish universities and admissions offices, solely to submit applications on your behalf and only with your explicit consent
• Trusted service providers who assist in operating our platform (e.g., cloud hosting, email delivery), bound by confidentiality obligations
• Law enforcement or government authorities when required by law

All third-party service providers are contractually obligated to protect your data and use it only for the purposes we specify.`,
  },
  {
    title: '4. Data Retention',
    content: `We retain your personal data for as long as necessary to provide our services and comply with our legal obligations. Specifically:

• Inquiry and consultation records: up to 3 years after your last interaction
• Account data: until you request deletion
• Application records: up to 5 years for compliance and reference purposes

You may request deletion of your data at any time by contacting us at info@uniturkey.com.`,
  },
  {
    title: '5. Security',
    content: `We implement industry-standard security measures to protect your personal data, including:

• TLS/SSL encryption for all data transmitted between your browser and our servers
• Access controls ensuring only authorized personnel can view sensitive data
• Regular security audits and vulnerability assessments

No method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.`,
  },
  {
    title: '6. Your Rights',
    content: `Depending on your country of residence, you may have the following rights regarding your personal data:

• Right of access: obtain a copy of the data we hold about you
• Right to rectification: correct inaccurate or incomplete data
• Right to erasure: request deletion of your data ("right to be forgotten")
• Right to restrict processing: limit how we use your data
• Right to data portability: receive your data in a structured, machine-readable format
• Right to object: object to processing based on legitimate interests

To exercise any of these rights, contact us at info@uniturkey.com. We will respond within 30 days.`,
  },
  {
    title: '7. Cookies',
    content: `We use cookies and similar tracking technologies to enhance your experience. Cookies we use include:

• Essential cookies: required for the site to function (session management, authentication)
• Analytics cookies: help us understand how visitors interact with our site (e.g., Google Analytics)
• Preference cookies: remember your language and display settings

You can control cookie settings through your browser. Disabling certain cookies may affect site functionality.`,
  },
  {
    title: '8. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email (if you have an account) or by placing a prominent notice on our website. The date of the most recent update will always be shown at the top of this page.

Your continued use of our services after any change constitutes acceptance of the updated policy.`,
  },
  {
    title: '9. Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:

UniTurkey
Email: info@uniturkey.com
Phone: +90 212 000 00 00
Address: Istanbul, Turkey`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-[100dvh] flex flex-col pt-16">
      <section className="relative px-6 py-20 border-b border-border bg-card/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 text-sm font-medium">
            <Shield className="w-3.5 h-3.5" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: June 1, 2025</p>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            This Privacy Policy explains how UniTurkey collects, uses, and protects your personal data when you use our website and services.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-10">
            {sections.map((s) => (
              <article key={s.title}>
                <h2 className="text-xl font-bold mb-4 text-foreground">{s.title}</h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">{s.content}</div>
                <div className="mt-8 border-t border-border/60" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
