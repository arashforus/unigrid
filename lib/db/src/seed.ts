/**
 * Seed script: 5 Turkish universities, 10 faculties, 26 programs, 26 tuition fee records.
 * Run with: pnpm --filter @workspace/db run seed
 */

import { db } from "./index";
import {
  universitiesTable,
  facultiesTable,
  programsTable,
  tuitionFeesTable,
} from "./schema";

async function seed() {
  console.log("Seeding database…");

  // Clear existing data (order matters for FK constraints)
  await db.delete(tuitionFeesTable);
  await db.delete(programsTable);
  await db.delete(facultiesTable);
  await db.delete(universitiesTable);

  // -------------------------------------------------------------------------
  // Universities
  // -------------------------------------------------------------------------
  const [boun, itu, koc, sabanci, bilkent] = await db
    .insert(universitiesTable)
    .values([
      {
        name_en: "Boğaziçi University",
        name_tr: "Boğaziçi Üniversitesi",
        name_fa: "دانشگاه بوغازیچی",
        name_ar: "جامعة بوغازيتشي",
        slug: "boun",
        type: "state",
        city_en: "Istanbul",
        city_tr: "İstanbul",
        city_fa: "استانبول",
        city_ar: "إسطنبول",
        website_url: "https://www.boun.edu.tr",
        description_en:
          "Boğaziçi University is a leading Turkish public research university located on the European shore of the Bosphorus in Istanbul. Founded in 1863, it is known for its English-medium instruction and strong engineering and social science faculties.",
        description_tr:
          "Boğaziçi Üniversitesi, İstanbul'un Boğaz kıyısında yer alan, 1863 yılında kurulan köklü bir devlet araştırma üniversitesidir.",
        description_fa:
          "دانشگاه بوغازیچی یکی از برجسته‌ترین دانشگاه‌های دولتی ترکیه است که در کنار تنگه بسفر در استانبول واقع شده است.",
        description_ar:
          "جامعة بوغازيتشي هي جامعة بحثية عامة رائدة في تركيا تقع على الضفة الأوروبية لمضيق البوسفور في إسطنبول.",
        yok_universite_id: 1010,
        established_year: 1863,
        latitude: 41.0833,
        longitude: 29.0500,
        rank_turkey: 4,
        rank_world: 601,
        students_total: 17000,
        students_international: 500,
        campus_size_ha: 54,
      },
      {
        name_en: "Istanbul Technical University",
        name_tr: "İstanbul Teknik Üniversitesi",
        name_fa: "دانشگاه فنی استانبول",
        name_ar: "جامعة إسطنبول التقنية",
        slug: "itu",
        type: "state",
        city_en: "Istanbul",
        city_tr: "İstanbul",
        city_fa: "استانبول",
        city_ar: "إسطنبول",
        website_url: "https://www.itu.edu.tr",
        description_en:
          "Istanbul Technical University (ITU) is one of the world's oldest technical universities, founded in 1773. It is a global leader in engineering and applied sciences education.",
        description_tr:
          "İstanbul Teknik Üniversitesi (İTÜ), 1773 yılında kurulan ve mühendislik alanında dünya çapında tanınan köklü bir devlet üniversitesidir.",
        description_fa:
          "دانشگاه فنی استانبول (ITU) یکی از قدیمی‌ترین دانشگاه‌های فنی جهان است که در سال ۱۷۷۳ تأسیس شده است.",
        description_ar:
          "جامعة إسطنبول التقنية (ITU) هي واحدة من أقدم الجامعات التقنية في العالم، تأسست عام 1773.",
        yok_universite_id: 1020,
        established_year: 1773,
        latitude: 41.1040,
        longitude: 29.0220,
        rank_turkey: 5,
        rank_world: 651,
        students_total: 37000,
        students_international: 2000,
        campus_size_ha: 20,
      },
      {
        name_en: "Koç University",
        name_tr: "Koç Üniversitesi",
        name_fa: "دانشگاه کوچ",
        name_ar: "جامعة كوتش",
        slug: "koc",
        type: "private",
        city_en: "Istanbul",
        city_tr: "İstanbul",
        city_fa: "استانبول",
        city_ar: "إسطنبول",
        website_url: "https://www.ku.edu.tr",
        description_en:
          "Koç University is a leading private research university in Istanbul, established in 1993. It offers English-medium programs and is renowned for its research output and international partnerships.",
        description_tr:
          "Koç Üniversitesi, 1993 yılında kurulan, İngilizce eğitim veren ve araştırma alanında öne çıkan köklü bir vakıf üniversitesidir.",
        description_fa:
          "دانشگاه کوچ یک دانشگاه خصوصی پژوهشی پیشرو در استانبول است که در سال ۱۹۹۳ تأسیس شده است.",
        description_ar:
          "جامعة كوتش هي جامعة بحثية خاصة رائدة في إسطنبول، تأسست عام 1993.",
        yok_universite_id: 2001,
        established_year: 1993,
        latitude: 41.2010,
        longitude: 29.0778,
        rank_turkey: 1,
        rank_world: 479,
        students_total: 7500,
        students_international: 900,
        campus_size_ha: 67,
      },
      {
        name_en: "Sabancı University",
        name_tr: "Sabancı Üniversitesi",
        name_fa: "دانشگاه صابانجی",
        name_ar: "جامعة صاباندجي",
        slug: "sabanci",
        type: "private",
        city_en: "Istanbul",
        city_tr: "İstanbul",
        city_fa: "استانبول",
        city_ar: "إسطنبول",
        website_url: "https://www.sabanciuniv.edu",
        description_en:
          "Sabancı University is a private research university near Istanbul, founded in 1996. It is known for its interdisciplinary approach, strong engineering and business programs, and English-medium instruction.",
        description_tr:
          "Sabancı Üniversitesi, 1996 yılında kurulan, disiplinlerarası yaklaşımıyla öne çıkan İngilizce eğitim veren vakıf üniversitesidir.",
        description_fa:
          "دانشگاه صابانجی یک دانشگاه خصوهشی پژوهشی در نزدیکی استانبول است که در سال ۱۹۹۶ تأسیس شده است.",
        description_ar:
          "جامعة صاباندجي هي جامعة بحثية خاصة قرب إسطنبول، تأسست عام 1996.",
        yok_universite_id: 2002,
        established_year: 1996,
        latitude: 40.8903,
        longitude: 29.3764,
        rank_turkey: 2,
        rank_world: 574,
        students_total: 11000,
        students_international: 700,
        campus_size_ha: 100,
      },
      {
        name_en: "Bilkent University",
        name_tr: "Bilkent Üniversitesi",
        name_fa: "دانشگاه بیلکنت",
        name_ar: "جامعة بيلكنت",
        slug: "bilkent",
        type: "private",
        city_en: "Ankara",
        city_tr: "Ankara",
        city_fa: "آنکارا",
        city_ar: "أنقرة",
        website_url: "https://www.bilkent.edu.tr",
        description_en:
          "Bilkent University is Turkey's first private university, founded in 1984 in Ankara. It is consistently ranked among Turkey's top universities and offers English-medium instruction across all programs.",
        description_tr:
          "Bilkent Üniversitesi, 1984 yılında Ankara'da kurulan Türkiye'nin ilk vakıf üniversitesidir. Tüm programlarda İngilizce eğitim verilmektedir.",
        description_fa:
          "دانشگاه بیلکنت اولین دانشگاه خصوصی ترکیه است که در سال ۱۹۸۴ در آنکارا تأسیس شده است.",
        description_ar:
          "جامعة بيلكنت هي أول جامعة خاصة في تركيا، تأسست عام 1984 في أنقرة.",
        yok_universite_id: 2003,
        established_year: 1984,
        latitude: 39.8678,
        longitude: 32.7483,
        rank_turkey: 3,
        rank_world: 338,
        students_total: 13000,
        students_international: 1200,
        campus_size_ha: 160,
      },
    ])
    .returning();

  console.log("✓ Universities inserted");

  // -------------------------------------------------------------------------
  // Faculties (2 per university)
  // -------------------------------------------------------------------------
  const [
    bounEng, bounSoc,
    ituEng, ituArch,
    kocEng, kocBus,
    sabanciEng, sabanciBus,
    bilkentEng, bilkentBus,
  ] = await db
    .insert(facultiesTable)
    .values([
      // BOUN
      {
        university_id: boun.id,
        name_en: "Faculty of Engineering",
        name_tr: "Mühendislik Fakültesi",
        name_fa: "دانشکده مهندسی",
        name_ar: "كلية الهندسة",
      },
      {
        university_id: boun.id,
        name_en: "Faculty of Arts and Social Sciences",
        name_tr: "Fen-Edebiyat Fakültesi",
        name_fa: "دانشکده علوم انسانی و اجتماعی",
        name_ar: "كلية الآداب والعلوم الاجتماعية",
      },
      // ITU
      {
        university_id: itu.id,
        name_en: "Faculty of Civil Engineering",
        name_tr: "İnşaat Fakültesi",
        name_fa: "دانشکده مهندسی عمران",
        name_ar: "كلية الهندسة المدنية",
      },
      {
        university_id: itu.id,
        name_en: "Faculty of Architecture",
        name_tr: "Mimarlık Fakültesi",
        name_fa: "دانشکده معماری",
        name_ar: "كلية العمارة",
      },
      // Koç
      {
        university_id: koc.id,
        name_en: "College of Engineering",
        name_tr: "Mühendislik Fakültesi",
        name_fa: "دانشکده مهندسی",
        name_ar: "كلية الهندسة",
      },
      {
        university_id: koc.id,
        name_en: "College of Administrative Sciences and Economics",
        name_tr: "İdari Bilimler ve İktisat Fakültesi",
        name_fa: "دانشکده علوم اداری و اقتصاد",
        name_ar: "كلية العلوم الإدارية والاقتصاد",
      },
      // Sabancı
      {
        university_id: sabanci.id,
        name_en: "Faculty of Engineering and Natural Sciences",
        name_tr: "Mühendislik ve Doğa Bilimleri Fakültesi",
        name_fa: "دانشکده مهندسی و علوم طبیعی",
        name_ar: "كلية الهندسة والعلوم الطبيعية",
      },
      {
        university_id: sabanci.id,
        name_en: "Faculty of Management",
        name_tr: "İşletme Fakültesi",
        name_fa: "دانشکده مدیریت",
        name_ar: "كلية إدارة الأعمال",
      },
      // Bilkent
      {
        university_id: bilkent.id,
        name_en: "Faculty of Engineering",
        name_tr: "Mühendislik Fakültesi",
        name_fa: "دانشکده مهندسی",
        name_ar: "كلية الهندسة",
      },
      {
        university_id: bilkent.id,
        name_en: "Faculty of Business Administration",
        name_tr: "İşletme Fakültesi",
        name_fa: "دانشکده مدیریت بازرگانی",
        name_ar: "كلية إدارة الأعمال",
      },
    ])
    .returning();

  console.log("✓ Faculties inserted");

  // -------------------------------------------------------------------------
  // Programs (26 total: ~5-6 per university)
  // -------------------------------------------------------------------------
  const programs = await db
    .insert(programsTable)
    .values([
      // ── BOUN – Engineering (3 programs) ──────────────────────────────────
      {
        faculty_id: bounEng.id,
        name_en: "Computer Engineering",
        name_tr: "Bilgisayar Mühendisliği",
        name_fa: "مهندسی کامپیوتر",
        name_ar: "هندسة الحاسوب",
        yok_atlas_code: "100100101",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "The Computer Engineering program at Boğaziçi University provides a rigorous foundation in algorithms, software engineering, computer architecture, and artificial intelligence. Students gain hands-on experience through project-based courses and have access to cutting-edge research labs. Graduates are highly sought by leading technology companies and research institutions worldwide.",
        admission_requirements: "High school diploma with strong mathematics and science background. International students must submit SAT/ACT scores or equivalent national exam results. English proficiency: TOEFL iBT 87+ or IELTS 6.5+. All applicants undergo a transcript review and may be required to attend an online interview.",
        quota_total: 80,
        quota_international: 12,
        application_deadline_fall: "June 15",
        scholarship_available: true,
        scholarship_description: "Merit-based scholarships covering up to 50% of tuition are available for high-achieving international students. Awards are renewable annually based on academic performance (GPA ≥ 3.0).",
      },
      {
        faculty_id: bounEng.id,
        name_en: "Electrical and Electronics Engineering",
        name_tr: "Elektrik-Elektronik Mühendisliği",
        name_fa: "مهندسی برق و الکترونیک",
        name_ar: "هندسة الكهرباء والإلكترونيات",
        yok_atlas_code: "100100102",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "This program covers the fundamentals of electrical circuits, signal processing, telecommunications, and embedded systems. Students work in state-of-the-art laboratories and participate in collaborative research projects. The curriculum bridges theory and practice, preparing graduates for careers in electronics, energy, and communications industries.",
        admission_requirements: "High school diploma with strong physics and mathematics. International applicants must submit TOEFL iBT 87+ or IELTS 6.5+. SAT/ACT or equivalent national exam scores required. Shortlisted candidates may be invited for an online interview.",
        quota_total: 75,
        quota_international: 10,
        application_deadline_fall: "June 15",
        scholarship_available: true,
        scholarship_description: "Merit scholarships of 25–50% tuition reduction available. Candidates in the top 10% of their cohort receive full-tuition awards.",
      },
      {
        faculty_id: bounEng.id,
        name_en: "Computer Engineering",
        name_tr: "Bilgisayar Mühendisliği",
        name_fa: "مهندسی کامپیوتر",
        name_ar: "هندسة الحاسوب",
        yok_atlas_code: "100100103",
        degree_type: "master",
        language: "English",
        duration_years: 2,
        thesis_option: "both",
        description_en: "The M.S. in Computer Engineering offers thesis and non-thesis tracks, covering advanced topics in machine learning, distributed systems, computer vision, and cybersecurity. Students work directly with faculty on funded research projects. Non-thesis students complete a capstone project with an industry partner.",
        admission_requirements: "Bachelor's degree in Computer Engineering, Computer Science, or a related field. Minimum GPA of 2.75/4.0. GRE scores recommended but not mandatory. TOEFL iBT 87+ or IELTS 6.5+. Two letters of recommendation and a statement of purpose required.",
        quota_total: 40,
        quota_international: 8,
        application_deadline_fall: "May 31",
        application_deadline_spring: "November 30",
        scholarship_available: true,
        scholarship_description: "Research assistantships providing a monthly stipend (₺18,000–₺22,000) and full tuition waiver are available for thesis-track students. Highly competitive — apply early.",
      },
      // ── BOUN – Social Sciences (2 programs) ────────────────────────────
      {
        faculty_id: bounSoc.id,
        name_en: "Economics",
        name_tr: "Ekonomi",
        name_fa: "اقتصاد",
        name_ar: "الاقتصاد",
        yok_atlas_code: "100100201",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "Boğaziçi's Economics program combines rigorous quantitative training with a broad understanding of economic theory and policy. Students study micro- and macroeconomics, econometrics, international trade, and development economics. The program's small class sizes and distinguished faculty foster close mentorship and research opportunities.",
        admission_requirements: "High school diploma. Strong performance in mathematics required. International applicants: TOEFL iBT 87+ or IELTS 6.5+. SAT/ACT or equivalent accepted. Statement of interest encouraged.",
        quota_total: 60,
        quota_international: 8,
        application_deadline_fall: "June 15",
        scholarship_available: false,
      },
      {
        faculty_id: bounSoc.id,
        name_en: "Psychology",
        name_tr: "Psikoloji",
        name_fa: "روانشناسی",
        name_ar: "علم النفس",
        yok_atlas_code: "100100202",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "The Psychology program at Boğaziçi is one of Turkey's most prestigious, emphasizing scientific approaches to the study of human behavior and mental processes. Core areas include cognitive psychology, neuroscience, social psychology, and clinical applications. Students participate in departmental research labs from their second year onward.",
        admission_requirements: "High school diploma. Biology and/or mathematics background is advantageous. International applicants: TOEFL iBT 87+ or IELTS 6.5+. Personal statement describing research interests required.",
        quota_total: 45,
        quota_international: 6,
        application_deadline_fall: "June 15",
        scholarship_available: false,
      },
      // ── ITU – Civil Engineering (3 programs) ───────────────────────────
      {
        faculty_id: ituEng.id,
        name_en: "Civil Engineering",
        name_tr: "İnşaat Mühendisliği",
        name_fa: "مهندسی عمران",
        name_ar: "الهندسة المدنية",
        yok_atlas_code: "100200101",
        degree_type: "bachelor",
        language: "Turkish",
        duration_years: 4,
        description_en: "One of Turkey's oldest and most respected civil engineering programs, this degree covers structural analysis, geotechnics, hydraulics, transportation engineering, and construction management. Students complete hands-on laboratory work and a required summer internship at a construction or engineering firm.",
        admission_requirements: "High school diploma. Strong mathematics and physics background. Turkish proficiency required (YDS 70+ or equivalent for non-native speakers). International applicants may apply through YÖK's international student quota.",
        quota_total: 120,
        quota_international: 15,
        application_deadline_fall: "July 1",
        scholarship_available: false,
      },
      {
        faculty_id: ituEng.id,
        name_en: "Environmental Engineering",
        name_tr: "Çevre Mühendisliği",
        name_fa: "مهندسی محیط زیست",
        name_ar: "هندسة البيئة",
        yok_atlas_code: "100200102",
        degree_type: "bachelor",
        language: "Turkish",
        duration_years: 4,
        description_en: "Environmental Engineering at ITU addresses water treatment, air quality, waste management, and sustainable urban development. Students gain practical skills in environmental monitoring and regulatory compliance. The program has strong ties to Istanbul's major infrastructure projects and governmental environmental agencies.",
        admission_requirements: "High school diploma with chemistry and biology background. Turkish proficiency required. International students must satisfy ITU's international applicant requirements, including language assessment.",
        quota_total: 80,
        quota_international: 10,
        application_deadline_fall: "July 1",
        scholarship_available: false,
      },
      {
        faculty_id: ituEng.id,
        name_en: "Structural Engineering",
        name_tr: "Yapı Mühendisliği",
        name_fa: "مهندسی سازه",
        name_ar: "الهندسة الإنشائية",
        yok_atlas_code: "100200103",
        degree_type: "master",
        language: "Turkish/English",
        duration_years: 2,
        thesis_option: "thesis",
        description_en: "This M.S. program provides advanced training in structural analysis, earthquake engineering, and computational mechanics. The bilingual (Turkish/English) curriculum attracts students from across Turkey and the MENA region. Thesis research is often conducted in partnership with industry and government agencies on real infrastructure projects.",
        admission_requirements: "B.S. in Civil or Structural Engineering (GPA ≥ 2.5/4.0). ALES score of 65+ (for domestic students). International applicants: GRE or equivalent, TOEFL iBT 79+ or YDS 60+. One letter of recommendation and a research proposal required.",
        quota_total: 30,
        quota_international: 8,
        application_deadline_fall: "June 30",
        application_deadline_spring: "December 15",
        scholarship_available: true,
        scholarship_description: "Research assistantships with monthly stipends are available for full-time thesis students. Competitive selection based on academic record and research alignment with faculty projects.",
      },
      // ── ITU – Architecture (2 programs) ────────────────────────────────
      {
        faculty_id: ituArch.id,
        name_en: "Architecture",
        name_tr: "Mimarlık",
        name_fa: "معماری",
        name_ar: "العمارة",
        yok_atlas_code: "100200201",
        degree_type: "bachelor",
        language: "Turkish",
        duration_years: 4,
        description_en: "ITU's Architecture program is one of the most prestigious in Turkey, combining design studios, architectural history, structural technology, and urban studies. Students develop a strong design portfolio through intensive studio courses and field trips to significant architectural sites across Turkey and Europe.",
        admission_requirements: "High school diploma. A portfolio of creative or artistic work is strongly recommended. Turkish proficiency required. International students admitted through YÖK's international student quota process.",
        quota_total: 100,
        quota_international: 12,
        application_deadline_fall: "July 1",
        scholarship_available: false,
      },
      {
        faculty_id: ituArch.id,
        name_en: "Urban and Regional Planning",
        name_tr: "Şehir ve Bölge Planlaması",
        name_fa: "برنامه‌ریزی شهری و منطقه‌ای",
        name_ar: "التخطيط العمراني والإقليمي",
        yok_atlas_code: "100200202",
        degree_type: "bachelor",
        language: "Turkish",
        duration_years: 4,
        description_en: "This interdisciplinary program trains future planners in land use, transportation, housing policy, and environmental management. Students learn to analyze complex urban systems and develop sustainable spatial plans. Istanbul itself serves as a living laboratory for case studies and fieldwork throughout the degree.",
        admission_requirements: "High school diploma. Interest in social sciences and geography is beneficial. Turkish proficiency required. International students admitted through YÖK quota.",
        quota_total: 70,
        quota_international: 8,
        application_deadline_fall: "July 1",
        scholarship_available: false,
      },
      // ── Koç – Engineering (3 programs) ─────────────────────────────────
      {
        faculty_id: kocEng.id,
        name_en: "Computer Engineering",
        name_tr: "Bilgisayar Mühendisliği",
        name_fa: "مهندسی کامپیوتر",
        name_ar: "هندسة الحاسوب",
        yok_atlas_code: "100300101",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "Koç University's Computer Engineering program is consistently ranked among Turkey's best, with a strong focus on software systems, AI, and human-computer interaction. Small class sizes and a research-active faculty ensure personalized learning. Students benefit from Koç's extensive industry partnerships and internship programs with global tech companies.",
        admission_requirements: "High school diploma. Strong mathematics background. TOEFL iBT 90+ or IELTS 7.0+. SAT 1200+ or equivalent. Personal statement and one letter of recommendation required. Rolling admissions — apply early.",
        quota_total: 60,
        quota_international: 15,
        application_deadline_fall: "May 15",
        scholarship_available: true,
        scholarship_description: "Koç University Scholarship Program awards up to 100% tuition coverage for top-ranked international applicants. All admitted students are automatically considered. Additional need-based grants available.",
      },
      {
        faculty_id: kocEng.id,
        name_en: "Mechanical Engineering",
        name_tr: "Makine Mühendisliği",
        name_fa: "مهندسی مکانیک",
        name_ar: "الهندسة الميكانيكية",
        yok_atlas_code: "100300102",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "The Mechanical Engineering program provides comprehensive training in thermodynamics, fluid mechanics, solid mechanics, and manufacturing. Students complete hands-on projects in Koç's modern fabrication labs and have opportunities to join cutting-edge research groups in robotics, energy systems, and biomedical engineering.",
        admission_requirements: "High school diploma with physics and mathematics. TOEFL iBT 90+ or IELTS 7.0+. SAT 1150+ or equivalent. Personal statement required.",
        quota_total: 55,
        quota_international: 12,
        application_deadline_fall: "May 15",
        scholarship_available: true,
        scholarship_description: "Merit scholarships of 25–100% tuition available. Koç also offers the Global Engineering Scholarship for outstanding international students.",
      },
      {
        faculty_id: kocEng.id,
        name_en: "Data Science",
        name_tr: "Veri Bilimi",
        name_fa: "علم داده",
        name_ar: "علم البيانات",
        yok_atlas_code: "100300103",
        degree_type: "master",
        language: "English",
        duration_years: 2,
        thesis_option: "non-thesis",
        description_en: "Koç's M.S. in Data Science is a non-thesis professional degree designed to produce industry-ready data scientists. The curriculum covers statistical learning, big data infrastructure, natural language processing, and applied machine learning. Students complete a capstone project sponsored by one of Koç's industry partners.",
        admission_requirements: "Bachelor's degree in a quantitative field (CS, Engineering, Statistics, Mathematics). Minimum GPA 3.0/4.0. TOEFL iBT 90+ or IELTS 7.0+. GRE recommended. CV and statement of purpose required.",
        quota_total: 35,
        quota_international: 10,
        application_deadline_fall: "April 30",
        application_deadline_spring: "October 31",
        scholarship_available: false,
      },
      // ── Koç – Business (2 programs) ─────────────────────────────────────
      {
        faculty_id: kocBus.id,
        name_en: "Business Administration",
        name_tr: "İşletme",
        name_fa: "مدیریت بازرگانی",
        name_ar: "إدارة الأعمال",
        yok_atlas_code: "100300201",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "Koç's Business Administration program prepares students for leadership in global business environments. Core areas include accounting, finance, marketing, operations, and strategic management. Students have the option to specialize through elective tracks and benefit from Koç's global exchange partnerships with over 100 universities.",
        admission_requirements: "High school diploma. TOEFL iBT 90+ or IELTS 7.0+. SAT 1200+ or equivalent. Two letters of recommendation and a personal essay required.",
        quota_total: 50,
        quota_international: 12,
        application_deadline_fall: "May 15",
        scholarship_available: true,
        scholarship_description: "Merit-based scholarships of 25–100% tuition available. All applicants automatically reviewed for scholarship eligibility at the time of admission.",
      },
      {
        faculty_id: kocBus.id,
        name_en: "MBA",
        name_tr: "İşletme Yüksek Lisansı",
        name_fa: "کارشناسی ارشد مدیریت",
        name_ar: "ماجستير إدارة الأعمال",
        yok_atlas_code: "100300202",
        degree_type: "master",
        language: "English",
        duration_years: 2,
        thesis_option: "non-thesis",
        description_en: "Koç's full-time MBA program is the most internationally recognized MBA in Turkey, consistently ranked among the top programs in emerging markets. The curriculum emphasizes leadership, entrepreneurship, and global business strategy. Students have access to the Koç Executive Education Network and a prestigious alumni base spanning Fortune 500 companies.",
        admission_requirements: "Bachelor's degree in any field. Minimum 2 years of professional work experience. GMAT 600+ or GRE equivalent. TOEFL iBT 100+ or IELTS 7.5+. Two professional references and a personal statement required.",
        quota_total: 60,
        quota_international: 20,
        application_deadline_fall: "April 15",
        scholarship_available: true,
        scholarship_description: "Partial and full-tuition MBA scholarships available based on GMAT score, work experience, and academic background. Diversity scholarships offered for underrepresented nationalities.",
      },
      // ── Sabancı – Engineering (3 programs) ─────────────────────────────
      {
        faculty_id: sabanciEng.id,
        name_en: "Computer Science and Engineering",
        name_tr: "Bilgisayar Bilimi ve Mühendisliği",
        name_fa: "علوم کامپیوتر و مهندسی",
        name_ar: "علوم الحاسوب والهندسة",
        yok_atlas_code: "100400101",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "Sabancı's CSE program takes an interdisciplinary approach, allowing students to combine computer science with engineering, mathematics, or management. All students share a common first year before declaring their major, fostering cross-disciplinary thinking. The program has strong ties to Sabancı's internationally ranked research centers.",
        admission_requirements: "High school diploma with strong mathematics. TOEFL iBT 87+ or IELTS 6.5+. SAT 1100+ or equivalent. Personal statement required. International applicants evaluated on a rolling basis.",
        quota_total: 65,
        quota_international: 14,
        application_deadline_fall: "June 1",
        scholarship_available: true,
        scholarship_description: "Sabancı University Merit Scholarships cover 25–100% of tuition for top-performing international applicants. Recipients maintain scholarships with a GPA of 3.0+ each semester.",
      },
      {
        faculty_id: sabanciEng.id,
        name_en: "Industrial Engineering",
        name_tr: "Endüstri Mühendisliği",
        name_fa: "مهندسی صنایع",
        name_ar: "الهندسة الصناعية",
        yok_atlas_code: "100400102",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "This program combines optimization, operations research, supply chain management, and data analytics to train engineers who improve complex systems. Sabancı's strong industry network provides students with real-world projects and co-op opportunities. Graduates are highly recruited by manufacturing, logistics, and consulting firms.",
        admission_requirements: "High school diploma with strong mathematics and statistics background. TOEFL iBT 87+ or IELTS 6.5+. SAT 1100+ or equivalent. Personal statement required.",
        quota_total: 55,
        quota_international: 10,
        application_deadline_fall: "June 1",
        scholarship_available: true,
        scholarship_description: "Merit scholarships of 25–100% tuition available for international students. Sabancı Engineering Excellence Award offered to the top admitted student each year.",
      },
      {
        faculty_id: sabanciEng.id,
        name_en: "Artificial Intelligence",
        name_tr: "Yapay Zeka",
        name_fa: "هوش مصنوعی",
        name_ar: "الذكاء الاصطناعي",
        yok_atlas_code: "100400103",
        degree_type: "master",
        language: "English",
        duration_years: 2,
        thesis_option: "both",
        description_en: "Sabancı's M.S. in Artificial Intelligence is one of the first dedicated AI master's programs in Turkey. It covers deep learning, reinforcement learning, computer vision, NLP, and AI ethics. Both thesis and non-thesis tracks are available. The program benefits from Sabancı's Nanotechnology Research Center and AI research groups with international funding.",
        admission_requirements: "Bachelor's in CS, Engineering, Mathematics, or a related technical field. GPA ≥ 3.0/4.0. TOEFL iBT 87+ or IELTS 6.5+. GRE recommended. Statement of purpose outlining research interests required. Interview may be requested.",
        quota_total: 30,
        quota_international: 10,
        application_deadline_fall: "May 15",
        application_deadline_spring: "November 15",
        scholarship_available: true,
        scholarship_description: "Research assistantships (full tuition + monthly stipend of ₺20,000–₺25,000) available for thesis-track students. Highly competitive — early application advised.",
      },
      // ── Sabancı – Business (2 programs) ────────────────────────────────
      {
        faculty_id: sabanciBus.id,
        name_en: "Management",
        name_tr: "Yönetim Bilimleri",
        name_fa: "مدیریت",
        name_ar: "الإدارة",
        yok_atlas_code: "100400201",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "Sabancı's Management program is built on an interdisciplinary foundation. Students can blend management courses with engineering, arts, or sciences electives. The program develops analytical thinking, leadership, and entrepreneurial skills through case studies, simulations, and a required internship in the third year.",
        admission_requirements: "High school diploma. TOEFL iBT 87+ or IELTS 6.5+. SAT 1100+ or equivalent. Personal statement required.",
        quota_total: 50,
        quota_international: 10,
        application_deadline_fall: "June 1",
        scholarship_available: true,
        scholarship_description: "Merit scholarships covering 25–75% of tuition available based on academic record and application materials.",
      },
      {
        faculty_id: sabanciBus.id,
        name_en: "Finance",
        name_tr: "Finans",
        name_fa: "مالی",
        name_ar: "التمويل",
        yok_atlas_code: "100400202",
        degree_type: "master",
        language: "English",
        duration_years: 2,
        thesis_option: "non-thesis",
        description_en: "The M.S. in Finance at Sabancı prepares students for careers in investment banking, asset management, and financial analysis. The curriculum covers financial modeling, derivatives, risk management, and corporate finance. Students have access to Bloomberg terminals and complete a capstone project with a financial services industry partner.",
        admission_requirements: "Bachelor's in Business, Economics, Finance, or Engineering. GPA ≥ 3.0/4.0. GMAT 580+ or GRE equivalent. TOEFL iBT 87+ or IELTS 6.5+. Professional experience is advantageous. Two references required.",
        quota_total: 30,
        quota_international: 8,
        application_deadline_fall: "May 15",
        application_deadline_spring: "November 15",
        scholarship_available: false,
      },
      // ── Bilkent – Engineering (3 programs) ─────────────────────────────
      {
        faculty_id: bilkentEng.id,
        name_en: "Computer Engineering",
        name_tr: "Bilgisayar Mühendisliği",
        name_fa: "مهندسی کامپیوتر",
        name_ar: "هندسة الحاسوب",
        yok_atlas_code: "100500101",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "Bilkent's Computer Engineering program is among the most selective in Turkey, attracting top students from across the country and region. The curriculum emphasizes software engineering, systems programming, algorithms, and AI. Students benefit from Bilkent's on-campus tech park, which houses over 300 technology companies offering internships and co-op placements.",
        admission_requirements: "High school diploma with top academic standing. TOEFL iBT 87+ or IELTS 6.5+. Strong SAT/national exam scores. Two letters of recommendation. Merit-based admission — admission is highly competitive.",
        quota_total: 70,
        quota_international: 15,
        application_deadline_fall: "May 31",
        scholarship_available: true,
        scholarship_description: "Bilkent University Comprehensive Scholarships cover up to 100% of tuition and include dormitory and meal allowances. Approximately 40% of international students receive some form of financial support.",
      },
      {
        faculty_id: bilkentEng.id,
        name_en: "Electrical and Electronics Engineering",
        name_tr: "Elektrik-Elektronik Mühendisliği",
        name_fa: "مهندسی برق و الکترونیک",
        name_ar: "هندسة الكهرباء والإلكترونيات",
        yok_atlas_code: "100500102",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "This program offers strong preparation in electronics, photonics, telecommunications, and control systems. Research groups at Bilkent are internationally recognized in nanophotonics and signal processing. Students have access to advanced fabrication facilities including Bilkent's National Nanotechnology Research Center (UNAM).",
        admission_requirements: "High school diploma. Strong physics and mathematics. TOEFL iBT 87+ or IELTS 6.5+. Competitive SAT or national exam scores. Letters of recommendation required.",
        quota_total: 65,
        quota_international: 12,
        application_deadline_fall: "May 31",
        scholarship_available: true,
        scholarship_description: "Merit-based scholarships of 25–100% tuition available. UNAM Research Scholarships offered to students who join a research lab in their second year.",
      },
      {
        faculty_id: bilkentEng.id,
        name_en: "Cybersecurity",
        name_tr: "Siber Güvenlik",
        name_fa: "امنیت سایبری",
        name_ar: "الأمن السيبراني",
        yok_atlas_code: "100500103",
        degree_type: "master",
        language: "English",
        duration_years: 2,
        thesis_option: "both",
        description_en: "Bilkent's M.S. in Cybersecurity is a specialized program covering network security, cryptography, malware analysis, digital forensics, and security policy. Students gain hands-on experience in Bilkent's dedicated cybersecurity lab and have the option to collaborate with Turkey's National Cyber Incidents Response Center (USOM). Both thesis and non-thesis tracks available.",
        admission_requirements: "Bachelor's in Computer Engineering, CS, or Information Systems. GPA ≥ 2.75/4.0. TOEFL iBT 87+ or IELTS 6.5+. GRE optional. Statement of purpose required. Applicants with professional security certifications (e.g., CISSP, CEH) are given preference.",
        quota_total: 25,
        quota_international: 8,
        application_deadline_fall: "May 31",
        application_deadline_spring: "November 30",
        scholarship_available: true,
        scholarship_description: "Research assistantships available for thesis-track students. National security partnerships occasionally fund full fellowships for students working on designated research topics.",
      },
      // ── Bilkent – Business (3 programs) ────────────────────────────────
      {
        faculty_id: bilkentBus.id,
        name_en: "Business Administration",
        name_tr: "İşletme Yönetimi",
        name_fa: "مدیریت بازرگانی",
        name_ar: "إدارة الأعمال",
        yok_atlas_code: "100500201",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "Bilkent's Business Administration program delivers a comprehensive management education with tracks in finance, marketing, and entrepreneurship. The program is AACSB-accredited and has a strong alumni network in Turkey's top corporations. Students may participate in international exchange programs with partner universities across Europe and North America.",
        admission_requirements: "High school diploma with strong academic record. TOEFL iBT 87+ or IELTS 6.5+. Competitive national or SAT scores. Personal statement required.",
        quota_total: 60,
        quota_international: 12,
        application_deadline_fall: "May 31",
        scholarship_available: true,
        scholarship_description: "Bilkent merit scholarships of 25–100% tuition available. AACSB Business Excellence Scholarship offered to the top three international admittees annually.",
      },
      {
        faculty_id: bilkentBus.id,
        name_en: "International Trade",
        name_tr: "Uluslararası Ticaret",
        name_fa: "تجارت بین‌الملل",
        name_ar: "التجارة الدولية",
        yok_atlas_code: "100500202",
        degree_type: "bachelor",
        language: "English",
        duration_years: 4,
        description_en: "The International Trade program prepares students for careers in global commerce, customs management, and supply chain strategy. Courses integrate economics, law, logistics, and cross-cultural business communication. Students complete a mandatory internship and a capstone trade simulation project in their final year.",
        admission_requirements: "High school diploma. English proficiency: TOEFL iBT 87+ or IELTS 6.5+. SAT or national exam scores required. Personal statement encouraged.",
        quota_total: 50,
        quota_international: 10,
        application_deadline_fall: "May 31",
        scholarship_available: true,
        scholarship_description: "Partial merit scholarships (25–50% tuition) available for high-achieving international applicants. Scholarship maintained with GPA ≥ 2.75 each semester.",
      },
      {
        faculty_id: bilkentBus.id,
        name_en: "MBA",
        name_tr: "İşletme Yüksek Lisansı",
        name_fa: "کارشناسی ارشد مدیریت",
        name_ar: "ماجستير إدارة الأعمال",
        yok_atlas_code: "100500203",
        degree_type: "master",
        language: "English",
        duration_years: 2,
        thesis_option: "non-thesis",
        description_en: "Bilkent's MBA program is designed for early-career professionals seeking to accelerate their leadership trajectory. The curriculum covers strategy, finance, marketing analytics, and innovation management. Students complete two elective concentrations and a consulting capstone project with a real corporate client. The program's Ankara location provides access to government, defense, and technology sector employers.",
        admission_requirements: "Bachelor's degree in any discipline. Minimum 2 years of work experience preferred. GMAT 580+ or GRE equivalent. TOEFL iBT 90+ or IELTS 7.0+. Two professional references and a personal statement required.",
        quota_total: 45,
        quota_international: 12,
        application_deadline_fall: "April 30",
        application_deadline_spring: "October 31",
        scholarship_available: true,
        scholarship_description: "Partial tuition scholarships (up to 50%) available for applicants with GMAT 650+ or outstanding professional achievements. Need-based grants also available.",
      },
    ])
    .returning();

  console.log(`✓ ${programs.length} programs inserted`);

  // -------------------------------------------------------------------------
  // Tuition fees (one record per program, academic year 2024-2025)
  // State universities (BOUN, ITU): domestic free, international in USD
  // Private universities (Koç, Sabancı, Bilkent): fees in TRY
  // -------------------------------------------------------------------------
  const feeValues: {
    domestic_fee: string;
    international_fee: string;
    domestic_currency: string;
    international_currency: string;
  }[] = [
    // BOUN Engineering (3)
    { domestic_fee: "0",      international_fee: "6500",  domestic_currency: "TRY", international_currency: "USD" },
    { domestic_fee: "0",      international_fee: "6500",  domestic_currency: "TRY", international_currency: "USD" },
    { domestic_fee: "0",      international_fee: "5000",  domestic_currency: "TRY", international_currency: "USD" },
    // BOUN Social Sciences (2)
    { domestic_fee: "0",      international_fee: "6000",  domestic_currency: "TRY", international_currency: "USD" },
    { domestic_fee: "0",      international_fee: "6000",  domestic_currency: "TRY", international_currency: "USD" },
    // ITU Civil Eng (3)
    { domestic_fee: "0",      international_fee: "4500",  domestic_currency: "TRY", international_currency: "USD" },
    { domestic_fee: "0",      international_fee: "4500",  domestic_currency: "TRY", international_currency: "USD" },
    { domestic_fee: "0",      international_fee: "3500",  domestic_currency: "TRY", international_currency: "USD" },
    // ITU Architecture (2)
    { domestic_fee: "0",      international_fee: "4500",  domestic_currency: "TRY", international_currency: "USD" },
    { domestic_fee: "0",      international_fee: "4500",  domestic_currency: "TRY", international_currency: "USD" },
    // Koç Engineering (3)
    { domestic_fee: "480000", international_fee: "22000", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "480000", international_fee: "22000", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "350000", international_fee: "18000", domestic_currency: "TRY", international_currency: "TRY" },
    // Koç Business (2)
    { domestic_fee: "460000", international_fee: "20000", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "380000", international_fee: "25000", domestic_currency: "TRY", international_currency: "TRY" },
    // Sabancı Engineering (3)
    { domestic_fee: "510000", international_fee: "21000", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "510000", international_fee: "21000", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "360000", international_fee: "17000", domestic_currency: "TRY", international_currency: "TRY" },
    // Sabancı Business (2)
    { domestic_fee: "490000", international_fee: "19500", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "370000", international_fee: "22000", domestic_currency: "TRY", international_currency: "TRY" },
    // Bilkent Engineering (3)
    { domestic_fee: "520000", international_fee: "20000", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "520000", international_fee: "20000", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "380000", international_fee: "16000", domestic_currency: "TRY", international_currency: "TRY" },
    // Bilkent Business (3)
    { domestic_fee: "500000", international_fee: "18500", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "500000", international_fee: "18500", domestic_currency: "TRY", international_currency: "TRY" },
    { domestic_fee: "390000", international_fee: "23000", domestic_currency: "TRY", international_currency: "TRY" },
  ];

  await db.insert(tuitionFeesTable).values(
    programs.map((p, i) => ({
      program_id: p.id,
      academic_year: "2024-2025",
      domestic_fee: feeValues[i]!.domestic_fee,
      international_fee: feeValues[i]!.international_fee,
      currency: feeValues[i]!.domestic_currency,
      domestic_currency: feeValues[i]!.domestic_currency,
      international_currency: feeValues[i]!.international_currency,
    })),
  );

  console.log(`✓ ${programs.length} tuition fee records inserted`);
  console.log("Seeding complete.");
}

// Allow direct invocation: pnpm --filter @workspace/db run seed
const isMain = process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js");
if (isMain) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}

export { seed };
