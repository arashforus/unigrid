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
      // BOUN – Engineering (3 programs)
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
      },
      // BOUN – Social Sciences (2 programs)
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
      },
      // ITU – Civil Engineering (3 programs)
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
      },
      // ITU – Architecture (2 programs)
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
      },
      // Koç – Engineering (3 programs)
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
      },
      // Koç – Business (2 programs)
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
      },
      // Sabancı – Engineering (3 programs)
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
      },
      // Sabancı – Business (2 programs)
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
      },
      // Bilkent – Engineering (3 programs)
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
      },
      // Bilkent – Business (3 programs)
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
      },
    ])
    .returning();

  console.log(`✓ ${programs.length} programs inserted`);

  // -------------------------------------------------------------------------
  // Tuition fees (one record per program, academic year 2024-2025)
  // Domestic fees in TRY, international fees in USD
  // -------------------------------------------------------------------------
  const feeValues: {
    domestic_fee: string;
    international_fee: string;
    currency: string;
  }[] = [
    // BOUN Engineering (3)
    { domestic_fee: "0", international_fee: "6500", currency: "USD" },     // CS bachelor – free for domestic
    { domestic_fee: "0", international_fee: "6500", currency: "USD" },     // EE bachelor
    { domestic_fee: "0", international_fee: "5000", currency: "USD" },     // CS master
    // BOUN Social Sciences (2)
    { domestic_fee: "0", international_fee: "6000", currency: "USD" },     // Economics
    { domestic_fee: "0", international_fee: "6000", currency: "USD" },     // Psychology
    // ITU Civil Eng (3)
    { domestic_fee: "0", international_fee: "4500", currency: "USD" },     // Civil Eng
    { domestic_fee: "0", international_fee: "4500", currency: "USD" },     // Environmental Eng
    { domestic_fee: "0", international_fee: "3500", currency: "USD" },     // Structural master
    // ITU Architecture (2)
    { domestic_fee: "0", international_fee: "4500", currency: "USD" },     // Architecture
    { domestic_fee: "0", international_fee: "4500", currency: "USD" },     // Urban Planning
    // Koç Engineering (3)
    { domestic_fee: "480000", international_fee: "22000", currency: "TRY" }, // CS bachelor
    { domestic_fee: "480000", international_fee: "22000", currency: "TRY" }, // Mech Eng
    { domestic_fee: "350000", international_fee: "18000", currency: "TRY" }, // Data Science master
    // Koç Business (2)
    { domestic_fee: "460000", international_fee: "20000", currency: "TRY" }, // Business
    { domestic_fee: "380000", international_fee: "25000", currency: "TRY" }, // MBA
    // Sabancı Engineering (3)
    { domestic_fee: "510000", international_fee: "21000", currency: "TRY" }, // CS&E bachelor
    { domestic_fee: "510000", international_fee: "21000", currency: "TRY" }, // Industrial Eng
    { domestic_fee: "360000", international_fee: "17000", currency: "TRY" }, // AI master
    // Sabancı Business (2)
    { domestic_fee: "490000", international_fee: "19500", currency: "TRY" }, // Management
    { domestic_fee: "370000", international_fee: "22000", currency: "TRY" }, // Finance master
    // Bilkent Engineering (3)
    { domestic_fee: "520000", international_fee: "20000", currency: "TRY" }, // CS bachelor
    { domestic_fee: "520000", international_fee: "20000", currency: "TRY" }, // EE bachelor
    { domestic_fee: "380000", international_fee: "16000", currency: "TRY" }, // Cybersecurity master
    // Bilkent Business (3)
    { domestic_fee: "500000", international_fee: "18500", currency: "TRY" }, // Business Admin
    { domestic_fee: "500000", international_fee: "18500", currency: "TRY" }, // Intl Trade
    { domestic_fee: "390000", international_fee: "23000", currency: "TRY" }, // MBA
  ];

  await db.insert(tuitionFeesTable).values(
    programs.map((p, i) => ({
      program_id: p.id,
      academic_year: "2024-2025",
      domestic_fee: feeValues[i]!.domestic_fee,
      international_fee: feeValues[i]!.international_fee,
      currency: feeValues[i]!.currency,
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
