import { Footer } from '@/components/Footer';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using the UniTurkey platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.

These Terms apply to all visitors, users, and others who access or use the Service. We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance.`,
  },
  {
    title: '2. Description of Service',
    content: `UniTurkey provides an online platform to help international students discover, compare, and apply to universities in Turkey. Our services include:

• A searchable database of Turkish universities and academic programs
• Advisory consultations with multilingual education advisors
• Application support, document guidance, and status tracking
• Educational content including articles, guides, and news

We are not a Turkish government body and do not make final admission decisions. Acceptance to any university is at the sole discretion of that institution.`,
  },
  {
    title: '3. User Accounts',
    content: `To access certain features, you must create an account. You agree to:

• Provide accurate, complete, and current information during registration
• Maintain the security of your password and accept responsibility for all activity under your account
• Notify us immediately of any unauthorized use of your account
• Not share your account credentials with any third party

We reserve the right to terminate accounts that violate these Terms or engage in fraudulent activity.`,
  },
  {
    title: '4. User Conduct',
    content: `You agree not to use the Service to:

• Submit false, misleading, or fraudulent information in applications or inquiries
• Impersonate any person or entity or misrepresent your affiliation
• Attempt to gain unauthorized access to any part of the Service or its systems
• Scrape, copy, or redistribute our content without written permission
• Engage in any conduct that restricts or inhibits other users' enjoyment of the Service
• Upload or transmit viruses, malware, or any other harmful code`,
  },
  {
    title: '5. Intellectual Property',
    content: `All content on the UniTurkey platform — including text, graphics, logos, icons, images, and software — is the property of UniTurkey or its content suppliers and is protected by international copyright laws.

You may view and print content for personal, non-commercial use only. Any other use — including reproduction, modification, distribution, or republication — without our prior written consent is strictly prohibited.`,
  },
  {
    title: '6. Advisory Services & Disclaimer',
    content: `Our advisors provide guidance based on experience and publicly available information. However:

• We do not guarantee admission to any specific university or program
• Admission requirements, tuition fees, and program availability are subject to change without notice
• University rankings and assessments are provided for informational purposes only
• We are not liable for any decisions made based on information provided through our Service

Always verify critical information directly with the relevant university's admissions office.`,
  },
  {
    title: '7. Fees & Payments',
    content: `Some advisory and application services may require payment of fees. All fees will be clearly disclosed before any payment is required. By submitting a payment, you:

• Authorize UniTurkey to charge the specified amount
• Acknowledge that consulting fees are non-refundable once an advisory session has been completed
• Understand that application submission fees charged by universities are separate and non-refundable

For fee disputes, contact us within 14 days of the charge at info@uniturkey.com.`,
  },
  {
    title: '8. Limitation of Liability',
    content: `To the fullest extent permitted by applicable law, UniTurkey shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, resulting from:

• Your use of or inability to use the Service
• Any errors or omissions in content provided through the Service
• Unauthorized access to your account or personal data
• Any conduct of third parties, including universities

Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.`,
  },
  {
    title: '9. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of the Republic of Turkey, without regard to its conflict of law provisions.

Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Istanbul, Turkey. If you are a consumer in the European Union, you may also have rights under your local consumer protection laws.`,
  },
  {
    title: '10. Contact',
    content: `For questions about these Terms, please contact us:

UniTurkey
Email: info@uniturkey.com
Phone: +90 212 000 00 00
Address: Istanbul, Turkey`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-[100dvh] flex flex-col pt-16">
      <section className="relative px-6 py-20 border-b border-border bg-card/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 text-sm font-medium">
            <FileText className="w-3.5 h-3.5" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: June 1, 2025</p>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Please read these Terms carefully before using UniTurkey. By using our platform, you agree to these Terms.
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
